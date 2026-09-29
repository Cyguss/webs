import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyAdminSessionTicket } from "@/lib/admin-gate";
import { auth } from "@/lib/auth";

function getClientIp(h: Headers): string {
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") || "127.0.0.1";
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const headersList = await headers();
    const { userId } = await params;
    const ticket = headersList.get("x-admin-ticket");
    const ip = getClientIp(headersList);
    const isSuperAdminTicket = verifyAdminSessionTicket(ticket, ip);

    // Also check session for admin / superadmin
    const session = await auth.api.getSession({ headers: headersList });
    let isSuperAdminSession = false;
    let isAdminSession = false;

    if (session?.user?.id) {
      const callerDb = await db.query.user.findFirst({ where: eq(user.id, session.user.id) });
      if (callerDb?.role === "superadmin") isSuperAdminSession = true;
      if (callerDb?.role === "admin" && callerDb.adminPermissionsActive !== false) {
        const { hasAdminPermission } = await import("@/lib/admin-gate");
        if (hasAdminPermission(callerDb, "canManageUsers")) {
          isAdminSession = true;
        }
      }
    }

    if (!isSuperAdminTicket && !isSuperAdminSession) {
      const { getBlockAllAdminsStatus } = await import("@/lib/admin-gate");
      const isBlocked = await getBlockAllAdminsStatus();
      if (isBlocked) {
        return NextResponse.json(
          { error: "Administrative actions are currently locked down by Super-Admin (Emergency Lockdown)." },
          { status: 403 }
        );
      }
    }

    const hasPermission = isSuperAdminTicket || isSuperAdminSession || isAdminSession;
    if (!hasPermission) {
      return NextResponse.json({ error: "Administrator permission required" }, { status: 403 });
    }

    const dbUser = await db.query.user.findFirst({ where: eq(user.id, userId) });
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent deleting superadmin accounts unless ticket superadmin
    if (dbUser.role === "superadmin") {
      return NextResponse.json({ error: "Cannot delete superadmin accounts" }, { status: 400 });
    }

    await db.delete(user).where(eq(user.id, userId));

    return NextResponse.json({ success: true, message: `User ${dbUser.email} deleted successfully` });
  } catch (err: any) {
    console.error("[Admin Delete User] Error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
