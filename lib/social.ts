/**
 * High-reliability Social Platform Metadata & Verification Engine
 * Handles YouTube, Discord, Telegram, and Trustpilot with fallbacks,
 * oEmbed resolution, cookie consent bypass, and in-memory caching.
 */

interface YouTubeChannelData {
  valid: boolean;
  name: string;
  handle: string;
  subscribers: string;
  avatar: string | null;
  bannerUrl: string | null;
  description: string | null;
  url: string;
}

interface DiscordGuildData {
  valid: boolean;
  name: string;
  description: string | null;
  bannerUrl: string | null;
  iconUrl: string | null;
  memberCount: number | null;
  presenceCount: number | null;
  inviteUrl: string;
}

interface TelegramChannelData {
  valid: boolean;
  name: string;
  username: string;
  members: string;
  avatar: string | null;
  description: string | null;
  url: string;
}

interface TrustpilotData {
  valid: boolean;
  domain: string;
  url: string;
  label: string;
}

// In-memory TTL cache to prevent repeated third-party requests
const socialCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCached<T>(key: string): T | null {
  const item = socialCache.get(key);
  if (item && Date.now() - item.timestamp < CACHE_TTL_MS) {
    return item.data as T;
  }
  return null;
}

function setCache(key: string, data: any): void {
  socialCache.set(key, { data, timestamp: Date.now() });
}

/**
 * YouTube Channel Metadata Extractor
 * Supports @handles, channel/UC..., c/..., user/..., and video URLs (via oEmbed author resolution)
 */
