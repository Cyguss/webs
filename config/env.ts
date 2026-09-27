import { z } from "zod";
import * as dotenv from "dotenv";

if (!process.env.DATABASE_URL) {
  dotenv.config({ path: ".env.local" });
  dotenv.config();
}

/**
 * Validated, typed environment variables schema.
 * Prevents runtime bugs by catching missing or invalid keys early.
 */
const envSchema = z.object({
  // ── Database ──
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL must be provided in environment variables"),

  // ── Better-Auth ──
  BETTER_AUTH_SECRET: z
    .string()
    .min(16, "BETTER_AUTH_SECRET must be at least 16 characters"),
  BETTER_AUTH_URL: z
    .string()
    .optional()
    .transform((val) => {
      const candidate =
        (val && val.trim()) ||
        (process.env.BETTER_AUTH_URL && process.env.BETTER_AUTH_URL.trim()) ||
        (process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.trim()) ||
        (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN.trim()}` : "") ||
        "http://localhost:3000";
      let clean = candidate;
      if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
        clean = `https://${clean}`;
      }
      return clean.replace(/\/+$/, "");
    }),

  // ── Google OAuth (Optional) ──
  GOOGLE_CLIENT_ID: z.string().optional().default(""),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(""),

  // ── Stripe Payments (Optional) ──
  STRIPE_SECRET_KEY: z.string().optional().default(""),
  STRIPE_PUBLISHABLE_KEY: z.string().optional().default(""),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional().default(""),
  STRIPE_WEBHOOK_SECRET: z.string().optional().default(""),

  // ── Crypto / NOWPayments & Cryptomus (Optional) ──
  NOWPAYMENTS_API_KEY: z.string().optional().default(""),
  NOWPAYMENTS_IPN_SECRET: z.string().optional().default(""),
  CRYPTOMUS_SANDBOX: z.string().optional().default("true"),
  CRYPTOMUS_MERCHANT_ID: z.string().optional().default(""),
  CRYPTOMUS_PAYMENT_KEY: z.string().optional().default(""),
  CRYPTOMUS_PAYOUT_KEY: z.string().optional().default(""),

  // ── Resend Email (Optional) ──
  RESEND_API_KEY: z.string().optional().default(""),

  // ── Discord OAuth & Bot ──
  DISCORD_CLIENT_ID: z.string().optional().default(""),
  DISCORD_CLIENT_SECRET: z.string().optional().default(""),
  DISCORD_BOT_TOKEN: z.string().optional().default(""),
  DISCORD_GUILD_ID: z.string().optional().default(""),
  DISCORD_ADMIN_ROLE_ID: z.string().optional().default(""),
  DISCORD_APPROVAL_WEBHOOK_URL: z.string().optional().default(""),

  // ── Super Admin Master Access ──
  SUPER_ADMIN_USER: z.string().min(1, "SUPER_ADMIN_USER must be defined in environment"),
  SUPER_ADMIN_PASSWORD: z.string().min(1, "SUPER_ADMIN_PASSWORD must be defined in environment"),

  // ── Public Platform Config ──
  NEXT_PUBLIC_APP_URL: z
    .string()
    .optional()
    .transform((val) => {
      const candidate =
        (val && val.trim()) ||
        (process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.trim()) ||
        (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN.trim()}` : "") ||
        "http://localhost:3000";
      let clean = candidate;
      if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
        clean = `https://${clean}`;
      }
      return clean.replace(/\/+$/, "");
    }),
  NEXT_PUBLIC_APP_DOMAIN: z.string().default("localhost:3000"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.format());
  throw new Error("Invalid environment variables. Check .env.local file.");
}

export const env = parsed.data;

/**
 * Feature flag helpers to cleanly check if third-party providers are active.
 */
export const features = {
  googleAuth: Boolean(
    env.GOOGLE_CLIENT_ID &&
    env.GOOGLE_CLIENT_SECRET &&
    env.GOOGLE_CLIENT_ID.length > 5 &&
    env.GOOGLE_CLIENT_SECRET.length > 5
  ),
  discordAuth: Boolean(
    env.DISCORD_CLIENT_ID &&
    env.DISCORD_CLIENT_SECRET &&
    env.DISCORD_CLIENT_ID.length > 5 &&
    env.DISCORD_CLIENT_SECRET.length > 5
  ),
  discordBot: Boolean(
    env.DISCORD_BOT_TOKEN &&
    env.DISCORD_GUILD_ID &&
    env.DISCORD_ADMIN_ROLE_ID
  ),
  stripe: Boolean(
    env.STRIPE_SECRET_KEY &&
    !env.STRIPE_SECRET_KEY.includes("sk_test_...") &&
    env.STRIPE_SECRET_KEY.startsWith("sk_")
  ),
  resend: Boolean(
    env.RESEND_API_KEY &&
    !env.RESEND_API_KEY.includes("re_...") &&
    env.RESEND_API_KEY.startsWith("re_")
  ),
  crypto: Boolean(
    (env.CRYPTOMUS_MERCHANT_ID && env.CRYPTOMUS_PAYMENT_KEY) ||
    (env.NOWPAYMENTS_API_KEY && env.NOWPAYMENTS_API_KEY !== "your-nowpayments-api-key")
  ),
};
