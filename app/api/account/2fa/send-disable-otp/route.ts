import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user, verification } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { send2FADisableEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    let session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session || !session.user) {
      session = await auth.api.getSession({
        headers: await headers(),
      });
    }

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [currentUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (!currentUser || !currentUser.twoFactorEnabled) {
      return NextResponse.json(
        { error: "Two-Factor Authentication is not enabled on this account." },
        { status: 400 }
      );
    }

    // Generate secure 6-digit verification code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const identifier = `2fa-disable-${session.user.id}`;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Delete any existing unused disable tokens for this user
    await db.delete(verification).where(eq(verification.identifier, identifier));

    // Store in verification table
    await db.insert(verification).values({
      id: `ver_${crypto.randomUUID().slice(0, 16)}`,
      identifier,
      value: otp,
      expiresAt,
    });

    // Send email
    const emailResult = await send2FADisableEmail({
      email: currentUser.email,
      otp,
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { error: "Failed to dispatch verification code via email. Please check your email configuration." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "A 6-digit confirmation code has been sent to your registered email address.",
    });
  } catch (err: any) {
    console.error("[2FA Send Disable OTP] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to send verification code." },
      { status: 500 }
    );
  }
}
