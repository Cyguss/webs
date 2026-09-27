import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { twoFactor } from "better-auth/plugins";
import { db, schema } from "@/lib/db";
import { env, features } from "@/config";
import { Resend } from "resend";
import crypto from "crypto";
import { isDisposableEmail } from "@/lib/anti-fraud/disposable-email";

const resend = features.resend ? new Resend(env.RESEND_API_KEY) : null;

const resendFromEmail = process.env.RESEND_FROM_EMAIL || "Vaultly <onboarding@resend.dev>";

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: [
    env.BETTER_AUTH_URL,
    env.NEXT_PUBLIC_APP_URL,
    ...(process.env.RAILWAY_PUBLIC_DOMAIN ? [`https://${process.env.RAILWAY_PUBLIC_DOMAIN}`] : []),
  ].filter(Boolean),
  database: drizzleAdapter(db, {
    provider: "mysql",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
      twoFactor: schema.twoFactor,
    },
  }),
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
        input: false,
      },
      adminPermissionsActive: {
        type: "boolean",
        defaultValue: true,
        input: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days persistent session
    updateAge: 60 * 60 * 24, // refresh token every 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 min cookie cache
    },
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
    },
    ipAddress: {
      ipAddressHeaders: ["x-forwarded-for", "cf-connecting-ip", "x-real-ip"],
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "discord"],
      requireLocalEmailVerified: false,
      allowDifferentEmails: true,
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      if (resend) {
        await resend.emails.send({
          from: resendFromEmail,
          to: user.email,
          subject: "Reset your Vaultly password",
          html: `<p>Click here to reset your password: <a href="${url}">${url}</a></p>`,
        });
      } else {
        console.log(`[Dev Auth] Password reset link for ${user.email}: ${url}`);
      }
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      if (resend) {
        await resend.emails.send({
          from: resendFromEmail,
          to: user.email,
          subject: "Verify your email address",
          html: `<p>Welcome to Vaultly! Verify your email: <a href="${url}">${url}</a></p>`,
        });
      } else {
        console.log(`[Dev Auth] Email verification link for ${user.email}: ${url}`);
      }
    },
  },
  socialProviders: {
    ...(features.googleAuth
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
    ...(features.discordAuth
      ? {
          discord: {
            clientId: env.DISCORD_CLIENT_ID,
            clientSecret: env.DISCORD_CLIENT_SECRET,
            scope: ["identify", "email"],
          },
        }
      : {}),
  },
  plugins: [
    twoFactor({
      issuer: "Vaultly",
      otpOptions: {
        sendOTP: async ({ user, otp }) => {
          if (resend) {
            try {
              await resend.emails.send({
                from: resendFromEmail,
                to: user.email,
                subject: "Your Vaultly 2FA Verification Code",
                html: `
                  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #111; max-width: 500px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px;">
                    <h2 style="color: #4f46e5; margin-top: 0;">Vaultly Security Verification</h2>
                    <p style="font-size: 15px; color: #374151;">Your 2-factor authentication code is:</p>
                    <div style="font-size: 32px; font-weight: 800; letter-spacing: 6px; padding: 14px 24px; background: #f3f4f6; border-radius: 8px; width: fit-content; margin: 18px 0; color: #1f2937;">
                      ${otp}
                    </div>
                    <p style="color: #6b7280; font-size: 13px; line-height: 1.5;">This code expires in 3 minutes. If you did not attempt to sign in to Vaultly, please change your password immediately.</p>
                  </div>
                `,
              });
            } catch (err) {
              console.error("[2FA Email Send Error]", err);
            }
          }
          if (process.env.NODE_ENV !== "production") {
            console.log(`\n========================================\n[VAULTLY 2FA OTP] Code for ${user.email}: ${otp}\n========================================\n`);
          }
        },
      },
    }),
  ],
  databaseHooks: {
    user: {
      create: {
        before: async (userData) => {
          if (userData.email && isDisposableEmail(userData.email)) {
            throw new Error("Temporary or disposable email domains cannot be used to create a seller account. Please use a permanent email.");
          }
          return { data: userData };
        },
        after: async (newUser) => {
          try {
            await db.insert(schema.sellerBalances).values({
              id: `bal_${crypto.randomUUID().slice(0, 12)}`,
              userId: newUser.id,
              availableBalance: "0",
              pendingBalance: "0",
              totalEarned: "0",
              totalWithdrawn: "0",
            });
          } catch (err) {
            console.error("Failed to initialize seller balance:", err);
          }
        },
      },
    },
    account: {
      create: {
        after: async (newAccount) => {
          if (newAccount.providerId === "discord" && newAccount.userId) {
            try {
              const { syncUserDiscord } = await import("@/lib/discord");
              await syncUserDiscord(newAccount.userId);
            } catch (err) {
              console.error("[Auth Hook] Failed to auto-sync Discord on account link:", err);
            }
          }
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
