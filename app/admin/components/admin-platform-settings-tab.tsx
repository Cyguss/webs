"use client";

import React, { useState, useEffect } from "react";
import {
  Sliders,
  Store,
  UserPlus,
  AlertTriangle,
  CreditCard,
  Coins,
  Megaphone,
  Save,
  Loader2,
  CheckCircle2,
  ShieldAlert,
  Percent,
  Layers,
  Lock,
  Info,
} from "lucide-react";
import { useToast } from "@/components/toast-context";

interface PlatformSettingsTabProps {
  isSuperAdmin: boolean;
  ticket: string | null;
  onShowMasterModal?: () => void;
}

export function AdminPlatformSettingsTab({
  isSuperAdmin,
  ticket,
  onShowMasterModal,
}: PlatformSettingsTabProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    allow_store_creation: true,
    allow_user_registration: true,
    maintenance_mode: false,
    maintenance_message: "KRYPT MARKET protocol is undergoing scheduled maintenance. Node synchronization will resume shortly.",
    platform_fee_percent: 5.0,
    enable_crypto_payments: true,
    enable_stripe_payments: true,
    cryptomus_sandbox_mode: true,
    announcement_banner_active: false,
    announcement_banner_text: "",
    announcement_banner_type: "info" as "info" | "warning" | "alert",
    max_shops_per_user: 10,
  });

  useEffect(() => {
    fetchSettings();
  }, [ticket]);

  async function fetchSettings() {
    setLoading(true);
    try {
      const headersInit: Record<string, string> = {};
      if (ticket) headersInit["x-admin-ticket"] = ticket;

      const res = await fetch("/api/admin/platform-settings", {
        headers: headersInit,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setSettings(data.config);
        }
      }
    } catch (err) {
      console.error("Failed to load platform settings:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!isSuperAdmin && !ticket) {
      toast.error("Super-Admin authorization required to modify platform configuration.");
      onShowMasterModal?.();
      return;
    }

    setSaving(true);
    try {
      const headersInit: Record<string, string> = { "Content-Type": "application/json" };
      if (ticket) headersInit["x-admin-ticket"] = ticket;

      const res = await fetch("/api/admin/platform-settings", {
        method: "POST",
        headers: headersInit,
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to update platform settings");
      } else {
        toast.success("Platform settings saved and applied globally!");
        if (data.config) {
          setSettings(data.config);
        }
      }
    } catch (err: any) {
      toast.error(err?.message || "Error saving platform settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="card" style={{ padding: 48, textAlign: "center" }}>
        <Loader2 size={32} className="animate-spin" style={{ color: "#6366f1", margin: "0 auto 12px" }} />
        <div style={{ fontSize: 13, color: "var(--color-muted-foreground)" }}>Loading Platform Settings...</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSaveSettings} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header banner */}
      <div
        className="card"
        style={{
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.04) 100%)",
          border: "1px solid rgba(99, 102, 241, 0.2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "var(--radius-md)",
              background: "rgba(99, 102, 241, 0.15)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#818cf8",
            }}
          >
            <Sliders size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: "-0.01em" }}>
              Global Platform Configuration
            </h2>
            <p style={{ fontSize: 12, color: "var(--color-muted-foreground)", margin: "3px 0 0" }}>
              Control platform-wide toggles, payment processing gateways, registration flow, and global announcements.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn btn-primary"
          style={{
            padding: "10px 22px",
            fontSize: 13,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          <span>{saving ? "Saving Changes..." : "Apply Platform Settings"}</span>
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: 20 }}>
        {/* Section 1: Store & Registration Control */}
        <div className="card" style={{ padding: 22, display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid var(--color-border)", paddingBottom: 12 }}>
            <Store size={18} style={{ color: "#60a5fa" }} />
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Store & User Operations</h3>
              <p style={{ fontSize: 11, color: "var(--color-muted-foreground)", margin: 0 }}>
                Control merchant onboarding and store creation platform-wide
              </p>
            </div>
          </div>

          {/* Toggle: Allow Store Creation */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "rgba(255,255,255,0.02)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Allow New Store Creation</div>
              <div style={{ fontSize: 11, color: "var(--color-muted-foreground)" }}>
                When disabled, merchants cannot create new stores from onboarding or dashboard.
              </div>
            </div>
            <label style={{ position: "relative", display: "inline-block", width: 44, height: 24, cursor: "pointer", flexShrink: 0 }}>
              <input
                type="checkbox"
                checked={settings.allow_store_creation}
                onChange={(e) => setSettings({ ...settings, allow_store_creation: e.target.checked })}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 24,
                  backgroundColor: settings.allow_store_creation ? "#10b981" : "rgba(255,255,255,0.15)",
                  transition: "0.2s",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    height: 18,
                    width: 18,
                    left: settings.allow_store_creation ? 22 : 3,
                    bottom: 3,
                    backgroundColor: "white",
                    borderRadius: "50%",
                    transition: "0.2s",
                  }}
                />
              </span>
            </label>
          </div>

          {/* Toggle: Allow User Registration */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "rgba(255,255,255,0.02)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Allow User Registrations</div>
              <div style={{ fontSize: 11, color: "var(--color-muted-foreground)" }}>
                When disabled, new signups are blocked. Existing merchants can still log in.
              </div>
            </div>
            <label style={{ position: "relative", display: "inline-block", width: 44, height: 24, cursor: "pointer", flexShrink: 0 }}>
              <input
                type="checkbox"
                checked={settings.allow_user_registration}
                onChange={(e) => setSettings({ ...settings, allow_user_registration: e.target.checked })}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 24,
                  backgroundColor: settings.allow_user_registration ? "#10b981" : "rgba(255,255,255,0.15)",
                  transition: "0.2s",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    height: 18,
                    width: 18,
                    left: settings.allow_user_registration ? 22 : 3,
                    bottom: 3,
                    backgroundColor: "white",
                    borderRadius: "50%",
                    transition: "0.2s",
                  }}
                />
              </span>
            </label>
          </div>

          {/* Input: Max Shops Per User */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
              Maximum Stores per Merchant
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={settings.max_shops_per_user}
              onChange={(e) => setSettings({ ...settings, max_shops_per_user: parseInt(e.target.value, 10) || 1 })}
              className="input"
              style={{ width: "100%", fontSize: 13 }}
            />
            <span style={{ fontSize: 11, color: "var(--color-muted-foreground)", marginTop: 4, display: "block" }}>
              Standard quota of stores an individual user account is permitted to register.
            </span>
          </div>
        </div>

        {/* Section 2: Platform Maintenance Mode */}
        <div className="card" style={{ padding: 22, display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid var(--color-border)", paddingBottom: 12 }}>
            <AlertTriangle size={18} style={{ color: "#f59e0b" }} />
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Platform Maintenance Mode</h3>
              <p style={{ fontSize: 11, color: "var(--color-muted-foreground)", margin: 0 }}>
                Emergency maintenance overlay for maintenance windows
              </p>
            </div>
          </div>

          {/* Toggle: Maintenance Mode */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 14px",
              background: settings.maintenance_mode ? "rgba(239, 68, 68, 0.08)" : "rgba(255,255,255,0.02)",
              borderRadius: "var(--radius-sm)",
              border: settings.maintenance_mode ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid var(--color-border)",
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: settings.maintenance_mode ? "#f87171" : "inherit" }}>
                Enable Platform Maintenance
              </div>
              <div style={{ fontSize: 11, color: "var(--color-muted-foreground)" }}>
                When active, storefronts display a maintenance banner and checkout is temporarily paused.
              </div>
            </div>
            <label style={{ position: "relative", display: "inline-block", width: 44, height: 24, cursor: "pointer", flexShrink: 0 }}>
              <input
                type="checkbox"
                checked={settings.maintenance_mode}
                onChange={(e) => setSettings({ ...settings, maintenance_mode: e.target.checked })}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 24,
                  backgroundColor: settings.maintenance_mode ? "#ef4444" : "rgba(255,255,255,0.15)",
                  transition: "0.2s",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    height: 18,
                    width: 18,
                    left: settings.maintenance_mode ? 22 : 3,
                    bottom: 3,
                    backgroundColor: "white",
                    borderRadius: "50%",
                    transition: "0.2s",
                  }}
                />
              </span>
            </label>
          </div>

          {/* Input: Maintenance Message */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
              Maintenance Notice Description
            </label>
            <textarea
              rows={3}
              value={settings.maintenance_message}
              onChange={(e) => setSettings({ ...settings, maintenance_message: e.target.value })}
              className="input"
              style={{ width: "100%", fontSize: 12, resize: "vertical", minHeight: 70 }}
              placeholder="KRYPT is undergoing scheduled maintenance..."
            />
          </div>
        </div>

        {/* Section 3: Monetization & Fee Architecture */}
        <div className="card" style={{ padding: 22, display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid var(--color-border)", paddingBottom: 12 }}>
            <Percent size={18} style={{ color: "#10b981" }} />
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Monetization & Commission</h3>
              <p style={{ fontSize: 11, color: "var(--color-muted-foreground)", margin: 0 }}>
                Configure platform fee split deducted automatically from orders
              </p>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
              Platform Commission Rate (%)
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="number"
                step="0.1"
                min="0"
                max="50"
                value={settings.platform_fee_percent}
                onChange={(e) => setSettings({ ...settings, platform_fee_percent: parseFloat(e.target.value) || 0 })}
                className="input"
                style={{ width: 140, fontSize: 14, fontWeight: 700 }}
              />
              <div style={{ fontSize: 12, color: "var(--color-muted-foreground)" }}>
                % (e.g. 5.0% means seller receives <strong>{(100 - settings.platform_fee_percent).toFixed(1)}%</strong> of order total)
              </div>
            </div>
          </div>

          {/* Payment Gateways */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-muted-foreground)" }}>Payment Processors</div>

            {/* Cryptomus */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "rgba(255,255,255,0.02)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Coins size={16} style={{ color: "#a855f7" }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>Cryptomus (Cryptocurrency)</div>
                  <div style={{ fontSize: 10, color: "var(--color-muted-foreground)" }}>BTC, USDT, ETH, LTC and 30+ coins</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.enable_crypto_payments}
                onChange={(e) => setSettings({ ...settings, enable_crypto_payments: e.target.checked })}
              />
            </div>

            {/* Cryptomus Sandbox */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "rgba(255,255,255,0.02)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Layers size={16} style={{ color: "#38bdf8" }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>Cryptomus Sandbox / Testnet</div>
                  <div style={{ fontSize: 10, color: "var(--color-muted-foreground)" }}>Toggle test payments vs production settlement</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.cryptomus_sandbox_mode}
                onChange={(e) => setSettings({ ...settings, cryptomus_sandbox_mode: e.target.checked })}
              />
            </div>

            {/* Stripe */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "rgba(255,255,255,0.02)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CreditCard size={16} style={{ color: "#6366f1" }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>Stripe / Cards Gateway</div>
                  <div style={{ fontSize: 10, color: "var(--color-muted-foreground)" }}>Debit, Credit Card & Apple Pay processing</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.enable_stripe_payments}
                onChange={(e) => setSettings({ ...settings, enable_stripe_payments: e.target.checked })}
              />
            </div>
          </div>
        </div>

        {/* Section 4: Global Announcement Banner */}
        <div className="card" style={{ padding: 22, display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid var(--color-border)", paddingBottom: 12 }}>
            <Megaphone size={18} style={{ color: "#ec4899" }} />
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Global Announcement Banner</h3>
              <p style={{ fontSize: 11, color: "var(--color-muted-foreground)", margin: 0 }}>
                Broadcast messages at top of all pages and customer storefronts
              </p>
            </div>
          </div>

          {/* Toggle: Announcement Active */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "rgba(255,255,255,0.02)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Display Announcement Banner</div>
              <div style={{ fontSize: 11, color: "var(--color-muted-foreground)" }}>
                Visible to every visitor on the platform
              </div>
            </div>
            <label style={{ position: "relative", display: "inline-block", width: 44, height: 24, cursor: "pointer", flexShrink: 0 }}>
              <input
                type="checkbox"
                checked={settings.announcement_banner_active}
                onChange={(e) => setSettings({ ...settings, announcement_banner_active: e.target.checked })}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 24,
                  backgroundColor: settings.announcement_banner_active ? "#10b981" : "rgba(255,255,255,0.15)",
                  transition: "0.2s",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    height: 18,
                    width: 18,
                    left: settings.announcement_banner_active ? 22 : 3,
                    bottom: 3,
                    backgroundColor: "white",
                    borderRadius: "50%",
                    transition: "0.2s",
                  }}
                />
              </span>
            </label>
          </div>

          {/* Banner Type */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
              Banner Notice Style
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {(["info", "warning", "alert"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSettings({ ...settings, announcement_banner_type: type })}
                  style={{
                    padding: "8px 10px",
                    borderRadius: "var(--radius-sm)",
                    border: settings.announcement_banner_type === type ? "1px solid #818cf8" : "1px solid var(--color-border)",
                    background: settings.announcement_banner_type === type ? "rgba(99, 102, 241, 0.15)" : "rgba(255,255,255,0.02)",
                    color: settings.announcement_banner_type === type ? "#ffffff" : "var(--color-muted-foreground)",
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: "capitalize",
                    cursor: "pointer",
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Banner Text */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
              Announcement Message
            </label>
            <textarea
              rows={2}
              value={settings.announcement_banner_text}
              onChange={(e) => setSettings({ ...settings, announcement_banner_text: e.target.value })}
              className="input"
              style={{ width: "100%", fontSize: 12, resize: "vertical" }}
              placeholder="e.g. ⚡ KRYPT 2.4 is live! Enjoy instant crypto fulfillment and zero setup fees."
            />
          </div>
        </div>
      </div>
    </form>
  );
}
