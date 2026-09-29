import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq, and, or, desc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get("shopId");

    const { getActiveMerchantShop } = await import("@/lib/tenant");
    const activeShop = await getActiveMerchantShop(session.user.id, shopId);

    const targetUserId = activeShop ? activeShop.userId : session.user.id;
    const targetShopId = activeShop ? activeShop.id : null;

    const userNotifications = await db.query.notifications.findMany({
      where: targetShopId
        ? or(eq(notifications.shopId, targetShopId), eq(notifications.userId, targetUserId))
        : eq(notifications.userId, targetUserId),
      orderBy: [desc(notifications.createdAt)],
    });

    const unreadCount = userNotifications.filter((n) => !n.isRead).length;

    return NextResponse.json({
      notifications: userNotifications,
      unreadCount,
    });
  } catch (err: any) {
    console.error("Error fetching notifications:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, all, shopId } = body;

    const { getActiveMerchantShop } = await import("@/lib/tenant");
    const activeShop = await getActiveMerchantShop(session.user.id, shopId);
    const targetUserId = activeShop ? activeShop.userId : session.user.id;

    if (all) {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(
          activeShop
            ? or(eq(notifications.shopId, activeShop.id), eq(notifications.userId, targetUserId))
            : eq(notifications.userId, targetUserId)
        );
      return NextResponse.json({ success: true });
    }

    if (id) {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(
          activeShop
            ? and(eq(notifications.id, id), or(eq(notifications.shopId, activeShop.id), eq(notifications.userId, targetUserId)))
            : and(eq(notifications.id, id), eq(notifications.userId, targetUserId))
        );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Missing notification id or all flag" }, { status: 400 });
  } catch (err: any) {
    console.error("Error updating notifications:", err);
    return NextResponse.json({ error: err.message || "Failed to update notification" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const all = searchParams.get("all") === "true";
    const shopId = searchParams.get("shopId");

    const { getActiveMerchantShop } = await import("@/lib/tenant");
    const activeShop = await getActiveMerchantShop(session.user.id, shopId);
    const targetUserId = activeShop ? activeShop.userId : session.user.id;

    if (all) {
      await db.delete(notifications).where(
        activeShop
          ? or(eq(notifications.shopId, activeShop.id), eq(notifications.userId, targetUserId))
          : eq(notifications.userId, targetUserId)
      );
      return NextResponse.json({ success: true });
    }

    if (id) {
      await db
        .delete(notifications)
        .where(
          activeShop
            ? and(eq(notifications.id, id), or(eq(notifications.shopId, activeShop.id), eq(notifications.userId, targetUserId)))
            : and(eq(notifications.id, id), eq(notifications.userId, targetUserId))
        );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Missing notification id or all parameter" }, { status: 400 });
  } catch (err: any) {
    console.error("Error deleting notification:", err);
    return NextResponse.json({ error: err.message || "Failed to delete notification" }, { status: 500 });
  }
}
