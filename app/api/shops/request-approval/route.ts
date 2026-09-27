import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { shops, shopApprovalRequests, user } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { sendApprovalRequestWebhook } from "@/lib/webhooks";
import crypto from "crypto";

const RATE_LIMIT_HOURS = 24;

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const shopId = body.shopId as string;

    if (!shopId) {
      return NextResponse.json({ error: "shopId is required" }, { status: 400 });
    }

    // Verify ownership
    const shop = await db.query.shops.findFirst({
      where: and(eq(shops.id, shopId), eq(shops.userId, session.user.id)),
    });

    if (!shop) {
      return NextResponse.json({ error: "Shop not found or not yours" }, { status: 404 });
    }

    if (shop.isAccepted) {
      return NextResponse.json({ error: "Store is already approved" }, { status: 400 });
    }

    // Check for existing pending/recent request — spam protection
    const existingRequest = await db.query.shopApprovalRequests.findFirst({
      where: and(
        eq(shopApprovalRequests.shopId, shopId),
        eq(shopApprovalRequests.status, "pending")
      ),
      orderBy: [desc(shopApprovalRequests.requestedAt)],
    });

    if (existingRequest) {
      // Rate limit: if webhook was sent < 24h ago, block
      if (existingRequest.webhookSentAt) {
        const hoursSince =
          (Date.now() - new Date(existingRequest.webhookSentAt).getTime()) / (1000 * 60 * 60);
        if (hoursSince < RATE_LIMIT_HOURS) {
          const hoursLeft = Math.ceil(RATE_LIMIT_HOURS - hoursSince);
          return NextResponse.json(
            {
              error: `You already have a pending approval request. Please wait ${hoursLeft} hour(s) before sending another.`,
              rateLimited: true,
              hoursLeft,
            },
            { status: 429 }
          );
        }
      } else {
        // Pending but webhook not sent yet — send it now
      }
    }

    // Get user data for webhook
    const ownerData = await db.query.user.findFirst({
      where: eq(user.id, session.user.id),
    });

    const requestId = `req_${crypto.randomUUID().slice(0, 12)}`;
    const now = new Date();

    if (existingRequest && !existingRequest.webhookSentAt) {
      // Re-send webhook for existing unsent request
      await sendApprovalRequestWebhook({
        shopId: shop.id,
        shopName: shop.name,
        shopSlug: shop.slug,
        ownerName: ownerData?.name || session.user.name || "Unknown",
        ownerEmail: ownerData?.email || session.user.email || "Unknown",
        requestId: existingRequest.id,
      });
      await db
        .update(shopApprovalRequests)
        .set({ webhookSentAt: now })
        .where(eq(shopApprovalRequests.id, existingRequest.id));
    } else {
      // Create new request
      await db.insert(shopApprovalRequests).values({
        id: requestId,
        shopId: shop.id,
        userId: session.user.id,
        status: "pending",
        requestedAt: now,
        webhookSentAt: now,
      });

      // Send Discord webhook
      await sendApprovalRequestWebhook({
        shopId: shop.id,
        shopName: shop.name,
        shopSlug: shop.slug,
        ownerName: ownerData?.name || session.user.name || "Unknown",
        ownerEmail: ownerData?.email || session.user.email || "Unknown",
        requestId,
      });
    }

    return NextResponse.json({ success: true, message: "Approval request submitted. Admin will review shortly." });
  } catch (err: any) {
    console.error("[Approval Request] Error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get approval requests for this user's shops
    const userShops = await db.query.shops.findMany({
      where: eq(shops.userId, session.user.id),
    });

    const shopIds = userShops.map((s) => s.id);
    if (shopIds.length === 0) {
      return NextResponse.json({ requests: [] });
    }

    const requests = await db.query.shopApprovalRequests.findMany({
      orderBy: [desc(shopApprovalRequests.requestedAt)],
    });

    const filtered = requests.filter((r) => shopIds.includes(r.shopId));

    return NextResponse.json({ requests: filtered });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
