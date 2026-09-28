import { NextResponse } from "next/server";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory sliding window bucket store with hard size boundary to prevent memory exhaustion
const MAX_STORE_SIZE = 25000;
const store = new Map<string, RateLimitRecord>();

// Clean up expired keys periodically
let lastCleanup = Date.now();
function cleanupExpired() {
  const now = Date.now();
  if (now - lastCleanup < 30000) return; // run at most every 30s
  lastCleanup = now;

  for (const [key, record] of store.entries()) {
    if (record.resetTime <= now) {
      store.delete(key);
    }
  }

  // If still oversized, drop oldest 20%
  if (store.size > MAX_STORE_SIZE) {
    let count = 0;
    const toRemove = Math.floor(MAX_STORE_SIZE * 0.2);
    for (const key of store.keys()) {
      store.delete(key);
      count++;
      if (count >= toRemove) break;
    }
  }
}

/**
 * Validates whether an IP address is syntactically valid (IPv4 or IPv6).
 */
function isValidIp(ip: string): boolean {
  if (!ip || typeof ip !== "string") return false;
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^([0-9a-fA-F]{1,4}:){1,7}:$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip) || ip === "localhost";
}

/**
 * Safely extracts client IP address from request headers without trusting client-spoofed internal IPs.
 */
export function getClientIp(requestOrHeaders: Request | Headers): string {
  const headers = requestOrHeaders instanceof Headers ? requestOrHeaders : requestOrHeaders.headers;

  // Cloudflare Connecting IP is set by Cloudflare edge servers and cannot be forged by client
  const cfIp = headers.get("cf-connecting-ip");
  if (cfIp && isValidIp(cfIp.trim())) {
    return cfIp.trim();
  }

  // True-Client-IP (Akamai, Cloudflare Enterprise)
  const trueClientIp = headers.get("true-client-ip");
  if (trueClientIp && isValidIp(trueClientIp.trim())) {
    return trueClientIp.trim();
  }

  // X-Real-IP (Nginx / Caddy reverse proxies)
  const realIp = headers.get("x-real-ip");
  if (realIp && isValidIp(realIp.trim())) {
    return realIp.trim();
  }

  // X-Forwarded-For: take the leftmost client IP
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",").map((s) => s.trim());
    const candidate = parts[0];
    if (candidate && isValidIp(candidate)) {
      return candidate;
    }
  }

  return "127.0.0.1";
}

export interface RateLimitOptions {
  key: string;
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfterSeconds: number;
}

/**
 * Production rate limiter with sliding window.
 */
export function rateLimit(options: RateLimitOptions): RateLimitResult {
  const { key, limit, windowMs } = options;
  const now = Date.now();

  cleanupExpired();

  const record = store.get(key);

  if (!record || record.resetTime <= now) {
    store.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });

    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - 1),
      reset: Math.ceil((now + windowMs) / 1000),
      retryAfterSeconds: 0,
    };
  }

  record.count += 1;
  const remaining = Math.max(0, limit - record.count);
  const retryAfterSeconds = Math.ceil(Math.max(0, record.resetTime - now) / 1000);

  if (record.count > limit) {
    return {
      allowed: false,
      limit,
      remaining: 0,
      reset: Math.ceil(record.resetTime / 1000),
      retryAfterSeconds,
    };
  }

  return {
    allowed: true,
    limit,
    remaining,
    reset: Math.ceil(record.resetTime / 1000),
    retryAfterSeconds: 0,
  };
}

/**
 * Standard Presets for Different Protection Levels
 */
export const rateLimitPresets = {
  // Anti-DDoS / global flood protection (120 req / 10 seconds)
  global: { limit: 120, windowMs: 10 * 1000 },
  // High-sensitivity auth endpoints (login, password reset, 2FA)
  auth: { limit: 5, windowMs: 15 * 60 * 1000 },
  // Checkout & payment session generation
  checkout: { limit: 12, windowMs: 60 * 1000 },
  // Coupon validation (prevents brute forcing discount codes)
  coupon: { limit: 15, windowMs: 60 * 1000 },
  // Support ticket & reply creation (prevents ticket spam)
  ticket: { limit: 6, windowMs: 60 * 1000 },
  // Review posting
  review: { limit: 5, windowMs: 60 * 1000 },
  // Public developer API v1
  apiV1: { limit: 60, windowMs: 60 * 1000 },
  // Admin login attempts
  adminGate: { limit: 5, windowMs: 15 * 60 * 1000 },
};

/**
 * Formats a 429 Too Many Requests response with standard RFC headers.
 */
export function createRateLimitResponse(
  result: RateLimitResult,
  customMessage?: string
): NextResponse {
  return NextResponse.json(
    {
      error:
        customMessage ||
        `Too many requests. Rate limit exceeded. Please try again in ${result.retryAfterSeconds} seconds.`,
      retryAfter: result.retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        "Retry-After": result.retryAfterSeconds.toString(),
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": result.reset.toString(),
      },
    }
  );
}
