import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user, twoFactor, verification, account } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { verifyPassword, symmetricDecrypt } from "better-auth/crypto";
import { createOTP } from "@better-auth/utils/otp";
import { env } from "@/config";

async function verifyBackupCodeMatch(
  storedCodes: string | null | undefined,
  secretKey: string,
  inputCode: string
): Promise<boolean> {
  if (!storedCodes) return false;
  const cleanInput = inputCode.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  if (!cleanInput) return false;

  try {
    let list: string[] = [];
    try {
      const decrypted = await symmetricDecrypt({ key: secretKey, data: storedCodes });
      list = JSON.parse(decrypted);
    } catch {
      list = JSON.parse(storedCodes);
    }

    return Array.isArray(list) && list.some(
      (c) => c.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() === cleanInput
    );
  } catch {
    return false;
  }
}

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

    const body = await req.json();
    const { password, code, method } = body;

    if (!code || typeof code !== "string" || !code.trim()) {
      return NextResponse.json(
        { error: "Verification code is required to disable 2FA." },
        { status: 400 }
      );
    }

    const cleanCode = code.trim();

    // 1. Check if user has 2FA enabled in database
    const [currentUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (!currentUser || !currentUser.twoFactorEnabled) {
      return NextResponse.json(
        { error: "Two-Factor Authentication is already disabled on this account." },
        { status: 400 }
      );
    }

    // 2. Validate account master password if the user has a credential password
    const credentialAccount = await db.query.account.findFirst({
      where: and(eq(account.userId, session.user.id), eq(account.providerId, "credential")),
    });

    if (credentialAccount?.password) {
      if (!password) {
        return NextResponse.json(
          { error: "Current account password is required." },
          { status: 400 }
        );
      }

      const passwordMatches = await verifyPassword({
        hash: credentialAccount.password,
        password,
      });

      if (!passwordMatches) {
        return NextResponse.json(
          { error: "Invalid current account password." },
          { status: 400 }
        );
      }
    }

    // 3. Find two_factor record
    const [twoFactorRecord] = await db
      .select()
      .from(twoFactor)
      .where(eq(twoFactor.userId, session.user.id))
      .limit(1);

    let codeIsValid = false;

    // First check if it matches an emergency backup code
    if (twoFactorRecord?.backupCodes) {
      const isBackup = await verifyBackupCodeMatch(
        twoFactorRecord.backupCodes,
        env.BETTER_AUTH_SECRET,
        cleanCode
      );
      if (isBackup) {
        codeIsValid = true;
      }
    }

    // If method is email: verify against the email OTP record in verification table
    if (!codeIsValid && method === "email") {
      const identifier = `2fa-disable-${session.user.id}`;
      const [verRecord] = await db
        .select()
        .from(verification)
        .where(eq(verification.identifier, identifier))
        .limit(1);

      if (verRecord && verRecord.value === cleanCode) {
        if (new Date(verRecord.expiresAt).getTime() > Date.now()) {
          codeIsValid = true;
          // Delete used token
          await db.delete(verification).where(eq(verification.id, verRecord.id));
        } else {
          return NextResponse.json(
            { error: "The verification code has expired. Please request a new code." },
            { status: 400 }
          );
        }
      }
    }

    // If method is totp (or fallback): verify against TOTP secret
    if (!codeIsValid && (method === "totp" || !method)) {
      if (twoFactorRecord?.secret) {
        try {
          const decryptedSecret = await symmetricDecrypt({
            key: env.BETTER_AUTH_SECRET,
            data: twoFactorRecord.secret,
          });

          const otpVerifier = createOTP(decryptedSecret);
          const isTotpValid = await otpVerifier.verify(cleanCode);

          if (isTotpValid) {
            codeIsValid = true;
          }
        } catch (err) {
          console.error("[2FA Disable] Error decrypting/verifying TOTP secret:", err);
        }
      }
    }

    // Also check email verification table if user selected TOTP but entered email code or vice-versa
    if (!codeIsValid) {
      const identifier = `2fa-disable-${session.user.id}`;
      const [verRecord] = await db
        .select()
        .from(verification)
        .where(eq(verification.identifier, identifier))
        .limit(1);

      if (verRecord && verRecord.value === cleanCode && new Date(verRecord.expiresAt).getTime() > Date.now()) {
        codeIsValid = true;
        await db.delete(verification).where(eq(verification.id, verRecord.id));
      }
    }

    if (!codeIsValid) {
      return NextResponse.json(
        { error: "Invalid verification code. Please check the code and try again." },
        { status: 400 }
      );
    }

    // 4. Verification successful! Disable 2FA
    await db
      .update(user)
      .set({ twoFactorEnabled: false, updatedAt: new Date() })
      .where(eq(user.id, session.user.id));

    await db
      .delete(twoFactor)
      .where(eq(twoFactor.userId, session.user.id));

    // Clean up any remaining disable tokens
    await db
      .delete(verification)
      .where(eq(verification.identifier, `2fa-disable-${session.user.id}`));

    return NextResponse.json({
      success: true,
      message: "Two-Factor Authentication has been successfully disabled.",
    });
  } catch (err: any) {
    console.error("[2FA Disable] Fatal error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to disable 2FA" },
      { status: 500 }
    );
  }
}
