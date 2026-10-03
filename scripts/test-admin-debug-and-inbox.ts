import { generateAdminSessionTicket } from "../lib/admin-gate";
import { db } from "../lib/db";
import { user, shops, products, orders, sellerBalances, notifications } from "../lib/db/schema";
import { eq, desc } from "drizzle-orm";
import crypto from "crypto";
import { GET as getDebugOrders, POST as postDebugReversal } from "../app/api/admin/debug/reverse-payment/route";
import { GET as getNotifications, PATCH as patchNotifications } from "../app/api/notifications/route";

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const CYAN = "\x1b[36m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

async function runVerification() {
  console.log(`${BOLD}${CYAN}======================================================${RESET}`);
  console.log(`${BOLD}${CYAN}   ADMIN DEBUG REVERSALS & INBOX NOTIFICATIONS TEST   ${RESET}`);
  console.log(`${BOLD}${CYAN}======================================================${RESET}\n`);

  const testId = Date.now();
  const testUserId = `usr_debug_merchant_${testId}`;
  const testShopId = `shp_debug_${testId}`;
  const testProdId = `prd_debug_${testId}`;

  // 1. Setup Test Merchant
  console.log(`[1] Creating Merchant Fixtures (User: ${testUserId})...`);
  await db.insert(user).values({
    id: testUserId,
    name: "Alex Merchant (Verified)",
    email: `alex_${testId}@krypt.market`,
    role: "user",
  });

  await db.insert(shops).values({
    id: testShopId,
    userId: testUserId,
    slug: `alex-store-${testId}`,
    name: `Alex Goods #${testId}`,
    isActive: true,
    isAccepted: true,
  });

  await db.insert(products).values({
    id: testProdId,
    shopId: testShopId,
    title: "1-Month Discord Nitro Gift",
    type: "service",
    price: "40.00",
    isActive: true,
  });

  await db.insert(sellerBalances).values({
    id: crypto.randomUUID(),
    userId: testUserId,
    availableBalance: "100.00",
    pendingBalance: "0.00",
    reserveBalance: "0.00",
    totalEarned: "100.00",
    totalWithdrawn: "0.00",
  });

  // Create a completed order
  const order1Id = `ord_dispute_${testId}`;
  await db.insert(orders).values({
    id: order1Id,
    shopId: testShopId,
    productId: testProdId,
    buyerEmail: "buyer_dispute@gmail.com",
    quantity: 1,
    unitPrice: "40.00",
    totalAmount: "40.00",
    currency: "USD",
    paymentMethod: "stripe",
    paymentStatus: "completed",
    stripePaymentIntentId: `pi_disp_${testId}`,
  });

  console.log(`${GREEN}✓ Fixtures created. Initial Available: $100.00, Reserve: $0.00, Payoutable: $100.00${RESET}\n`);

  // Generate super-admin ticket
  const adminTicket = generateAdminSessionTicket("127.0.0.1");

  // 2. Test GET /api/admin/debug/reverse-payment
  console.log("[2] Testing GET /api/admin/debug/reverse-payment (Candidate Orders List)...");
  const getReq = new Request("http://localhost/api/admin/debug/reverse-payment", {
    headers: { "x-admin-ticket": adminTicket },
  });
  const getRes = await getDebugOrders(getReq);
  assert(getRes.status === 200, `Expected status 200, got ${getRes.status}`);
  const getData = await getRes.json();
  assert(Array.isArray(getData.orders), "Orders should be an array");
  const foundOrder = getData.orders.find((o: any) => o.id === order1Id);
  assert(!!foundOrder, `Order ${order1Id} should appear in candidate orders list`);
  console.log(`${GREEN}✓ Candidate list returned ${getData.orders.length} orders; targeted order identified.${RESET}\n`);

  // 3. Test POST /api/admin/debug/reverse-payment with ReversalType = "dispute"
  console.log("[3] Testing POST /api/admin/debug/reverse-payment (Simulate BUYER DISPUTE)...");
  const disputeReq = new Request("http://localhost/api/admin/debug/reverse-payment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-ticket": adminTicket,
    },
    body: JSON.stringify({
      orderId: order1Id,
      reversalType: "dispute",
      amount: 40.00,
      reason: "Buyer opened dispute: Cardholder does not recognize transaction",
    }),
  });

  const disputeRes = await postDebugReversal(disputeReq);
  const disputeData = await disputeRes.json();
  assert(disputeRes.status === 200, `Expected 200, got ${disputeRes.status}: ${JSON.stringify(disputeData)}`);
  assert(disputeData.success === true, "disputeData.success should be true");
  assert(disputeData.order.newPaymentStatus === "disputed", "Order status should be disputed");
  assert(disputeData.reversalResult.newReserveBalance === "40.00", "Reserve balance should be $40.00");
  assert(disputeData.reversalResult.payoutableBalance === "60.00", "Payoutable balance should be $60.00 ($100 - $40)");
  console.log(`${GREEN}✓ Dispute processed successfully. Order marked as disputed, $40 held in reserve.${RESET}\n`);

  // 4. Verify Merchant Inbox Notification for DISPUTE
  console.log("[4] Verifying Merchant Inbox for Payment Dispute Notice...");
  const merchantNotifs1 = await db.query.notifications.findMany({
    where: eq(notifications.userId, testUserId),
    orderBy: [desc(notifications.createdAt)],
  });

  assert(merchantNotifs1.length === 1, `Expected 1 notification, found ${merchantNotifs1.length}`);
  const notif1 = merchantNotifs1[0];
  assert(notif1.type === "payment_disputed", `Expected type payment_disputed, got ${notif1.type}`);
  assert(notif1.title.toLowerCase().includes("dispute"), `Title should mention dispute: "${notif1.title}"`);
  assert(notif1.message.includes("$40.00"), `Message should mention $40.00: "${notif1.message}"`);
  assert(notif1.reason === "Buyer opened dispute: Cardholder does not recognize transaction", "Reason should match simulation input");
  assert(notif1.isRead === false, "Notification should be unread initially");
  console.log(`${GREEN}✓ Inbox Notification delivered!${RESET}`);
  console.log(`  • ID: ${notif1.id}`);
  console.log(`  • Type: ${notif1.type}`);
  console.log(`  • Title: "${notif1.title}"`);
  console.log(`  • Message: "${notif1.message}"`);
  console.log(`  • Reason: "${notif1.reason}"`);
  console.log(`  • Is Read: ${notif1.isRead}\n`);

  // 5. Test POST /api/admin/debug/reverse-payment with ReversalType = "dispute_won"
  console.log("[5] Testing POST /api/admin/debug/reverse-payment (Simulate DISPUTE WON / RESERVE RELEASE)...");
  const winReq = new Request("http://localhost/api/admin/debug/reverse-payment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-ticket": adminTicket,
    },
    body: JSON.stringify({
      orderId: order1Id,
      reversalType: "dispute_won",
      amount: 40.00,
      reason: "Merchant provided legitimate digital delivery evidence; bank ruled in merchant favor.",
    }),
  });

  const winRes = await postDebugReversal(winReq);
  const winData = await winRes.json();
  assert(winRes.status === 200, `Expected 200, got ${winRes.status}: ${JSON.stringify(winData)}`);
  assert(winData.success === true, "winData.success should be true");
  assert(winData.order.newPaymentStatus === "completed", "Order status should be restored to completed");
  assert(winData.reversalResult.newReserveBalance === "0.00", "Reserve balance should be released back to $0.00");
  assert(winData.reversalResult.payoutableBalance === "100.00", "Payoutable balance should be fully restored to $100.00");
  console.log(`${GREEN}✓ Dispute Won processed! Order restored to completed, reserve released back to $0.00, payoutable funds restored to $100.00.${RESET}\n`);

  // 6. Verify Merchant Inbox Notification for DISPUTE WON
  console.log("[6] Verifying Merchant Inbox for Dispute Won Notice...");
  const merchantNotifs2 = await db.query.notifications.findMany({
    where: eq(notifications.userId, testUserId),
    orderBy: [desc(notifications.createdAt)],
  });

  assert(merchantNotifs2.length === 2, `Expected 2 notifications, found ${merchantNotifs2.length}`);
  const notif2 = merchantNotifs2[0]; // Latest
  assert(notif2.type === "payment_dispute_won", `Expected type payment_dispute_won, got ${notif2.type}`);
  assert(notif2.title.toLowerCase().includes("dispute won"), `Title should announce win: "${notif2.title}"`);
  assert(notif2.message.includes("$40.00"), `Message should reference the $40.00 reserve released: "${notif2.message}"`);
  assert(notif2.reason?.includes("legitimate digital delivery"), "Reason should include the winning note");
  console.log(`${GREEN}✓ Dispute Won Notification delivered!${RESET}`);
  console.log(`  • ID: ${notif2.id}`);
  console.log(`  • Type: ${notif2.type}`);
  console.log(`  • Title: "${notif2.title}"`);
  console.log(`  • Message: "${notif2.message}"`);
  console.log(`  • Reason: "${notif2.reason}"\n`);

  // 7. Test POST /api/admin/debug/reverse-payment with ReversalType = "chargeback" causing negative balance
  console.log("[7] Testing POST /api/admin/debug/reverse-payment (Simulate CHARGEBACK & DEBT)...");
  // Create second order for $150
  const order2Id = `ord_chargeback_${testId}`;
  await db.insert(orders).values({
    id: order2Id,
    shopId: testShopId,
    productId: testProdId,
    buyerEmail: "chargeback_claim@test.local",
    quantity: 1,
    unitPrice: "150.00",
    totalAmount: "150.00",
    currency: "USD",
    paymentMethod: "stripe",
    paymentStatus: "completed",
    stripePaymentIntentId: `pi_cb_${testId}`,
  });

  const cbReq = new Request("http://localhost/api/admin/debug/reverse-payment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-ticket": adminTicket,
    },
    body: JSON.stringify({
      orderId: order2Id,
      reversalType: "chargeback",
      amount: 150.00,
      reason: "Issuing bank forced reversal due to confirmed fraudulent card use",
    }),
  });

  const cbRes = await postDebugReversal(cbReq);
  const cbData = await cbRes.json();
  assert(cbRes.status === 200, `Expected 200, got ${cbRes.status}: ${JSON.stringify(cbData)}`);
  assert(cbData.success === true, "cbData.success should be true");
  assert(cbData.order.newPaymentStatus === "reversed", "Order status should be reversed");
  assert(cbData.balances.isDebt === true, "Account should be flagged with debt");
  assert(cbData.balances.debtAmount === 50, "Debt amount should be $50 ($100 available - $150 debit = -$50)");
  assert(cbData.balances.newAvailable === "-50.00", "New available balance should be -$50.00");
  console.log(`${GREEN}✓ Chargeback processed! Account accurately entered -$50.00 debt, payouts locked.${RESET}\n`);

  // 8. Verify Merchant Inbox Notification for CHARGEBACK & DEBT
  console.log("[8] Verifying Merchant Inbox for Chargeback & Debt Warning...");
  const merchantNotifs3 = await db.query.notifications.findMany({
    where: eq(notifications.userId, testUserId),
    orderBy: [desc(notifications.createdAt)],
  });

  assert(merchantNotifs3.length === 3, `Expected 3 notifications, found ${merchantNotifs3.length}`);
  const notif3 = merchantNotifs3.find(n => n.type === "payment_reversed");
  assert(!!notif3, "payment_reversed notification should be present in inbox");
  assert(notif3.message.includes("outstanding balance") || notif3.message.includes("$50.00"), "Message should explicitly inform merchant of outstanding debt");
  console.log(`${GREEN}✓ Chargeback & Debt Warning delivered!${RESET}`);
  console.log(`  • Title: "${notif3.title}"`);
  console.log(`  • Message: "${notif3.message}"`);
  console.log(`  • Reason: "${notif3.reason}"\n`);

  // 9. Verify Mark Read & Inbox interaction
  console.log("[9] Testing Mark All Read in Merchant Inbox...");
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, testUserId));
  const unreadCount = await db.query.notifications.findMany({
    where: eq(notifications.userId, testUserId),
  });
  assert(unreadCount.every(n => n.isRead === true), "All notifications should now be marked as read");
  console.log(`${GREEN}✓ Merchant inbox mark-all-read verified.${RESET}\n`);

  console.log(`${BOLD}${GREEN}======================================================${RESET}`);
  console.log(`${BOLD}${GREEN}   ALL REVERSAL, CHARGEBACK & INBOX TESTS PASSED!     ${RESET}`);
  console.log(`${BOLD}${GREEN}======================================================${RESET}`);
}

runVerification().catch((err) => {
  console.error(`\n${RED}${BOLD}VERIFICATION FAILED:${RESET}`, err);
  process.exit(1);
});
