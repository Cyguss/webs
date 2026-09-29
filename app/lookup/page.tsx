import { Metadata } from "next";
import Link from "next/link";
import { OrderLookupForm } from "@/components/order-lookup-form";
import { ArrowLeft, Terminal, Cpu } from "lucide-react";
import { GlobalAnnouncementBanner } from "@/components/global-announcement-banner";

export const metadata: Metadata = {
  title: "Order Ledger Query | KRYPT MARKET",
  description: "Retrieve your purchased digital license keys and access links instantly via cryptographic ledger query.",
};

export default function GlobalOrderLookupPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-background)",
        color: "var(--color-foreground)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      <GlobalAnnouncementBanner currentLocation="platform" />
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
          borderBottom: "1px solid var(--color-border)",
          padding: "14px 24px",
          background: "var(--header-bg)",
          backdropFilter: "blur(12px)",
          position: "relative",
          zIndex: 10,
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "var(--color-foreground)", fontWeight: 800, fontSize: 16, fontFamily: "var(--font-mono, monospace)" }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(55, 44, 102, 0.2)", border: "1px solid rgba(139, 92, 246, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-primary-light)" }}>
              <Terminal size={15} />
            </div>
            <span>KRYPT<span style={{ color: "var(--color-primary-light)" }}>.MARKET</span></span>
          </Link>

          <Link
            href="/"
            style={{
              fontSize: 12,
              fontFamily: "var(--font-mono, monospace)",
              color: "var(--color-muted-foreground)",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 6,
              background: "var(--btn-ghost-bg)",
              border: "1px solid var(--color-border)",
            }}
          >
            <ArrowLeft size={13} />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px", position: "relative", zIndex: 10 }}>
        <OrderLookupForm />
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--color-border)", padding: "18px 24px", textAlign: "center", fontSize: 11, fontFamily: "var(--font-mono, monospace)", color: "var(--color-muted-foreground)", position: "relative", zIndex: 10 }}>
        &copy; {new Date().getFullYear()} KRYPT • Instant Key Delivery Protocol
      </footer>
    </div>
  );
}

