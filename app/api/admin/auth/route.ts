import { headers } from "next/headers";
import { NextResponse } from "next/server";
import {
  checkAdminRateLimit,
  recordAdminFailedAttempt,
  resetAdminRateLimit,
  verifySuperAdminCredentials,
  generateAdminSessionTicket,
  verifyAdminSessionTicket,
} from "@/lib/admin-gate";
import { getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const headersList = await headers();
    const ip = getClientIp(headersList);

    // 1. Check Rate Limiter
    const rateCheck = checkAdminRateLimit(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many failed login attempts. Access temporarily locked for ${rateCheck.waitSeconds}s.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { username, password } = body;

    // 2. Timing-safe verification
    const isValid = verifySuperAdminCredentials(username, password);

    if (!isValid) {
      const failStatus = recordAdminFailedAttempt(ip);
      if (failStatus.blocked) {
        return NextResponse.json(
          {
            error: `Invalid credentials. Maximum attempts exceeded! Locked for ${failStatus.waitSeconds}s.`,
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          error: `Invalid administrator credentials. Remaining attempts: ${failStatus.remainingAttempts}.`,
        },
        { status: 401 }
      );
    }

    // 3. Reset rate limit and issue ephemeral ticket
    resetAdminRateLimit(ip);
    const ticket = generateAdminSessionTicket(ip);

    // 4. If caller is logged into an account, elevate their DB role to superadmin
    try {
      const { auth } = await import("@/lib/auth");
      const { db } = await import("@/lib/db");
      const { user } = await import("@/lib/db/schema");
      const { eq } = await import("drizzle-orm");

      const session = await auth.api.getSession({
        headers: headersList,
      });

      if (session?.user?.id) {
        await db
          .update(user)
          .set({
            role: "superadmin",
            adminPermissionsActive: true,
            adminPermissions: "all",
            updatedAt: new Date(),
          })
          .where(eq(user.id, session.user.id));
      }
    } catch (elevateErr) {
      console.error("[Admin Auth] Failed to elevate session user:", elevateErr);
    }

    return NextResponse.json({
      success: true,
      role: "superadmin",
      display: "super admin",
      ticket,
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  const headersList = await headers();
  const ticket = headersList.get("x-admin-ticket");
  const ip = getClientIp(headersList);

  const isValid = verifyAdminSessionTicket(ticket, ip);

  return NextResponse.json({
    authenticated: isValid,
    display: isValid ? "super admin" : null,
  });
}

/**
 * DELETE /api/admin/auth - Allows user to demote themselves back to 'user' for testing
 */
export async function DELETE() {
  try {
    const headersList = await headers();
    const { auth } = await import("@/lib/auth");
    const { db } = await import("@/lib/db");
    const { user } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (session?.user?.id) {
      await db
        .update(user)
        .set({
          role: "user",
          updatedAt: new Date(),
        })
        .where(eq(user.id, session.user.id));
    }

    return NextResponse.json({ success: true, role: "user" });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to demote" }, { status: 500 });
  }
}
