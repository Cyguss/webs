import { env, features } from "@/config";
import { db } from "@/lib/db";
import { user, account } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export interface DiscordGuildMember {
  user: {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
  };
  roles: string[];
  joined_at: string;
  nick?: string | null;
}

export async function getDiscordCredentials() {
  let guildId = env.DISCORD_GUILD_ID || "";
  let botToken = env.DISCORD_BOT_TOKEN || "";
  let adminRoleId = env.DISCORD_ADMIN_ROLE_ID || "";
  let clientId = env.DISCORD_CLIENT_ID || "";

  try {
    const settings = await db.query.platformSettings.findMany();
    for (const s of settings) {
      if (s.settingKey === "bot_guild_id" && s.settingValue) guildId = s.settingValue;
      if (s.settingKey === "bot_token" && s.settingValue) botToken = s.settingValue;
      if (s.settingKey === "bot_admin_role_id" && s.settingValue) adminRoleId = s.settingValue;
      if (s.settingKey === "bot_client_id" && s.settingValue) clientId = s.settingValue;
    }
  } catch {
    // fallback to env
  }

  return { guildId, botToken, adminRoleId, clientId };
}

/**
 * Fetch member details from our Discord Guild using our Bot Token
 */
export async function getDiscordGuildMember(discordUserId: string): Promise<DiscordGuildMember | null> {
  const { guildId, botToken } = await getDiscordCredentials();
  if (!guildId || !botToken) {
    console.warn("[Discord API] Bot token or guild ID missing in config.");
    return null;
  }

  try {
    const url = `https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bot ${botToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (res.status === 404) {
      console.log(`[Discord API] User ${discordUserId} is not in guild ${guildId}`);
      return null;
    }

    if (!res.ok) {
      const errBody = await res.text();
      console.error(`[Discord API] Error ${res.status}:`, errBody);
      return null;
    }

    const data: DiscordGuildMember = await res.json();
    return data;
  } catch (err) {
    console.error("[Discord API] Network error querying Discord Bot API:", err);
    return null;
  }
}

/**
 * Checks if a Discord user possesses the Administrator role in our Discord Guild.
 * Strictly verifies the configured Discord Admin Role ID.
 */
export async function isDiscordUserAdmin(discordUserId: string): Promise<{
  isAdmin: boolean;
  member: DiscordGuildMember | null;
}> {
  const [{ adminRoleId }, member] = await Promise.all([
    getDiscordCredentials(),
    getDiscordGuildMember(discordUserId),
  ]);

  if (!member) {
    return { isAdmin: false, member: null };
  }

  // Strict check: User MUST have the configured Admin Role ID on the server
  const hasAdminRole =
    Array.isArray(member.roles) && member.roles.includes(adminRoleId);
  return { isAdmin: hasAdminRole, member };
}

/**
 * Synchronizes user's Discord roles from the server and updates MariaDB user record.
 * Instantly promotes to "admin" if role is present, or demotes to "user" if role is missing/removed.
 */
export async function syncUserDiscord(
  userId: string
): Promise<{
  success: boolean;
  linked: boolean;
  isAdmin: boolean;
  discordUsername?: string;
  error?: string;
}> {
  // 1. Look strictly for connected Discord account in verified OAuth account table
  const discordAccount = await db.query.account.findFirst({
    where: and(eq(account.userId, userId), eq(account.providerId, "discord")),
  });

  const discordId = discordAccount?.accountId;

  if (!discordId) {
    return {
      success: false,
      linked: false,
      isAdmin: false,
      error: "No verified Discord account connected. Please connect your Discord account via OAuth2.",
    };
  }

  // 2. Query Discord Bot API in real-time
  const { isAdmin, member } = await isDiscordUserAdmin(discordId);

  if (!member) {
    const existingDbUser = await db.query.user.findFirst({ where: eq(user.id, userId) });
    if (existingDbUser?.role !== "superadmin") {
      await db.update(user).set({ role: "user", updatedAt: new Date() }).where(eq(user.id, userId));
    }
    return {
      success: false,
      linked: false,
      isAdmin: false,
      error: `Użytkownik Discord (${discordId}) nie został znaleziony na oficjalnym serwerze KRYPT. Dołącz najpierw do serwera Discord!`,
    };
  }

  const discordUsername = member.user.username;
  const rolesJson = JSON.stringify(member.roles);

  const existingDbUser = await db.query.user.findFirst({ where: eq(user.id, userId) });
  const isExistingSuperAdmin = existingDbUser?.role === "superadmin";

  // 3. Update MariaDB user record with current status
  const updateData: Record<string, any> = {
    discordId: member.user.id,
    discordUsername,
    discordRoles: rolesJson,
    role: isExistingSuperAdmin ? "superadmin" : isAdmin ? "admin" : "user",
    updatedAt: new Date(),
  };

  await db.update(user).set(updateData).where(eq(user.id, userId));

  return {
    success: true,
    linked: true,
    isAdmin,
    discordUsername,
  };
}
