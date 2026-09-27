import { env } from "@/config";
import crypto from "crypto";

// ─── Rate Limiter (In-Memory IP Bucket) ───────────────────────────────────────

interface RateLimitRecord {
  failedAttempts: number;
  blockedUntil: number;
  lastAttempt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

const MAX_FAILED_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes block
const WINDOW_DURATION_MS = 15 * 60 * 1000;

export function checkAdminRateLimit(ip: string): { allowed: boolean; remainingAttempts: number; waitSeconds?: number } {
  // Always allow localhost during development to prevent developer lockout
  if (ip === "127.0.0.1" || ip === "::1" || ip === "localhost") {
    return { allowed: true, remainingAttempts: MAX_FAILED_ATTEMPTS };
  }

  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record) {
    return { allowed: true, remainingAttempts: MAX_FAILED_ATTEMPTS };
  }

  // Check if currently blocked
  if (record.blockedUntil > now) {
    const waitSeconds = Math.ceil((record.blockedUntil - now) / 1000);
    return { allowed: false, remainingAttempts: 0, waitSeconds };
  }

  // If window expired, reset record
  if (now - record.lastAttempt > WINDOW_DURATION_MS) {
    rateLimitStore.delete(ip);
    return { allowed: true, remainingAttempts: MAX_FAILED_ATTEMPTS };
  }

  const remaining = Math.max(0, MAX_FAILED_ATTEMPTS - record.failedAttempts);
  return { allowed: remaining > 0, remainingAttempts: remaining };
}

export function recordAdminFailedAttempt(ip: string): { remainingAttempts: number; blocked: boolean; waitSeconds?: number } {
  if (ip === "127.0.0.1" || ip === "::1" || ip === "localhost") {
    return { remainingAttempts: MAX_FAILED_ATTEMPTS, blocked: false };
  }

  const now = Date.now();
  const record = rateLimitStore.get(ip) || { failedAttempts: 0, blockedUntil: 0, lastAttempt: now };

  record.failedAttempts += 1;
  record.lastAttempt = now;

  if (record.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_DURATION_MS;
    rateLimitStore.set(ip, record);
    return { remainingAttempts: 0, blocked: true, waitSeconds: Math.ceil(BLOCK_DURATION_MS / 1000) };
  }

  rateLimitStore.set(ip, record);
  return { remainingAttempts: MAX_FAILED_ATTEMPTS - record.failedAttempts, blocked: false };
}

export function resetAdminRateLimit(ip: string) {
  rateLimitStore.delete(ip);
}

// ─── Constant-Time Password Verification ─────────────────────────────────────

function hashString(input: string): Buffer {
  return crypto.createHash("sha256").update(input, "utf8").digest();
}

/**
 * Validates Super-Admin username and password using constant-time buffer comparison.
 * Never leaks credentials or timing information.
 * Strictly requires both exact username and exact password (single unique combination).
 */
export function verifySuperAdminCredentials(usernameInput: string, passwordInput: string): boolean {
  const expectedUser = (env.SUPER_ADMIN_USER || "").trim();
  const expectedPassword = (env.SUPER_ADMIN_PASSWORD || "").trim();

  if (!expectedUser || !expectedPassword) {
    console.error("[Admin Gate] SUPER_ADMIN_USER or SUPER_ADMIN_PASSWORD not configured.");
    return false;
  }

  if (!usernameInput || typeof usernameInput !== "string" || !usernameInput.trim()) {
    return false;
  }
  if (!passwordInput || typeof passwordInput !== "string" || !passwordInput.trim()) {
    return false;
  }

  const trimmedUser = usernameInput.trim();
  const trimmedPass = passwordInput.trim();

  const userBuffer = hashString(trimmedUser);
  const expectedUserBuffer = hashString(expectedUser);

  const passBuffer = hashString(trimmedPass);
  const expectedPassBuffer = hashString(expectedPassword);

  // Constant-time checks on both username and password
  const isUserValid = crypto.timingSafeEqual(userBuffer, expectedUserBuffer);
  const isPassValid = crypto.timingSafeEqual(passBuffer, expectedPassBuffer);

  return isUserValid && isPassValid;
}

// ─── Ephemeral Short-Lived Session Token (No persistent cookie) ───────────────

const HMAC_SECRET = crypto.createHash("sha256").update(env.BETTER_AUTH_SECRET + "_super_admin_gate").digest("hex");
const TOKEN_MAX_AGE_MS = 30 * 60 * 1000; // Max 30 minutes validity per unlock

export function generateAdminSessionTicket(ip: string): string {
  const issuedAt = Date.now();
  const payload = JSON.stringify({
    issuedAt,
    ip,
    nonce: crypto.randomBytes(16).toString("hex"),
  });
  const signature = crypto.createHmac("sha256", HMAC_SECRET).update(payload).digest("hex");
  return Buffer.from(JSON.stringify({ payload, signature })).toString("base64url");
}

export function verifyAdminSessionTicket(ticket: string | null | undefined, ip?: string): boolean {
  if (!ticket) return false;

  try {
    const raw = Buffer.from(ticket, "base64url").toString("utf8");
    const { payload, signature } = JSON.parse(raw);
    if (!payload || !signature) return false;

    // Verify cryptographic signature in constant time
    const expectedSignature = crypto.createHmac("sha256", HMAC_SECRET).update(payload).digest("hex");
    const sigBuf = Buffer.from(signature, "hex");
    const expectedSigBuf = Buffer.from(expectedSignature, "hex");
    if (sigBuf.length !== expectedSigBuf.length) return false;
    if (!crypto.timingSafeEqual(sigBuf, expectedSigBuf)) return false;

    const data = JSON.parse(payload);
    if (!data.issuedAt || Date.now() - data.issuedAt > TOKEN_MAX_AGE_MS) {
      return false;
    }

    // Bind ticket to issuing IP (allow local loopback during dev)
    if (ip && data.ip && data.ip !== ip && data.ip !== "127.0.0.1" && ip !== "127.0.0.1") {
      return false;
    }

    return true;
  } catch (err) {
    return false;
  }
}

// ─── Super-Admin Kill Switch: Block All Admins ────────────────────────────────

export async function getBlockAllAdminsStatus(): Promise<boolean> {
  try {
    const { db } = await import("@/lib/db");
    const { platformSettings } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    const row = await db.query.platformSettings.findFirst({
      where: eq(platformSettings.settingKey, "block_all_admins"),
    });
    return row?.settingValue === "true";
  } catch (err) {
    console.error("Failed to read block_all_admins status:", err);
    return false;
  }
}

export async function setBlockAllAdminsStatus(blocked: boolean): Promise<boolean> {
  try {
    const { db } = await import("@/lib/db");
    const { platformSettings } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    const value = blocked ? "true" : "false";
    const existing = await db.query.platformSettings.findFirst({
      where: eq(platformSettings.settingKey, "block_all_admins"),
    });

    if (existing) {
      await db
        .update(platformSettings)
        .set({ settingValue: value, updatedAt: new Date() })
        .where(eq(platformSettings.settingKey, "block_all_admins"));
    } else {
      await db.insert(platformSettings).values({
        settingKey: "block_all_admins",
        settingValue: value,
      });
    }

    return blocked;
  } catch (err) {
    console.error("Failed to update block_all_admins status:", err);
    return false;
  }
}
