import crypto from "crypto";

/**
 * Generates an unpredictable, cryptographically secure 256-bit bearer secret.
 * Independent of orderId, email, timestamps, or sequential values.
 */
export function generateOrderBearerSecret(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Computes a SHA-256 digest of the bearer secret for secure storage.
 */
export function hashOrderBearerSecret(secret: string): string {
  if (!secret || typeof secret !== "string") return "";
  return crypto.createHash("sha256").update(secret.trim()).digest("hex");
}

/**
 * Validates a provided bearer secret or token against the stored hash and/or legacy HMAC.
 * Uses constant-time comparison to prevent timing side-channel attacks.
 */
export function verifyOrderSecret({
  orderId,
  buyerEmail,
  providedSecret,
  storedSecretHash,
}: {
  orderId: string;
  buyerEmail: string;
  providedSecret?: string | null;
  storedSecretHash?: string | null;
}): boolean {
  if (!providedSecret || typeof providedSecret !== "string") return false;
  const cleanSecret = providedSecret.trim();
  if (!cleanSecret) return false;

  // 1. Primary: Constant-time check against SHA-256 hash stored in database
  if (storedSecretHash && typeof storedSecretHash === "string" && storedSecretHash.length > 0) {
    const computedHash = hashOrderBearerSecret(cleanSecret);
    const computedBuf = Buffer.from(computedHash, "hex");
    const storedBuf = Buffer.from(storedSecretHash, "hex");
    if (computedBuf.length === storedBuf.length && crypto.timingSafeEqual(computedBuf, storedBuf)) {
      return true;
    }
  }

  // 2. Legacy fallback: Verify deterministic HMAC for older unmigrated records
  const legacySecret = process.env.BETTER_AUTH_SECRET;
  if (legacySecret && legacySecret.length >= 16) {
    const legacyExpected = crypto
      .createHmac("sha256", legacySecret)
      .update(`${orderId}:${buyerEmail.toLowerCase().trim()}`)
      .digest("hex")
      .slice(0, 32);

    const tokenBuf = Buffer.from(cleanSecret);
    const expectedBuf = Buffer.from(legacyExpected);
    if (tokenBuf.length === expectedBuf.length && crypto.timingSafeEqual(tokenBuf, expectedBuf)) {
      return true;
    }
  }

  return false;
}

/**
 * Backward compatibility wrapper for existing call sites.
 */
export function generateOrderAccessToken(orderId: string, buyerEmail: string): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET is required to generate order tokens");
  }
  return crypto
    .createHmac("sha256", secret)
    .update(`${orderId}:${buyerEmail.toLowerCase().trim()}`)
    .digest("hex")
    .slice(0, 32);
}

/**
 * Backward compatibility verification wrapper.
 */
export function verifyOrderAccessToken(orderId: string, buyerEmail: string, token?: string | null): boolean {
  return verifyOrderSecret({
    orderId,
    buyerEmail,
    providedSecret: token,
  });
}
