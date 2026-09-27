import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { platformSettings, user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyAdminSessionTicket } from "@/lib/admin-gate";
import { auth } from "@/lib/auth";

function getClientIp(h: Headers): string {
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") || "127.0.0.1";
}

import { DEFAULT_BOT_CONFIG, BOT_CONFIG_KEYS } from "@/config/bot";
import { env } from "@/config";

async function checkSuperAdmin(headersList: Headers): Promise<boolean> {
  const ticket = headersList.get("x-admin-ticket");
  const ip = getClientIp(headersList);
  if (verifyAdminSessionTicket(ticket, ip)) return true;

  const session = await auth.api.getSession({ headers: headersList });
  if (session?.user?.id) {
    const dbUser = await db.query.user.findFirst({ where: eq(user.id, session.user.id) });
    if (dbUser?.role === "superadmin") return true;
  }

  return false;
}

async function upsertSetting(key: string, value: string) {
  const existing = await db.query.platformSettings.findFirst({
    where: eq(platformSettings.settingKey, key),
  });
  if (existing) {
    await db
      .update(platformSettings)
      .set({ settingValue: value, updatedAt: new Date() })
      .where(eq(platformSettings.settingKey, key));
  } else {
    await db.insert(platformSettings).values({ settingKey: key, settingValue: value });
  }
}

export async function GET() {
  try {
    const headersList = await headers();
    const isSuperAdmin = await checkSuperAdmin(headersList);

    if (!isSuperAdmin) {
      return NextResponse.json({ error: "Super-Admin access required" }, { status: 403 });
    }

    const rows = await db.query.platformSettings.findMany();
    const existingMap = new Map<string, string>();
    for (const row of rows) {
      existingMap.set(row.settingKey, row.settingValue);
    }

    // Auto-seed missing default configurations from environment variables if set
    const config: Record<string, string> = {};
    for (const [key, defaultValue] of Object.entries(DEFAULT_BOT_CONFIG)) {
      if (!existingMap.has(key)) {
        let envVal = defaultValue;
        if (key === "bot_guild_id") envVal = env.DISCORD_GUILD_ID || defaultValue;
        if (key === "bot_token") envVal = env.DISCORD_BOT_TOKEN || defaultValue;
        if (key === "bot_admin_role_id") envVal = env.DISCORD_ADMIN_ROLE_ID || defaultValue;
        if (key === "bot_client_id") envVal = env.DISCORD_CLIENT_ID || defaultValue;
        if (key === "webhook_approval_log") envVal = env.DISCORD_APPROVAL_WEBHOOK_URL || defaultValue;

        if (envVal) {
          await upsertSetting(key, envVal);
          config[key] = envVal;
        } else {
          config[key] = "";
        }
      } else {
        config[key] = existingMap.get(key) || "";
      }
    }

    return NextResponse.json({ success: true, config });
  } catch (err: any) {
    console.error("[Bot Config GET] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const headersList = await headers();
    const isSuperAdmin = await checkSuperAdmin(headersList);

    if (!isSuperAdmin) {
      return NextResponse.json({ error: "Super-Admin access required" }, { status: 403 });
    }

    const body = await req.json();

    // Validate and save each config key
    for (const key of BOT_CONFIG_KEYS) {
      if (body[key] !== undefined) {
        const value = String(body[key]).trim();
        // Validate webhook URLs
        if (key.startsWith("webhook_") && value && !value.startsWith("https://discord.com/api/webhooks/")) {
          return NextResponse.json(
            { error: `${key}: must be a valid Discord webhook URL starting with https://discord.com/api/webhooks/` },
            { status: 400 }
          );
        }
        // Validate IDs (numeric)
        if (
          (key === "bot_guild_id" || key === "bot_admin_role_id" || key === "bot_staff_role_id" || key === "bot_client_id") &&
          value &&
          !/^\d+$/.test(value)
        ) {
          return NextResponse.json(
            { error: `${key}: must be a numeric Discord Snowflake ID` },
            { status: 400 }
          );
        }
        await upsertSetting(key, value);
      }
    }

    return NextResponse.json({ success: true, message: "Bot & Discord configuration saved successfully into database." });
  } catch (err: any) {
    console.error("[Bot Config POST] Error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
