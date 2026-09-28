import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Terminal, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-background)",
        color: "var(--color-foreground)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "36px 20px",
        position: "relative",
        backgroundImage: "radial-gradient(var(--color-border) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }}
    >
      {/* Top Corner Controls */}
      <div style={{ position: "absolute", top: 20, right: 24, zIndex: 10 }}>
        <ThemeToggle />
      </div>

      {/* Brand Header */}
      <Link
        href="/"
        title="Return to Home"
        style={{
          textDecoration: "none",
          marginBottom: 32,
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: "#030305",
            border: "1px solid rgba(139, 92, 246, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#c4b5fd",
            boxShadow: "0 0 16px rgba(55, 44, 102, 0.4)",
          }}
        >
          <Terminal size={18} />
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontWeight: 900,
              fontSize: 18,
              color: "#ffffff",
              letterSpacing: "0.06em",
              fontFamily: "var(--font-mono)",
            }}
          >
            KRYPT<span style={{ color: "#c4b5fd" }}>.MARKET</span>
          </span>
          <span style={{ fontSize: 9.5, color: "#8b949e", letterSpacing: "0.18em", fontFamily: "var(--font-mono)" }}>
            MERCHANT PROTOCOL
          </span>
        </div>
      </Link>

      {/* Main Auth Form Container */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          zIndex: 1,
        }}
      >
        {children}
      </div>

      {/* High-End Darkmarket Gateway Indicator */}
      <div
        style={{
          marginTop: 28,
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 11,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          color: "#4b5563",
          letterSpacing: "0.03em",
        }}
      >
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: "#10b981",
            boxShadow: "0 0 6px rgba(16, 185, 129, 0.6)",
          }}
        />
        <span>TLS ENCRYPTED ACCESS • ZERO-KNOWLEDGE MERCHANT AUTH</span>
      </div>
    </div>
  );
}
