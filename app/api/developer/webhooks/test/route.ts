import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { webhookEndpoints, webhookLogs, shops } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

export async function POST(req: Request) {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { endpointId, shopId } = body;

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

    const { validateWebhookUrl } = await import("@/lib/webhooks");
    const urlValidation = validateWebhookUrl(endpoint.url);
    if (!urlValidation.valid) {
      return NextResponse.json({ error: `Destination blocked: ${urlValidation.error}` }, { status: 400 });
    }

    const testPayload = {
      id: `evt_test_${crypto.randomUUID().slice(0, 12)}`,
      event: "test.ping",
      createdAt: new Date().toISOString(),
      shopId: shop.id,
      data: {
        message: "This is a test webhook from KRYPT MARKET Protocol.",
        shopName: shop.name,
        shopSlug: shop.slug,
        timestamp: Date.now(),
      },
    };

    const payloadString = JSON.stringify(testPayload);
    const signature = crypto
      .createHmac("sha256", endpoint.secret)
      .update(payloadString)
      .digest("hex");

    const isDiscord =
      endpoint.url.includes("discord.com/api/webhooks") ||
      endpoint.url.includes("discordapp.com/api/webhooks");

    let outgoingBody: string;

    if (isDiscord) {
      outgoingBody = JSON.stringify({
        username: "KRYPT Webhooks",
        content: `⚡ **[KRYPT Test Ping]** Webhook connection verified successfully for **${shop.name}**!`,
        embeds: [
          {
            title: "⚡ Webhook Test Verified",
            description: `Your Discord webhook endpoint is active and ready to receive real-time event notifications from KRYPT.`,
            color: 0x00ff66,
            fields: [
              { name: "Event", value: "`test.ping`", inline: true },
              { name: "Store", value: shop.name, inline: true },
              { name: "Timestamp", value: new Date().toUTCString(), inline: false },
            ],
            footer: { text: "KRYPT MARKET • Developer Platform" },
          },
        ],
      });
    } else {
      outgoingBody = payloadString;
    }

    const startTime = Date.now();
    let status = 0;
    let responseText = "";
    let success = false;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(endpoint.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "KRYPT-Webhooks/2.0",
          "X-Krypt-Event": "test.ping",
          "X-Krypt-Signature": `sha256=${signature}`,
          "X-Vaultly-Event": "test.ping",
          "X-Vaultly-Signature": `sha256=${signature}`,
        },
        body: outgoingBody,
        signal: controller.signal,
      });

      clearTimeout(timeout);
      status = res.status;
      success = res.status >= 200 && res.status < 300;
      responseText = (await res.text()).slice(0, 1000);
    } catch (fetchErr: any) {
      responseText = fetchErr?.message || "Connection timeout";
    }

    const durationMs = Date.now() - startTime;

    // Log the test ping
    await db.insert(webhookLogs).values({
      id: `whl_${crypto.randomUUID().slice(0, 16)}`,
      webhookEndpointId: endpoint.id,
      shopId: shop.id,
      event: "test.ping",
      payload: payloadString,
      responseStatus: status,
      responseBody: responseText,
      durationMs,
      success,
    });

    return NextResponse.json({
      success,
      status,
      durationMs,
      responseBody: responseText,
    });
  } catch (err: any) {
    console.error("[Test Webhook Error]", err);
    return NextResponse.json({ error: "Failed to send test webhook" }, { status: 500 });
  }
}
