"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldAlert, ShieldCheck, Lock, Loader2, ArrowRight } from "lucide-react";
import { useToast } from "@/components/toast-context";

interface AdminElevationClientProps {
  initialRole: string;
}

export function AdminElevationClient({ initialRole }: AdminElevationClientProps) {
  const toast = useToast();
  const [role, setRole] = useState(initialRole);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleElevate(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error("Please provide both identifier and master passphrase.");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Authorization denied.");
        setLoading(false);
        return;
      }

      setRole("admin");
      setPassword("");
      toast.success("Super-Admin credentials verified. Admin portal enabled!");

      setTimeout(() => {
        window.location.reload();
      }, 900);
    } catch (err: any) {
      toast.error(err.message || "Network error during elevation");
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16, padding: 22 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "var(--radius-sm)",
              background: role === "admin" ? "rgba(239, 68, 68, 0.15)" : "rgba(255, 255, 255, 0.05)",
              border: `1px solid ${role === "admin" ? "rgba(239, 68, 68, 0.3)" : "rgba(255, 255, 255, 0.1)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {role === "admin" ? <ShieldAlert size={16} color="#ef4444" /> : <Lock size={16} color="#ffffff" />}
          </div>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "var(--color-foreground)" }}>
              Administrator Authorization (Master Gate)
            </h3>
            <p style={{ fontSize: 12, color: "var(--color-muted-foreground)", margin: "2px 0 0" }}>
              Standard accounts operate with &apos;user&apos; permissions. Admin tools unlock only via master credentials or Discord role.
            </p>
          </div>
        </div>

        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            padding: "3px 8px",
            borderRadius: 4,
            background: role === "admin" ? "rgba(239, 68, 68, 0.15)" : "rgba(255, 255, 255, 0.06)",
            border: `1px solid ${role === "admin" ? "rgba(239, 68, 68, 0.3)" : "rgba(255, 255, 255, 0.12)"}`,
            color: role === "admin" ? "#f87171" : "var(--color-muted-foreground)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          ROLE: {role}
        </span>
      </div>

      {role === "admin" ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, paddingTop: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ShieldCheck size={16} color="#22c55e" />
            <span style={{ fontSize: 13, color: "var(--color-foreground)" }}>
              Your account possesses active <strong>Administrator</strong> privileges. Admin Portal is active in your sidebar.
            </span>
          </div>

          <Link
            href="/admin"
            className="btn btn-primary"
            style={{
              fontSize: 12,
              padding: "7px 16px",
              gap: 6,
            }}
          >
            <span>Open Admin Portal</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      ) : (
        <form onSubmit={handleElevate} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 10 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, marginBottom: 4, color: "var(--color-muted-foreground)" }}>
                Super-Admin Identifier
              </label>
              <input
                type="text"
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Identifier"
                required
                style={{ fontSize: 13, height: 38 }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, marginBottom: 4, color: "var(--color-muted-foreground)" }}>
                Master Passphrase
              </label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Passphrase"
                required
                style={{ fontSize: 13, height: 38 }}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              disabled={loading || !username.trim() || !password.trim()}
              className="btn btn-primary"
              style={{
                fontSize: 12,
                padding: "8px 18px",
                gap: 6,
              }}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <ShieldAlert size={14} />}
              <span>Authenticate as Administrator</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
