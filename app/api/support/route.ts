import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { platformSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const emailRow = await db.query.platformSettings.findFirst({
      where: eq(platformSettings.settingKey, "support_email"),
    });

    const supportEmail = emailRow?.settingValue?.trim() || "support@vaultly.io";
    const discordInvite = "https://discord.gg/vaultly";

    return NextResponse.json({
      supportEmail,
      discordInvite,
    });
  } catch (err: any) {
    return NextResponse.json({
      supportEmail: "support@vaultly.io",
      discordInvite: "https://discord.gg/vaultly",
    });
  }
}
