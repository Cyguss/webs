import { NextResponse } from "next/server";
import {
  getYouTubeInfo,
  getDiscordInfo,
  getTelegramInfo,
  getTrustpilotInfo,
} from "@/lib/social";

async function handleSocialPreview(platformOrType: string, url: string) {
  const type = (platformOrType || "").toLowerCase().trim();

  if (!url) {
    return { valid: false, error: "Social URL is required" };
  }

  try {
    if (type === "youtube") {
      const data = await getYouTubeInfo(url);
      if (!data) {
        return {
          valid: false,
          error: "Could not find a YouTube channel for this link. Please check the URL or handle.",
        };
      }
      return data;
    } else if (type === "discord") {
      const data = await getDiscordInfo(url);
      if (!data) {
        return {
          valid: false,
          error: "Invalid or expired Discord invite link.",
        };
      }
      return data;
    } else if (type === "telegram") {
      const data = await getTelegramInfo(url);
      if (!data) {
        return {
          valid: false,
          error: "Could not retrieve Telegram channel information.",
        };
      }
      return data;
    } else if (type === "trustpilot") {
      const data = getTrustpilotInfo(url);
      if (!data) {
        return {
          valid: false,
          error: "Please enter a valid Trustpilot profile or business domain.",
        };
      }
      return data;
    }

    return { valid: false, error: `Unsupported social platform: ${type}` };
  } catch (err: any) {
    return { valid: false, error: err.message || "Failed to parse social preview" };
  }
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
