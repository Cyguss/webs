import { db } from "@/lib/db";
import { webhookEndpoints, webhookLogs, shops } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

export interface WebhookPayload<T = any> {
  id: string;
  event: string;
  createdAt: string;
  shopId: string;
  data: T;
}

/**
 * Dispatches an event to all active webhook endpoints registered for a shop.
 * Includes cryptographic HMAC-SHA256 signature in X-Vaultly-Signature header.
 * Dispatches concurrently without blocking the main request thread.
 */
export async function dispatchWebhookEvent<T = any>(
  shopId: string,
  event: string,
  data: T
): Promise<void> {
  try {
    const endpoints = await db.query.webhookEndpoints.findFirst
      ? await db.select().from(webhookEndpoints).where(
          and(
            eq(webhookEndpoints.shopId, shopId),
            eq(webhookEndpoints.isActive, true)
          )
        )
      : [];

    if (!endpoints || endpoints.length === 0) {
      return;
    }

    const payload: WebhookPayload<T> = {
      id: `evt_${crypto.randomUUID().slice(0, 16)}`,
      event,
      createdAt: new Date().toISOString(),
      shopId,
      data,
    };

    const payloadString = JSON.stringify(payload);

    for (const endpoint of endpoints) {
      // Check if endpoint is subscribed to this event or to all events ("*")
      let subscribedEvents: string[] = [];
      try {
        subscribedEvents = JSON.parse(endpoint.events);
      } catch {
        subscribedEvents = [endpoint.events];
      }

      if (!subscribedEvents.includes(event) && !subscribedEvents.includes("*")) {
        continue;
      }

      // Fire and record asynchronously
      deliverWebhook(endpoint, event, payloadString).catch((err) =>
        console.error(`[Webhook] Delivery failed to ${endpoint.url}:`, err)
      );
    }
  } catch (err) {
    console.error("[Webhook Dispatch Error]", err);
  }
}

function formatDiscordWebhookPayload(event: string, payload: any): string {
  const data = payload?.data || {};
  let title = `Vaultly Event: ${event}`;
  let description = "";
  let color = 0x6366f1; // default indigo
  const fields: Array<{ name: string; value: string; inline?: boolean }> = [];

  if (event === "order.completed") {
    title = "🎉 New Sale Completed!";
    color = 0x10b981; // green
    description = `A new customer order was successfully processed on your store!`;
    if (data.productTitle) fields.push({ name: "📦 Product", value: String(data.productTitle), inline: true });
    if (data.totalAmount) fields.push({ name: "💰 Total", value: `$${parseFloat(data.totalAmount).toFixed(2)} ${data.currency || "USD"}`, inline: true });
    if (data.paymentMethod) fields.push({ name: "💳 Method", value: String(data.paymentMethod).toUpperCase(), inline: true });
    if (data.orderId) fields.push({ name: "🧾 Order ID", value: `\`${data.orderId.slice(0, 10)}\``, inline: true });
    if (data.buyerEmail) {
      const parts = data.buyerEmail.split("@");
      const masked = parts.length === 2 ? `${parts[0].slice(0, 2)}***@${parts[1]}` : "Customer";
      fields.push({ name: "👤 Customer", value: masked, inline: true });
    }
  } else if (event === "order.created") {
    title = "🛒 Checkout Started";
    color = 0x3b82f6; // blue
    description = `A customer has started checkout for order \`${data.orderId || payload.id}\`.`;
    if (data.productTitle) fields.push({ name: "📦 Product", value: String(data.productTitle), inline: true });
  } else if (event === "stock.low") {
    title = "⚠️ Low Inventory Warning!";
    color = 0xef4444; // red
    description = `Product **${data.productTitle || "Digital Key"}** has only ${data.remainingKeys ?? 0} keys remaining in stock!`;
    fields.push({ name: "Remaining Keys", value: String(data.remainingKeys ?? 0), inline: true });
  } else if (event === "product.created") {
    title = "✨ New Product Published";
    color = 0x8b5cf6; // purple
    description = `Product **${data.title || "New Product"}** is now live on your storefront.`;
    if (data.price) fields.push({ name: "Price", value: `$${parseFloat(data.price).toFixed(2)}`, inline: true });
  } else if (event === "review.created") {
    title = "⭐ New Customer Review";
    color = 0xf59e0b; // amber
    description = `A customer left a review: "${data.comment || "Great product!"}"`;
    if (data.rating) fields.push({ name: "Rating", value: `${"★".repeat(data.rating)} (${data.rating}/5)`, inline: true });
  } else {
    description = `\`\`\`json\n${JSON.stringify(data, null, 2).slice(0, 1500)}\n\`\`\``;
  }

  return JSON.stringify({
    username: "Vaultly Webhooks",
    content: `🔔 **[Vaultly Notification]** \`${event}\``,
    embeds: [
      {
        title,
        description,
        color,
        fields: fields.length > 0 ? fields : undefined,
        footer: { text: "Vaultly Digital Commerce • Live Notifications" },
        timestamp: new Date().toISOString(),
      },
    ],
  });
}

