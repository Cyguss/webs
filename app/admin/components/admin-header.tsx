"use client";

import React from "react";
import Link from "next/link";
import { Terminal, Lock, ExternalLink, ShieldAlert } from "lucide-react";

interface AdminHeaderProps {
  adminData: any;
  onShowMasterModal: () => void;
  onShowPanicModal: () => void;
  onShowKillSwitchModal?: () => void;
  onLockSession: () => void;
}

export function AdminHeader({
  adminData,
  onShowMasterModal,
  onShowPanicModal,
  onShowKillSwitchModal,
  onLockSession,
}: AdminHeaderProps) {
  return (
    <header
      style={{
        height: 64,
        borderBottom: "1px solid var(--color-border)",
        background: "var(--header-bg)",
        backdropFilter: "blur(16px)",
        padding: "0 28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "var(--radius-sm)",
              background: adminData?.isSuperAdmin ? "#ffffff" : "#1a1c24",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: adminData?.isSuperAdmin ? "#000000" : "#ffffff",
            }}
          >
            <Terminal size={17} />
          </div>
          <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.02em" }}>
            {adminData?.isSuperAdmin ? "ADMIN PANEL • SUPER ADMIN" : "ADMIN PANEL"}
          </span>
        </div>

        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            padding: "3px 8px",
            borderRadius: 4,
            background: adminData?.isSuperAdmin ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.12)",
            border: `1px solid ${
              adminData?.isSuperAdmin ? "rgba(239, 68, 68, 0.4)" : "rgba(16, 185, 129, 0.3)"
            }`,
            color: adminData?.isSuperAdmin ? "#f87171" : "#34d399",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {adminData?.isSuperAdmin ? "SUPER ADMIN" : `STAFF ADMIN (@${adminData?.discordUsername || "Admin"})`}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* If Ordinary Admin, allow upgrading to Super-Admin */}
        {!adminData?.isSuperAdmin && (
          <button
            onClick={onShowMasterModal}
            className="btn btn-secondary"
            style={{ padding: "6px 12px", fontSize: 12, gap: 6 }}
          >
            <Lock size={13} />
            <span>Super-Admin Access</span>
          </button>
        )}

        <Link href="/dashboard" className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: 12, gap: 6 }}>
          <span>Merchant Suite</span>
          <ExternalLink size={13} />
        </Link>

        {/* Ordinary Admin Panic Button (Self-Lockout ONLY) */}
        {!adminData?.isSuperAdmin && (
          <button
            onClick={onShowPanicModal}
            className="btn btn-danger"
            style={{ padding: "6px 12px", fontSize: 12, gap: 6 }}
            title="Emergency Panic Switch: Instantly revoke your personal admin access"
          >
            <ShieldAlert size={14} />
            <span>Panic Switch</span>
          </button>
        )}

        {/* Super-Admin Exclusive: Kill Switch (Platform-wide Admin Freeze) */}
        {adminData?.isSuperAdmin && onShowKillSwitchModal && (
          <button
            onClick={onShowKillSwitchModal}
            className="btn btn-danger"
            style={{
              padding: "6px 12px",
              fontSize: 12,
              gap: 6,
              background: adminData?.blockAllAdmins ? "#dc2626" : "rgba(239, 68, 68, 0.15)",
              color: adminData?.blockAllAdmins ? "#ffffff" : "#f87171",
              borderColor: "rgba(239, 68, 68, 0.4)",
            }}
            title="Kill Switch: Freeze all ordinary administrators"
          >
            <ShieldAlert size={14} />
            <span>{adminData?.blockAllAdmins ? "Kill Switch Active (Locked)" : "Admin Kill Switch"}</span>
          </button>
        )}

        {/* Super-Admin Session Lock */}
        {adminData?.isSuperAdmin && (
          <button
            onClick={onLockSession}
            className="btn btn-secondary"
            style={{ padding: "6px 12px", fontSize: 12, gap: 6 }}
            title="End active Super-Admin session"
          >
            <Lock size={13} />
            <span>Lock Session</span>
          </button>
        )}
      </div>
    </header>
  );
}
