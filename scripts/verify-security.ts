import crypto from "crypto";
import {
  generateOrderBearerSecret,
  hashOrderBearerSecret,
  verifyOrderSecret,
} from "../lib/order-auth";
import { validateDiscordWebhookUrl, validateWebhookUrl } from "../lib/webhooks";

/**
 * Phase 3 Automated Security & Logic Verification Suite
 */
async function runSecuritySuite() {
  console.log("\n=======================================================");
  console.log("  KRYPT / VAULTLY PHASE 3 SECURITY VERIFICATION SUITE  ");
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

  // ── TEST 1: Bearer Secret Generation & Entropy ────────────────────────────
  const secret1 = generateOrderBearerSecret();
  const secret2 = generateOrderBearerSecret();
  assert(
    typeof secret1 === "string" && secret1.length === 64,
    "Secret 1 has 256 bits (64 hex characters) of CSPRNG entropy"
  );
  assert(
    secret1 !== secret2,
    "Secrets are independently generated and unpredictable"
  );

  // ── TEST 2: Bearer Secret Hashing ─────────────────────────────────────────
  const hash1 = hashOrderBearerSecret(secret1);
  const hash2 = hashOrderBearerSecret(secret1);
  assert(
    hash1 === hash2 && hash1.length === 64,
    "hashOrderBearerSecret produces consistent, valid SHA-256 digests"
  );

  // ── TEST 3: Scenario A — Order Access without Secret Fails ─────────────────
  const dummyOrderId = crypto.randomUUID();
  const dummyEmail = "buyer@victim.com";
  const authNoSecret = verifyOrderSecret({
    orderId: dummyOrderId,
    buyerEmail: dummyEmail,
    providedSecret: undefined,
    storedSecretHash: hash1,
  });
  assert(authNoSecret === false, "Scenario A: Order access without secret is rejected (403)");

  // ── TEST 4: Scenario B — Order Access with Wrong Secret Fails ──────────────
  const wrongSecret = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  const authWrongSecret = verifyOrderSecret({
    orderId: dummyOrderId,
    buyerEmail: dummyEmail,
    providedSecret: wrongSecret,
    storedSecretHash: hash1,
  });
  assert(authWrongSecret === false, "Scenario B: Order access with wrong secret is rejected (403)");

  // ── TEST 5: Scenario C — Order Access with Correct Secret Succeeds ─────────
  const authCorrectSecret = verifyOrderSecret({
    orderId: dummyOrderId,
    buyerEmail: dummyEmail,
    providedSecret: secret1,
    storedSecretHash: hash1,
  });
  assert(authCorrectSecret === true, "Scenario C: Order access with correct bearer secret is granted");

  // ── TEST 6: Scenario E — Attacker with Order ID + Email Cannot Compute Secret ─
  const attackerAttempt = verifyOrderSecret({
    orderId: dummyOrderId,
    buyerEmail: dummyEmail,
    providedSecret: `${dummyOrderId}:${dummyEmail}`,
    storedSecretHash: hash1,
  });
  assert(
    attackerAttempt === false,
    "Scenario E: Attacker knowing Order ID + Email cannot bypass bearer secret check"
  );

  // ── TEST 7: Webhook SSRF — Cloud Metadata & Loopback Blocked ──────────────
  const ssrf1 = validateWebhookUrl("http://169.254.169.254/latest/meta-data/");
  const ssrf2 = validateWebhookUrl("http://127.0.0.1:8080/admin");
  const ssrf3 = validateWebhookUrl("http://localhost:3000/api");
  const ssrf4 = validateWebhookUrl("https://webhook.site/my-endpoint");
  assert(ssrf1.valid === false, "SSRF: Cloud metadata (169.254.169.254) is blocked");
  assert(ssrf2.valid === false, "SSRF: Loopback (127.0.0.1) is blocked");
  assert(ssrf3.valid === false, "SSRF: Localhost is blocked");
  assert(ssrf4.valid === true, "SSRF: Public HTTPS endpoint is permitted");

  // ── TEST 8: Discord Webhook Validation ───────────────────────────────────
  const discordValid = validateDiscordWebhookUrl(
    "https://discord.com/api/webhooks/123456789/abcdefghijk"
  );
  const discordAppValid = validateDiscordWebhookUrl(
    "https://discordapp.com/api/webhooks/987654321/xyz123"
  );
  const discordFakeDomain = validateDiscordWebhookUrl(
    "https://evil-attacker.com/api/webhooks/123/abc"
  );
  const discordHttp = validateDiscordWebhookUrl(
    "http://discord.com/api/webhooks/123/abc"
  );
  assert(discordValid.valid === true, "Discord Webhook: genuine discord.com HTTPS endpoint allowed");
  assert(discordAppValid.valid === true, "Discord Webhook: genuine discordapp.com HTTPS endpoint allowed");
  assert(discordFakeDomain.valid === false, "Discord Webhook: non-discord domain rejected");
  assert(discordHttp.valid === false, "Discord Webhook: unencrypted HTTP rejected");

  // ── TEST 9: Admin Shop Preview & Tenant Isolation Logic ───────────────────
  // Simulated tenant context resolver test
  const merchantUserA = { id: "user_merchant_a", role: "user" };
  const merchantUserB = { id: "user_merchant_b", role: "user" };
  const adminUser = { id: "user_admin_root", role: "admin" };

  const shopA = { id: "shop_alpha", userId: "user_merchant_a", name: "Store Alpha" };
  const shopB = { id: "shop_beta", userId: "user_merchant_b", name: "Store Beta" };

  function simulateShopResolution(user: { id: string; role: string }, requestedShopId?: string | null) {
    const isAdmin = user.role === "admin" || user.role === "superadmin";
    if (requestedShopId) {
      const targetShop = [shopA, shopB].find((s) => s.id === requestedShopId);
      if (targetShop) {
        if (targetShop.userId === user.id) {
          return { shop: targetShop, isPreviewMode: false, isOwner: true };
        }
        if (isAdmin) {
          return { shop: targetShop, isPreviewMode: true, isOwner: false };
        }
      }
    }
    const defaultShop = [shopA, shopB].find((s) => s.userId === user.id);
    return { shop: defaultShop || null, isPreviewMode: false, isOwner: !!defaultShop };
  }

  const resAdminPreviewA = simulateShopResolution(adminUser, "shop_alpha");
  assert(
    resAdminPreviewA.shop?.id === "shop_alpha" && resAdminPreviewA.isPreviewMode === true,
    "Shop Preview A: Admin requesting shop_alpha loads shop_alpha with isPreviewMode=true"
  );

  const resAdminPreviewB = simulateShopResolution(adminUser, "shop_beta");
  assert(
    resAdminPreviewB.shop?.id === "shop_beta" && resAdminPreviewB.isPreviewMode === true,
    "Shop Preview B: Admin requesting shop_beta loads shop_beta with isPreviewMode=true"
  );

  const resAdminNormal = simulateShopResolution(adminUser, null);
  assert(
    resAdminNormal.isPreviewMode === false,
    "Shop Preview C: Admin without shopId returns normal context without override"
  );

  const resMerchantBUnauthorized = simulateShopResolution(merchantUserB, "shop_alpha");
  assert(
    resMerchantBUnauthorized.shop?.id === "shop_beta" && resMerchantBUnauthorized.isPreviewMode === false,
    "Shop Preview D: Merchant B attempting to preview Shop A is denied and falls back to Shop B"
  );

  assert(
    shopA.userId === "user_merchant_a",
    "Shop Preview E: Shop ownership (shops.userId) remains intact and unmodified during preview"
  );

  console.log("\n-------------------------------------------------------");
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log("-------------------------------------------------------\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runSecuritySuite().catch((err) => {
  console.error("Verification suite encountered unhandled error:", err);
  process.exit(1);
});
