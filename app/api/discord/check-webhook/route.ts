import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const webhookUrl = (body.webhookUrl || "").trim();

    if (!webhookUrl) {
      return NextResponse.json(
        { valid: false, error: "Discord webhook URL is required" },
        { status: 400 }
      );
    }

    // Match Discord webhook URL pattern
    const pattern = /^https:\/\/(?:ptb\.|canary\.)?discord\.com\/api\/webhooks\/\d+\/[\w-]+$/i;
    if (!pattern.test(webhookUrl)) {
      return NextResponse.json({
        valid: false,
        error: "Invalid Discord webhook URL format. It should look like: https://discord.com/api/webhooks/ID/TOKEN",
      });
    }

    // Ping Discord's GET endpoint on the webhook to verify existence
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(webhookUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "Vaultly-Webhook-Verifier/1.0" },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json({
        valid: false,
        error: "Discord webhook not found or revoked (HTTP " + res.status + ")",
      });
    }

    const data = await res.json();
    return NextResponse.json({
      valid: true,
      name: data.name || "Discord Webhook",
      channelId: data.channel_id,
      guildId: data.guild_id,
    });
  } catch (err: any) {
    return NextResponse.json({
      valid: false,
      error: err.message || "Failed to reach Discord webhook",
    });
  }
}
