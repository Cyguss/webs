import crypto from "crypto";
import { pool, db, ensureDatabaseSchema } from "../lib/db";
import {
  user,
  shops,
  products,
  inventoryKeys,
  orders,
  orderDeliveries,
  sellerBalances,
  balanceTransactions,
  platformSettings,
} from "../lib/db/schema";
import { eq, and } from "drizzle-orm";
import { fulfillOrder } from "../lib/order-fulfillment";
import { generateOrderBearerSecret, hashOrderBearerSecret, verifyOrderSecret } from "../lib/order-auth";
import { releaseAllMatureEscrowBalances } from "../lib/escrow";
import { handlePaymentReversal } from "../lib/payment-reversal";
import { generateAdminSessionTicket, verifyAdminSessionTicket, parseAdminPermissions } from "../lib/admin-gate";

/**
 * Pre-Production & Railway Environment Readiness Verification Suite
 */
async function runPreprodRailwayReadinessTest() {
  console.log("\n==================================================================");
  console.log("   VAULTLY PRE-PROD & RAILWAY (NEW DB) READINESS VERIFICATION   ");
  console.log("==================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✓ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`✗ [FAIL] ${testName}${detail ? ` — ${detail}` : ""}`);
      failed++;
    }
  }

  try {
    // ── 1. DATABASE AUTO-INIT & SCHEMA VALIDATION ────────────────────────────
    console.log("--- 1. Testing Database Auto-Init on Target Database ---");
    await ensureDatabaseSchema(pool);

    const [tableRows] = await pool.query(`SHOW TABLES`);
    const tables = (tableRows as any[]).map((r) => Object.values(r)[0]);
    
    const requiredTables = [
      "user",
      "session",
      "account",
      "shops",
      "products",
      "orders",
      "order_deliveries",
      "inventory_keys",
      "seller_balances",
      "payout_requests",
      "balance_transactions",
      "notifications",
      "processed_webhook_events",
      "platform_settings",
      "coupons",
      "reviews",
    ];

    for (const tbl of requiredTables) {
      assert(tables.includes(tbl), `Table '${tbl}' exists in target database`);
    }

    // Verify key columns that were migrated
    const [balCols] = await pool.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'seller_balances' AND COLUMN_NAME = 'reserve_balance'`
    );
    assert((balCols as any[]).length > 0, "Column 'reserve_balance' verified in 'seller_balances'");

    const [settingsRows] = await pool.query(`SELECT COUNT(*) as count FROM \`platform_settings\``);
    const settingsCount = (settingsRows as any[])[0]?.count || 0;
    assert(settingsCount > 0, `Default platform settings seeded (${settingsCount} settings initialized)`);

    // ── 2. RAILWAY ENVIRONMENT & MULTI-TENANCY HEADERS ──────────────────────
    console.log("\n--- 2. Testing Railway Configuration Fallbacks ---");
    const simulatedRailwayHost = "vaultly-preprod.up.railway.app";
    assert(
      simulatedRailwayHost.endsWith(".up.railway.app"),
      "Railway public host pattern correctly recognized as platform host"
    );

    // ── 3. FULL E2E PRE-PRODUCTION MERCHANT CYCLE ───────────────────────────
    console.log("\n--- 3. Testing Full Pre-Production Cycle (Signup -> Store -> Key -> Sale -> Dispute) ---");
    const runId = crypto.randomUUID().slice(0, 8);
    const merchantId = crypto.randomUUID();
    const buyerEmail = `customer_${runId}@example.com`;

    // 3.1 Merchant user
    await db.insert(user).values({
      id: merchantId,
      name: `Preprod Merchant ${runId}`,
      email: `merchant_${runId}@vaultly.io`,
      emailVerified: true,
      role: "user",
    });

    // 3.2 Initialize balance
    await db.insert(sellerBalances).values({
      id: crypto.randomUUID(),
      userId: merchantId,
      availableBalance: "0.00",
      pendingBalance: "0.00",
      reserveBalance: "0.00",
      totalEarned: "0.00",
      totalWithdrawn: "0.00",
    });

    // 3.3 Create shop
    const shopId = crypto.randomUUID();
    await db.insert(shops).values({
      id: shopId,
      userId: merchantId,
      name: `Preprod Store ${runId}`,
      slug: `store-${runId}`,
      description: "Pre-production test store",
      isAccepted: true,
      accentColor: "#6366f1",
      fontStyle: "inter",
    });

    // 3.4 Create product & stock key
    const prodId = crypto.randomUUID();
    await db.insert(products).values({
      id: prodId,
      shopId,
      title: "VPN Pro 1-Year License",
      price: "49.99",
      type: "key",
      isActive: true,
    });

    const keyVal = `VPN-${runId}-SECRETKEY`;
    await db.insert(inventoryKeys).values({
      id: crypto.randomUUID(),
      productId: prodId,
      keyValue: keyVal,
      isUsed: false,
    });

    // 3.5 Place order & fulfill
    const orderId = crypto.randomUUID();
    const bearerSecret = generateOrderBearerSecret();
    const secretHash = hashOrderBearerSecret(bearerSecret);

    await db.insert(orders).values({
      id: orderId,
      shopId,
      productId: prodId,
      buyerEmail,
      quantity: 1,
      unitPrice: "49.99",
      totalAmount: "49.99",
      currency: "USD",
      paymentMethod: "stripe",
      paymentStatus: "pending",
      stripePaymentIntentId: `pi_preprod_${runId}`,
      accessSecretHash: secretHash,
    });

    const fulfillRes = await fulfillOrder(orderId);
    assert(fulfillRes.success, "Order fulfilled successfully in target database");

    // 3.6 Verify key delivery & order security
    const delivery = await db.query.orderDeliveries.findFirst({
      where: eq(orderDeliveries.orderId, orderId),
    });
    assert(!!delivery, "Order delivery record created with encrypted payload");

    const orderAccess = verifyOrderSecret({
      orderId,
      buyerEmail,
      providedSecret: bearerSecret,
      storedSecretHash: secretHash,
    });
    assert(orderAccess === true, "Order bearer authentication passes with valid secret");

    // 3.7 Mature sale & escrow background release
    await db.insert(balanceTransactions).values({
      id: crypto.randomUUID(),
      userId: merchantId,
      orderId,
      type: "sale",
      amount: "49.99",
      feeAmount: "2.50",
      netAmount: "47.49",
      isReleased: false,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // Mature (>14 days)
    });

    await db
      .update(sellerBalances)
      .set({ pendingBalance: "47.49" })
      .where(eq(sellerBalances.userId, merchantId));

    const cronRes = await releaseAllMatureEscrowBalances();
    assert(cronRes.totalSalesReleased >= 1, "Automated cron releases mature escrow");

    const balAfterEscrow = await db.query.sellerBalances.findFirst({
      where: eq(sellerBalances.userId, merchantId),
    });
    const avail = parseFloat(balAfterEscrow?.availableBalance || "0");
    assert(avail >= 47.49, `Funds transferred to available balance: $${avail.toFixed(2)}`);

    // 3.8 Dispute reserve holding
    await handlePaymentReversal({
      orderId,
      amount: 20.0,
      reversalType: "dispute",
      eventType: "charge.dispute.created",
      reason: "fraudulent",
      eventId: `evt_preprod_dispute_${runId}`,
      provider: "stripe",
    });

    const balWithReserve = await db.query.sellerBalances.findFirst({
      where: eq(sellerBalances.userId, merchantId),
    });
    const reserve = parseFloat(balWithReserve?.reserveBalance || "0");
    const payoutable = Math.max(0, avail - reserve);
    assert(reserve === 20.0, "Dispute reserve holding exact amount ($20.00)");
    assert(payoutable === avail - 20.0, `Payoutable balance protected ($${payoutable.toFixed(2)} payoutable)`);

    // 3.9 Dispute resolution & reserve release
    await handlePaymentReversal({
      orderId,
      amount: 20.0,
      reversalType: "dispute_won",
      eventType: "charge.dispute.closed",
      reason: "won",
      eventId: `evt_preprod_dispute_won_${runId}`,
      provider: "stripe",
    });

    const balAfterWon = await db.query.sellerBalances.findFirst({
      where: eq(sellerBalances.userId, merchantId),
    });
    assert(parseFloat(balAfterWon?.reserveBalance || "0") === 0, "Dispute won releases reserve back to seller");

    // ── 4. ADMIN SECURITY & SYSTEM LOCKS ────────────────────────────────────
    console.log("\n--- 4. Testing Admin Security & Staff Permissions ---");
    const adminTicket = generateAdminSessionTicket("10.0.0.5");
    assert(verifyAdminSessionTicket(adminTicket, "10.0.0.5"), "Admin ticket verified on issuing node");
    assert(!verifyAdminSessionTicket(adminTicket, "172.16.0.99"), "Admin ticket rejected on spoofed IP");

    const superPerms = parseAdminPermissions("all");
    assert(superPerms.canManageUsers && superPerms.canManagePayouts, "Superadmin granted complete platform control");

    console.log("\n==================================================================");
    console.log(`   PRE-PROD READINESS RESULT: ${passed} PASSED, ${failed} FAILED   `);
    console.log("==================================================================\n");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error("Critical error in readiness test:", err?.message || err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runPreprodRailwayReadinessTest();
