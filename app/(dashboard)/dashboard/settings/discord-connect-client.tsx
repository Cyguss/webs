"use client";

import { useState, useEffect } from "react";
import { linkSocial } from "@/lib/auth-client";
import { RefreshCw, Loader2, ShieldCheck, Info } from "lucide-react";
import { useToast } from "@/components/toast-context";

function DiscordIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

export function DiscordConnectClient({
  initialDiscordUsername,
  initialRole,
}: {
  initialDiscordUsername: string | null;
  initialRole: string;
}) {
  const toast = useToast();
  const [discordUsername, setDiscordUsername] = useState<string | null>(initialDiscordUsername);
  const [role, setRole] = useState(initialRole);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get("error");
    if (errorParam) {
      const msg = errorParam.replace(/_/g, " ");
      toast.error(`Discord connection failed: ${msg}`);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [toast]);

  async function handleConnectDiscord() {
    setLoading(true);
    try {
      await linkSocial({
        provider: "discord",
        callbackURL: "/dashboard/settings",
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to initiate Discord OAuth authentication");
      setLoading(false);
    }
  }

  async function handleSyncRoles() {
    setLoading(true);
    try {
      const res = await fetch("/api/discord/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to synchronize permissions with Discord guild.");
        setLoading(false);
        return;
      }

      if (data.discordUsername) {
        setDiscordUsername(data.discordUsername);
      }
      setRole(data.isAdmin ? "admin" : "user");

      if (data.isAdmin) {
        toast.success("Synchronized! Administrator role verified and active.");
      } else {
        toast.info("Synchronized. Standard merchant account privileges.");
      }

      setTimeout(() => {
        window.location.reload();
      }, 900);
    } catch (err: any) {
      toast.error(err?.message || "Network error during role synchronization");
    } finally {
      setLoading(false);
    }
  }

  const isConnected = !!discordUsername;

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16, padding: 22 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "var(--radius-sm)",
              background: "rgba(88, 101, 242, 0.12)",
              border: "1px solid rgba(88, 101, 242, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#5865F2",
            }}
          >
            <DiscordIcon size={16} />
          </div>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "var(--color-foreground)" }}>
              Discord Guild Integration
            </h3>
            <p style={{ fontSize: 12, color: "var(--color-muted-foreground)", margin: "2px 0 0" }}>
              Link Discord securely via OAuth2 to automatically sync server roles and verified badge status.
            </p>
          </div>
        </div>

        {role === "admin" && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 10,
              fontWeight: 800,
              padding: "3px 8px",
              borderRadius: 4,
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#f87171",
              letterSpacing: "0.05em",
            }}
          >
            <ShieldCheck size={12} />
            <span>ROLE: ADMIN</span>
          </span>
        )}
      </div>

      {/* Connection status banner */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px",
          borderRadius: "var(--radius-sm)",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid var(--color-border)",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "var(--radius-sm)",
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-foreground)",
            }}
          >
            <DiscordIcon size={18} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>
              {isConnected ? `@${discordUsername}` : "No Discord account linked"}
            </div>
            <div style={{ fontSize: 11, color: "var(--color-muted-foreground)" }}>
              {isConnected
                ? "Account securely linked via Discord OAuth2 and verified."
                : "Connect your Discord account to sync verified guild roles."}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {isConnected ? (
            <button
              type="button"
              onClick={handleSyncRoles}
              disabled={loading}
              className="btn btn-secondary"
              style={{ fontSize: 12, gap: 6, padding: "7px 14px" }}
            >
              {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
              <span>Sync Roles Now</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConnectDiscord}
              disabled={loading}
              className="btn btn-primary"
              style={{
                fontSize: 12,
                gap: 8,
                padding: "7px 16px",
              }}
            >
              {loading ? <Loader2 size={13} className="animate-spin" /> : <DiscordIcon size={15} />}
              <span>Link via OAuth2</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
