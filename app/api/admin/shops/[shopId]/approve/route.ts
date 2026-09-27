import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { shops, shopApprovalRequests, user, notifications } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { verifyAdminSessionTicket } from "@/lib/admin-gate";
import { sendAdminActionWebhook } from "@/lib/webhooks";
import crypto from "crypto";

function getClientIp(h: Headers): string {
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") || "127.0.0.1";
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const headersList = await headers();
    const { shopId } = await params;
    const ticket = headersList.get("x-admin-ticket");
    const ip = getClientIp(headersList);
    const isSuperAdmin = verifyAdminSessionTicket(ticket, ip);

    // Must be super admin OR discord admin
    const session = await auth.api.getSession({ headers: headersList });

    let isAdmin = isSuperAdmin;
    let adminName = "SuperAdmin";

    if (!isSuperAdmin) {
      const { getBlockAllAdminsStatus } = await import("@/lib/admin-gate");
      const isBlocked = await getBlockAllAdminsStatus();
      if (isBlocked) {
        return NextResponse.json(
          { error: "Administrative actions are currently locked down by Super-Admin (Emergency Lockdown)." },
          { status: 403 }
        );
      }

      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const dbUser = await db.query.user.findFirst({ where: eq(user.id, session.user.id) });
      if (dbUser?.role !== "admin" && dbUser?.role !== "superadmin") {
        return NextResponse.json({ error: "Admin access required" }, { status: 403 });
      }
      isAdmin = true;
      adminName = dbUser?.discordUsername || dbUser?.name || "Admin";
    }

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const decision = body.decision as "approved" | "rejected";
    const note = (body.note as string) || "";

    if (!decision || !["approved", "rejected"].includes(decision)) {
      return NextResponse.json({ error: "decision must be 'approved' or 'rejected'" }, { status: 400 });
    }

    // Find shop
    const shop = await db.query.shops.findFirst({ where: eq(shops.id, shopId) });
    if (!shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    // Update shop isAccepted
    const isAccepted = decision === "approved";
    await db.update(shops).set({ isAccepted, updatedAt: new Date() }).where(eq(shops.id, shopId));

    // Update pending requests or insert a decision record
    const pendingReqs = await db.query.shopApprovalRequests.findMany({
      where: and(eq(shopApprovalRequests.shopId, shopId), eq(shopApprovalRequests.status, "pending")),
    });

    if (pendingReqs.length > 0) {
      await db
        .update(shopApprovalRequests)
        .set({
          status: decision,
          processedAt: new Date(),
          processedBy: adminName,
          adminNote: note || null,
        })
        .where(and(eq(shopApprovalRequests.shopId, shopId), eq(shopApprovalRequests.status, "pending")));
    } else {
      await db.insert(shopApprovalRequests).values({
        id: crypto.randomUUID(),
        shopId: shop.id,
        userId: shop.userId,
        status: decision,
        adminNote: note || null,
        processedBy: adminName,
        processedAt: new Date(),
      });
    }

    // Insert user notification into their Inbox
    if (decision === "rejected") {
      await db.insert(notifications).values({
        id: crypto.randomUUID(),
        userId: shop.userId,
        shopId: shop.id,
        type: "store_rejected",
        title: `Store "${shop.name}" was rejected`,
        message: `Your store submission for "${shop.name}" (/${shop.slug}) was reviewed and rejected by the moderation team.`,
        reason: note ? note.trim() : "No specific reason provided.",
        isRead: false,
        createdAt: new Date(),
      });
    } else {
      await db.insert(notifications).values({
        id: crypto.randomUUID(),
        userId: shop.userId,
        shopId: shop.id,
        type: "store_approved",
        title: `Store "${shop.name}" is approved! 🎉`,
        message: `Congratulations! Your store "${shop.name}" (/${shop.slug}) has been approved and is now active and accessible to all visitors.`,
        reason: null,
        isRead: false,
        createdAt: new Date(),
      });
    }

    // Send log webhook
    await sendAdminActionWebhook({
      action: decision,
      adminName,
      shopName: shop.name,
      shopSlug: shop.slug,
      note: note || undefined,
    });

    return NextResponse.json({ success: true, isAccepted });
  } catch (err: any) {
    console.error("[Admin Approve] Error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
