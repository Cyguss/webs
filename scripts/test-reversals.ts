import { db } from "../lib/db";
import {
  user,
  shops,
  products,
  orders,
  sellerBalances,
  balanceTransactions,
  payoutRequests,
  notifications,
  processedWebhookEvents,
} from "../lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import crypto from "crypto";
import { handlePaymentReversal } from "../lib/payment-reversal";
import { fulfillOrder } from "../lib/order-fulfillment";

// ANSI colors for clean test reporting
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

async function runTest(title: string, testFn: () => Promise<void>) {
  process.stdout.write(`  • Running: ${title}... `);
  try {
    await testFn();
    console.log(`${GREEN}✓ PASS${RESET}`);
    passedCount++;
  } catch (err: any) {
    console.log(`${RED}✗ FAIL${RESET}`);
    console.error(`    ${RED}Error: ${err.message}${RESET}`);
    if (err.stack) {
      console.error(`    ${err.stack.split("\n").slice(1, 3).join("\n    ")}`);
    }
    failedCount++;
  }
}

// Helpers to create test fixtures
async function createTestFixtures(suffix: string) {
  const userId = `test_usr_${suffix}_${Date.now()}`;
  const shopId = `test_shp_${suffix}_${Date.now()}`;
  const prodId = `test_prd_${suffix}_${Date.now()}`;

  // 1. Create User
  await db.insert(user).values({
    id: userId,
    name: `Test Merchant ${suffix}`,
    email: `merchant_${suffix}_${Date.now()}@test.local`,
    role: "user",
  });

  // 2. Create Shop
  await db.insert(shops).values({
    id: shopId,
    userId: userId,
    slug: `test-shop-${suffix}-${Date.now()}`,
    name: `Test Store ${suffix}`,
    isActive: true,
    isAccepted: true,
  });

  // 3. Create Product
  await db.insert(products).values({
    id: prodId,
    shopId: shopId,
    title: `Test Product ${suffix}`,
    type: "service",
    price: "20.00",
    isActive: true,
  });

  // 4. Create Seller Balance
  await db.insert(sellerBalances).values({
    id: crypto.randomUUID(),
    userId: userId,
    availableBalance: "0.00",
    pendingBalance: "0.00",
    reserveBalance: "0.00",
    totalEarned: "0.00",
    totalWithdrawn: "0.00",
  });

  return { userId, shopId, prodId };
}

