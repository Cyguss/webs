import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user, shops } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyAdminSessionTicket } from "@/lib/admin-gate";

function getClientIp(headersList: Headers): string {
  const forwarded = headersList.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headersList.get("x-real-ip") || "127.0.0.1";
}

/**
 * POST /api/admin/masquerade
 * Validates admin authorization and generates request-scoped preview URL for a store.
 */
export async function POST(req: Request) {
  try {
    const headersList = await headers();
    const ticket = headersList.get("x-admin-ticket");
    const ip = getClientIp(headersList);

    const isSuperAdminTicket = verifyAdminSessionTicket(ticket, ip);

    const session = await auth.api.getSession({
      headers: headersList,
    });

    let currentDbUser: any = null;
    if (session?.user?.id) {
      currentDbUser = await db.query.user.findFirst({
        where: eq(user.id, session.user.id),
      });
    }

    const { isUserActiveAdmin } = await import("@/lib/admin-gate");
    const isAuthorizedAdmin =
      isSuperAdminTicket ||
      isUserActiveAdmin(currentDbUser);

    if (!isAuthorizedAdmin) {
      return NextResponse.json(
        { error: "Unauthorized. Administrator privileges required to preview store dashboard." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { shopId } = body;

    if (!shopId) {
      return NextResponse.json({ error: "Missing required store ID." }, { status: 400 });
    }

    const targetShop = await db.query.shops.findFirst({
      where: eq(shops.id, shopId),
    });

    if (!targetShop) {
      return NextResponse.json({ error: "Store not found." }, { status: 404 });
    }

    const shopOwner = await db.query.user.findFirst({
      where: eq(user.id, targetShop.userId),
    });

    const res = NextResponse.json({
      success: true,
      shop: {
        id: targetShop.id,
        name: targetShop.name,
        slug: targetShop.slug,
      },
      owner: {
        email: shopOwner?.email || null,
        name: shopOwner?.name || null,
      },
      redirectUrl: `/dashboard?shopId=${encodeURIComponent(targetShop.id)}`,
    });

    // Clean up any legacy override cookies
    res.cookies.delete("krypt_admin_override_shop_id");
    res.cookies.delete("krypt_admin_override_shop_name");
    res.cookies.delete("krypt_admin_override_owner");

    return res;
  } catch (err: any) {
    console.error("[Admin Preview Error]", err);
    return NextResponse.json(
      { error: err?.message || "Failed to initialize store preview." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/masquerade
 * Cleans up any legacy override cookies and returns admin to admin portal.
 */
export async function DELETE() {
  try {
    const res = NextResponse.json({
      success: true,
      redirectUrl: "/admin",
    });

    // Delete legacy override cookies
    res.cookies.delete("krypt_admin_override_shop_id");
    res.cookies.delete("krypt_admin_override_shop_name");
    res.cookies.delete("krypt_admin_override_owner");

    return res;
  } catch (err: any) {
    console.error("[Admin Exit Error]", err);
    return NextResponse.json(
      { error: err?.message || "Failed to exit admin mode." },
      { status: 500 }
    );
  }
}
