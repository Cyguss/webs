import { NextResponse } from "next/server";
import { getPlatformConfig } from "@/lib/platform-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = await getPlatformConfig();
    return NextResponse.json({
      active: config.announcement_banner_active,
      text: config.announcement_banner_text,
      type: config.announcement_banner_type || "info",
      target: config.announcement_banner_target || "all",
      linkUrl: config.announcement_banner_link_url || "",
      linkText: config.announcement_banner_link_text || "",
      dismissible: config.announcement_banner_dismissible !== false,
    });
  } catch (err) {
    return NextResponse.json(
      {
        active: false,
        text: "",
        type: "info",
        target: "all",
        linkUrl: "",
        linkText: "",
        dismissible: true,
      },
      { status: 200 }
    );
  }
}