export async function getYouTubeInfo(rawUrl?: string | null): Promise<YouTubeChannelData | null> {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  const cacheKey = `yt:${trimmed.toLowerCase()}`;
  const cached = getCached<YouTubeChannelData>(cacheKey);
  if (cached) return cached;

  let canonicalChannelUrl = "";
  let fallbackTitle = "";

  try {
    if (trimmed.startsWith("@")) {
      canonicalChannelUrl = `https://www.youtube.com/${trimmed}`;
    } else if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      if (trimmed.startsWith("channel/") || trimmed.startsWith("c/") || trimmed.startsWith("user/")) {
        canonicalChannelUrl = `https://www.youtube.com/${trimmed}`;
      } else if (trimmed.includes("youtube.com/") || trimmed.includes("youtu.be/")) {
        canonicalChannelUrl = `https://${trimmed.replace(/^https?:\/\//i, "").replace(/^\/+/, "")}`;
      } else {
        canonicalChannelUrl = `https://www.youtube.com/@${trimmed}`;
      }
    } else {
      const parsed = new URL(trimmed);
      const isYouTuBe = parsed.hostname.includes("youtu.be");
      const isWatch = parsed.pathname === "/watch" && parsed.searchParams.get("v");

      if (isYouTuBe || isWatch) {
        // Video link -> resolve author channel via official oEmbed
        const videoId = isYouTuBe ? parsed.pathname.slice(1) : parsed.searchParams.get("v");
        const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
        const oembRes = await fetch(oembedUrl);
        if (oembRes.ok) {
          const oembData = await oembRes.json();
          if (oembData.author_url) canonicalChannelUrl = oembData.author_url;
          if (oembData.author_name) fallbackTitle = oembData.author_name;
        }
      }

      if (!canonicalChannelUrl) {
        const channelMatch = parsed.pathname.match(
          /^\/(channel\/[a-zA-Z0-9_-]+|@[a-zA-Z0-9_.-]+|c\/[a-zA-Z0-9_.-]+|user\/[a-zA-Z0-9_.-]+)/i
        );
        if (channelMatch) {
          canonicalChannelUrl = `https://www.youtube.com/${channelMatch[1]}`;
        } else {
          canonicalChannelUrl = trimmed;
        }
      }
    }
  } catch {
    canonicalChannelUrl = trimmed.startsWith("http") ? trimmed : `https://www.youtube.com/@${trimmed}`;
  }

  if (!canonicalChannelUrl) return null;

  // Extract display handle
  let handle = "";
  const handleMatch = canonicalChannelUrl.match(/@([a-zA-Z0-9_.-]+)/);
  if (handleMatch) {
    handle = `@${handleMatch[1]}`;
  } else {
    const parts = canonicalChannelUrl.split("/").filter(Boolean);
    handle = parts[parts.length - 1] || "Channel";
  }

  let title = fallbackTitle || handle;
  let subscribers: string | null = null;
  let avatar: string | null = null;
  let bannerUrl: string | null = null;
  let description: string | null = null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(canonicalChannelUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        Cookie: "CONSENT=PENDING+987; SOCS=CAESEwgDEgk2NTE3MjQyMTEaAmVuIAEaBgiA_LyaBg;",
      },
      next: { revalidate: 3600 },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const html = await res.text();

      // Check for 404
      if (html.includes("This page isn't available") && !html.includes("subscribers")) {
        return null;
      }

      // Title
      const titleMatch =
        html.match(/<meta property="og:title" content="([^"]+)"/i) ||
        html.match(/<title>([^<]+) - YouTube<\/title>/i);
      if (titleMatch && titleMatch[1] && titleMatch[1] !== "YouTube") {
        title = titleMatch[1];
      }

      // Subscribers: Specifically target the channel's main header to prevent matching
      // recommended, featured, or related channels in the carousel/shelves.
      const headerSectionMatch = html.match(
        /"header":\s*\{([\s\S]*?)\}(?:,\s*"rawHeader"|,\s*"contents"|,\s*"trackingParams"|,\s*"headerViewModel")/i
      );
      const headerHtml = headerSectionMatch ? headerSectionMatch[1] : "";

      if (headerHtml) {
        const headerSub =
          headerHtml.match(/"text":\s*\{\s*"content":\s*"([0-9.,]+[KMkmB]?\s+subscribers?)"/i) ||
          headerHtml.match(/"accessibilityLabel":\s*"([^"]+subscribers?[^"]*)"/i) ||
          headerHtml.match(/"subscriberCountText":\s*\{[^}]*?"simpleText":\s*"([^"]+)"/i) ||
          headerHtml.match(/"subscriberCountText":\s*\{[^}]*?"label":\s*"([^"]+)"/i) ||
          headerHtml.match(/"([0-9.,]+[KMkmB]?\s+subscribers?)"/i);
        if (headerSub) {
          subscribers = headerSub[1];
        }
      }

      // Modern YouTube pageHeaderViewModel direct content (2024-2026 update)
      if (!subscribers) {
        const metaPartsMatch = html.match(
          /"contentMetadataViewModel":\s*\{[\s\S]*?"metadataParts":\s*\[[\s\S]*?"content":\s*"([0-9.,]+[KMkmB]?\s+subscribers?)"/i
        );
        if (metaPartsMatch) {
          subscribers = metaPartsMatch[1];
        }
      }

      // Modern YouTube accessibilityLabel in metadataParts
      if (!subscribers) {
        const metaAccessMatch = html.match(
          /"contentMetadataViewModel":\s*\{[\s\S]*?"metadataParts":\s*\[[\s\S]*?"accessibilityLabel":\s*"([^"]+subscribers?[^"]*)"/i
        );
        if (metaAccessMatch) {
          subscribers = metaAccessMatch[1];
        }
      }

      // Classic YouTube c4TabbedHeaderRenderer
      if (!subscribers) {
        const c4Match =
          html.match(/"c4TabbedHeaderRenderer":\s*\{[\s\S]*?"subscriberCountText":\s*\{[^}]*?"simpleText":\s*"([^"]+)"/i) ||
          html.match(/"c4TabbedHeaderRenderer":\s*\{[\s\S]*?"label":\s*"([^"]+subscribers?[^"]*)"/i);
        if (c4Match) {
          subscribers = c4Match[1];
        }
      }

      // Fallback: subscriberCountText with accessibility label
      if (!subscribers) {
        const subCountAcc = html.match(
          /"subscriberCountText":\s*\{[\s\S]*?"accessibilityData":\s*\{"label":"([^"]+subscribers?)"/i
        );
        if (subCountAcc) {
          subscribers = subCountAcc[1];
        }
      }

      // Avatar
      const imgMatch =
        html.match(/<meta property="og:image" content="([^"]+)"/i) ||
        html.match(/"avatar":\{"thumbnails":\[\{"url":"([^"]+)"/i);
      if (imgMatch) {
        avatar = imgMatch[1];
      }

      // Banner
      const bannerMatch =
        html.match(/"imageBannerViewModel":\{"image":\{"sources":\[\{"url":"([^"]+)"/i) ||
        html.match(/"tvBanner":\{"thumbnails":\[\{"url":"([^"]+)"/i) ||
        html.match(/"banner":\{"thumbnails":\[\{"url":"([^"]+)"/i);
      if (bannerMatch) {
        bannerUrl = bannerMatch[1];
      }

      // Description
      const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/i);
      if (descMatch && descMatch[1] && !descMatch[1].includes("Enjoy the videos and music")) {
        description = descMatch[1];
      }
    }
  } catch (err) {
    // Direct scrape failed or timed out — fallback to oEmbed
  }

  // oEmbed fallback if avatar or title still missing
  if (!avatar || title === handle) {
    try {
      const oembedRes = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(canonicalChannelUrl)}&format=json`
      );
      if (oembedRes.ok) {
        const odata = await oembedRes.json();
        if (odata.author_name && title === handle) title = odata.author_name;
        if (odata.thumbnail_url && !avatar) avatar = odata.thumbnail_url;
      }
    } catch {}
  }

  const result: YouTubeChannelData = {
    valid: true,
    name: title,
    handle,
    subscribers: subscribers || "Active Channel",
    avatar,
    bannerUrl,
    description,
    url: canonicalChannelUrl,
  };

  setCache(cacheKey, result);
  return result;
}

/**
 * Classifies any Discord input string into Server Invite vs User Profile/Handle
 */
export function parseDiscordInput(input?: string | null): {
  type: "server" | "user";
  isUrl: boolean;
  href: string | null;
  handle: string;
  label: string;
  buttonText: string;
} {
  if (!input) {
    return {
      type: "server",
      isUrl: false,
      href: null,
      handle: "",
      label: "Discord",
      buttonText: "Join",
    };
  }

  const trimmed = input.trim();

  // Check if it's an invite link (discord.gg / discord.com/invite / discordapp.com/invite)
  const isInvite = /(?:discord\.gg\/|discord\.com\/invite\/|discordapp\.com\/invite\/)/i.test(trimmed);

  // Check if it's an explicit Discord user profile link (discord.com/users/123456789)
  const isUserUrl = /(?:discord\.com\/users\/|discordapp\.com\/users\/)/i.test(trimmed);

  // Check if it's a raw numeric user snowflake ID (17-20 digits)
  const isUserId = /^\d{17,20}$/.test(trimmed);

  // Check if it's a handle (starts with @ or no slashes/dots)
  const isHandle = trimmed.startsWith("@") || (!trimmed.includes("/") && !trimmed.includes("."));

  if (isInvite) {
    const inviteCodeMatch = trimmed.match(/(?:discord\.gg\/|discord\.com\/invite\/|discordapp\.com\/invite\/)([a-zA-Z0-9_-]+)/i);
    const code = inviteCodeMatch ? inviteCodeMatch[1] : trimmed.replace(/^https?:\/\//i, "");
    const href = `https://discord.gg/${code}`;
    return {
      type: "server",
      isUrl: true,
      href,
      handle: `discord.gg/${code}`,
      label: "Discord Server",
      buttonText: "Join",
    };
  }

  if (isUserUrl) {
    const userIdMatch = trimmed.match(/\/users\/(\d+)/i);
    const userId = userIdMatch ? userIdMatch[1] : trimmed;
    const href = `https://discord.com/users/${userId}`;
    return {
      type: "user",
      isUrl: true,
      href,
      handle: `@${userId}`,
      label: "Discord User",
      buttonText: "Open Profile",
    };
  }

  if (isUserId) {
    return {
      type: "user",
      isUrl: true,
      href: `https://discord.com/users/${trimmed}`,
      handle: `@${trimmed}`,
      label: "Discord User",
      buttonText: "Open Profile",
    };
  }

  if (isHandle) {
    const cleanHandle = trimmed.replace(/^@/, "");
    return {
      type: "user",
      isUrl: false,
      href: null,
      handle: `@${cleanHandle}`,
      label: "Discord User",
      buttonText: `@${cleanHandle}`,
    };
  }

  // Fallback: URL starting with http/https -> only allow genuine discord domains over HTTPS
  if (/^https:\/\/(?:[a-zA-Z0-9-]+\.)*discord(?:app)?\.(?:com|gg)\//i.test(trimmed)) {
    return {
      type: "server",
      isUrl: true,
      href: trimmed,
      handle: trimmed.replace(/^https?:\/\//i, ""),
      label: "Discord Server",
      buttonText: "Join",
    };
  }

  return {
    type: "user",
    isUrl: false,
    href: null,
    handle: trimmed.startsWith("@") ? trimmed : `@${trimmed}`,
    label: "Discord User",
    buttonText: trimmed.startsWith("@") ? trimmed : `@${trimmed}`,
  };
}

/**
 * Discord Invite & Guild Metadata Extractor
 * Uses the official Discord API v10 invite endpoint with member counts
 */
export async function getDiscordInfo(rawUrl?: string | null): Promise<DiscordGuildData | null> {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  // If it's a user handle or user URL, don't attempt guild invite lookup
  const parsedDiscord = parseDiscordInput(trimmed);
  if (parsedDiscord.type === "user") {
    return null;
  }

  const cacheKey = `dc:${trimmed.toLowerCase()}`;
  const cached = getCached<DiscordGuildData>(cacheKey);
  if (cached) return cached;

  const match = trimmed.match(/(?:discord\.gg\/|discord\.com\/invite\/)([a-zA-Z0-9_-]+)/i);
  const code = match ? match[1] : trimmed.replace(/^https?:\/\//i, "").replace(/[^a-zA-Z0-9_-]/g, "");

  if (!code) return null;

  try {
    const res = await fetch(`https://discord.com/api/v10/invites/${code}?with_counts=true&with_expiration=true`, {
      next: { revalidate: 300 },
      headers: { "User-Agent": "Krypt-Bot (https://krypt.market, 1.0)" },
    });

    if (!res.ok) return null;

    const data = await res.json();
    const guild = data.guild;
    const bannerUrl =
      guild?.id && guild?.banner
        ? `https://cdn.discordapp.com/banners/${guild.id}/${guild.banner}.png?size=1024`
        : guild?.id && guild?.splash
        ? `https://cdn.discordapp.com/splashes/${guild.id}/${guild.splash}.png?size=1024`
        : null;

    const result: DiscordGuildData = {
      valid: true,
      name: guild?.name || "Official Discord Server",
      description: guild?.description || null,
      bannerUrl,
      iconUrl:
        guild?.id && guild?.icon
          ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=256`
          : null,
      memberCount: typeof data.approximate_member_count === "number" ? data.approximate_member_count : null,
      presenceCount: typeof data.approximate_presence_count === "number" ? data.approximate_presence_count : null,
      inviteUrl: `https://discord.gg/${data.code || code}`,
    };

    setCache(cacheKey, result);
    return result;
  } catch {
    return null;
  }
}

/**
 * Telegram Channel & Community Metadata Extractor
 * Uses t.me web preview to extract channel title, verified avatar, and subscriber count
 */
export async function getTelegramInfo(rawUrl?: string | null): Promise<TelegramChannelData | null> {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  const cacheKey = `tg:${trimmed.toLowerCase()}`;
  const cached = getCached<TelegramChannelData>(cacheKey);
  if (cached) return cached;

  const match = trimmed.match(/(?:t\.me\/|telegram\.me\/)([a-zA-Z0-9_]+)/i);
  let username = match ? match[1] : trimmed.replace(/^@/, "").replace(/[^a-zA-Z0-9_]/g, "");

  if (!username) return null;

  const tgUrl = `https://t.me/${username}`;

  try {
    const res = await fetch(tgUrl, {
      next: { revalidate: 600 },
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!res.ok) {
      return {
        valid: true,
        name: `@${username}`,
        username,
        members: "Community Channel",
        avatar: null,
        description: null,
        url: tgUrl,
      };
    }

    const html = await res.text();
    const titleMatch =
      html.match(/<meta property="og:title" content="([^"]+)"/i) ||
      html.match(/class="tgme_page_title"[^>]*><span[^>]*>([^<]+)<\/span>/i);
    const imageMatch =
      html.match(/<meta property="og:image" content="([^"]+)"/i) ||
      html.match(/class="tgme_page_photo_image" src="([^"]+)"/i);
    const membersMatch = html.match(/class="tgme_page_extra">([^<]+)<\/div>/i);
    const descMatch =
      html.match(/<meta property="og:description" content="([^"]+)"/i) ||
      html.match(/class="tgme_page_description"[^>]*>([\s\S]*?)<\/div>/i);

    const result: TelegramChannelData = {
      valid: true,
      name: titleMatch ? titleMatch[1] : `@${username}`,
      username,
      members: membersMatch ? membersMatch[1].trim() : "Community Channel",
      avatar: imageMatch ? imageMatch[1] : null,
      description: descMatch ? descMatch[1].replace(/<[^>]+>/g, "").trim() : null,
      url: tgUrl,
    };

    setCache(cacheKey, result);
    return result;
  } catch {
    return {
      valid: true,
      name: `@${username}`,
      username,
      members: "Community Channel",
      avatar: null,
      description: null,
      url: tgUrl,
    };
  }
}

/**
 * Trustpilot Domain & Review Profile Extractor
 * Cleans and formats the verified Trustpilot review destination
 */
export function getTrustpilotInfo(rawUrl?: string | null): TrustpilotData | null {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/(?:trustpilot\.com\/review\/)([a-zA-Z0-9.-]+)/i);
  let domain = match ? match[1] : null;

  if (!domain) {
    const clean = trimmed.replace(/^https?:\/\//i, "").replace(/\/.*$/, "").trim();
    if (clean.includes(".")) domain = clean;
  }

  if (!domain) return null;

  const cleanDomain = domain.toLowerCase().replace(/^www\./, "");
  return {
    valid: true,
    domain: cleanDomain,
    url: `https://www.trustpilot.com/review/${cleanDomain}`,
    label: "Customer Reviews",
  };
}
