"use client";

import { useState, useEffect } from "react";
import { LifeBuoy, ExternalLink, Mail, Copy, Check, MessageSquare, Clock, ShieldCheck } from "lucide-react";
import { useToast } from "@/components/toast-context";

function DiscordLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

export default function DashboardSupportTicketsPage() {
  const toast = useToast();
  const [supportEmail, setSupportEmail] = useState("support@vaultly.io");
  const [discordInvite, setDiscordInvite] = useState("https://discord.gg/vaultly");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadSupport() {
      try {
        const res = await fetch("/api/support");
        if (res.ok) {
          const data = await res.json();
          if (data.supportEmail) setSupportEmail(data.supportEmail);
          if (data.discordInvite) setDiscordInvite(data.discordInvite);
        }
      } catch {
        // default
      }
    }
    loadSupport();
  }, []);

  function handleCopyEmail() {
    navigator.clipboard.writeText(supportEmail);
    setCopied(true);
    toast.success("Email Copied", supportEmail);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="page-fly-in" style={{ maxWidth: 1240, margin: "0 auto", width: "100%" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--color-foreground)", letterSpacing: "-0.02em" }}>
          Platform Support & Assistance
        </h1>
        <p style={{ color: "var(--color-muted-foreground)", fontSize: 14, marginTop: 4 }}>
          Connect with the Vaultly administration team directly via our official Discord community or via verified email.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>
        {/* Discord Card */}
        <div
          className="card"
          style={{
            background: "rgba(88, 101, 242, 0.05)",
            border: "1px solid rgba(88, 101, 242, 0.3)",
            borderRadius: "var(--radius-lg)",
            padding: 28,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: "#5865f2",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
                boxShadow: "0 8px 20px rgba(88, 101, 242, 0.35)",
              }}
            >
              <DiscordLogo size={28} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-foreground)", margin: "0 0 8px" }}>
              Join Discord Server
            </h3>
            <p style={{ fontSize: 13, color: "var(--color-muted-foreground)", lineHeight: 1.6, margin: 0 }}>
              Join our active merchant community on Discord. Chat with other store owners and reach administrators directly in real-time.
            </p>
          </div>

          <div style={{ marginTop: 28 }}>
            <a
              href={discordInvite}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 24px",
                borderRadius: "var(--radius-md)",
                background: "#5865f2",
                color: "#fff",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 700,
                boxShadow: "0 6px 20px rgba(88, 101, 242, 0.3)",
                transition: "opacity 0.15s ease",
              }}
            >
              <span>Join Discord Server</span>
              <ExternalLink size={15} />
            </a>
          </div>
        </div>

        {/* Email Contact Card */}
        <div
          className="card"
          style={{
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            padding: 28,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                color: "var(--color-foreground)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
              }}
            >
              <Mail size={26} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-foreground)", margin: "0 0 8px" }}>
              Contact Us via Email
            </h3>
            <p style={{ fontSize: 13, color: "var(--color-muted-foreground)", lineHeight: 1.6, margin: "0 0 12px" }}>
              For business partnerships, compliance, or account assistance, contact our administration team directly:
            </p>
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "var(--radius-md)",
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                fontFamily: "monospace",
                fontSize: 13,
                color: "var(--color-foreground)",
                fontWeight: 600,
              }}
            >
              {supportEmail}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
            <button
              type="button"
              onClick={handleCopyEmail}
              className="btn btn-secondary"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}
            >
              {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              <span>{copied ? "Copied" : "Copy Email"}</span>
            </button>

            <a
              href={`mailto:${supportEmail}`}
              className="btn btn-primary"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, textDecoration: "none" }}
            >
              <Mail size={14} />
              <span>Send Mail</span>
            </a>
          </div>
        </div>
      </div>

      {/* Security notice */}
      <div
        style={{
          padding: "16px 20px",
          borderRadius: "var(--radius-md)",
          background: "var(--color-surface-2)",
          border: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          gap: 14,
          fontSize: 13,
          color: "var(--color-muted-foreground)",
        }}
      >
        <ShieldCheck size={20} color="#10b981" style={{ flexShrink: 0 }} />
        <span>
          Vaultly administrators will never ask for your private encryption keys or account passwords. Official communications are only sent from verified channels.
        </span>
      </div>
    </div>
  );
}
