"use client";

import React from "react";
import { ShieldAlert, ShieldCheck, Loader2 } from "lucide-react";

interface AdminLockdownBannerProps {
  isSuperAdmin: boolean;
  blockAllAdmins: boolean;
  discordUsername?: string;
  lockdownLoading: boolean;
  onToggleLockdown: () => void;
  onShowPanicModal: () => void;
}

export function AdminLockdownBanner({
  isSuperAdmin,
  blockAllAdmins,
  discordUsername,
  lockdownLoading,
  onToggleLockdown,
  onShowPanicModal,
}: AdminLockdownBannerProps) {
  // If Super-Admin: Only render banner if platform lockdown is currently engaged (alert mode)
  // This ensures there is strictly 1 single Kill Switch control (in header) instead of 2 duplicate controls
  if (isSuperAdmin) {
    if (!blockAllAdmins) {
      return null;
    }

    return (
      <div
        style={{
          marginBottom: 24,
          padding: "16px 20px",
          borderRadius: "var(--radius-md)",
          background: "rgba(239, 68, 68, 0.12)",
          border: "1px solid rgba(239, 68, 68, 0.45)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "var(--radius-sm)",
              background: "#ef4444",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <ShieldAlert size={20} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: "#f87171" }}>
                Emergency Platform Lockdown Active
              </h3>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: "2px 6px",
                  borderRadius: 4,
                  background: "#ef4444",
                  color: "#ffffff",
                  letterSpacing: "0.06em",
                }}
              >
                KILL-SWITCH ENGAGED
              </span>
            </div>
            <p style={{ fontSize: 12, color: "var(--color-muted-foreground)", margin: "3px 0 0" }}>
              All ordinary Discord administrators are strictly locked out of the panel.
            </p>
          </div>
        </div>

        <button
          onClick={onToggleLockdown}
          disabled={lockdownLoading}
          className="btn btn-primary"
          style={{
            padding: "8px 16px",
            fontSize: 12,
            fontWeight: 700,
            background: "#10b981",
            borderColor: "#10b981",
          }}
        >
          {lockdownLoading ? <Loader2 size={14} className="animate-spin" /> : "Lift Lockdown (Restore Admins)"}
        </button>
      </div>
    );
  }

  // Ordinary Discord Staff Admin view: Show status badge without duplicate kill-switch button
  return (
    <div
      style={{
        marginBottom: 24,
        padding: "14px 20px",
        borderRadius: "var(--radius-md)",
        background: "#0d0e12",
        border: "1px solid var(--color-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <ShieldCheck size={18} color="#34d399" />
        <span style={{ fontSize: 13, color: "var(--color-foreground)" }}>
          Signed in as <strong>Discord Staff</strong> (@{discordUsername || "Staff"}). Live role check enforced via Discord Bot API.
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--color-muted-foreground)" }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
        <span>Staff Session Active</span>
      </div>
    </div>
  );
}
