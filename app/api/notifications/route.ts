import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userNotifications = await db.query.notifications.findMany({
      where: eq(notifications.userId, session.user.id),
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
    const { id, all } = body;

    if (all) {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.userId, session.user.id));
      return NextResponse.json({ success: true });
    }

    if (id) {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(eq(notifications.id, id), eq(notifications.userId, session.user.id)));
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

    if (all) {
      await db.delete(notifications).where(eq(notifications.userId, session.user.id));
      return NextResponse.json({ success: true });
    }

    if (id) {
      await db
        .delete(notifications)
        .where(and(eq(notifications.id, id), eq(notifications.userId, session.user.id)));
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Missing notification id or all parameter" }, { status: 400 });
  } catch (err: any) {
    console.error("Error deleting notification:", err);
    return NextResponse.json({ error: err.message || "Failed to delete notification" }, { status: 500 });
  }
}
