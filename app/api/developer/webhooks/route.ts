import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { webhookEndpoints, webhookLogs, shops } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import crypto from "crypto";

export async function GET() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const shop = await db.query.shops.findFirst({
    where: eq(shops.userId, session.user.id),
  });

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

  const shop = await db.query.shops.findFirst({
    where: eq(shops.userId, session.user.id),
  });

  if (!shop) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const { url, events } = body;

    if (!url || typeof url !== "string" || !url.startsWith("http")) {
      return NextResponse.json({ error: "Valid HTTP/HTTPS webhook URL is required" }, { status: 400 });
    }

    const id = `whe_${crypto.randomUUID().slice(0, 12)}`;
    const secret = `whsec_${crypto.randomBytes(24).toString("hex")}`;
    const selectedEvents = Array.isArray(events) && events.length > 0 ? events : ["order.completed"];

    await db.insert(webhookEndpoints).values({
      id,
      userId: session.user.id,
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
    const { endpointId } = body;

    if (!endpointId) {
      return NextResponse.json({ error: "Endpoint ID is required" }, { status: 400 });
    }

    await db
      .update(webhookEndpoints)
      .set({ isActive: false })
      .where(and(eq(webhookEndpoints.id, endpointId), eq(webhookEndpoints.userId, session.user.id)));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[Delete Webhook Error]", err);
    return NextResponse.json({ error: "Failed to remove webhook endpoint" }, { status: 500 });
  }
}
