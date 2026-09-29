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
 * Includes cryptographic HMAC-SHA256 signature in X-Krypt-Signature header.
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
  let title = `KRYPT Event: ${event}`;
  let description = "";
  let color = 0x00e5ff; // cyan
  const fields: Array<{ name: string; value: string; inline?: boolean }> = [];

  if (event === "order.completed") {
    title = "⚡ KRYPT // Sale Settled & Keys Dispatched";
    color = 0x00ff66; // neon green
    description = `A new transaction settled on your store node!`;
    if (data.productTitle) fields.push({ name: "📦 Protocol", value: String(data.productTitle), inline: true });
    if (data.totalAmount) fields.push({ name: "💰 Total", value: `$${parseFloat(data.totalAmount).toFixed(2)} ${data.currency || "USD"}`, inline: true });
    if (data.paymentMethod) fields.push({ name: "💳 Gateway", value: String(data.paymentMethod).toUpperCase(), inline: true });
    if (data.orderId) fields.push({ name: "🧾 TXID", value: `\`${data.orderId.slice(0, 10)}\``, inline: true });
    if (data.buyerEmail) {
      const parts = data.buyerEmail.split("@");
      const masked = parts.length === 2 ? `${parts[0].slice(0, 2)}***@${parts[1]}` : "Customer";
      fields.push({ name: "👤 Mailbox", value: masked, inline: true });
    }
  } else if (event === "order.created") {
    title = "🛒 Checkout Initialized";
    color = 0x00e5ff; // cyan
    description = `Checkout session created for order \`${data.orderId || payload.id}\`.`;
    if (data.productTitle) fields.push({ name: "📦 Product", value: String(data.productTitle), inline: true });
  } else if (event === "stock.low") {
    title = "⚠️ Vault Partition Low Warning!";
    color = 0xff2a4b; // laser red
    description = `Product **${data.productTitle || "Digital Key"}** has only ${data.remainingKeys ?? 0} keys remaining in vault!`;
    fields.push({ name: "Remaining Keys", value: String(data.remainingKeys ?? 0), inline: true });
  } else if (event === "product.created") {
    title = "✨ New Protocol Product Published";
    color = 0x00e5ff; // cyan
    description = `Product **${data.title || "New Product"}** is now live on your storefront node.`;
    if (data.price) fields.push({ name: "Price", value: `$${parseFloat(data.price).toFixed(2)}`, inline: true });
  } else if (event === "review.created") {
    title = "⭐ Verified Feedback Received";
    color = 0x00ff66; // green
    description = `A customer left feedback: "${data.comment || "Verified purchase."}"`;
    if (data.rating) fields.push({ name: "Rating", value: `${"★".repeat(data.rating)} (${data.rating}/5)`, inline: true });
  } else {
    description = `\`\`\`json\n${JSON.stringify(data, null, 2).slice(0, 1500)}\n\`\`\``;
  }

  return JSON.stringify({
    username: "KRYPT Webhooks",
    content: `🔔 **[KRYPT Protocol Notification]** \`${event}\``,
    embeds: [
      {
        title,
        description,
        color,
        fields: fields.length > 0 ? fields : undefined,
        footer: { text: "KRYPT MARKET PROTOCOL // ZERO LOG RETENTION" },
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
        "User-Agent": "KRYPT-Webhooks/2.0",
        "X-Krypt-Event": event,
        "X-Krypt-Signature": `sha256=${signature}`,
      },
      body: outgoingBody,
      signal: controller.signal,
    });

    clearTimeout(timeout);
    status = res.status;
    success = res.status >= 200 && res.status < 300;
    const text = await res.text();
    responseText = text.slice(0, 1000);
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

    // Mask buyer email for privacy
    const emailParts = buyerEmail.split("@");
    const maskedEmail =
      emailParts.length === 2
        ? `${emailParts[0].slice(0, 2)}***@${emailParts[1]}`
        : "Buyer";

    const formattedAmount = `$${parseFloat(totalAmount.toString()).toFixed(2)} ${currency}`;
    const shortOrderId = orderId.slice(0, 8).toUpperCase();

    const embed = {
      title: "⚡ KRYPT // Sale Settled & Dispatched",
      description: `New customer purchase settled on **${shop.name}**!`,
      color: 0x00ff66, // Neon Green
      fields: [
        {
          name: "📦 Protocol",
          value: `${productTitle} ${quantity > 1 ? `(x${quantity})` : ""}`,
          inline: true,
        },
        {
          name: "💰 Settled Amount",
          value: `**${formattedAmount}**`,
          inline: true,
        },
        {
          name: "💳 Gateway",
          value: paymentMethod.toUpperCase(),
          inline: true,
        },
        {
          name: "👤 Destination",
          value: `\`${maskedEmail}\``,
          inline: true,
        },
        {
          name: "🔑 Decrypted Keys",
          value: `${keysCount} key(s) dispatched`,
          inline: true,
        },
        {
          name: "🧾 TXID Reference",
          value: `#${shortOrderId}`,
          inline: true,
        },
      ],
      footer: {
        text: `KRYPT MARKET PROTOCOL • Order #${shortOrderId}`,
        icon_url: "https://krypt.market/favicon.ico",
      },
      timestamp: new Date().toISOString(),
    };

    // Verify Discord Webhook URL safety before dispatch
    const validation = validateDiscordWebhookUrl(shop.discordWebhookUrl);
    if (!validation.valid) {
      console.warn(`[Discord Notification Skipped] Invalid or unsafe webhook URL for shop ${shop.id}: ${validation.error}`);
      return;
    }

    await fetch(shop.discordWebhookUrl.trim(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      redirect: "error", // Prevent HTTP redirect SSRF
      body: JSON.stringify({
        username: "KRYPT Sales Daemon",
        avatar_url: "https://krypt.market/logo.png",
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
    const validation = validateDiscordWebhookUrl(webhookUrl);
    if (!validation.valid) {
      console.warn(`[Approval Webhook Skipped] Invalid Discord approval webhook URL: ${validation.error}`);
      return;
    }

    const embed = {
      title: "📋 Storefront Node Approval Request",
      description: `Operator requested protocol verification for **${params.shopName}**`,
      color: 0x00e5ff, // Cyan
      fields: [
        { name: "Node Name", value: params.shopName, inline: true },
        { name: "Slug Endpoint", value: `/${params.shopSlug}`, inline: true },
        { name: "Operator", value: `${params.ownerName} (${params.ownerEmail})`, inline: false },
        { name: "Request ID", value: params.requestId, inline: true },
      ],
      footer: { text: "KRYPT Protocol Admin Security" },
      timestamp: new Date().toISOString(),
    };

    await fetch(webhookUrl.trim(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      redirect: "error",
      body: JSON.stringify({
        username: "KRYPT Node Approvals",
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
    const validation = validateDiscordWebhookUrl(webhookUrl);
    if (!validation.valid) {
      console.warn(`[Admin Action Webhook Skipped] Invalid Discord approval webhook URL: ${validation.error}`);
      return;
    }

    const isApproved = params.action === "approved";
    const embed = {
      title: isApproved ? "✅ Storefront Node Approved" : "❌ Storefront Node Rejected",
      description: `Store node **${params.shopName}** (/${params.shopSlug}) was ${params.action} by admin **${params.adminName}**.`,
      color: isApproved ? 0x00ff66 : 0xff2a4b,
      fields: [
        { name: "Admin", value: params.adminName, inline: true },
        { name: "Decision", value: params.action.toUpperCase(), inline: true },
        ...(params.note ? [{ name: "Moderation Note", value: params.note, inline: false }] : []),
      ],
      footer: { text: "KRYPT Protocol Audit Log" },
      timestamp: new Date().toISOString(),
    };

    await fetch(webhookUrl.trim(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      redirect: "error",
      body: JSON.stringify({
        username: "KRYPT Audit Daemon",
        embeds: [embed],
      }),
    });
  } catch (err) {
    console.warn("[Admin Action Webhook Error]", err);
  }
}

/**
 * Discord Webhook URL Validator
 * Strictly validates that webhook URLs belong to genuine Discord endpoints and use HTTPS.
 */
export function validateDiscordWebhookUrl(urlString: string): { valid: boolean; error?: string } {
  if (!urlString || typeof urlString !== "string") {
    return { valid: false, error: "Discord webhook URL is required." };
  }
  try {
    const url = new URL(urlString.trim());
    if (url.protocol !== "https:") {
      return { valid: false, error: "Discord webhook URLs must use HTTPS protocol." };
    }
    const hostname = url.hostname.toLowerCase();
    if (
      hostname !== "discord.com" &&
      hostname !== "discordapp.com" &&
      hostname !== "canary.discord.com" &&
      hostname !== "ptb.discord.com"
    ) {
      return { valid: false, error: "Invalid Discord webhook domain. Must be discord.com or discordapp.com." };
    }
    if (!url.pathname.startsWith("/api/webhooks/")) {
      return { valid: false, error: "Invalid Discord webhook path. Must start with /api/webhooks/." };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: "Malformed Discord webhook URL provided." };
  }
}

/**
 * SSRF Prevention Validator
 * Ensures webhook URLs are public HTTPS endpoints and do not point to internal metadata/loopback services.
 */
export function validateWebhookUrl(urlString: string): { valid: boolean; error?: string } {
  try {
    const url = new URL(urlString);

    if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
      return { valid: false, error: "Only HTTPS webhook URLs are allowed in production." };
    }

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { valid: false, error: "Invalid protocol. Only HTTP and HTTPS are permitted." };
    }

    const hostname = url.hostname.toLowerCase();

    // Block localhost and loopbacks
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname === "0.0.0.0" ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".local")
    ) {
      return { valid: false, error: "Localhost and loopback destinations are forbidden." };
    }

    // Block AWS / GCP / Azure / cloud metadata services and private subnets
    const privateIpRegex = /^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|169\.254\.)/;
    if (privateIpRegex.test(hostname)) {
      return { valid: false, error: "Private or internal IP addresses are strictly forbidden." };
    }

    // Block cloud metadata hostnames
    if (
      hostname.includes("metadata.google.internal") ||
      hostname.includes("instance-data") ||
      hostname === "169.254.169.254"
    ) {
      return { valid: false, error: "Cloud metadata addresses are forbidden." };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: "Malformed URL provided." };
  }
}

