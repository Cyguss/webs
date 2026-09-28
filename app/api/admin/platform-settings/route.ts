import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { verifyAdminSessionTicket, parseAdminPermissions } from "@/lib/admin-gate";
import { getPlatformConfig, setPlatformSetting } from "@/lib/platform-settings";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

function getClientIp(headersList: Headers): string {
  const forwarded = headersList.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headersList.get("x-real-ip") || "127.0.0.1";
}

async function verifySuperAdminOrSettingsPermission(headersList: Headers) {
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

  if (isSuperAdmin) {
    return { authorized: true, isSuperAdmin: true, user: currentDbUser };
  }

  // Check if staff admin with canManageSettings permission
  if (currentDbUser?.role === "admin" && currentDbUser.adminPermissionsActive !== false) {
    const perms = parseAdminPermissions(currentDbUser.adminPermissions);
    if (perms.canManageSettings) {
      return { authorized: true, isSuperAdmin: false, user: currentDbUser };
    }
  }

  return { authorized: false, isSuperAdmin: false, user: null };
}

export async function GET() {
  try {
    const headersList = await headers();
    const authCheck = await verifySuperAdminOrSettingsPermission(headersList);

    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: "Access Denied: Platform settings require Super-Admin or Settings Manager privileges." },
        { status: 403 }
      );
    }

    const config = await getPlatformConfig();
    return NextResponse.json({ success: true, config, isSuperAdmin: authCheck.isSuperAdmin });
  } catch (err: any) {
    console.error("[Platform Settings GET Error]", err);
    return NextResponse.json(
      { error: err.message || "Failed to retrieve platform settings" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const headersList = await headers();
    const authCheck = await verifySuperAdminOrSettingsPermission(headersList);

    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: "Access Denied: Super-Admin authorization required to modify platform settings." },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Whitelist allowed settings keys
    const allowedKeys = [
      "allow_store_creation",
      "allow_user_registration",
      "maintenance_mode",
      "maintenance_message",
      "platform_fee_percent",
      "enable_crypto_payments",
      "enable_stripe_payments",
      "cryptomus_sandbox_mode",
      "announcement_banner_active",
      "announcement_banner_text",
      "announcement_banner_type",
      "max_shops_per_user",
    ];

    for (const key of allowedKeys) {
      if (body[key] !== undefined) {
        const val = String(body[key]);
        await setPlatformSetting(key, val);
      }
    }

    const updatedConfig = await getPlatformConfig();
    return NextResponse.json({
      success: true,
      message: "Platform settings updated successfully.",
      config: updatedConfig,
    });
  } catch (err: any) {
    console.error("[Platform Settings POST Error]", err);
    return NextResponse.json(
      { error: err.message || "Failed to update platform settings" },
      { status: 500 }
    );
  }
}
