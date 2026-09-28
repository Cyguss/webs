import { NextResponse } from "next/server";
import { headers } from "next/headers";

// In-memory cache for Discord invite data (TTL: 2 minutes)
const cacheMap = new Map<string, { data: any; timestamp: number }>();

// IP-based request throttling
const ipRequestHistory = new Map<string, number[]>();

function getClientIp(headersList: Headers): string {
  const forwarded = headersList.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = headersList.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const history = (ipRequestHistory.get(ip) || []).filter((time) => now - time < 30000);
  if (history.length >= 15) {
    return false; // more than 15 requests in 30 seconds
  }
  history.push(now);
  ipRequestHistory.set(ip, history);
  return true;
}

function extractInviteCode(rawInput: string): string | null {
  if (!rawInput) return null;
  let input = rawInput.trim();

  // Match discord.gg/xxx or discord.com/invite/xxx
  const match = input.match(/(?:discord\.gg\/|discord\.com\/invite\/)([a-zA-Z0-9-]+)/i);
  if (match && match[1]) {
    return match[1].split("?")[0].split("#")[0].trim();
  }

  // If user provided a URL with http/https or slashes that isn't Discord, it's invalid
  if (input.match(/^https?:\/\//i) || input.includes("/")) {
    return null;
  }

  // Raw alphanumeric code without spaces or dots
  const clean = input.split("?")[0].split("#")[0].trim();
  if (!clean.includes(" ") && !clean.includes(".") && clean.length >= 2) {
    return clean;
  }

  return null;
}

async function verifyDiscordCode(code: string) {
  // Check cache first
  const cacheKey = code.toLowerCase();
  const cached = cacheMap.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 120000) {
    return cached.data;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(
      `https://discord.com/api/v10/invites/${encodeURIComponent(code)}?with_counts=true`,
      {
        signal: controller.signal,
        headers: {
          "User-Agent": "Krypt-Storefront-Verifier/2.0",
          Accept: "application/json",
        },
      }
    );
    clearTimeout(timeoutId);

    if (response.status === 404) {
      return {
        valid: false,
        error: "Discord invite not found or expired. Please check your link.",
      };
    }

    if (!response.ok) {
      return {
        valid: false,
        error: `Discord returned status ${response.status}. Please check the invite.`,
      };
    }

    const data = await response.json();
    const guild = data.guild;

    if (!guild) {
      return {
        valid: false,
        error: "This Discord invite does not point to a valid server.",
      };
    }

    const guildBanner =
      guild.id && guild.banner
        ? `https://cdn.discordapp.com/banners/${guild.id}/${guild.banner}.png?size=1024`
        : guild.id && guild.splash
        ? `https://cdn.discordapp.com/splashes/${guild.id}/${guild.splash}.png?size=1024`
        : null;

    const guildIcon =
      guild.id && guild.icon
        ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=256`
        : null;

    const result = {
      valid: true,
      code: data.code || code,
      name: guild.name || "Discord Server",
      guildName: guild.name || "Discord Server",
      description: guild.description || null,
      guildDescription: guild.description || null,
      iconUrl: guildIcon,
      guildIcon: guildIcon,
      bannerUrl: guildBanner,
      guildBanner: guildBanner,
      memberCount:
        typeof data.approximate_member_count === "number" ? data.approximate_member_count : null,
      presenceCount:
        typeof data.approximate_presence_count === "number" ? data.approximate_presence_count : null,
      inviteUrl: `https://discord.gg/${data.code || code}`,
    };

    cacheMap.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      return {
        valid: false,
        error: "Discord API timed out. Please try again.",
      };
    }
    return {
      valid: false,
      error: "Unable to reach Discord servers. Please check your network connection.",
    };
  }
}

export async function POST(req: Request) {
  try {
    const headersList = await headers();
    const ip = getClientIp(headersList);

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { valid: false, error: "Too many requests. Please wait a few seconds before trying again." },
        { status: 429 }
      );
    }

    let rawInvite = "";
    try {
      const body = await req.json();
      rawInvite = (body.inviteUrl || body.url || body.invite || "").trim();
    } catch {
      return NextResponse.json(
        { valid: false, error: "Invalid JSON request body" },
        { status: 400 }
      );
    }

    if (!rawInvite) {
      return NextResponse.json(
        { valid: false, error: "Discord invite link or code is required" },
        { status: 400 }
      );
    }

    const code = extractInviteCode(rawInvite);
    if (!code) {
      return NextResponse.json(
        { valid: false, error: "Invalid Discord invite link or code format (e.g. discord.gg/yourcode)" },
        { status: 400 }
      );
    }

    const result = await verifyDiscordCode(code);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { valid: false, error: err.message || "Failed to verify Discord invite" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const headersList = await headers();
    const ip = getClientIp(headersList);

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { valid: false, error: "Too many requests. Please wait a few seconds before trying again." },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const rawInvite = (searchParams.get("invite") || searchParams.get("url") || "").trim();

    if (!rawInvite) {
      return NextResponse.json(
        { valid: false, error: "Invite link or code is required" },
        { status: 400 }
      );
    }

    const code = extractInviteCode(rawInvite);
    if (!code) {
      return NextResponse.json(
        { valid: false, error: "Invalid Discord invite link or code format" },
        { status: 400 }
      );
    }

    const result = await verifyDiscordCode(code);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { valid: false, error: err.message || "Failed to verify Discord invite" },
      { status: 500 }
    );
  }
}
