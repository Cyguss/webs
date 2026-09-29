import type { BetterAuthPlugin } from "better-auth";
import { deleteSessionCookie, expireCookie } from "better-auth/cookies";
import { createAuthMiddleware } from "@better-auth/core/api";
import { createHMAC } from "@better-auth/utils/hmac";
import { db } from "@/lib/db";
import { user as userTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const TRUST_DEVICE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds
const TWO_FACTOR_MAX_AGE = 10 * 60; // 10 minutes in seconds

/**
 * Better-Auth plugin that intercepts OAuth / Social login callbacks (Google, Discord, etc.)
 * and enforces Two-Factor Authentication if the user has 2FA enabled.
 */
export const oauthTwoFactorPlugin = (): BetterAuthPlugin => {
  return {
    id: "oauth-2fa-enforce",
    hooks: {
      after: [
        {
          matcher(context) {
            return !!(
              context.path?.startsWith("/callback/") ||
              context.path?.startsWith("/oauth2/callback/")
            );
          },
          handler: createAuthMiddleware(async (ctx) => {
            const location = ctx.context.responseHeaders?.get("location");
            if (!location) return;

            // If the OAuth flow resulted in an error redirect, do not intercept
            if (location.includes("error=") || location.includes("/error")) return;

            const newSession = ctx.context.newSession;
            const userId = newSession?.user?.id;

            if (!userId) {
              return;
            }

            // Check if user has 2FA enabled in session object or database
            let isTwoFactorEnabled = Boolean(newSession?.user?.twoFactorEnabled);

            const [dbUser] = await db
              .select({
                id: userTable.id,
                email: userTable.email,
                twoFactorEnabled: userTable.twoFactorEnabled,
                twoFactorMethod: userTable.twoFactorMethod,
              })
              .from(userTable)
              .where(eq(userTable.id, userId))
              .limit(1);

            if (dbUser?.twoFactorEnabled) {
              isTwoFactorEnabled = true;
            }

            // If 2FA is not enabled, allow normal OAuth login to proceed
            if (!isTwoFactorEnabled) {
              return;
            }

            // 1. Check if the device is trusted (Trust Device Cookie)
            const trustDeviceCookieAttrs = ctx.context.createAuthCookie("trust_device", {
              maxAge: TRUST_DEVICE_MAX_AGE,
            });
            const trustDeviceCookie = await ctx.getSignedCookie(
              trustDeviceCookieAttrs.name,
              ctx.context.secret
            );

            if (trustDeviceCookie && typeof trustDeviceCookie === "string") {
              const [token, trustIdentifier] = trustDeviceCookie.split("!");
              if (token && trustIdentifier) {
                const expectedToken = await createHMAC("SHA-256", "base64urlnopad").sign(
                  ctx.context.secret,
                  `${userId}!${trustIdentifier}`
                );

                if (token === expectedToken) {
                  const verificationRecord =
                    await ctx.context.internalAdapter.findVerificationValue(trustIdentifier);

                  if (
                    verificationRecord &&
                    verificationRecord.value === userId &&
                    new Date(verificationRecord.expiresAt) > new Date()
                  ) {
                    // Valid trusted device: rotate trust token and allow sign in
                    await ctx.context.internalAdapter.deleteVerificationByIdentifier(trustIdentifier);
                    const newTrustIdentifier = `trust-device-${crypto.randomBytes(16).toString("hex")}`;
                    const newToken = await createHMAC("SHA-256", "base64urlnopad").sign(
                      ctx.context.secret,
                      `${userId}!${newTrustIdentifier}`
                    );
                    await ctx.context.internalAdapter.createVerificationValue({
                      value: userId,
                      identifier: newTrustIdentifier,
                      expiresAt: new Date(Date.now() + TRUST_DEVICE_MAX_AGE * 1000),
                    });
                    const newTrustDeviceCookie = ctx.context.createAuthCookie("trust_device", {
                      maxAge: TRUST_DEVICE_MAX_AGE,
                    });
                    await ctx.setSignedCookie(
                      newTrustDeviceCookie.name,
                      `${newToken}!${newTrustIdentifier}`,
                      ctx.context.secret,
                      trustDeviceCookieAttrs.attributes
                    );
                    return; // Trusted device - allow login!
                  }
                }
              }
              // Expire invalid trust device cookie
              expireCookie(ctx, trustDeviceCookieAttrs);
            }

            // 2. Untrusted device with 2FA enabled:
            // Delete the newly created OAuth session from the database
            if (newSession?.session?.token) {
              try {
                await ctx.context.internalAdapter.deleteSession(newSession.session.token);
              } catch (err) {
                console.error("[OAuth 2FA] Failed to delete session token:", err);
              }
            }

            // Expire / remove session cookies from the response headers
            deleteSessionCookie(ctx, true);
            ctx.context.setNewSession(null);

            // 3. Create 2FA challenge in database verification table
            const twoFactorCookie = ctx.context.createAuthCookie("two_factor", {
              maxAge: TWO_FACTOR_MAX_AGE,
            });
            const identifier = `2fa-${crypto.randomBytes(16).toString("hex")}`;
            const expiresAt = new Date(Date.now() + TWO_FACTOR_MAX_AGE * 1000);

            await ctx.context.internalAdapter.createVerificationValue({
              value: userId,
              identifier,
              expiresAt,
            });

            await ctx.context.internalAdapter.createVerificationValue({
              value: "0",
              identifier: `2fa-attempts-${identifier}`,
              expiresAt,
            });

            // 4. Set signed two_factor cookie in response
            await ctx.setSignedCookie(
              twoFactorCookie.name,
              identifier,
              ctx.context.secret,
              twoFactorCookie.attributes
            );

            // 5. Redirect user to the 2FA challenge page
            const twoFactorRedirectUrl = "/login?twoFactor=true";
            ctx.setHeader("location", twoFactorRedirectUrl);
            if (ctx.context.responseHeaders) {
              ctx.context.responseHeaders.set("location", twoFactorRedirectUrl);
            }
          }),
        },
      ],
    },
  };
};
