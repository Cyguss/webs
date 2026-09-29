import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { webhookEndpoints, webhookLogs, shops } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import crypto from "crypto";

export async function GET(req: Request) {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const shopId = searchParams.get("shopId");

  const { getActiveMerchantShop } = await import("@/lib/tenant");
  const shop = await getActiveMerchantShop(session.user.id, shopId);

  if (!shop) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  const endpoints = await db
    .select()
    .from(webhookEndpoints)
    .where(and(eq(webhookEndpoints.shopId, shop.id), eq(webhookEndpoints.isActive, true)))
    .orderBy(desc(webhookEndpoints.createdAt));

  const logs = await db
    .select()
    .from(webhookLogs)
    .where(eq(webhookLogs.shopId, shop.id))
    .orderBy(desc(webhookLogs.createdAt))
    .limit(20);

  return NextResponse.json({
    success: true,
    endpoints: endpoints.map((e) => ({
      ...e,
      events: JSON.parse(e.events || "[]"),
    })),
    logs,
  });
}

export async function POST(req: Request) {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { url, events, shopId } = body;

    const { getActiveMerchantShop } = await import("@/lib/tenant");
    const shop = await getActiveMerchantShop(session.user.id, shopId);

    if (!shop) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Webhook URL is required" }, { status: 400 });
    }

    const { validateWebhookUrl } = await import("@/lib/webhooks");
    const urlValidation = validateWebhookUrl(url.trim());
    if (!urlValidation.valid) {
      return NextResponse.json({ error: urlValidation.error || "Invalid webhook destination URL" }, { status: 400 });
    }

    const id = `whe_${crypto.randomUUID().slice(0, 12)}`;
    const secret = `whsec_${crypto.randomBytes(24).toString("hex")}`;
    const selectedEvents = Array.isArray(events) && events.length > 0 ? events : ["order.completed"];

    await db.insert(webhookEndpoints).values({
      id,
      userId: shop.userId,
      shopId: shop.id,
      url: url.trim(),
      secret,
      events: JSON.stringify(selectedEvents),
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      endpoint: {
        id,
        url: url.trim(),
        secret,
        events: selectedEvents,
        createdAt: new Date(),
      },
    });
  } catch (err: any) {
    console.error("[Create Webhook Error]", err);
    return NextResponse.json({ error: "Failed to register webhook endpoint" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { endpointId, shopId } = body;

    if (!endpointId) {
      return NextResponse.json({ error: "Endpoint ID is required" }, { status: 400 });
    }

    const { getActiveMerchantShop } = await import("@/lib/tenant");
    const shop = await getActiveMerchantShop(session.user.id, shopId);

    if (!shop) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const endpoint = await db.query.webhookEndpoints.findFirst({
      where: and(eq(webhookEndpoints.id, endpointId), eq(webhookEndpoints.shopId, shop.id)),
    });

    if (!endpoint) {
      return NextResponse.json({ error: "Webhook endpoint not found" }, { status: 404 });
    }

    await db
      .update(webhookEndpoints)
      .set({ isActive: false })
      .where(eq(webhookEndpoints.id, endpointId));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[Delete Webhook Error]", err);
    return NextResponse.json({ error: "Failed to remove webhook endpoint" }, { status: 500 });
  }
}
