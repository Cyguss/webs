"use client";

import React from "react";
import Link from "next/link";
import { Lock, Loader2, ShieldCheck } from "lucide-react";

interface AdminLoginGateProps {
  usernameInput: string;
  setUsernameInput: (val: string) => void;
  passwordInput: string;
  setPasswordInput: (val: string) => void;
  loginLoading: boolean;
  onUnlock: (e: React.FormEvent) => void;
}

export function AdminLoginGate({
  usernameInput,
  setUsernameInput,
  passwordInput,
  setPasswordInput,
  loginLoading,
  onUnlock,
}: AdminLoginGateProps) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-background)",
        padding: "24px",
      }}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: 420,
          padding: "36px 32px",
          borderRadius: "var(--radius-lg, 16px)",
          border: "1px solid var(--color-border)",
          boxShadow: "0 24px 48px -12px rgba(0, 0, 0, 0.5)",
          background: "var(--color-surface)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: "var(--radius-md)",
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              color: "#ffffff",
            }}
          >
            <Lock size={22} />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6, letterSpacing: "-0.02em" }}>
            Administrator Portal
          </h1>
          <p style={{ fontSize: 13, color: "var(--color-muted-foreground)", lineHeight: 1.5 }}>
            Authenticate with Super-Admin credentials or link a verified Discord Administrator account.
          </p>
        </div>

        <form onSubmit={onUnlock} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 6,
                color: "var(--color-muted-foreground)",
              }}
            >
              Super-Admin Identifier
            </label>
            <input
              type="text"
              className="input"
              placeholder="Enter identifier"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              required
              autoFocus
              style={{ height: 42, fontSize: 14 }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 6,
                color: "var(--color-muted-foreground)",
              }}
            >
              Master Passphrase
            </label>
            <input
              type="password"
              className="input"
              placeholder="Enter master passphrase"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              required
              style={{ height: 42, fontSize: 14 }}
            />
          </div>

          <button
            type="submit"
            disabled={loginLoading || !usernameInput.trim() || !passwordInput.trim()}
            className="btn btn-primary"
            style={{
              height: 44,
              fontSize: 13,
              fontWeight: 700,
              marginTop: 6,
            }}
          >
            {loginLoading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
            <span>{loginLoading ? "Verifying..." : "Authenticate as Super-Admin"}</span>
          </button>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
            <Link
              href="/dashboard/settings"
              className="btn btn-secondary"
              style={{ height: 38, fontSize: 12, textAlign: "center" }}
            >
              Have Discord Admin Role? Link in Settings
            </Link>

            <Link
              href="/dashboard"
              className="btn btn-ghost"
              style={{ height: 36, fontSize: 12, color: "var(--color-muted-foreground)", textAlign: "center" }}
            >
              Return to Dashboard
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
