"use client";

import React, { useState } from "react";
import { Lock, Loader2, CheckCircle2, Terminal, Radio, Eye, EyeOff, Database, ShieldCheck } from "lucide-react";
import { DEFAULT_BOT_CONFIG } from "@/config/bot";
import { useToast } from "@/components/toast-context";

interface AdminBotConfigTabProps {
  isSuperAdmin: boolean;
  botConfig: Record<string, string>;
  setBotConfig: (config: Record<string, string>) => void;
  botConfigSaving: boolean;
  onSaveBotConfig: (e: React.FormEvent) => void;
  onShowMasterModal: () => void;
}

export function AdminBotConfigTab({
  isSuperAdmin,
  botConfig,
  setBotConfig,
  botConfigSaving,
  onSaveBotConfig,
  onShowMasterModal,
}: AdminBotConfigTabProps) {
  const toast = useToast();
  const [showToken, setShowToken] = useState(false);

  if (!isSuperAdmin) {
    return (
      <div className="card" style={{ padding: 40, textAlign: "center", maxWidth: 540, margin: "0 auto" }}>
        <div
          style={{
            width: 54,
            height: 54,
            borderRadius: 14,
            background: "rgba(239, 68, 68, 0.12)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#ef4444",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <Lock size={26} />
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: "var(--color-foreground)" }}>
          Super-Admin Permission Required
        </h3>
        <p style={{ fontSize: 13, color: "var(--color-muted-foreground)", lineHeight: 1.6, marginBottom: 24 }}>
          Only authenticated Super-Administrators can view, modify, and persist Discord bot tokens, server IDs, and platform webhooks.
        </p>
        <button onClick={onShowMasterModal} className="btn btn-primary" style={{ padding: "10px 22px", fontSize: 13 }}>
          <Lock size={14} /> Elevate to Super-Admin
        </button>
      </div>
    );
  }

  function handleResetDefaults() {
    setBotConfig({
      ...botConfig,
      ...DEFAULT_BOT_CONFIG,
    });
    toast.success("Reset form inputs to defaults. Click 'Save All Configuration' to commit to database.");
  }

  return (
    <form onSubmit={onSaveBotConfig} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "var(--color-foreground)" }}>
              Bot & Discord Platform Configuration
            </h2>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 10,
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: 4,
                background: "rgba(16, 185, 129, 0.12)",
                color: "#10b981",
                border: "1px solid rgba(16, 185, 129, 0.25)",
              }}
            >
              <Database size={11} /> Database Synced
            </span>
          </div>
          <p style={{ fontSize: 12, color: "var(--color-muted-foreground)", margin: "4px 0 0" }}>
            Configuration is saved and loaded directly from MariaDB (<code style={{ color: "#818cf8" }}>platform_settings</code>). If empty, environment variables are loaded automatically.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            onClick={handleResetDefaults}
            className="btn btn-secondary"
            style={{ padding: "9px 16px", fontSize: 12 }}
            title="Reset form inputs to default values"
          >
            Reset Defaults
          </button>
          <button
            type="submit"
            disabled={botConfigSaving}
            className="btn btn-primary"
            style={{ padding: "9px 20px", fontSize: 13, fontWeight: 700, gap: 8 }}
          >
            {botConfigSaving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
            <span>Save All Configuration</span>
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: 20 }}>
        {/* Panel 1: Discord Credentials & Server IDs */}
        <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "rgba(88, 101, 242, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#818cf8",
              }}
            >
              <Terminal size={17} />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "var(--color-foreground)" }}>
                Discord Server & Bot Credentials
              </h3>
              <p style={{ fontSize: 11, color: "var(--color-muted-foreground)", margin: "2px 0 0" }}>
                Active parameters used for bot API checks & role synchronization.
              </p>
            </div>
          </div>

          <div>
            <label className="label" style={{ marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
              <span>Discord Client ID (OAuth Application ID)</span>
              <span style={{ fontSize: 11, color: "var(--color-muted-foreground)", fontFamily: "monospace" }}>Snowflake ID</span>
            </label>
            <input
              type="text"
              className="input"
              placeholder="e.g. 1550863025794322522"
              value={botConfig.bot_client_id || ""}
              onChange={(e) => setBotConfig({ ...botConfig, bot_client_id: e.target.value })}
              style={{ fontFamily: "monospace", fontSize: 13 }}
            />
            <span style={{ fontSize: 11, color: "var(--color-muted-foreground)", marginTop: 4, display: "block" }}>
              Public identifier of the Discord application for bot commands and OAuth2 linking.
            </span>
          </div>

          <div>
            <label className="label" style={{ marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
              <span>Discord Guild (Server) ID</span>
              <span style={{ fontSize: 11, color: "var(--color-muted-foreground)", fontFamily: "monospace" }}>Snowflake ID</span>
            </label>
            <input
              type="text"
              className="input"
              placeholder="e.g. 1550862716367802508"
              value={botConfig.bot_guild_id || ""}
              onChange={(e) => setBotConfig({ ...botConfig, bot_guild_id: e.target.value })}
              style={{ fontFamily: "monospace", fontSize: 13 }}
            />
            <span style={{ fontSize: 11, color: "var(--color-muted-foreground)", marginTop: 4, display: "block" }}>
              Numeric snowflake ID of your official Discord community server.
            </span>
          </div>

          <div>
            <label className="label" style={{ marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
              <span>Administrator Role ID</span>
              <span style={{ fontSize: 11, color: "var(--color-muted-foreground)", fontFamily: "monospace" }}>Role ID</span>
            </label>
            <input
              type="text"
              className="input"
              placeholder="e.g. 1550864919442751489"
              value={botConfig.bot_admin_role_id || ""}
              onChange={(e) => setBotConfig({ ...botConfig, bot_admin_role_id: e.target.value })}
              style={{ fontFamily: "monospace", fontSize: 13 }}
            />
            <span style={{ fontSize: 11, color: "var(--color-muted-foreground)", marginTop: 4, display: "block" }}>
              Members possessing this Discord role gain staff administrator portal access.
            </span>
          </div>

          <div>
            <label className="label" style={{ marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
              <span>Staff / Support Role ID (Optional)</span>
              <span style={{ fontSize: 11, color: "var(--color-muted-foreground)", fontFamily: "monospace" }}>Role ID</span>
            </label>
            <input
              type="text"
              className="input"
              placeholder="e.g. 1550864919442751499"
              value={botConfig.bot_staff_role_id || ""}
              onChange={(e) => setBotConfig({ ...botConfig, bot_staff_role_id: e.target.value })}
              style={{ fontFamily: "monospace", fontSize: 13 }}
            />
            <span style={{ fontSize: 11, color: "var(--color-muted-foreground)", marginTop: 4, display: "block" }}>
              Secondary role tagged in support notifications and ticket interactions.
            </span>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label className="label" style={{ margin: 0 }}>
                Bot Secret Token
              </label>
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="btn btn-ghost"
                style={{ padding: "2px 6px", height: "auto", fontSize: 11, gap: 4, color: "var(--color-muted-foreground)" }}
              >
                {showToken ? <EyeOff size={12} /> : <Eye size={12} />}
                <span>{showToken ? "Hide" : "Show"}</span>
              </button>
            </div>
            <input
              type={showToken ? "text" : "password"}
              className="input"
              placeholder="Discord Bot Token"
              value={botConfig.bot_token || ""}
              onChange={(e) => setBotConfig({ ...botConfig, bot_token: e.target.value })}
              style={{ fontFamily: "monospace", fontSize: 13 }}
            />
            <span style={{ fontSize: 11, color: "var(--color-muted-foreground)", marginTop: 4, display: "block" }}>
              Discord Application Bot Token. Loaded dynamically from MariaDB or environment variables for API requests.
            </span>
          </div>
        </div>

        {/* Panel 2: Webhooks & Support */}
        <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "rgba(16, 185, 129, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#10b981",
              }}
            >
              <Radio size={17} />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "var(--color-foreground)" }}>
                Automated Discord Logging Webhooks
              </h3>
              <p style={{ fontSize: 11, color: "var(--color-muted-foreground)", margin: "2px 0 0" }}>
                Real-time audit trails and administrative notifications dispatch.
              </p>
            </div>
          </div>

          <div>
            <label className="label" style={{ marginBottom: 6 }}>
              Store Approvals & Review Log Webhook
            </label>
            <input
              type="url"
              className="input"
              placeholder="https://discord.com/api/webhooks/..."
              value={botConfig.webhook_approval_log || ""}
              onChange={(e) => setBotConfig({ ...botConfig, webhook_approval_log: e.target.value })}
              style={{ fontFamily: "monospace", fontSize: 12 }}
            />
            <span style={{ fontSize: 11, color: "var(--color-muted-foreground)", marginTop: 4, display: "block" }}>
              Receives new store approval requests & admin decision logs.
            </span>
          </div>

          <div>
            <label className="label" style={{ marginBottom: 6 }}>
              Orders & Sales Log Webhook
            </label>
            <input
              type="url"
              className="input"
              placeholder="https://discord.com/api/webhooks/..."
              value={botConfig.webhook_order_log || ""}
              onChange={(e) => setBotConfig({ ...botConfig, webhook_order_log: e.target.value })}
              style={{ fontFamily: "monospace", fontSize: 12 }}
            />
            <span style={{ fontSize: 11, color: "var(--color-muted-foreground)", marginTop: 4, display: "block" }}>
              Broadcasts real-time checkout completions and key deliveries.
            </span>
          </div>

          <div>
            <label className="label" style={{ marginBottom: 6 }}>
              Seller Payouts Log Webhook
            </label>
            <input
              type="url"
              className="input"
              placeholder="https://discord.com/api/webhooks/..."
              value={botConfig.webhook_payout_log || ""}
              onChange={(e) => setBotConfig({ ...botConfig, webhook_payout_log: e.target.value })}
              style={{ fontFamily: "monospace", fontSize: 12 }}
            />
            <span style={{ fontSize: 11, color: "var(--color-muted-foreground)", marginTop: 4, display: "block" }}>
              Logs crypto withdrawal requests and admin payout confirmations.
            </span>
          </div>

          <div>
            <label className="label" style={{ marginBottom: 6 }}>
              Activity & Kill-Switch Log Webhook
            </label>
            <input
              type="url"
              className="input"
              placeholder="https://discord.com/api/webhooks/..."
              value={botConfig.webhook_activity_log || ""}
              onChange={(e) => setBotConfig({ ...botConfig, webhook_activity_log: e.target.value })}
              style={{ fontFamily: "monospace", fontSize: 12 }}
            />
            <span style={{ fontSize: 11, color: "var(--color-muted-foreground)", marginTop: 4, display: "block" }}>
              Alerts staff on panic triggers, lockdowns, and admin logins.
            </span>
          </div>

          <div>
            <label className="label" style={{ marginBottom: 6 }}>
              Official Platform Support Email
            </label>
            <input
              type="email"
              className="input"
              placeholder="support@krypt.market"
              value={botConfig.support_email ?? "support@krypt.market"}
              onChange={(e) => setBotConfig({ ...botConfig, support_email: e.target.value })}
              style={{ fontFamily: "monospace", fontSize: 12 }}
            />
            <span style={{ fontSize: 11, color: "var(--color-muted-foreground)", marginTop: 4, display: "block" }}>
              Support email address displayed across the marketplace and receipts.
            </span>
          </div>
        </div>
      </div>
    </form>
  );
}
