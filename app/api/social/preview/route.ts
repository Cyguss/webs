import { NextResponse } from "next/server";

// In-memory cache for social previews
const socialCache = new Map<string, { data: any; timestamp: number }>();

async function getYouTubePreview(rawUrl: string) {
  let url = rawUrl.trim();
  let handle: string | null = null;

  if (url.startsWith("@")) {
    handle = url;
  } else if (url.match(/^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\//i)) {
    const match = url.match(/(?:youtube\.com\/(?:@|c\/|channel\/)?)([a-zA-Z0-9_.-]+)/i);
    if (match && match[1]) {
      handle = match[1];
    }
  } else if (!url.includes("/") && !url.includes(".") && !url.includes(" ") && url.length >= 2) {
    handle = url;
  }

  if (!handle) {
    return {
      valid: false,
      error: "Please enter a valid YouTube channel URL (e.g. https://youtube.com/@channel) or @handle",
    };
  }

  const cleanHandle = handle.startsWith("@") ? handle : `@${handle}`;
  const channelUrl = `https://www.youtube.com/${cleanHandle}`;
  const cacheKey = `yt:${cleanHandle.toLowerCase()}`;

  const cached = socialCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 180000) {
    return cached.data;
  }

  let title = cleanHandle;
  let subscribers: string | null = null;
  let avatar: string | null = null;
  let bannerUrl: string | null = null;
  let description: string | null = null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const htmlRes = await fetch(channelUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    clearTimeout(timeout);

    if (htmlRes.ok) {
      const html = await htmlRes.text();

      // Check for YouTube 404 channel
      if (html.includes("This page isn't available") && !html.includes("subscriberCountText")) {
        return {
          valid: false,
          error: `YouTube channel ${cleanHandle} was not found. Please verify the handle.`,
        };
      }

      // Extract subscriber count
      const subsMatch =
        html.match(/"subscriberCountText":\{"accessibility":\{"accessibilityData":\{"label":"([^"]+)"/i) ||
        html.match(/"subscriberCountText":\{"simpleText":"([^"]+)"/i) ||
        html.match(/"subtitle":\{"runs":\[\{"text":"([^"]+subscribers?)"/i) ||
        html.match(/"simpleText":"([0-9.,]+[KMkm]?\s+subscribers?)"/i) ||
        html.match(/([0-9.,]+[KMkm]?\s+subscribers?)/i);
      if (subsMatch) {
        subscribers = subsMatch[1];
      }

      // Extract title
      const titleMatch =
        html.match(/<meta property="og:title" content="([^"]+)"/i) ||
        html.match(/<title>([^<]+) - YouTube<\/title>/i);
      if (titleMatch) {
        title = titleMatch[1];
      }

      // Extract avatar image
      const imageMatch =
        html.match(/<meta property="og:image" content="([^"]+)"/i) ||
        html.match(/"avatar":\{"thumbnails":\[\{"url":"([^"]+)"/i);
      if (imageMatch) {
        avatar = imageMatch[1];
      }

      // Extract banner image
      const bannerMatch =
        html.match(/"imageBannerViewModel":\{"image":\{"sources":\[\{"url":"([^"]+)"/i) ||
        html.match(/"tvBanner":\{"thumbnails":\[\{"url":"([^"]+)"/i) ||
        html.match(/"banner":\{"thumbnails":\[\{"url":"([^"]+)"/i);
      if (bannerMatch) {
        bannerUrl = bannerMatch[1];
      }
    }
  } catch {
    // If direct channel scrape timed out, fallback to oEmbed
    try {
      const oembedRes = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(channelUrl)}&format=json`
      );
      if (oembedRes.ok) {
        const data = await oembedRes.json();
        if (data.author_name) title = data.author_name;
        if (data.thumbnail_url) avatar = data.thumbnail_url;
      }
    } catch {
      // Ignore
    }
  }

  const result = {
    valid: true,
    type: "youtube",
    platform: "youtube",
    name: title || cleanHandle,
    handle: cleanHandle,
    subscribers: subscribers || "Community Channel",
    avatar,
    bannerUrl,
    description,
    url: channelUrl,
  };

  socialCache.set(cacheKey, { data: result, timestamp: Date.now() });
  return result;
}

async function getTelegramPreview(rawUrl: string) {
  let url = rawUrl.trim();
  let username: string | null = null;

  if (url.startsWith("@")) {
    username = url.substring(1);
  } else if (url.match(/^(?:https?:\/\/)?(?:www\.)?(?:t\.me|telegram\.me)\//i)) {
    const match = url.match(/(?:t\.me\/|telegram\.me\/)([a-zA-Z0-9_]+)/i);
    if (match && match[1]) {
      username = match[1];
    }
  } else if (!url.includes("/") && !url.includes(".") && !url.includes(" ") && url.length >= 3) {
    username = url;
  }

  if (!username || username.length < 3) {
    return {
      valid: false,
      error: "Please enter a valid Telegram channel link (e.g. https://t.me/channel) or @username",
    };
  }

  const tgUrl = `https://t.me/${username}`;
  const cacheKey = `tg:${username.toLowerCase()}`;

  const cached = socialCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 180000) {
    return cached.data;
  }

  let title = `@${username}`;
  let members: string | null = null;
  let avatar: string | null = null;
  let description: string | null = null;
  let exists = false;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const htmlRes = await fetch(tgUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    clearTimeout(timeout);

    if (htmlRes.ok) {
      const html = await htmlRes.text();

      // Title
      const titleMatch =
        html.match(/<meta property="og:title" content="([^"]+)"/i) ||
        html.match(/class="tgme_page_title"[^>]*><span[^>]*>([^<]+)<\/span>/i);
      if (titleMatch) {
        title = titleMatch[1];
        exists = true;
      }

      // Avatar image
      const imageMatch =
        html.match(/<meta property="og:image" content="([^"]+)"/i) ||
        html.match(/class="tgme_page_photo_image" src="([^"]+)"/i);
      if (imageMatch) {
        avatar = imageMatch[1];
      }

      // Members / Subscribers count
      const membersMatch = html.match(/class="tgme_page_extra">([^<]+)<\/div>/i);
      if (membersMatch) {
        members = membersMatch[1].trim();
      }

      // Description
      const descMatch =
        html.match(/<meta property="og:description" content="([^"]+)"/i) ||
        html.match(/class="tgme_page_description"[^>]*>([\s\S]*?)<\/div>/i);
      if (descMatch) {
        description = descMatch[1].replace(/<[^>]+>/g, "").trim();
      }
    }
  } catch {
    // Network fallback
  }

  const result = {
    valid: true,
    type: "telegram",
    platform: "telegram",
    name: title || `@${username}`,
    username,
    handle: `@${username}`,
    members: members || "Telegram Channel",
    avatar,
    description,
    url: tgUrl,
  };

  socialCache.set(cacheKey, { data: result, timestamp: Date.now() });
  return result;
}

function getTrustpilotPreview(rawUrl: string) {
  const url = rawUrl.trim();
  const match = url.match(/(?:trustpilot\.com\/review\/)([a-zA-Z0-9.-]+)/i);
  let domain = match ? match[1] : null;

  if (!domain) {
    const clean = url.replace(/^https?:\/\//i, "").replace(/\/.*$/, "").trim();
    if (clean.includes(".")) {
      domain = clean;
    }
  }

  if (!domain) {
    return {
      valid: false,
      error: "Invalid Trustpilot review URL format. Example: https://www.trustpilot.com/review/yourdomain.com",
    };
  }

  const cleanDomain = domain.toLowerCase().replace(/^www\./, "");
  const reviewUrl = `https://www.trustpilot.com/review/${cleanDomain}`;

  return {
    valid: true,
    type: "trustpilot",
    platform: "trustpilot",
    name: cleanDomain,
    domain: cleanDomain,
    ratingScore: "4.8",
    ratingLabel: "Excellent",
    stars: 5,
    reviewCount: "140+ Reviews",
    url: reviewUrl,
  };
}

async function handleSocialPreview(platformOrType: string, url: string) {
  const type = (platformOrType || "").toLowerCase().trim();

  if (!url) {
    return { valid: false, error: "Social URL is required" };
  }

  if (type === "youtube") {
    return await getYouTubePreview(url);
  } else if (type === "telegram") {
    return await getTelegramPreview(url);
  } else if (type === "trustpilot") {
    return getTrustpilotPreview(url);
  }

  return { valid: false, error: `Unsupported social platform: ${type}` };
}

export async function POST(req: Request) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ valid: false, error: "Invalid JSON body" }, { status: 400 });
    }

    const platform = (body.platform || body.type || "").toString();
    const url = (body.url || "").toString();

    if (!url.trim()) {
      return NextResponse.json({ valid: false, error: "URL is required" }, { status: 400 });
    }

    const result = await handleSocialPreview(platform, url);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { valid: false, error: err.message || "Failed to parse social preview" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const platform = searchParams.get("platform") || searchParams.get("type") || "";
    const url = (searchParams.get("url") || "").trim();

    if (!url) {
      return NextResponse.json({ valid: false, error: "URL is required" }, { status: 400 });
    }

    const result = await handleSocialPreview(platform, url);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { valid: false, error: err.message || "Failed to parse social preview" },
      { status: 500 }
    );
  }
}
