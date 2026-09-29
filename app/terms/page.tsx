import Link from "next/link";
import { ArrowLeft, ShieldCheck, FileText, CheckCircle2, Lock, Scale, AlertTriangle, ExternalLink } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { GlobalAnnouncementBanner } from "@/components/global-announcement-banner";

export const metadata = {
  title: "Terms of Service & Merchant Policy // KRYPT MARKET",
  description: "Platform terms of service, merchant operating guidelines, buyer protections, and acceptable use policy for Krypt Market.",
};

export default function TermsOfServicePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-background)",
        color: "var(--color-foreground)",
        fontFamily: "var(--font-mono, monospace)",
        position: "relative",
      }}
    >
      <GlobalAnnouncementBanner currentLocation="platform" />
      {/* Top HUD Command Bar */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 80,
          background: "var(--color-surface)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--color-border)",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "12px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 6,
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                color: "var(--color-foreground)",
                textDecoration: "none",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              <ArrowLeft size={13} />
              <span>Back to Krypt Hub</span>
            </Link>

            <span style={{ fontSize: 11, color: "var(--color-muted-foreground)" }}>/</span>

            <span style={{ fontSize: 12, fontWeight: 800, color: "var(--color-foreground)" }}>
              Terms of Service
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ThemeToggle />
            <Link
              href="/dashboard"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                borderRadius: 6,
                background: "linear-gradient(135deg, rgb(55, 44, 102) 0%, rgb(78, 62, 140) 100%)",
                border: "1px solid rgba(167, 139, 250, 0.4)",
                color: "#ffffff",
                textDecoration: "none",
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main
        style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: "40px 20px 80px",
          display: "flex",
          flexDirection: "column",
          gap: 28,
        }}
      >
        {/* Hero Header */}
        <div
          style={{
            padding: 28,
            borderRadius: 14,
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                background: "rgba(139, 92, 246, 0.15)",
                border: "1px solid rgba(139, 92, 246, 0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#8b5cf6",
              }}
            >
              <Scale size={20} />
            </div>
            <div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  color: "#8b5cf6",
                  textTransform: "uppercase",
                }}
              >
                Legal & Platform Agreement
              </span>
              <h1 style={{ fontSize: 24, fontWeight: 900, margin: "2px 0 0", color: "var(--color-foreground)" }}>
                KRYPT MARKET — Terms of Service
              </h1>
            </div>
          </div>
          <p style={{ fontSize: 13, color: "var(--color-muted-foreground)", lineHeight: 1.6, margin: 0 }}>
            Last revised: September 2026. By utilizing Krypt Market, hosting a storefront, or acquiring digital products, software licenses, or keys through our automated infrastructure, you acknowledge and agree to the contractual provisions detailed below.
          </p>
        </div>

        {/* Section 1: Platform Overview & Roles */}
        <div
          style={{
            padding: 24,
            borderRadius: 12,
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ShieldCheck size={18} color="#8b5cf6" />
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "var(--color-foreground)" }}>
              1. Platform Infrastructure & Facilitation
            </h2>
          </div>
          <p style={{ fontSize: 12.5, color: "var(--color-muted-foreground)", lineHeight: 1.6, margin: 0 }}>
            Krypt Market operates as a sovereign, multi-tenant digital license orchestration and merchant hosting network. Individual storefronts are managed by independent third-party vendors. Krypt Market provides the cryptographic key distribution engine, automated checkout pipeline (via Stripe and NOWPayments), and order recovery vaults.
          </p>
        </div>

        {/* Section 2: Merchant Responsibilities */}
        <div
          style={{
            padding: 24,
            borderRadius: 12,
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Lock size={18} color="#8b5cf6" />
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "var(--color-foreground)" }}>
              2. Merchant Obligations & Acceptable Use
            </h2>
          </div>
          <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8, fontSize: 12.5, color: "var(--color-muted-foreground)", lineHeight: 1.6 }}>
            <li>Merchants are strictly prohibited from distributing unauthorized malware, stolen payment methods, non-functional key batches, or fraudulent products.</li>
            <li>All merchants must provide valid customer support channels (e.g. active Discord server, Telegram contact, or support email).</li>
            <li>Merchants may configure custom store-level Terms of Service and refund policies, which must comply with baseline platform standards.</li>
            <li>Violation of platform policies results in immediate store suspension, key vault quarantine, and merchant account termination.</li>
          </ul>
        </div>

        {/* Section 3: Digital Delivery & Buyers Warranty */}
        <div
          style={{
            padding: 24,
            borderRadius: 12,
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle2 size={18} color="#22c55e" />
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "var(--color-foreground)" }}>
              3. Digital Delivery, Order Lookup & Key Access
            </h2>
          </div>
          <p style={{ fontSize: 12.5, color: "var(--color-muted-foreground)", lineHeight: 1.6, margin: 0 }}>
            Upon completed cryptographic transaction or credit card processing, digital license keys are dispatched immediately on the live receipt screen and securely delivered to the buyer's specified email address. Buyers can query their historical licenses at any time using the <strong>Find My Order</strong> portal.
          </p>
        </div>

        {/* Section 4: Refunds & Disputes */}
        <div
          style={{
            padding: 24,
            borderRadius: 12,
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <AlertTriangle size={18} color="#f59e0b" />
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "var(--color-foreground)" }}>
              4. Refund Policy & Replacement Guarantees
            </h2>
          </div>
          <p style={{ fontSize: 12.5, color: "var(--color-muted-foreground)", lineHeight: 1.6, margin: 0 }}>
            Because digital license keys are instantly revealed and usable upon generation, all sales are considered final once delivered, except in instances where a key is verified defective or invalid upon initial redemption. Buyers experiencing issues must first contact the merchant's official support desk with proof of transaction.
          </p>
        </div>

        {/* Section 5: Direct Inquiries */}
        <div
          style={{
            padding: 24,
            borderRadius: 12,
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 4px", color: "var(--color-foreground)" }}>
              Questions or Dispute Resolution?
            </h3>
            <p style={{ fontSize: 12, color: "var(--color-muted-foreground)", margin: 0 }}>
              Join the official Krypt Market Discord community or contact platform admins for vendor disputes.
            </p>
          </div>
          <a
            href="https://discord.gg/krypt"
            target="_blank"
            rel="noreferrer"
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              background: "linear-gradient(135deg, rgb(55, 44, 102) 0%, rgb(78, 62, 140) 100%)",
              border: "1px solid rgba(167, 139, 250, 0.4)",
              color: "#ffffff",
              textDecoration: "none",
              fontSize: 12,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>Official Discord</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--color-border)",
          background: "var(--color-surface)",
          padding: "24px 20px",
          textAlign: "center",
          fontSize: 11,
          color: "var(--color-muted-foreground)",
        }}
      >
        &copy; {new Date().getFullYear()} KRYPT MARKET • All Rights Reserved
      </footer>
    </div>
  );
}
