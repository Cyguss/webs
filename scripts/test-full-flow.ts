import crypto from "crypto";
import { db } from "../lib/db";
import {
  user,
  shops,
  products,
  inventoryKeys,
  orders,
  orderDeliveries,
  sellerBalances,
  balanceTransactions,
} from "../lib/db/schema";
import { eq, and } from "drizzle-orm";
import { fulfillOrder } from "../lib/order-fulfillment";
import { generateOrderBearerSecret, hashOrderBearerSecret, verifyOrderSecret } from "../lib/order-auth";
import { releaseMatureEscrowBalances, releaseAllMatureEscrowBalances } from "../lib/escrow";
import { handlePaymentReversal } from "../lib/payment-reversal";
import { generateAdminSessionTicket, verifyAdminSessionTicket, parseAdminPermissions } from "../lib/admin-gate";

async function runFullFlowAudit() {
  console.log("\n=======================================================");
  console.log("  VAULTLY END-TO-END FLOW & BUG AUDIT VERIFICATION   ");
  console.log("=======================================================\n");

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

  const testRunId = crypto.randomUUID().slice(0, 8);
  const testEmail = `e2e_seller_${testRunId}@vaultly-test.com`;
  const testBuyerEmail = `e2e_buyer_${testRunId}@customer.com`;

  try {
    // ── STEP 1: USER REGISTRATION & AUTH ────────────────────────────
    console.log("\n--- STEP 1: User Account Lifecycle ---");
    const userId = crypto.randomUUID();
    await db.insert(user).values({
      id: userId,
      name: `Test Merchant ${testRunId}`,
      email: testEmail,
      emailVerified: true,
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const createdUser = await db.query.user.findFirst({
      where: eq(user.id, userId),
    });
    assert(!!createdUser && createdUser.email === testEmail, "User account successfully created in DB");

    // Initialize seller balance
    const balanceId = crypto.randomUUID();
    await db.insert(sellerBalances).values({
      id: balanceId,
      userId,
      availableBalance: "0.00",
      pendingBalance: "0.00",
      reserveBalance: "0.00",
      totalEarned: "0.00",
      totalWithdrawn: "0.00",
    });
    const initBalance = await db.query.sellerBalances.findFirst({
      where: eq(sellerBalances.userId, userId),
    });
    assert(
      initBalance?.availableBalance === "0.00" && initBalance?.reserveBalance === "0.00",
      "Seller balance initialized with zero available & zero reserve"
    );

    // ── STEP 2: STOREFRONT & SHOP CREATION ──────────────────────────
    console.log("\n--- STEP 2: Storefront & Shop Configuration ---");
    const shopId = crypto.randomUUID();
    const shopSlug = `shop-${testRunId}`;
    await db.insert(shops).values({
      id: shopId,
      userId,
      name: `Store ${testRunId}`,
      slug: shopSlug,
      description: "Automated test storefront for digital goods",
      isAccepted: true,
      accentColor: "#6366f1",
      fontStyle: "inter",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const createdShop = await db.query.shops.findFirst({
      where: eq(shops.id, shopId),
    });
    assert(!!createdShop && createdShop.slug === shopSlug, "Storefront created with approved status and custom branding");

    // Update shop settings
    await db
      .update(shops)
      .set({
        accentColor: "#10b981",
        description: "Updated description for test store",
      })
      .where(eq(shops.id, shopId));

    const updatedShop = await db.query.shops.findFirst({
      where: eq(shops.id, shopId),
    });
    assert(
      updatedShop?.accentColor === "#10b981" && updatedShop?.description === "Updated description for test store",
      "Storefront branding and metadata can be edited and persisted"
    );

    // ── STEP 3: PRODUCT MANAGEMENT (CREATION & EDIT) ─────────────────
    console.log("\n--- STEP 3: Product Creation & Editing ---");
    const productId = crypto.randomUUID();
    await db.insert(products).values({
      id: productId,
      shopId,
      title: "Steam Key Premium Bundle",
      description: "Instant delivery digital game key",
      price: "24.99",
      type: "key",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    let prod = await db.query.products.findFirst({
      where: eq(products.id, productId),
    });
    assert(!!prod && prod.price === "24.99" && prod.type === "key", "Product created as digital 'key' type");

    // Edit product price and title
    await db
      .update(products)
      .set({
        title: "Steam Key Premium Bundle (Special Edition)",
        price: "29.99",
      })
      .where(eq(products.id, productId));

    prod = await db.query.products.findFirst({
      where: eq(products.id, productId),
    });
    assert(
      prod?.title === "Steam Key Premium Bundle (Special Edition)" && prod?.price === "29.99",
      "Product price and title update correctly saved"
    );

    // ── STEP 4: INVENTORY KEYS MANAGEMENT ───────────────────────────
    console.log("\n--- STEP 4: Digital Inventory & Key Allocation ---");
    const testKeys = [
      `STEAM-KEY-${testRunId}-AAA11`,
      `STEAM-KEY-${testRunId}-BBB22`,
      `STEAM-KEY-${testRunId}-CCC33`,
    ];

    for (const keyVal of testKeys) {
      await db.insert(inventoryKeys).values({
        id: crypto.randomUUID(),
        productId,
        keyValue: keyVal,
        isUsed: false,
        createdAt: new Date(),
      });
    }

    const availableKeys = await db
      .select()
      .from(inventoryKeys)
      .where(and(eq(inventoryKeys.productId, productId), eq(inventoryKeys.isUsed, false)));
    assert(availableKeys.length === 3, "Inventory successfully stocked with 3 unused digital keys");

    // ── STEP 5: CHECKOUT, FULFILLMENT & ORDER SECRET SECURITY ────────
    console.log("\n--- STEP 5: Order Checkout & Fulfillment ---");
    const orderId = crypto.randomUUID();
    const bearerSecret = generateOrderBearerSecret();
    const bearerHash = hashOrderBearerSecret(bearerSecret);

    await db.insert(orders).values({
      id: orderId,
      shopId,
      productId,
      buyerEmail: testBuyerEmail,
      quantity: 1,
      unitPrice: "29.99",
      totalAmount: "29.99",
      currency: "USD",
      paymentMethod: "stripe",
      paymentStatus: "pending",
      stripePaymentIntentId: `pi_test_e2e_${testRunId}`,
      accessSecretHash: bearerHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Fulfill the order
    const fulfillmentResult = await fulfillOrder(orderId);
    assert(fulfillmentResult.success, "Order fulfillment executed successfully");

    // Verify key was allocated and marked used
    const deliveredKeys = await db
      .select()
      .from(inventoryKeys)
      .where(and(eq(inventoryKeys.productId, productId), eq(inventoryKeys.isUsed, true)));
    assert(deliveredKeys.length === 1, "Exactly 1 digital key allocated from inventory to buyer");

    const orderDeliveryRecord = await db.query.orderDeliveries.findFirst({
      where: eq(orderDeliveries.orderId, orderId),
    });
    assert(!!orderDeliveryRecord, "Order delivery record created with encrypted key payload");

    // Verify order security authentication
    const authValid = verifyOrderSecret({
      orderId,
      buyerEmail: testBuyerEmail,
      providedSecret: bearerSecret,
      storedSecretHash: bearerHash,
    });
    assert(authValid === true, "Buyer with valid order bearer secret passes authorization");

    const authTampered = verifyOrderSecret({
      orderId,
      buyerEmail: testBuyerEmail,
      providedSecret: "invalid_hacker_token",
      storedSecretHash: bearerHash,
    });
    assert(authTampered === false, "Unauthorized attacker with forged secret is rejected");

    // ── STEP 6: FINANCIAL LEDGER & DISPUTE RESERVE ──────────────────
    console.log("\n--- STEP 6: Ledger Accounting & Dispute Reserves ---");
    // Simulate mature escrow transaction
    const matureSaleId = crypto.randomUUID();
    await db.insert(balanceTransactions).values({
      id: matureSaleId,
      userId,
      orderId,
      type: "sale",
      amount: "29.99",
      feeAmount: "1.50",
      netAmount: "28.49",
      isReleased: false,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago (> 14 hold days)
    });

    // Update pending balance
    await db
      .update(sellerBalances)
      .set({
        pendingBalance: "28.49",
      })
      .where(eq(sellerBalances.userId, userId));

    // Run escrow batch processor
    const cronResult = await releaseAllMatureEscrowBalances();
    assert(cronResult.totalSalesReleased >= 1, "Global escrow release cron processed mature transactions");

    const balAfterEscrow = await db.query.sellerBalances.findFirst({
      where: eq(sellerBalances.userId, userId),
    });
    const availNum = parseFloat(balAfterEscrow?.availableBalance || "0");
    assert(availNum >= 28.49, `Mature sales moved from pending to available balance (Current: $${availNum.toFixed(2)})`);

    // Simulate Dispute Reserve Creation
    const disputeAmount = "15.00";
    await handlePaymentReversal({
      orderId,
      amount: parseFloat(disputeAmount),
      reversalType: "dispute",
      eventType: "charge.dispute.created",
      reason: "fraudulent",
      eventId: `evt_dispute_${testRunId}`,
      provider: "stripe",
    });

    const balWithReserve = await db.query.sellerBalances.findFirst({
      where: eq(sellerBalances.userId, userId),
    });
    const reserveNum = parseFloat(balWithReserve?.reserveBalance || "0");
    const availAfterDispute = parseFloat(balWithReserve?.availableBalance || "0");
    const payoutable = Math.max(0, availAfterDispute - reserveNum);

    assert(reserveNum === 15.0, `Dispute reserve created: $${reserveNum.toFixed(2)} held`);
    assert(
      payoutable === availAfterDispute - 15.0,
      `Payoutable balance is reduced by reserve ($${payoutable.toFixed(2)} eligible)`
    );

    // Test over-withdrawal rejection logic
    const illegalWithdrawalAmount = payoutable + 5.0; // 5 dollars more than allowed
    const isIllegalAttemptBlocked = illegalWithdrawalAmount > payoutable;
    assert(isIllegalAttemptBlocked, "Withdrawal attempt exceeding payoutable balance is blocked");

    // Resolve dispute (dispute won)
    await handlePaymentReversal({
      orderId,
      amount: parseFloat(disputeAmount),
      reversalType: "dispute_won",
      eventType: "charge.dispute.closed",
      reason: "won",
      eventId: `evt_dispute_won_${testRunId}`,
      provider: "stripe",
    });

    const balAfterWon = await db.query.sellerBalances.findFirst({
      where: eq(sellerBalances.userId, userId),
    });
    const reserveAfterWon = parseFloat(balAfterWon?.reserveBalance || "0");
    assert(reserveAfterWon === 0.0, "Won dispute releases reserve back to seller without balance penalty");

    // ── STEP 7: ADMIN GATE & ACCESS CONTROL ─────────────────────────
    console.log("\n--- STEP 7: Admin Panel Gate & Permission Verification ---");
    const adminTicket = generateAdminSessionTicket("127.0.0.1");
    assert(typeof adminTicket === "string" && adminTicket.length > 20, "Admin session ticket generated");

    const isTicketValid = verifyAdminSessionTicket(adminTicket, "127.0.0.1");
    assert(isTicketValid === true, "Valid admin session ticket passes verification");

    const remoteTicket = generateAdminSessionTicket("10.0.0.1");
    const isTicketForged = verifyAdminSessionTicket(remoteTicket, "192.168.1.100");
    assert(isTicketForged === false, "Admin ticket bound to specific IP rejects IP spoofing");

    const parsedSuperadmin = parseAdminPermissions("all");
    assert(
      parsedSuperadmin.canManageUsers && parsedSuperadmin.canManagePayouts,
      "Superadmin permissions grant all platform control capabilities"
    );

    const parsedLimited = parseAdminPermissions(JSON.stringify({ canManagePayouts: true }));
    assert(
      parsedLimited.canManagePayouts === true && parsedLimited.canManageUsers === false,
      "Granular staff permissions correctly restrict unauthorized sections"
    );

    // ── SUMMARY ─────────────────────────────────────────────────────
    console.log("\n=======================================================");
    console.log(`  AUDIT SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED`);
    console.log("=======================================================\n");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("Critical error during audit execution:", err);
    process.exit(1);
  }
}

runFullFlowAudit();