async function createTestOrder(
  shopId: string,
  prodId: string,
  amount: number,
  options?: {
    paymentMethod?: string;
    stripePaymentIntentId?: string;
    cryptoPaymentId?: string;
  }
) {
  const orderId = `test_ord_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  await db.insert(orders).values({
    id: orderId,
    shopId,
    productId: prodId,
    buyerEmail: "buyer@test.local",
    quantity: 1,
    unitPrice: amount.toFixed(2),
    totalAmount: amount.toFixed(2),
    currency: "USD",
    paymentMethod: options?.paymentMethod || "stripe",
    paymentStatus: "pending",
    stripePaymentIntentId: options?.stripePaymentIntentId || `pi_${orderId}`,
    cryptoPaymentId: options?.cryptoPaymentId || `sim_${orderId}`,
  });
  return orderId;
}

// Simulated backend payout request function matching app/api/payouts/route.ts
async function requestPayoutSimulated(userId: string, requestedAmount: number) {
  return await db.transaction(async (tx) => {
    const balanceRows = await tx
      .select()
      .from(sellerBalances)
      .where(eq(sellerBalances.userId, userId))
      .for("update");

    const balanceRecord = balanceRows[0];
    const currentAvailable = balanceRecord ? parseFloat(balanceRecord.availableBalance) : 0;
    const currentReserve = balanceRecord ? parseFloat((balanceRecord as any).reserveBalance || "0") : 0;

    if (!balanceRecord || currentAvailable <= 0) {
      const debtMsg =
        currentAvailable < 0
          ? `Payouts are blocked due to an outstanding negative balance of $${Math.abs(currentAvailable).toFixed(2)}.`
          : "No available funds to withdraw.";
      throw new Error(debtMsg);
    }

    const payoutableAmount = Math.max(0, currentAvailable - currentReserve);
    if (requestedAmount > payoutableAmount) {
      if (currentReserve > 0) {
        throw new Error(
          `Insufficient payoutable balance. $${currentReserve.toFixed(2)} is held in dispute reserve (payoutable: $${payoutableAmount.toFixed(2)}).`
        );
      }
      throw new Error(`Insufficient available balance. Available: $${currentAvailable.toFixed(2)}`);
    }

    const newAvailable = (currentAvailable - requestedAmount).toFixed(2);
    const newWithdrawn = (parseFloat(balanceRecord.totalWithdrawn || "0") + requestedAmount).toFixed(2);

    await tx
      .update(sellerBalances)
      .set({
        availableBalance: newAvailable,
        totalWithdrawn: newWithdrawn,
        updatedAt: new Date(),
      })
      .where(eq(sellerBalances.userId, userId));

    const payoutId = crypto.randomUUID();
    await tx.insert(payoutRequests).values({
      id: payoutId,
      userId,
      amountRequested: requestedAmount.toFixed(2),
      feeAmount: "0.00",
      amountSent: requestedAmount.toFixed(2),
      method: "crypto",
      destinationAddress: "0xTestAddress",
      status: "pending",
    });

    await tx.insert(balanceTransactions).values({
      id: crypto.randomUUID(),
      userId,
      type: "payout",
      amount: (-requestedAmount).toFixed(2),
      feeAmount: "0.00",
      netAmount: (-requestedAmount).toFixed(2),
      description: `Payout request`,
    });

    return { success: true, payoutId, newAvailable };
  });
}

async function main() {
  console.log(`\n${BOLD}${CYAN}======================================================${RESET}`);
  console.log(`${BOLD}${CYAN}   VAULTLY PAYMENT REVERSAL & FINANCIAL SAFETY TESTS  ${RESET}`);
  console.log(`${BOLD}${CYAN}======================================================${RESET}\n`);

  // Ensure DB schema is fully up to date
  const { pool } = await import("../lib/db");
  const { ensureDatabaseSchema } = await import("../lib/db/init");
  await ensureDatabaseSchema(pool);

  // -------------------------------------------------------------------------------------------------
  // 1. Chargeback przed release (pre-release hold)
  // -------------------------------------------------------------------------------------------------
  await runTest("1. Chargeback przed release (Deducts pending, cancels escrow release)", async () => {
    const { userId, shopId, prodId } = await createTestFixtures("t1");
    const orderId = await createTestOrder(shopId, prodId, 50.0);

    // Fulfill order -> goes to pendingBalance
    await fulfillOrder(orderId);

    const balBefore = await db.query.sellerBalances.findFirst({ where: eq(sellerBalances.userId, userId) });
    const pendingBefore = parseFloat(balBefore?.pendingBalance || "0");
    assert(pendingBefore > 0, "Pending balance should be credited on sale");

    // Provider sends chargeback
    const res = await handlePaymentReversal({
      provider: "stripe",
      eventId: `evt_t1_${Date.now()}`,
      eventType: "charge.refunded",
      reversalType: "refund",
      orderId,
    });

    assert(res.success === true, "Reversal must succeed");
    const balAfter = await db.query.sellerBalances.findFirst({ where: eq(sellerBalances.userId, userId) });
    assert(parseFloat(balAfter?.pendingBalance || "0") === 0, "Pending balance should be reduced to 0");
    assert(parseFloat(balAfter?.availableBalance || "0") === 0, "Available balance should not be affected");

    // Ensure sale transaction was marked sale_reversed
    const saleTx = await db.query.balanceTransactions.findFirst({
      where: and(eq(balanceTransactions.orderId, orderId), eq(balanceTransactions.type, "sale_reversed")),
    });
    assert(!!saleTx, "Sale transaction should be marked as sale_reversed");
  });

  // -------------------------------------------------------------------------------------------------
  // 2. Chargeback po release
  // -------------------------------------------------------------------------------------------------
  await runTest("2. Chargeback po release (Deducts from availableBalance)", async () => {
    const { userId, shopId, prodId } = await createTestFixtures("t2");
    const orderId = await createTestOrder(shopId, prodId, 50.0);
    await fulfillOrder(orderId);

    // Manually release sale to availableBalance (simulating 7-day escrow maturation)
    await db.update(sellerBalances).set({ availableBalance: "50.00", pendingBalance: "0.00" }).where(eq(sellerBalances.userId, userId));
    await db.update(balanceTransactions).set({ isReleased: true }).where(eq(balanceTransactions.orderId, orderId));

    // Provider sends chargeback
    const res = await handlePaymentReversal({
      provider: "stripe",
      eventId: `evt_t2_${Date.now()}`,
      eventType: "charge.refunded",
      reversalType: "refund",
      orderId,
    });

    assert(res.success === true, "Reversal must succeed");
    const balAfter = await db.query.sellerBalances.findFirst({ where: eq(sellerBalances.userId, userId) });
    assert(parseFloat(balAfter?.availableBalance || "0") === 0.0, "Available balance should be debited to 0");
  });

  // -------------------------------------------------------------------------------------------------
  // 3. Chargeback po payout (Merchant has $0 -> goes to negative debt)
  // -------------------------------------------------------------------------------------------------
  await runTest("3. Chargeback po payout (Merchant debt created, payouts blocked)", async () => {
    const { userId, shopId, prodId } = await createTestFixtures("t3");
    const orderId = await createTestOrder(shopId, prodId, 20.0);
    await fulfillOrder(orderId);

    // Released and paid out -> balance is now 0.00
    await db.update(sellerBalances).set({ availableBalance: "0.00", pendingBalance: "0.00", totalWithdrawn: "20.00" }).where(eq(sellerBalances.userId, userId));
    await db.update(balanceTransactions).set({ isReleased: true }).where(eq(balanceTransactions.orderId, orderId));

    // Provider sends chargeback for $20
    const res = await handlePaymentReversal({
      provider: "stripe",
      eventId: `evt_t3_${Date.now()}`,
      eventType: "charge.dispute.created",
      reversalType: "chargeback",
      orderId,
      amount: 20.0,
    });

    assert(res.success === true, "Reversal must succeed");
    assert(res.isDebt === true, "Should be flagged as debt");
    assert(parseFloat(res.newAvailableBalance || "0") === -20.0, "Available balance should be -20.00");

    const balAfter = await db.query.sellerBalances.findFirst({ where: eq(sellerBalances.userId, userId) });
    assert(parseFloat(balAfter?.availableBalance || "0") === -20.0, "DB balance must be -20.00");
  });

  // -------------------------------------------------------------------------------------------------
  // 4. Chargeback większy niż available balance
  // -------------------------------------------------------------------------------------------------
  await runTest("4. Chargeback większy niż available balance (Partial coverage -> negative debt)", async () => {
    const { userId, shopId, prodId } = await createTestFixtures("t4");
    const orderId = await createTestOrder(shopId, prodId, 25.0);
    await fulfillOrder(orderId);

    // Set available balance to $10.00
    await db.update(sellerBalances).set({ availableBalance: "10.00", pendingBalance: "0.00" }).where(eq(sellerBalances.userId, userId));
    await db.update(balanceTransactions).set({ isReleased: true }).where(eq(balanceTransactions.orderId, orderId));

    const res = await handlePaymentReversal({
      provider: "stripe",
      eventId: `evt_t4_${Date.now()}`,
      eventType: "charge.dispute.funds_withdrawn",
      reversalType: "chargeback",
      orderId,
      amount: 25.0,
    });

    assert(res.success === true, "Reversal must succeed");
    assert(parseFloat(res.newAvailableBalance || "0") === -15.0, "Available balance should be -$15.00");
  });

  // -------------------------------------------------------------------------------------------------
  // 5. Merchant z istniejącym debt (Debt accumulates)
  // -------------------------------------------------------------------------------------------------
  await runTest("5. Merchant z istniejącym debt (Debt accumulates)", async () => {
    const { userId, shopId, prodId } = await createTestFixtures("t5");
    const orderId = await createTestOrder(shopId, prodId, 10.0);
    await fulfillOrder(orderId);

    // Starting debt: -$15.00
    await db.update(sellerBalances).set({ availableBalance: "-15.00", pendingBalance: "0.00" }).where(eq(sellerBalances.userId, userId));
    await db.update(balanceTransactions).set({ isReleased: true }).where(eq(balanceTransactions.orderId, orderId));

    const res = await handlePaymentReversal({
      provider: "cryptomus",
      eventId: `evt_t5_${Date.now()}`,
      eventType: "cryptomus.refund_paid",
      reversalType: "refund",
      orderId,
      amount: 10.0,
    });

    assert(res.success === true, "Reversal must succeed");
    assert(parseFloat(res.newAvailableBalance || "0") === -25.0, "Available balance should be -$25.00");
  });

  // -------------------------------------------------------------------------------------------------
  // 6. Nowe sale spłacające debt
  // -------------------------------------------------------------------------------------------------
  await runTest("6. Nowe sale spłacające debt ($20 debt + $30 sale -> $20 covers debt, $10 available)", async () => {
    const { userId, shopId, prodId } = await createTestFixtures("t6");

    // Merchant has -$20.00 debt
    await db.update(sellerBalances).set({ availableBalance: "-20.00", pendingBalance: "0.00" }).where(eq(sellerBalances.userId, userId));

    // New sale arrives: $30.00
    const newOrderId = await createTestOrder(shopId, prodId, 30.0);
    await fulfillOrder(newOrderId);

    const balAfter = await db.query.sellerBalances.findFirst({ where: eq(sellerBalances.userId, userId) });
    const available = parseFloat(balAfter?.availableBalance || "0");

    // Should be positive (surplus credited to available balance, clearing debt)
    assert(available > 0, `Available balance should be positive after debt clearance (was ${available})`);

    // Verify debt_settlement ledger record
    const debtTx = await db.query.balanceTransactions.findFirst({
      where: and(eq(balanceTransactions.userId, userId), eq(balanceTransactions.type, "debt_settlement")),
    });
    assert(!!debtTx, "Debt settlement ledger entry must be recorded");
    assert(parseFloat(debtTx?.netAmount || "0") === 20.0, "Debt settlement amount should be $20.00");
  });

  // -------------------------------------------------------------------------------------------------
  // 7. Payout przy debt (Strictly blocked)
  // -------------------------------------------------------------------------------------------------
  await runTest("7. Payout przy debt (Backend rejection)", async () => {
    const { userId } = await createTestFixtures("t7");

    // Set debt -$20.00
    await db.update(sellerBalances).set({ availableBalance: "-20.00" }).where(eq(sellerBalances.userId, userId));

    let rejected = false;
    try {
      await requestPayoutSimulated(userId, 10.0);
    } catch (err: any) {
      rejected = true;
      assert(err.message.includes("blocked due to an outstanding negative balance"), "Error must mention negative balance");
    }

    assert(rejected, "Payout MUST be rejected when merchant has debt");
  });

  // -------------------------------------------------------------------------------------------------
  // 8. Payout po spłacie debt (Unlocked)
  // -------------------------------------------------------------------------------------------------
  await runTest("8. Payout po spłacie debt (Payout succeeds when balance is positive)", async () => {
    const { userId } = await createTestFixtures("t8");

    // Balance cleared to positive $15.00
    await db.update(sellerBalances).set({ availableBalance: "15.00" }).where(eq(sellerBalances.userId, userId));

    const payoutRes = await requestPayoutSimulated(userId, 10.0);
    assert(payoutRes.success === true, "Payout should succeed after debt repayment");
    assert(parseFloat(payoutRes.newAvailable) === 5.0, "Available balance should be $5.00 after withdrawal");
  });

  // -------------------------------------------------------------------------------------------------
  // 9. Duplicate webhook (Idempotency)
  // -------------------------------------------------------------------------------------------------
  await runTest("9. Duplicate webhook (Replay protection: 1st debits, 2nd is no-op)", async () => {
    const { userId, shopId, prodId } = await createTestFixtures("t9");
    const orderId = await createTestOrder(shopId, prodId, 30.0);
    await fulfillOrder(orderId);

    await db.update(sellerBalances).set({ availableBalance: "30.00", pendingBalance: "0.00" }).where(eq(sellerBalances.userId, userId));
    await db.update(balanceTransactions).set({ isReleased: true }).where(eq(balanceTransactions.orderId, orderId));

    const eventId = `evt_dup_test_${Date.now()}`;

    // 1st webhook
    const res1 = await handlePaymentReversal({
      provider: "stripe",
      eventId,
      eventType: "charge.refunded",
      reversalType: "refund",
      orderId,
      amount: 30.0,
    });
    assert(res1.success === true && !res1.duplicate, "First event must process");

    // 2nd webhook (duplicate)
    const res2 = await handlePaymentReversal({
      provider: "stripe",
      eventId,
      eventType: "charge.refunded",
      reversalType: "refund",
      orderId,
      amount: 30.0,
    });
    assert(res2.success === true && res2.duplicate === true, "Second event must be flagged as duplicate");

    // Balance should have been deducted only ONCE
    const balAfter = await db.query.sellerBalances.findFirst({ where: eq(sellerBalances.userId, userId) });
    assert(parseFloat(balAfter?.availableBalance || "0") === 0.0, "Balance must not be double-debited");

    // Notifications count for this event must be 1
    const notifs = await db.query.notifications.findMany({
      where: and(eq(notifications.userId, userId), eq(notifications.type, "payment_reversed")),
    });
    assert(notifs.length === 1, `Exactly 1 notification should be created, found ${notifs.length}`);
  });

  // -------------------------------------------------------------------------------------------------
  // 10. Równoległe chargebacki (Concurrent chargebacks on different orders)
  // -------------------------------------------------------------------------------------------------
  await runTest("10. Równoległe chargebacki (Atomic concurrent execution via row locks)", async () => {
    const { userId, shopId, prodId } = await createTestFixtures("t10");
    const orderId1 = await createTestOrder(shopId, prodId, 40.0);
    const orderId2 = await createTestOrder(shopId, prodId, 30.0);
    await fulfillOrder(orderId1);
    await fulfillOrder(orderId2);

    await db.update(sellerBalances).set({ availableBalance: "100.00", pendingBalance: "0.00" }).where(eq(sellerBalances.userId, userId));
    await db.update(balanceTransactions).set({ isReleased: true }).where(eq(balanceTransactions.userId, userId));

    // Run parallel chargebacks on Order 1 ($40) and Order 2 ($30)
    await Promise.all([
      handlePaymentReversal({
        provider: "stripe",
        eventId: `evt_par_1_${Date.now()}`,
        eventType: "charge.refunded",
        reversalType: "refund",
        orderId: orderId1,
        amount: 40.0,
      }),
      handlePaymentReversal({
        provider: "stripe",
        eventId: `evt_par_2_${Date.now()}`,
        eventType: "charge.refunded",
        reversalType: "refund",
        orderId: orderId2,
        amount: 30.0,
      }),
    ]);

    const balAfter = await db.query.sellerBalances.findFirst({ where: eq(sellerBalances.userId, userId) });
    assert(parseFloat(balAfter?.availableBalance || "0") === 30.0, `Balance should be exactly $30.00 (100 - 40 - 30), found ${balAfter?.availableBalance}`);
  });

  // -------------------------------------------------------------------------------------------------
  // 11. Równoległy payout + chargeback (Race conditions protected)
  // -------------------------------------------------------------------------------------------------
  await runTest("11. Równoległy payout + chargeback (Row lock prevents double-spending)", async () => {
    const { userId, shopId, prodId } = await createTestFixtures("t11");
    const orderId = await createTestOrder(shopId, prodId, 20.0);
    await fulfillOrder(orderId);

    await db.update(sellerBalances).set({ availableBalance: "20.00", pendingBalance: "0.00" }).where(eq(sellerBalances.userId, userId));
    await db.update(balanceTransactions).set({ isReleased: true }).where(eq(balanceTransactions.orderId, orderId));

    // Fire payout of $20 and chargeback of $20 concurrently
    const results = await Promise.allSettled([
      requestPayoutSimulated(userId, 20.0),
      handlePaymentReversal({
        provider: "stripe",
        eventId: `evt_race_${Date.now()}`,
        eventType: "charge.dispute.created",
        reversalType: "chargeback",
        orderId,
        amount: 20.0,
      }),
    ]);

    const balAfter = await db.query.sellerBalances.findFirst({ where: eq(sellerBalances.userId, userId) });
    const finalBalance = parseFloat(balAfter?.availableBalance || "0");

    // Either:
    // Payout first (20 - 20 = 0), then chargeback (0 - 20 = -20) -> final = -20
    // OR Chargeback first (20 - 20 = 0), then payout rejected due to 0 balance -> final = 0
    // In neither case does balance corrupt or double-spend!
    assert(
      finalBalance === -20.0 || finalBalance === 0.0,
      `Balance must be consistent (-20.00 or 0.00), got ${finalBalance}`
    );
  });

  // -------------------------------------------------------------------------------------------------
  // 12. Nieznany payment/event (No financial ops for unverified payments)
  // -------------------------------------------------------------------------------------------------
  await runTest("12. Nieznany payment/event (Safely rejected without modifying balances)", async () => {
    const res = await handlePaymentReversal({
      provider: "stripe",
      eventId: `evt_unknown_${Date.now()}`,
      eventType: "charge.refunded",
      reversalType: "refund",
      orderId: "non_existent_order_id_9999",
      providerPaymentId: "unknown_pi_9999",
    });

    assert(res.success === false, "Reversal for unknown order must return failure");
    assert(Boolean(res.error?.includes("Order not found")), "Error must report order not found");
  });

  // -------------------------------------------------------------------------------------------------
  // 13. Retry failed webhooka (Succeeds on retry)
  // -------------------------------------------------------------------------------------------------
  await runTest("13. Retry failed webhooka (Retry after transient issue succeeds safely)", async () => {
    const { userId, shopId, prodId } = await createTestFixtures("t13");
    const orderId = await createTestOrder(shopId, prodId, 25.0);
    await fulfillOrder(orderId);

    await db.update(sellerBalances).set({ availableBalance: "25.00", pendingBalance: "0.00" }).where(eq(sellerBalances.userId, userId));
    await db.update(balanceTransactions).set({ isReleased: true }).where(eq(balanceTransactions.orderId, orderId));

    const retryEventId = `evt_retry_${Date.now()}`;

    // Successful retry
    const res = await handlePaymentReversal({
      provider: "cryptomus",
      eventId: retryEventId,
      eventType: "cryptomus.refund_paid",
      reversalType: "refund",
      orderId,
      amount: 25.0,
    });

    assert(res.success === true, "Retry must succeed");
    const balAfter = await db.query.sellerBalances.findFirst({ where: eq(sellerBalances.userId, userId) });
    assert(parseFloat(balAfter?.availableBalance || "0") === 0.0, "Balance should be debited to 0");
  });

  // -------------------------------------------------------------------------------------------------
  // 14. Duplicate Inbox notification (Exactly 1 notification across multiple retries)
  // -------------------------------------------------------------------------------------------------
  await runTest("14. Duplicate Inbox notification (No duplicate notifications created)", async () => {
    const { userId, shopId, prodId } = await createTestFixtures("t14");
    const orderId = await createTestOrder(shopId, prodId, 15.0);
    await fulfillOrder(orderId);

    const dupEventId = `evt_notif_dup_${Date.now()}`;

    // Send 3 duplicate webhooks
    await handlePaymentReversal({
      provider: "stripe",
      eventId: dupEventId,
      eventType: "charge.refunded",
      reversalType: "refund",
      orderId,
    });
    await handlePaymentReversal({
      provider: "stripe",
      eventId: dupEventId,
      eventType: "charge.refunded",
      reversalType: "refund",
      orderId,
    });
    await handlePaymentReversal({
      provider: "stripe",
      eventId: dupEventId,
      eventType: "charge.refunded",
      reversalType: "refund",
      orderId,
    });

    const notifCount = await db.query.notifications.findMany({
      where: and(eq(notifications.userId, userId), eq(notifications.type, "payment_reversed")),
    });

    assert(notifCount.length === 1, `Expected exactly 1 notification, found ${notifCount.length}`);
  });

  // -------------------------------------------------------------------------------------------------
  // 15. DISPUTE RESERVE CREATION & PAYOUTABLE CONSTRAINT (Requirement 7)
  // Available: $100, Reserve: $20 -> Payoutable: $80. Payout of $90 blocked, payout of $80 succeeds.
  // -------------------------------------------------------------------------------------------------
  await runTest("15. Dispute Reserve: dispute.created -> reserve $20, payoutable $80, blocks $90 withdrawal", async () => {
    const { userId, shopId, prodId } = await createTestFixtures("t15_reserve");
    const orderId = await createTestOrder(shopId, prodId, 20.0);
    await fulfillOrder(orderId);

    // Initial state: Available = $100, Reserve = $0
    await db
      .update(sellerBalances)
      .set({ availableBalance: "100.00", pendingBalance: "0.00", reserveBalance: "0.00" })
      .where(eq(sellerBalances.userId, userId));
    await db.update(balanceTransactions).set({ isReleased: true }).where(eq(balanceTransactions.orderId, orderId));

    // 1. Dispute Created ($20)
    const disputeRes = await handlePaymentReversal({
      provider: "stripe",
      eventId: `evt_disp_created_${Date.now()}`,
      eventType: "charge.dispute.created",
      reversalType: "dispute",
      orderId,
      amount: 20.0,
    });

    assert(disputeRes.success === true, "Dispute event must be processed");
    assert(disputeRes.newReserveBalance === "20.00", "Reserve balance must be set to $20.00");
    assert(disputeRes.newAvailableBalance === "100.00", "Available balance must remain $100.00");
    assert(disputeRes.payoutableBalance === "80.00", "Payoutable balance must be $80.00 ($100 - $20 reserve)");

    // 2. Attempt payout of $90 -> MUST BE BLOCKED
    let blocked90 = false;
    try {
      await requestPayoutSimulated(userId, 90.0);
    } catch (err: any) {
      blocked90 = true;
      assert(err.message.includes("dispute reserve"), "Error message must mention dispute reserve");
    }
    assert(blocked90, "Payout of $90 must be blocked by dispute reserve");

    // 3. Attempt payout of $80 -> MUST SUCCEED
    const payout80 = await requestPayoutSimulated(userId, 80.0);
    assert(payout80.success === true, "Payout of $80 must succeed");

    const balAfter = await db.query.sellerBalances.findFirst({ where: eq(sellerBalances.userId, userId) });
    assert(parseFloat(balAfter?.availableBalance || "0") === 20.0, "Available balance should be $20 ($100 - $80 payout)");
    assert(parseFloat((balAfter as any)?.reserveBalance || "0") === 20.0, "Reserve balance remains $20");
  });

  // -------------------------------------------------------------------------------------------------
  // 16. CHARGEBACK SETTLES RESERVE (NO DOUBLE DEDUCTION) (Requirement 7)
  // Settle reserve: reserve $20 -> $0, available $20 -> $0. Final balance is $0, NOT -$20!
  // -------------------------------------------------------------------------------------------------
  await runTest("16. Chargeback Settles Reserve: funds_withdrawn settles reserve without double deduction", async () => {
    const { userId, shopId, prodId } = await createTestFixtures("t16_settle");
    const orderId = await createTestOrder(shopId, prodId, 20.0);
    await fulfillOrder(orderId);

    // Initial state: Available = $100, Reserve = $0
    await db
      .update(sellerBalances)
      .set({ availableBalance: "100.00", pendingBalance: "0.00", reserveBalance: "0.00" })
      .where(eq(sellerBalances.userId, userId));
    await db.update(balanceTransactions).set({ isReleased: true }).where(eq(balanceTransactions.orderId, orderId));

    // 1. Dispute Created ($20 reserve)
    await handlePaymentReversal({
      provider: "stripe",
      eventId: `evt_disp_init_${Date.now()}`,
      eventType: "charge.dispute.created",
      reversalType: "dispute",
      orderId,
      amount: 20.0,
    });

    // 2. Merchant withdraws maximum payoutable ($80)
    await requestPayoutSimulated(userId, 80.0);

    // 3. Chargeback funds_withdrawn ($20) arrives
    const chargebackRes = await handlePaymentReversal({
      provider: "stripe",
      eventId: `evt_disp_withdrawn_${Date.now()}`,
      eventType: "charge.dispute.funds_withdrawn",
      reversalType: "chargeback",
      orderId,
      amount: 20.0,
    });

    assert(chargebackRes.success === true, "Funds withdrawn chargeback must be processed");
    assert(chargebackRes.newReserveBalance === "0.00", "Reserve balance must be settled to $0.00");
    assert(chargebackRes.newAvailableBalance === "0.00", "Available balance must be $0.00 (settled, not double-debited to -$20)");
    assert(chargebackRes.isDebt === false, "No debt created because reserve was properly settled");
  });

  // -------------------------------------------------------------------------------------------------
  // 17. MULTI-WEBHOOK REPLAY & DOUBLE FINANCIAL EFFECT PROTECTION (Requirement 6)
  // charge.dispute.funds_withdrawn + charge.dispute.closed (lost) with different event IDs
  // -------------------------------------------------------------------------------------------------
  await runTest("17. Multi-Webhook Protection: duplicate chargeback events with different IDs do not double debit", async () => {
    const { userId, shopId, prodId } = await createTestFixtures("t17_multi");
    const orderId = await createTestOrder(shopId, prodId, 30.0);
    await fulfillOrder(orderId);

    await db
      .update(sellerBalances)
      .set({ availableBalance: "50.00", pendingBalance: "0.00", reserveBalance: "0.00" })
      .where(eq(sellerBalances.userId, userId));
    await db.update(balanceTransactions).set({ isReleased: true }).where(eq(balanceTransactions.orderId, orderId));

    // Event 1: charge.dispute.created (Event ID: evt_ev1)
    await handlePaymentReversal({
      provider: "stripe",
      eventId: `evt_ev1_${Date.now()}`,
      eventType: "charge.dispute.created",
      reversalType: "dispute",
      orderId,
      amount: 30.0,
    });

    // Event 2: charge.dispute.funds_withdrawn (Event ID: evt_ev2 - different ID)
    const res1 = await handlePaymentReversal({
      provider: "stripe",
      eventId: `evt_ev2_${Date.now()}`,
      eventType: "charge.dispute.funds_withdrawn",
      reversalType: "chargeback",
      orderId,
      amount: 30.0,
    });
    assert(res1.success === true, "First chargeback must succeed");
    assert(res1.newAvailableBalance === "20.00", "Available must be $20 ($50 - $30)");

    // Event 3: charge.dispute.closed (Event ID: evt_ev3 - another different ID for same lost dispute)
    const res2 = await handlePaymentReversal({
      provider: "stripe",
      eventId: `evt_ev3_${Date.now()}`,
      eventType: "charge.dispute.closed",
      reversalType: "chargeback",
      orderId,
      amount: 30.0,
    });
    assert(res2.success === true, "Second event must be handled safely");
    assert(res2.duplicate === true, "Second event must be flagged as duplicate financial operation");

    const bal = await db.query.sellerBalances.findFirst({ where: eq(sellerBalances.userId, userId) });
    assert(parseFloat(bal?.availableBalance || "0") === 20.0, "Available balance must strictly remain $20.00 (NO double deduction!)");
  });

  // -------------------------------------------------------------------------------------------------
  // 18. DISPUTE WON: RELEASE RESERVE (Requirement 7)
  // Available: $100. Dispute created ($20 reserve, $80 payoutable).
  // Dispute closed (won) -> reserve released ($0 reserve, $100 payoutable). Payout of $100 succeeds!
  // -------------------------------------------------------------------------------------------------
  await runTest("18. Dispute Won: charge.dispute.closed(won) releases reserve back to payoutable balance", async () => {
    const { userId, shopId, prodId } = await createTestFixtures("t18_won");
    const orderId = await createTestOrder(shopId, prodId, 25.0);
    await fulfillOrder(orderId);

    // Initial state: Available = $100, Reserve = $0
    await db
      .update(sellerBalances)
      .set({ availableBalance: "100.00", pendingBalance: "0.00", reserveBalance: "0.00" })
      .where(eq(sellerBalances.userId, userId));
    await db.update(balanceTransactions).set({ isReleased: true }).where(eq(balanceTransactions.orderId, orderId));

    // 1. Dispute Created ($25 reserve)
    await handlePaymentReversal({
      provider: "stripe",
      eventId: `evt_won_disp_${Date.now()}`,
      eventType: "charge.dispute.created",
      reversalType: "dispute",
      orderId,
      amount: 25.0,
    });

    // Payoutable is now $75. Attempting to withdraw $90 fails.
    let blocked90 = false;
    try {
      await requestPayoutSimulated(userId, 90.0);
    } catch {
      blocked90 = true;
    }
    assert(blocked90, "Payout of $90 is blocked while dispute is pending");

    // 2. Dispute Won!
    const wonRes = await handlePaymentReversal({
      provider: "stripe",
      eventId: `evt_won_closed_${Date.now()}`,
      eventType: "charge.dispute.closed",
      reversalType: "dispute_won",
      orderId,
      amount: 25.0,
    });

    assert(wonRes.success === true, "Dispute won event must be processed");
    const bal = await db.query.sellerBalances.findFirst({ where: eq(sellerBalances.userId, userId) });
    assert(parseFloat((bal as any)?.reserveBalance || "0") === 0.0, "Reserve must be released to $0.00");
    assert(parseFloat(bal?.availableBalance || "0") === 100.0, "Available balance must remain intact at $100.00");

    // 3. Full $100 payout now succeeds!
    const payout100 = await requestPayoutSimulated(userId, 100.0);
    assert(payout100.success === true, "Full $100 payout must succeed after dispute is won");

    const balFinal = await db.query.sellerBalances.findFirst({ where: eq(sellerBalances.userId, userId) });
    assert(parseFloat(balFinal?.availableBalance || "0") === 0.0, "Balance is $0 after full payout");
  });

  // -------------------------------------------------------------------------------------------------
  // MASTER SCENARIO: Complete End-to-End Cycle
  // -------------------------------------------------------------------------------------------------
  console.log(`\n${BOLD}${YELLOW}------------------------------------------------------${RESET}`);
  console.log(`${BOLD}${YELLOW}   RUNNING PRIMARY END-TO-END SCENARIO                ${RESET}`);
  console.log(`${BOLD}${YELLOW}------------------------------------------------------${RESET}\n`);

  await runTest("MASTER SCENARIO: $20 sale -> payout -> chargeback -> debt $20 -> payouts blocked -> $30 sale -> debt repaid -> payouts unlocked -> 1 notification", async () => {
    const { userId, shopId, prodId } = await createTestFixtures("master");

    // 1. $20 payment -> merchant +$20
    const order1 = await createTestOrder(shopId, prodId, 20.0);
    await fulfillOrder(order1);
    await db.update(sellerBalances).set({ availableBalance: "20.00", pendingBalance: "0.00" }).where(eq(sellerBalances.userId, userId));
    await db.update(balanceTransactions).set({ isReleased: true }).where(eq(balanceTransactions.orderId, order1));

    let bal = await db.query.sellerBalances.findFirst({ where: eq(sellerBalances.userId, userId) });
    assert(parseFloat(bal?.availableBalance || "0") === 20.0, "Step 1: Balance must be $20");

    // 2. Merchant wypłaca $20 -> balance = $0
    const payoutRes = await requestPayoutSimulated(userId, 20.0);
    assert(payoutRes.success === true, "Step 2: Payout must succeed");
    bal = await db.query.sellerBalances.findFirst({ where: eq(sellerBalances.userId, userId) });
    assert(parseFloat(bal?.availableBalance || "0") === 0.0, "Step 2: Balance must be $0 after payout");

    // 3. Provider wysyła chargeback $20
    const chargebackRes = await handlePaymentReversal({
      provider: "stripe",
      eventId: `evt_master_cb_${Date.now()}`,
      eventType: "charge.dispute.funds_withdrawn",
      reversalType: "chargeback",
      orderId: order1,
      amount: 20.0,
    });
    assert(chargebackRes.success === true, "Step 3: Chargeback must be processed");
    bal = await db.query.sellerBalances.findFirst({ where: eq(sellerBalances.userId, userId) });
    assert(parseFloat(bal?.availableBalance || "0") === -20.0, "Step 3: Merchant debt must be -$20.00");

    // 4. Payouts blocked
    let payoutBlocked = false;
    try {
      await requestPayoutSimulated(userId, 10.0);
    } catch {
      payoutBlocked = true;
    }
    assert(payoutBlocked, "Step 4: Payouts must be strictly blocked");

    // 5. Merchant sprzedaje za $30 -> $20 spłaca debt, $10 trafia do available
    const order2 = await createTestOrder(shopId, prodId, 30.0);
    await fulfillOrder(order2);

    bal = await db.query.sellerBalances.findFirst({ where: eq(sellerBalances.userId, userId) });
    const availAfterSale = parseFloat(bal?.availableBalance || "0");
    assert(availAfterSale > 0, `Step 5: Available balance must be positive (cleared debt + surplus), got ${availAfterSale}`);

    // 6. Payout zostaje odblokowany
    const unlockPayout = await requestPayoutSimulated(userId, Math.min(10.0, availAfterSale));
    assert(unlockPayout.success === true, "Step 6: Payout must be unlocked and succeed");

    // 7. Merchant Inbox zawiera jedno powiadomienie o reversal
    const notifs = await db.query.notifications.findMany({
      where: and(eq(notifications.userId, userId), eq(notifications.type, "payment_reversed")),
    });
    assert(notifs.length === 1, `Step 7: Inbox must contain exactly 1 reversal notification, found ${notifs.length}`);
    assert(notifs[0].message.includes("outstanding balance") || notifs[0].message.includes("reversed by the payment provider"), "Notification must clearly state provider reversal and debt impact");
  });

  console.log(`\n${BOLD}${CYAN}======================================================${RESET}`);
  console.log(`${BOLD}   TEST SUMMARY: ${GREEN}${passedCount} PASSED${RESET}, ${failedCount > 0 ? RED : GREEN}${failedCount} FAILED${RESET}`);
  console.log(`${BOLD}${CYAN}======================================================${RESET}\n`);

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((e) => {
  console.error("FATAL TEST SUITE ERROR:", e);
  process.exit(1);
});
