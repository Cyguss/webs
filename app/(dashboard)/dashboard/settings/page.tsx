import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { shops, user, account } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { User, Shield } from "lucide-react";
import { ProfileClient } from "./profile-client";
import { Security2FAClient } from "./security-2fa-client";
import { DiscordConnectClient } from "./discord-connect-client";

export default async function SettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/login");
  }

  let [currentUser] = await db
    .select()
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  // Auto-detect linked Discord from OAuth account table or user record
  const discordAccount = await db.query.account.findFirst({
    where: and(eq(account.userId, session.user.id), eq(account.providerId, "discord")),
  });

  const discordId = discordAccount?.accountId;
  if (discordId) {
    const { syncUserDiscord } = await import("@/lib/discord");
    await syncUserDiscord(session.user.id);
    const [freshUser] = await db.select().from(user).where(eq(user.id, session.user.id)).limit(1);
    if (freshUser) {
      currentUser = freshUser;
    }
  }

  // Detect whether the user has a password set (credential account with password)
  const credentialAccount = await db.query.account.findFirst({
    where: and(eq(account.userId, session.user.id), eq(account.providerId, "credential")),
  });
  const hasPassword = Boolean(credentialAccount?.password);

  const userShops = await db.select().from(shops).where(eq(shops.userId, session.user.id));
  const twoFactorActive = !!currentUser?.twoFactorEnabled;
  const twoFactorMethod = (currentUser?.twoFactorMethod as "email" | "totp") || "email";

  return (
    <div className="page-fly-in" style={{ maxWidth: 960, margin: "0 auto", width: "100%" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--color-foreground)", letterSpacing: "-0.02em" }}>
          Account & Settings
        </h1>
        <p style={{ color: "var(--color-muted-foreground)", fontSize: 14, marginTop: 4 }}>
          Manage your account credentials, store details, and security settings.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* User Profile with Editable Display Name */}
        <ProfileClient
          initialName={currentUser?.name || session.user.name || ""}
          email={currentUser?.email || session.user.email || ""}
        />

        {/* Discord Server Integration */}
        <DiscordConnectClient
          initialDiscordUsername={currentUser?.discordUsername || null}
          initialRole={currentUser?.role || "user"}
        />

        {/* Security & 2FA */}
        <Security2FAClient
          initialTwoFactorEnabled={twoFactorActive}
          initialTwoFactorMethod={twoFactorMethod}
          initialHasPassword={hasPassword}
        />
      </div>
    </div>
  );
}
