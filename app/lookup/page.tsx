import { Metadata } from "next";
import Link from "next/link";
import { OrderLookupForm } from "@/components/order-lookup-form";
import { ArrowLeft, Terminal, Cpu } from "lucide-react";

export const metadata: Metadata = {
  title: "Order Ledger Query | KRYPT MARKET",
  description: "Retrieve your purchased digital license keys and access links instantly via cryptographic ledger query.",
};

export default function GlobalOrderLookupPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#030305",
        color: "#ffffff",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {/* Tactical Background Grid */}
      <div
        className="krypt-grid-bg"
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.25,
          pointerEvents: "none",
        }}
      />

      {/* Navigation Header */}
      <header
        style={{
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "14px 24px",
          background: "rgba(8, 8, 12, 0.95)",
          backdropFilter: "blur(12px)",
          position: "relative",
          zIndex: 10,
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "#ffffff", fontWeight: 800, fontSize: 16, fontFamily: "var(--font-mono, monospace)" }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(55, 44, 102, 0.4)", border: "1px solid rgba(139, 92, 246, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", color: "#c4b5fd" }}>
              <Terminal size={15} />
            </div>
            <span>KRYPT<span style={{ color: "#c4b5fd" }}>.MARKET</span></span>
          </Link>

          <Link
            href="/"
            style={{
              fontSize: 12,
              fontFamily: "var(--font-mono, monospace)",
              color: "rgba(255, 255, 255, 0.7)",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 6,
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <ArrowLeft size={13} />
            <span>[RETURN_TO_TERMINAL]</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px", position: "relative", zIndex: 10 }}>
        <OrderLookupForm />
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(255, 255, 255, 0.06)", padding: "18px 24px", textAlign: "center", fontSize: 11, fontFamily: "var(--font-mono, monospace)", color: "rgba(255, 255, 255, 0.4)", position: "relative", zIndex: 10 }}>
        &copy; {new Date().getFullYear()} KRYPT PROTOCOL // AUTOMATED KEY DISPATCH DAEMON
      </footer>
    </div>
  );
}