async function deliverWebhook(
  endpoint: typeof webhookEndpoints.$inferSelect,
  event: string,
  payloadString: string
) {
  const startTime = Date.now();
  let status: number | null = null;
  let responseText: string | null = null;
  let success = false;

  // Generate HMAC-SHA256 signature
  const signature = crypto
    .createHmac("sha256", endpoint.secret)
    .update(payloadString)
    .digest("hex");

  const logId = `whl_${crypto.randomUUID().slice(0, 16)}`;

  const isDiscord =
    endpoint.url.includes("discord.com/api/webhooks") ||
    endpoint.url.includes("discordapp.com/api/webhooks");

  let outgoingBody = payloadString;
  if (isDiscord) {
    try {
      const parsed = JSON.parse(payloadString);
      outgoingBody = formatDiscordWebhookPayload(event, parsed);
    } catch {
      // Fallback
    }
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const res = await fetch(endpoint.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Vaultly-Webhooks/1.0",
        "X-Vaultly-Event": event,
        "X-Vaultly-Signature": `sha256=${signature}`,
      },
      body: outgoingBody,
      signal: controller.signal,
    });

    clearTimeout(timeout);
    status = res.status;
    success = res.status >= 200 && res.status < 300;
    const text = await res.text();
    responseText = text.slice(0, 1000); // truncate response preview
  } catch (err: any) {
    status = 0;
    responseText = err?.message || "Connection timeout or network error";
    success = false;
  }

  const durationMs = Date.now() - startTime;

  // Record delivery in webhook_logs
  try {
    await db.insert(webhookLogs).values({
      id: logId,
      webhookEndpointId: endpoint.id,
      shopId: endpoint.shopId,
      event,
      payload: payloadString,
      responseStatus: status,
      responseBody: responseText,
      durationMs,
      success,
    });
  } catch (logErr) {
    console.error("[Webhook Log Error]", logErr);
  }
}

/**
 * Sends a rich, professional sale notification embed to the merchant's Discord webhook if configured.
 */
