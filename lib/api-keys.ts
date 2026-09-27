import { db } from "@/lib/db";
import { apiKeys, shops } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

export interface ApiKeyVerificationResult {
  valid: boolean;
  keyId?: string;
  userId?: string;
  shopId?: string;
  shopSlug?: string;
  permissions?: string[];
  error?: string;
}

/**
 * Generates a new cryptographically secure API key.
 * Format: vlt_live_<32 random hex characters>
 * Only the hash is stored in the database. The full key is displayed to the user once.
 */
export async function createMerchantApiKey(params: {
  userId: string;
  shopId: string;
  name: string;
  permissions?: string[];
}): Promise<{
  id: string;
  fullKey: string;
  keyPrefix: string;
  name: string;
  createdAt: Date;
}> {
  const { userId, shopId, name, permissions = ["orders:read", "licenses:verify", "products:read"] } = params;

  // Generate 32 bytes of high-entropy randomness
  const randomPart = crypto.randomBytes(24).toString("hex");
  const fullKey = `vlt_live_${randomPart}`;
  const keyPrefix = fullKey.slice(0, 16); // e.g. "vlt_live_9a4f21b3"
  const keyHash = crypto.createHash("sha256").update(fullKey).digest("hex");

  const id = `apk_${crypto.randomUUID().slice(0, 12)}`;

  await db.insert(apiKeys).values({
    id,
    userId,
    shopId,
    name,
    keyPrefix,
    keyHash,
    permissions: JSON.stringify(permissions),
    isActive: true,
  });

  return {
    id,
    fullKey,
    keyPrefix,
    name,
    createdAt: new Date(),
  };
}

/**
 * Validates an incoming API key from request headers.
 * Accepts either:
 * - Authorization: Bearer vlt_live_...
 * - X-Vaultly-Api-Key: vlt_live_...
 */
export async function verifyMerchantApiKey(req: Request): Promise<ApiKeyVerificationResult> {
  const authHeader = req.headers.get("authorization");
  const apiKeyHeader = req.headers.get("x-vaultly-api-key");

  let token: string | null = null;
  if (apiKeyHeader) {
    token = apiKeyHeader.trim();
  } else if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    token = authHeader.slice(7).trim();
  }

  if (!token) {
    return { valid: false, error: "Missing API Key. Provide via 'Authorization: Bearer <key>' or 'X-Vaultly-Api-Key: <key>' header." };
  }

  if (!token.startsWith("vlt_live_")) {
    return { valid: false, error: "Invalid API key format. Vaultly API keys start with 'vlt_live_'." };
  }

  const hash = crypto.createHash("sha256").update(token).digest("hex");

  const keyRecord = await db.query.apiKeys.findFirst({
    where: and(eq(apiKeys.keyHash, hash), eq(apiKeys.isActive, true)),
  });

  if (!keyRecord) {
    return { valid: false, error: "Invalid or revoked API key." };
  }

  const shop = await db.query.shops.findFirst({
    where: eq(shops.id, keyRecord.shopId),
  });

  if (!shop) {
    return { valid: false, error: "Associated store not found or disabled." };
  }

  // Update lastUsedAt timestamp asynchronously (non-blocking)
  db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, keyRecord.id))
    .catch((err) => console.error("Failed to update API key lastUsedAt:", err));

  let parsedPermissions: string[] = [];
  try {
    parsedPermissions = JSON.parse(keyRecord.permissions);
  } catch {
    parsedPermissions = ["orders:read", "licenses:verify", "products:read"];
  }

  return {
    valid: true,
    keyId: keyRecord.id,
    userId: keyRecord.userId,
    shopId: keyRecord.shopId,
    shopSlug: shop.slug,
    permissions: parsedPermissions,
  };
}

/**
 * Revokes an existing API key.
 */
export async function revokeMerchantApiKey(keyId: string, userId: string): Promise<boolean> {
  const result = await db
    .update(apiKeys)
    .set({ isActive: false })
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId)));

  return true;
}
