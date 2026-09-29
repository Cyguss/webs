import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { verifyAdminSessionTicket, parseAdminPermissions, AdminPermissions } from "@/lib/admin-gate";
import { db } from "@/lib/db";
import { user, session as sessionTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

function getClientIp(headersList: Headers): string {
  const forwarded = headersList.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headersList.get("x-real-ip") || "127.0.0.1";
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const headersList = await headers();
    const ticket = headersList.get("x-admin-ticket");
    const ip = getClientIp(headersList);

    const isSuperAdminTicket = verifyAdminSessionTicket(ticket, ip);
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
        { error: "Access Denied: Only Super-Admin can view granular user permissions." },
        { status: 403 }
      );
    }

    const target = await db.query.user.findFirst({
      where: eq(user.id, userId),
    });

    if (!target) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const permissions = parseAdminPermissions(target.adminPermissions);

    return NextResponse.json({
      success: true,
      userId: target.id,
      name: target.name,
      email: target.email,
      role: target.role,
      adminPermissionsActive: target.adminPermissionsActive !== false,
      permissions,
    });
  } catch (err: any) {
    console.error("[Get User Permissions Error]", err);
    return NextResponse.json({ error: err.message || "Failed to get user permissions" }, { status: 500 });
  }
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
        { error: "Access Denied: Only Super-Admin can update administrator roles and permissions." },
        { status: 403 }
      );
    }

    const target = await db.query.user.findFirst({
      where: eq(user.id, userId),
    });

    if (!target) {
      return NextResponse.json({ error: "Target user not found." }, { status: 404 });
    }

    if (target.role === "superadmin" && target.id !== session?.user?.id) {
      return NextResponse.json({ error: "Cannot modify permissions of Super-Admin." }, { status: 400 });
    }

    const body = await req.json();
    const updatePayload: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (body.role && ["user", "admin"].includes(body.role)) {
      updatePayload.role = body.role;
    }

    if (typeof body.adminPermissionsActive === "boolean") {
      updatePayload.adminPermissionsActive = body.adminPermissionsActive;
      // Invalidate sessions if deactivated
      if (!body.adminPermissionsActive) {
        try {
          await db.delete(sessionTable).where(eq(sessionTable.userId, userId));
        } catch {}
      }
    }

    if (body.permissions && typeof body.permissions === "object") {
      const currentPerms = parseAdminPermissions(target.adminPermissions);
      const mergedPerms: AdminPermissions = {
        canApproveShops: typeof body.permissions.canApproveShops === "boolean" ? body.permissions.canApproveShops : currentPerms.canApproveShops,
        canDeleteShops: typeof body.permissions.canDeleteShops === "boolean" ? body.permissions.canDeleteShops : currentPerms.canDeleteShops,
        canManageUsers: typeof body.permissions.canManageUsers === "boolean" ? body.permissions.canManageUsers : currentPerms.canManageUsers,
        canManagePayouts: typeof body.permissions.canManagePayouts === "boolean" ? body.permissions.canManagePayouts : currentPerms.canManagePayouts,
        canViewFinancials: typeof body.permissions.canViewFinancials === "boolean" ? body.permissions.canViewFinancials : currentPerms.canViewFinancials,
        canManageSettings: typeof body.permissions.canManageSettings === "boolean" ? body.permissions.canManageSettings : currentPerms.canManageSettings,
        canAccessDebug: typeof body.permissions.canAccessDebug === "boolean" ? body.permissions.canAccessDebug : currentPerms.canAccessDebug,
      };
      updatePayload.adminPermissions = JSON.stringify(mergedPerms);
    }

    await db.update(user).set(updatePayload).where(eq(user.id, userId));

    const updatedUser = await db.query.user.findFirst({
      where: eq(user.id, userId),
    });

    return NextResponse.json({
      success: true,
      message: `Permissions updated successfully for ${updatedUser?.name || updatedUser?.email}.`,
      user: {
        id: updatedUser?.id,
        role: updatedUser?.role,
        adminPermissionsActive: updatedUser?.adminPermissionsActive !== false,
        permissions: parseAdminPermissions(updatedUser?.adminPermissions),
      },
    });
  } catch (err: any) {
    console.error("[Update User Permissions Error]", err);
    return NextResponse.json({ error: err.message || "Failed to update user permissions" }, { status: 500 });
  }
}
