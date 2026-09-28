import crypto from "crypto";

export function generateOrderAccessToken(orderId: string, buyerEmail: string): string {
  const secret = process.env.BETTER_AUTH_SECRET || "krypt_order_token_secret_salt";
  return crypto
    .createHmac("sha256", secret)
    .update(`${orderId}:${buyerEmail.toLowerCase().trim()}`)
    .digest("hex")
    .slice(0, 32);
}

export function verifyOrderAccessToken(orderId: string, buyerEmail: string, token?: string | null): boolean {
  if (!token || typeof token !== "string") return false;
  const expected = generateOrderAccessToken(orderId, buyerEmail);
  const tokenBuf = Buffer.from(token);
  const expectedBuf = Buffer.from(expected);
  if (tokenBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(tokenBuf, expectedBuf);
}
