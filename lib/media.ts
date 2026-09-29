/**
 * Universal Media & Link Normalizer Engine for Krypt Market
 * Handles YouTube, Streamable, Discord, Telegram, Images, and Contact Links.
 */

export interface VideoEmbedInfo {
  type: "youtube" | "streamable" | "direct" | null;
  embedUrl: string | null;
  videoId: string | null;
  thumbnailUrl?: string | null;
  originalUrl: string;
}

/**
 * Normalizes YouTube video URLs (watch, shorts, youtu.be, embed, live) to privacy-enhanced embed URLs.
 */
export function getYouTubeVideoId(url?: string | null): string | null {
  if (!url || typeof url !== "string") return null;
  const clean = url.trim();

  // 1. youtu.be/VIDEO_ID
  const shortMatch = clean.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|live\/))([\w-]{11})/i);
  if (shortMatch && shortMatch[1]) return shortMatch[1];

  // 2. youtube.com/watch?v=VIDEO_ID or ?.*v=VIDEO_ID
  const watchMatch = clean.match(/[?&]v=([\w-]{11})/i);
  if (watchMatch && watchMatch[1]) return watchMatch[1];

  // 3. Raw 11-char ID
  if (/^[\w-]{11}$/.test(clean)) return clean;

  return null;
}

export function getYouTubeEmbedUrl(url?: string | null): string | null {
  const id = getYouTubeVideoId(url);
  if (!id) return null;
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`;
}

export function getYouTubeThumbnailUrl(url?: string | null): string | null {
  const id = getYouTubeVideoId(url);
  if (!id) return null;
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

/**
 * Normalizes Streamable URLs (streamable.com/CODE -> streamable.com/e/CODE)
 */
export function getStreamableCode(url?: string | null): string | null {
  if (!url || typeof url !== "string") return null;
  const clean = url.trim();
  const match = clean.match(/streamable\.com\/(?:e\/)?([a-zA-Z0-9]+)/i);
  return match && match[1] ? match[1] : null;
}

export function getStreamableEmbedUrl(url?: string | null): string | null {
  const code = getStreamableCode(url);
  if (!code) return null;
  return `https://streamable.com/e/${code}`;
}

/**
 * Universal video embed resolver (YouTube or Streamable or Direct Video URL)
 */
export function parseVideoShowcase(url?: string | null): VideoEmbedInfo {
  if (!url || typeof url !== "string" || !url.trim()) {
    return { type: null, embedUrl: null, videoId: null, thumbnailUrl: null, originalUrl: "" };
  }

  const clean = url.trim();

  // Check YouTube
  const ytId = getYouTubeVideoId(clean);
  if (ytId) {
    return {
      type: "youtube",
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytId}?rel=0&modestbranding=1`,
      videoId: ytId,
      thumbnailUrl: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
      originalUrl: clean,
    };
  }

  // Check Streamable
  const streamableCode = getStreamableCode(clean);
  if (streamableCode) {
    return {
      type: "streamable",
      embedUrl: `https://streamable.com/e/${streamableCode}`,
      videoId: streamableCode,
      thumbnailUrl: null,
      originalUrl: clean,
    };
  }

  // Check direct MP4/WebM
  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(clean)) {
    return {
      type: "direct",
      embedUrl: clean.startsWith("http") ? clean : `https://${clean}`,
      videoId: null,
      thumbnailUrl: null,
      originalUrl: clean,
    };
  }

  return {
    type: null,
    embedUrl: null,
    videoId: null,
    thumbnailUrl: null,
    originalUrl: clean,
  };
}

/**
 * Resolves a list of up to 5 video showcases (from string, JSON array, or string array)
 */
export function parseVideoShowcaseList(
  urlOrJson?: string | string[] | null,
  maxItems = 5
): VideoEmbedInfo[] {
  if (!urlOrJson) return [];

  let rawList: string[] = [];
  if (Array.isArray(urlOrJson)) {
    rawList = urlOrJson;
  } else if (typeof urlOrJson === "string") {
    const trimmed = urlOrJson.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          rawList = parsed;
        } else {
          rawList = [trimmed];
        }
      } catch {
        rawList = [trimmed];
      }
    } else {
      rawList = [trimmed];
    }
  }

  const results: VideoEmbedInfo[] = [];
  for (const item of rawList) {
    if (typeof item === "string" && item.trim()) {
      const parsed = parseVideoShowcase(item.trim());
      if (parsed.embedUrl) {
        results.push(parsed);
        if (results.length >= maxItems) break;
      }
    }
  }

  return results;
}

/**
 * Normalizes Discord invite URLs and tags
 */
export function normalizeDiscordUrl(urlOrTag?: string | null): string | null {
  if (!urlOrTag || typeof urlOrTag !== "string") return null;
  let clean = urlOrTag.trim();
  if (!clean) return null;

  // Convert discord.com/invite/code to https://discord.gg/code
  const discordComMatch = clean.match(/^(?:https?:\/\/)?(?:www\.)?discord(?:app)?\.com\/invite\/([a-zA-Z0-9_-]+)/i);
  if (discordComMatch && discordComMatch[1]) {
    return `https://discord.gg/${discordComMatch[1]}`;
  }

  // Convert discord.gg/code to https://discord.gg/code
  const discordGgMatch = clean.match(/^(?:https?:\/\/)?(?:www\.)?discord\.gg\/([a-zA-Z0-9_-]+)/i);
  if (discordGgMatch && discordGgMatch[1]) {
    return `https://discord.gg/${discordGgMatch[1]}`;
  }

  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    return clean;
  }

  if (/^[a-zA-Z0-9_-]+$/.test(clean) && !clean.includes("#")) {
    // Pure code like "kryptmarket"
    return `https://discord.gg/${clean}`;
  }

  return clean; // Might be a username handle (e.g. user#1234 or @user)
}

/**
 * Normalizes Telegram URLs and handles
 */
export function normalizeTelegramUrl(urlOrHandle?: string | null): string | null {
  if (!urlOrHandle || typeof urlOrHandle !== "string") return null;
  const clean = urlOrHandle.trim();
  if (!clean) return null;

  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    return clean;
  }
  if (clean.startsWith("t.me/")) {
    return `https://${clean}`;
  }
  if (clean.startsWith("@")) {
    return `https://t.me/${clean.substring(1)}`;
  }
  if (/^[a-zA-Z0-9_]{4,}$/.test(clean)) {
    return `https://t.me/${clean}`;
  }
  return clean;
}

/**
 * Normalizes image URLs (Imgur fix, protocol fix, trim)
 */
export function normalizeImageUrl(url?: string | null): string | null {
  if (!url || typeof url !== "string") return null;
  let clean = url.trim();
  if (!clean) return null;

  // Imgur page -> direct image link
  if (/^https?:\/\/imgur\.com\/([a-zA-Z0-9]+)$/i.test(clean)) {
    const match = clean.match(/^https?:\/\/imgur\.com\/([a-zA-Z0-9]+)$/i);
    if (match && match[1]) {
      return `https://i.imgur.com/${match[1]}.png`;
    }
  }

  if (!clean.startsWith("http://") && !clean.startsWith("https://") && !clean.startsWith("/")) {
    clean = `https://${clean}`;
  }

  return clean;
}
