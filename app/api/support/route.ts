import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { platformSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const emailRow = await db.query.platformSettings.findFirst({
      where: eq(platformSettings.settingKey, "support_email"),
    });

    const supportEmail = emailRow?.settingValue?.trim() || "support@krypt.market";
    const discordInvite = "https://discord.gg/krypt";

    return NextResponse.json({
      supportEmail,
      discordInvite,
    });
  } catch (err: any) {
    return NextResponse.json({
      supportEmail: "support@krypt.market",
      discordInvite: "https://discord.gg/krypt",
    });
  }
}
