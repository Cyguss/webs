import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { user, verification } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const emailParam = searchParams.get("email");

    // 1. If email parameter is provided, query by email
    if (emailParam && emailParam.trim()) {
      const [foundUser] = await db
        .select({
          id: user.id,
          email: user.email,
          twoFactorEnabled: user.twoFactorEnabled,
          twoFactorMethod: user.twoFactorMethod,
        })
        .from(user)
        .where(eq(user.email, emailParam.trim().toLowerCase()))
        .limit(1);

      if (foundUser) {
        return NextResponse.json({
          method: foundUser.twoFactorMethod === "totp" ? "totp" : "email",
          email: foundUser.email,
          enabled: !!foundUser.twoFactorEnabled,
        });
      }
    }

    // 2. Otherwise check for 2FA pending session cookie
    const cookieStore = await cookies();
    const twoFactorCookieRaw =
      cookieStore.get("better-auth.two_factor")?.value ||
      cookieStore.get("__Secure-better-auth.two_factor")?.value ||
      cookieStore.get("two_factor")?.value;

    if (twoFactorCookieRaw) {
      // The cookie may be in format: "identifier.signature" or "identifier"
      const decodedCookie = decodeURIComponent(twoFactorCookieRaw).replace(/^"+|"+$/g, "");
      const rawIdentifier = decodedCookie.includes(".")
        ? decodedCookie.substring(0, decodedCookie.lastIndexOf("."))
        : decodedCookie;

      if (rawIdentifier) {
        const [verRecord] = await db
          .select({
            id: verification.id,
            value: verification.value,
          })
          .from(verification)
          .where(eq(verification.identifier, rawIdentifier))
          .limit(1);

        if (verRecord && verRecord.value) {
          const [foundUser] = await db
            .select({
              id: user.id,
              email: user.email,
              twoFactorEnabled: user.twoFactorEnabled,
              twoFactorMethod: user.twoFactorMethod,
            })
            .from(user)
            .where(eq(user.id, verRecord.value))
            .limit(1);

          if (foundUser) {
            return NextResponse.json({
              method: foundUser.twoFactorMethod === "totp" ? "totp" : "email",
              email: foundUser.email,
              enabled: !!foundUser.twoFactorEnabled,
            });
          }
        }
      }
    }

    // Default fallback
    return NextResponse.json({
      method: "totp",
      enabled: false,
    });
  } catch (err: any) {
    console.error("[2FA get-method error]", err);
    return NextResponse.json(
      { error: err?.message || "Failed to resolve 2FA method", method: "totp" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = body?.email;

    if (email && typeof email === "string" && email.trim()) {
      const [foundUser] = await db
        .select({
          id: user.id,
          email: user.email,
          twoFactorEnabled: user.twoFactorEnabled,
          twoFactorMethod: user.twoFactorMethod,
        })
        .from(user)
        .where(eq(user.email, email.trim().toLowerCase()))
        .limit(1);

      if (foundUser) {
        return NextResponse.json({
          method: foundUser.twoFactorMethod === "totp" ? "totp" : "email",
          email: foundUser.email,
          enabled: !!foundUser.twoFactorEnabled,
        });
      }
    }

    return GET(req);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to resolve 2FA method", method: "totp" },
      { status: 500 }
    );
  }
}
