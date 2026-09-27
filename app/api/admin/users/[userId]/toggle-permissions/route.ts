import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { verifyAdminSessionTicket } from "@/lib/admin-gate";
import { db } from "@/lib/db";
import { user, session as sessionTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

function getClientIp(headersList: Headers): string {
  const forwarded = headersList.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headersList.get("x-real-ip") || "127.0.0.1";
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const headersList = await headers();
    const ticket = headersList.get("x-admin-ticket");
    const ip = getClientIp(headersList);

    const isSuperAdminTicket = verifyAdminSessionTicket(ticket, ip);

    // Verify session
    const session = await auth.api.getSession({ headers: headersList });
    let currentDbUser: any = null;
    if (session?.user?.id) {
      currentDbUser = await db.query.user.findFirst({
        where: eq(user.id, session.user.id),
      });
    }

    const isSuperAdmin =
      isSuperAdminTicket ||
      currentDbUser?.role === "superadmin" ||
      (session?.user as any)?.role === "superadmin";

    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: "Access Denied: Only Super-Admin can manage and toggle administrator permissions." },
        { status: 403 }
      );
    }

    const [targetUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!targetUser) {
      return NextResponse.json({ error: "Target administrator not found." }, { status: 404 });
    }

    if (targetUser.role === "superadmin") {
      return NextResponse.json({ error: "Cannot modify permissions of Super-Admin." }, { status: 400 });
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    // Toggle if not explicitly specified
    const nextState = typeof body.active === "boolean" ? body.active : !targetUser.adminPermissionsActive;

    await db
      .update(user)
      .set({
        adminPermissionsActive: nextState,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));

    // If freezing permissions, immediately invalidate active sessions for this admin
    if (!nextState) {
      try {
        await db.delete(sessionTable).where(eq(sessionTable.userId, userId));
      } catch (sessErr) {
        console.error("Failed to clear sessions for frozen admin:", sessErr);
      }
    }

    return NextResponse.json({
      success: true,
      userId,
      adminPermissionsActive: nextState,
      message: nextState
        ? `Administrator permissions for ${targetUser.name || targetUser.email} restored.`
        : `Administrator permissions for ${targetUser.name || targetUser.email} frozen. Access to admin tools is blocked.`,
    });
  } catch (err: any) {
    console.error("[Toggle Admin Permissions Error]", err);
    return NextResponse.json({ error: err.message || "Failed to update admin permissions" }, { status: 500 });
  }
}
