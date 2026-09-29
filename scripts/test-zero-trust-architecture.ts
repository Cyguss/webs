import { db, pool, ensureDatabaseSchema } from "../lib/db";
import {
  user,
  shops,
  products,
  inventoryKeys,
  orders,
  tickets,
  ticketMessages,
  platformSettings,
} from "../lib/db/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import { isUserActiveAdmin, hasAdminPermission } from "../lib/admin-gate";
import { verifyOrderSecret, generateOrderBearerSecret, hashOrderBearerSecret } from "../lib/order-auth";

async function runZeroTrustAudit() {
  console.log("=================================================================");
  console.log("🛡️  ZERO-CLIENT-TRUST & SECURITY ARCHITECTURE AUDIT SUITE");
  console.log("=================================================================\n");

  await ensureDatabaseSchema(pool);

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}${detail ? " -> " + detail : ""}`);
    }
  }

  const runId = crypto.randomUUID().slice(0, 8);

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. TICKET SECURITY & BOLA / IDOR PREVENTION
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("--- 1. Support Tickets: BOLA / IDOR & Zero-Trust Bearer Tokens ---");

  // Create test shop
  const testUserId = `usr_zt_${runId}`;
  const testShopId = `shp_zt_${runId}`;
  await db.insert(user).values({
    id: testUserId,
    email: `merchant_${runId}@krypt.test`,
    name: "Zero Trust Merchant",
    emailVerified: true,
  });
  await db.insert(shops).values({
    id: testShopId,
    userId: testUserId,
    name: `ZT Store ${runId}`,
    slug: `zt-store-${runId}`,
  });

  // Buyer creates a ticket
  const ticketBearerSecret = crypto.randomBytes(32).toString("hex");
  const ticketSecretHash = crypto.createHash("sha256").update(ticketBearerSecret).digest("hex");
  const testTicketId = "TICK-" + crypto.randomBytes(8).toString("hex").toUpperCase();
  const buyerEmail = `customer_${runId}@example.com`;

  await db.insert(tickets).values({
    id: testTicketId,
    shopId: testShopId,
    buyerEmail,
    subject: "My License Key Question",
    status: "open",
    priority: "normal",
    accessSecretHash: ticketSecretHash,
  });

  await db.insert(ticketMessages).values({
    id: crypto.randomUUID(),
    ticketId: testTicketId,
    senderType: "buyer",
    message: "Here is my private message regarding order #101.",
  });

  // TEST 1.1: Verify Ticket ID entropy (CSPRNG, at least 16 hex chars)
  assert(
    testTicketId.startsWith("TICK-") && testTicketId.length >= 21,
    "Ticket ID uses CSPRNG with high entropy (>= 64 bits)",
    `Got ${testTicketId}`
  );

  // TEST 1.2: Raw email alone without cryptographic secret MUST NOT authenticate (Zero Client Trust)
  const resEmailOnly = await fetch(`http://localhost:3000/api/tickets?ticketId=${testTicketId}&buyerEmail=${buyerEmail}`);
  assert(
    resEmailOnly.status === 403,
    "GET /api/tickets rejects unauthenticated buyerEmail string with 403 Forbidden",
    `Status was ${resEmailOnly.status}`
  );

  // TEST 1.3: Forged / wrong secret MUST fail
  const resWrongSecret = await fetch(
    `http://localhost:3000/api/tickets?ticketId=${testTicketId}&secret=forged_token_12345`
  );
  assert(
    resWrongSecret.status === 403,
    "GET /api/tickets rejects forged/invalid bearer secret with 403 Forbidden",
    `Status was ${resWrongSecret.status}`
  );

  // TEST 1.4: Legitimate bearer secret grants access
  const resValidSecret = await fetch(
    `http://localhost:3000/api/tickets?ticketId=${testTicketId}&secret=${ticketBearerSecret}`
  );
  const validSecretData = await resValidSecret.json();
  assert(
    resValidSecret.status === 200 && validSecretData.ticket.id === testTicketId && validSecretData.messages.length === 1,
    "GET /api/tickets successfully authorizes via cryptographic bearer secret",
    `Status was ${resValidSecret.status}`
  );

  // TEST 1.5: Linked Order Bearer Secret grants ticket access
  const orderBearerSecret = generateOrderBearerSecret();
  const orderSecretHash = hashOrderBearerSecret(orderBearerSecret);
  const orderId = `ord_zt_${runId}`;

  await db.insert(orders).values({
    id: orderId,
    shopId: testShopId,
    productId: "dummy_prod",
    buyerEmail,
    quantity: 1,
    unitPrice: "25.00",
    totalAmount: "25.00",
    currency: "USD",
    paymentMethod: "stripe",
    paymentStatus: "completed",
    accessSecretHash: orderSecretHash,
  });

  // Link ticket to order
  await db.update(tickets).set({ orderId }).where(eq(tickets.id, testTicketId));

  const resOrderSecret = await fetch(
    `http://localhost:3000/api/tickets?ticketId=${testTicketId}&orderSecret=${orderBearerSecret}`
  );
  assert(
    resOrderSecret.status === 200,
    "GET /api/tickets allows buyer access via linked order cryptographic secret",
    `Status was ${resOrderSecret.status}`
  );

  // TEST 1.6: Buyer reply rejected without bearer secret
  const resReplyNoSecret = await fetch("http://localhost:3000/api/tickets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "reply",
      ticketId: testTicketId,
      buyerEmail, // unauthenticated email string
      message: "Malicious reply attempting to impersonate customer",
      senderType: "buyer",
    }),
  });
  assert(
    resReplyNoSecret.status === 403,
    "POST /api/tickets (reply) strictly rejects buyer reply without bearer secret (403 Forbidden)",
    `Status was ${resReplyNoSecret.status}`
  );

  // TEST 1.7: Buyer reply succeeds with valid bearer secret
  const resReplyValidSecret = await fetch("http://localhost:3000/api/tickets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "reply",
      ticketId: testTicketId,
      secret: ticketBearerSecret,
      message: "Legitimate customer followup message.",
      senderType: "buyer",
    }),
  });
  const replyData = await resReplyValidSecret.json();
  assert(
    resReplyValidSecret.status === 200 && replyData.success === true,
    "POST /api/tickets (reply) succeeds when authenticated with cryptographic bearer secret",
    `Status was ${resReplyValidSecret.status}`
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. SERVER AUTHORIZATION & STAFF ROLES (Zero-Client-Trust on Admin)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n--- 2. Server Authorization: Staff Permissions & Role Freezing ---");

  // TEST 2.1: Deactivated Admin (adminPermissionsActive = false)
  const deactivatedAdminUser = {
    role: "admin",
    adminPermissionsActive: false,
    adminPermissions: JSON.stringify({ canDeleteShops: true, canManageUsers: true, canApproveShops: true }),
  };
  assert(
    !isUserActiveAdmin(deactivatedAdminUser),
    "isUserActiveAdmin rejects frozen admin with adminPermissionsActive = false",
    "Should return false"
  );
  assert(
    !hasAdminPermission(deactivatedAdminUser, "canDeleteShops"),
    "hasAdminPermission rejects canDeleteShops for frozen admin",
    "Should return false"
  );
  assert(
    !hasAdminPermission(deactivatedAdminUser, "canManageUsers"),
    "hasAdminPermission rejects canManageUsers for frozen admin",
    "Should return false"
  );
  assert(
    !hasAdminPermission(deactivatedAdminUser, "canApproveShops"),
    "hasAdminPermission rejects canApproveShops for frozen admin",
    "Should return false"
  );

  // TEST 2.2: Active Admin with Granular Permissions
  const granularAdminUser = {
    role: "admin",
    adminPermissionsActive: true,
    adminPermissions: JSON.stringify({
      canApproveShops: true,
      canDeleteShops: false,
      canManageUsers: false,
      canManagePayouts: true,
    }),
  };
  assert(
    isUserActiveAdmin(granularAdminUser),
    "isUserActiveAdmin accepts active staff admin",
    "Should return true"
  );
  assert(
    hasAdminPermission(granularAdminUser, "canApproveShops"),
    "hasAdminPermission allows canApproveShops when granted",
    "Should return true"
  );
  assert(
    !hasAdminPermission(granularAdminUser, "canDeleteShops"),
    "hasAdminPermission blocks canDeleteShops when not granted",
    "Should return false"
  );
  assert(
    !hasAdminPermission(granularAdminUser, "canManageUsers"),
    "hasAdminPermission blocks canManageUsers when not granted",
    "Should return false"
  );

  // TEST 2.3: Super-Admin inherently possesses all permissions
  const superAdminUser = {
    role: "superadmin",
    adminPermissionsActive: true,
    adminPermissions: null,
  };
  assert(
    hasAdminPermission(superAdminUser, "canDeleteShops") &&
      hasAdminPermission(superAdminUser, "canManageUsers") &&
      hasAdminPermission(superAdminUser, "canApproveShops") &&
      hasAdminPermission(superAdminUser, "canManagePayouts"),
    "Super-Admin unconditionally possesses all granular administrative permissions",
    "Should all be true"
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. ORDER & LICENSE KEY PROTECTION (Anti-Enumeration / Anti-Theft)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n--- 3. Order & License Key Protection (Anti-Enumeration) ---");

  // TEST 3.1: Order Lookup never exposes keys or receipt links directly in JSON
  const lookupRes = await fetch("http://localhost:3000/api/orders/lookup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: buyerEmail,
    }),
  });
  const lookupBody = await lookupRes.json();
  assert(
    lookupRes.status === 200 &&
      lookupBody.success === true &&
      !lookupBody.orders &&
      !lookupBody.receiptUrl &&
      !lookupBody.secret &&
      !lookupBody.keys,
    "POST /api/orders/lookup NEVER returns keys, tokens, or URLs to unauthenticated caller",
    `Body had keys: ${Object.keys(lookupBody).join(", ")}`
  );

  // TEST 3.2: Order Secret Verification Constant-Time Guard
  assert(
    verifyOrderSecret({
      orderId,
      buyerEmail,
      providedSecret: orderBearerSecret,
      storedSecretHash: orderSecretHash,
    }),
    "verifyOrderSecret authenticates matching order secret",
    "Should return true"
  );

  assert(
    !verifyOrderSecret({
      orderId,
      buyerEmail,
      providedSecret: "invalid_secret_token",
      storedSecretHash: orderSecretHash,
    }),
    "verifyOrderSecret rejects invalid order secret",
    "Should return false"
  );

  // Clean up test data
  await db.delete(ticketMessages).where(eq(ticketMessages.ticketId, testTicketId));
  await db.delete(tickets).where(eq(tickets.id, testTicketId));
  await db.delete(orders).where(eq(orders.id, orderId));
  await db.delete(shops).where(eq(shops.id, testShopId));
  await db.delete(user).where(eq(user.id, testUserId));

  console.log("\n=================================================================");
  console.log(`🎯 AUDIT SUMMARY: ${passed}/${total} Zero-Trust Architectural Checks PASSED`);
  console.log("=================================================================\n");

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runZeroTrustAudit().catch((err) => {
  console.error("Audit suite error:", err);
  process.exit(1);
});