export async function sendDiscordSaleNotification(
  shopId: string,
  sale: {
    orderId: string;
    productTitle: string;
    quantity: number;
    totalAmount: number | string;
    currency: string;
    paymentMethod: string;
    buyerEmail: string;
    keysCount?: number;
  }
): Promise<void> {
  try {
    const shop = await db.query.shops.findFirst({
      where: eq(shops.id, shopId),
    });

    if (!shop || !shop.discordWebhookUrl || !shop.discordWebhookUrl.trim()) {
      return;
    }

    const {
      orderId,
      productTitle,
      quantity,
      totalAmount,
      currency,
      paymentMethod,
      buyerEmail,
      keysCount = 1,
    } = sale;

    // Mask buyer email for merchant privacy (e.g. jo***@gmail.com)
    const emailParts = buyerEmail.split("@");
    const maskedEmail =
      emailParts.length === 2
        ? `${emailParts[0].slice(0, 2)}***@${emailParts[1]}`
        : "Buyer";

    const formattedAmount = `$${parseFloat(totalAmount.toString()).toFixed(2)} ${currency}`;
    const shortOrderId = orderId.slice(0, 8).toUpperCase();

    const embed = {
      title: "🎉 New Sale Completed!",
      description: `A new customer purchase just completed on **${shop.name}**!`,
      color: 0x6366f1, // Vaultly Indigo
      fields: [
        {
          name: "📦 Product",
          value: `${productTitle} ${quantity > 1 ? `(x${quantity})` : ""}`,
          inline: true,
        },
        {
          name: "💰 Amount",
          value: `**${formattedAmount}**`,
          inline: true,
        },
        {
          name: "💳 Method",
          value: paymentMethod.toUpperCase(),
          inline: true,
        },
        {
          name: "👤 Customer",
          value: `\`${maskedEmail}\``,
          inline: true,
        },
        {
          name: "🔑 Digital Keys",
          value: `${keysCount} key(s) delivered`,
          inline: true,
        },
        {
          name: "🧾 Order ID",
          value: `#${shortOrderId}`,
          inline: true,
        },
      ],
      footer: {
        text: `Vaultly Automated Commerce • Order #${shortOrderId}`,
        icon_url: "https://vaultly.dev/favicon.ico",
      },
      timestamp: new Date().toISOString(),
    };

    await fetch(shop.discordWebhookUrl.trim(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Vaultly Sales Bot",
        avatar_url: "https://vaultly.dev/logo.png",
        embeds: [embed],
      }),
    });

    console.log(`[Discord Notification] Sale embed dispatched for #${shortOrderId} to ${shop.name}`);
  } catch (err) {
    console.warn("[Discord Webhook Error]", err);
  }
}

/**
 * Sends a notification to the platform approval webhook when a seller requests approval.
 */
export async function sendApprovalRequestWebhook(params: {
  shopId: string;
  shopName: string;
  shopSlug: string;
  ownerName: string;
  ownerEmail: string;
  requestId: string;
}): Promise<void> {
  const webhookUrl = process.env.DISCORD_APPROVAL_WEBHOOK_URL;
  if (!webhookUrl || !webhookUrl.trim()) return;

  try {
    const embed = {
      title: "📋 New Store Approval Request",
      description: `Seller requested verification for **${params.shopName}**`,
      color: 0xf59e0b, // Amber
      fields: [
        { name: "Store Name", value: params.shopName, inline: true },
        { name: "Slug", value: `/${params.shopSlug}`, inline: true },
        { name: "Owner", value: `${params.ownerName} (${params.ownerEmail})`, inline: false },
        { name: "Request ID", value: params.requestId, inline: true },
      ],
      footer: { text: "Vaultly Admin Security" },
      timestamp: new Date().toISOString(),
    };

    await fetch(webhookUrl.trim(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Vaultly Approvals",
        embeds: [embed],
      }),
    });
  } catch (err) {
    console.warn("[Approval Webhook Error]", err);
  }
}

/**
 * Sends a notification to the platform approval webhook when an admin approves or rejects a store.
 */
export async function sendAdminActionWebhook(params: {
  action: "approved" | "rejected";
  adminName: string;
  shopName: string;
  shopSlug: string;
  note?: string;
}): Promise<void> {
  const webhookUrl = process.env.DISCORD_APPROVAL_WEBHOOK_URL;
  if (!webhookUrl || !webhookUrl.trim()) return;

  try {
    const isApproved = params.action === "approved";
    const embed = {
      title: isApproved ? "✅ Store Approved" : "❌ Store Rejected",
      description: `Store **${params.shopName}** (/${params.shopSlug}) was ${params.action} by **${params.adminName}**.`,
      color: isApproved ? 0x22c55e : 0xef4444,
      fields: [
        { name: "Admin", value: params.adminName, inline: true },
        { name: "Decision", value: params.action.toUpperCase(), inline: true },
        ...(params.note ? [{ name: "Moderation Note", value: params.note, inline: false }] : []),
      ],
      footer: { text: "Vaultly Admin Audit Log" },
      timestamp: new Date().toISOString(),
    };

    await fetch(webhookUrl.trim(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Vaultly Audit",
        embeds: [embed],
      }),
    });
  } catch (err) {
    console.warn("[Admin Action Webhook Error]", err);
  }
}
