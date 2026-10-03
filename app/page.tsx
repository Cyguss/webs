"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import {
  Key,
  Zap,
  CreditCard,
  ArrowRight,
  CheckCircle2,
  Coins,
  LayoutDashboard,
  ExternalLink,
  Code2,
  Globe,
  Lock,
  ShieldCheck,
  Sparkles,
  ShoppingBag,
  Terminal,
  Bot,
  RefreshCw,
  BarChart3,
  Tag,
  Clock,
  ChevronRight,
  Server,
} from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { GlobalAnnouncementBanner } from "@/components/global-announcement-banner";

function DiscordLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

export default function LandingPage() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [feePercent, setFeePercent] = useState<number>(5);

  const DISCORD_INVITE = "https://discord.gg/krypt";

  useEffect(() => {
    setMounted(true);
    fetch("/api/platform/public")
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.platformFeePercent === "number") {
          setFeePercent(data.platformFeePercent);
        }
      })
      .catch(() => {});
  }, []);

  const isAuthenticated = Boolean(session?.user);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-background)",
        color: "var(--color-foreground)",
        fontFamily: "var(--font-sans, Inter, sans-serif)",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      <GlobalAnnouncementBanner currentLocation="home" />
      {/* Ambient Grid Background */}
      <div
        className="krypt-grid-bg"
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          opacity: 0.4,
        }}
      />

      {/* Top Ambient Violet Glow */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 1100,
          height: 420,
          background: "radial-gradient(ellipse at 50% 0%, rgba(55, 44, 102, 0.45) 0%, rgba(139, 92, 246, 0.14) 35%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ─── Navigation Header ────────────────────────────────────────── */}
      <header
        style={{
          position: "sticky",
          top: 14,
          zIndex: 50,
          maxWidth: 1100,
          margin: "0 auto",
          padding: "0 16px",
        }}
      >
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 18px",
            borderRadius: 12,
            background: "var(--header-bg)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid var(--color-border)",
            boxShadow: "var(--card-shadow)",
          }}
        >
          {/* Brand */}
          <Link
            href="/"
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-primary-light)",
                boxShadow: "0 0 12px var(--color-primary-subtle)",
              }}
            >
              <ShoppingBag size={16} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 900,
                  letterSpacing: "0.04em",
                  color: "var(--color-foreground)",
                  fontFamily: "var(--font-mono, monospace)",
                }}
              >
                KRYPT
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: "1px 5px",
                  borderRadius: 4,
                  background: "var(--color-primary-subtle)",
                  border: "1px solid var(--color-primary-glow)",
                  color: "var(--color-primary-light)",
                  fontFamily: "var(--font-mono, monospace)",
                }}
              >
                MARKET
              </span>
            </div>
          </Link>

          {/* Action Links */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link
              href="/lookup"
              className="interactive-pill"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 8,
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                color: "var(--color-foreground)",
                fontWeight: 600,
                fontSize: 12,
                textDecoration: "none",
                fontFamily: "var(--font-mono, monospace)",
              }}
            >
              <Key size={13} color="var(--color-primary-light)" />
              <span>Find My Order</span>
            </Link>

            <a
              href={DISCORD_INVITE}
              target="_blank"
              rel="noreferrer"
              className="interactive-pill"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 8,
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                color: "var(--color-foreground-muted)",
                fontWeight: 600,
                fontSize: 12,
                textDecoration: "none",
              }}
            >
              <DiscordLogo size={14} />
              <span>Discord</span>
            </a>

            <ThemeToggle />

            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="interactive-pill krypt-btn-primary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "7px 16px",
                  borderRadius: 8,
                  fontSize: 12,
                  textDecoration: "none",
                }}
              >
                <LayoutDashboard size={14} />
                <span>Dashboard</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="interactive-pill"
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    color: "var(--color-foreground-muted)",
                    fontSize: 12,
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="interactive-pill krypt-btn-primary"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 16px",
                    borderRadius: 8,
                    fontSize: 12,
                    textDecoration: "none",
                  }}
                >
                  <span>Create Store</span>
                  <ArrowRight size={13} />
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* ─── Hero Section ────────────────────────────────────────────── */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1040,
          margin: "0 auto",
          padding: "72px 24px 40px",
          textAlign: "center",
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(8px)",
          transition: "opacity 0.4s ease, transform 0.4s ease",
        }}
      >
        {/* Status Badge */}
        <div
          className="krypt-tag krypt-tag-violet animate-pop"
          style={{
            marginBottom: 20,
            padding: "5px 14px",
            borderRadius: 99,
          }}
        >
          <Sparkles size={13} />
          <span>Automated Digital Key & License E-Commerce</span>
        </div>

        {/* Hero Title */}
        <h1
          style={{
            fontSize: "clamp(34px, 5.5vw, 62px)",
            fontWeight: 900,
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
            margin: "0 0 20px",
            color: "var(--color-foreground)",
          }}
        >
          Sell Software &amp; Digital Keys with Instant 24/7 Delivery
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: "clamp(15px, 2vw, 17px)",
            color: "var(--color-muted-foreground)",
            maxWidth: 680,
            margin: "0 auto 36px",
            lineHeight: 1.6,
          }}
        >
          Launch your high-conversion storefront in minutes. Deposit serial keys, configure duration plans, and accept Card &amp; Crypto payments. We host your custom domain on Cloudflare Edge with automated SSL.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 50 }}>
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="interactive-pill krypt-btn-primary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "13px 28px",
                borderRadius: 10,
                fontSize: 14,
                textDecoration: "none",
              }}
            >
              <LayoutDashboard size={16} />
              <span>Go to Dashboard</span>
            </Link>
          ) : (
            <Link
              href="/register"
              className="interactive-pill krypt-btn-primary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "13px 28px",
                borderRadius: 10,
                fontSize: 14,
                textDecoration: "none",
              }}
            >
              <span>Create Your Store</span>
              <ArrowRight size={15} />
            </Link>
          )}
        </div>
      </section>

      {/* ─── Supported Payment Rails ───────────────────────────────────── */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1040,
          margin: "0 auto 60px",
          padding: "0 20px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 16,
          }}
        >
          {/* Card Gateway */}
          <div
            className="krypt-card"
            style={{
              padding: "24px",
              background: "var(--card-bg)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: "rgba(55, 44, 102, 0.4)",
                  border: "1px solid rgba(139, 92, 246, 0.45)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#c4b5fd",
                }}
              >
                <CreditCard size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--color-foreground)" }}>
                  Credit &amp; Debit Card Checkout
                </h3>
                <span style={{ fontSize: 11, color: "var(--color-muted-foreground)" }}>
                  Stripe Card, Apple Pay &amp; Google Pay
                </span>
              </div>
            </div>
            <p style={{ fontSize: 13, color: "var(--color-muted-foreground)", margin: "0 0 16px", lineHeight: 1.5 }}>
              Process major card payments securely with 3D Secure verification and zero customer friction.
            </p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["VISA", "MASTERCARD", "AMEX", "APPLE PAY", "GOOGLE PAY"].map((badge) => (
                <span key={badge} className="krypt-tag krypt-tag-violet">
                  {badge}
                </span>
              ))}
            </div>
          </div>

          {/* Crypto Rails */}
          <div
            className="krypt-card"
            style={{
              padding: "24px",
              background: "var(--card-bg)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: "rgba(55, 44, 102, 0.4)",
                  border: "1px solid rgba(139, 92, 246, 0.45)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#c4b5fd",
                }}
              >
                <Coins size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--color-foreground)" }}>
                  Cryptocurrency Invoicing
                </h3>
                <span style={{ fontSize: 11, color: "var(--color-muted-foreground)" }}>
                  Direct Automated Blockchain Settlements
                </span>
              </div>
            </div>
            <p style={{ fontSize: 13, color: "var(--color-muted-foreground)", margin: "0 0 16px", lineHeight: 1.5 }}>
              Accept decentralized payments with automated address generation, instant mempool detection, and 0 chargebacks.
            </p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["BTC", "LTC", "XMR", "USDT", "ETH", "SOL"].map((coin) => (
                <span key={coin} className="krypt-tag krypt-tag-violet">
                  {coin}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Merchant Suite & Store Operations ───────────── */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1040,
          margin: "0 auto 70px",
          padding: "0 20px",
        }}
      >
        <div style={{ textAlign: "left", marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--color-primary-light)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4, fontFamily: "var(--font-mono, monospace)" }}>
            Merchant Suite &amp; Operations
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: "var(--color-foreground)", letterSpacing: "-0.02em", margin: "0 0 8px" }}>
            The Operating System for Digital Goods
          </h2>
          <p style={{ fontSize: 14, color: "var(--color-muted-foreground)", margin: 0, maxWidth: 640 }}>
            Everything you need to automate orders, manage serial pools, protect license keys, and scale your brand without technical friction.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
            gap: 16,
          }}
        >
          {/* Card 1: Custom Domains */}
          <div
            className="krypt-card"
            style={{
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              background: "var(--card-bg)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 8,
                  background: "rgba(55, 44, 102, 0.4)",
                  border: "1px solid rgba(139, 92, 246, 0.45)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#c4b5fd",
                }}
              >
                <Globe size={19} />
              </div>
              <span className="krypt-tag krypt-tag-violet" style={{ fontSize: 10 }}>
                WE HOST FOR YOU
              </span>
            </div>

            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--color-foreground)", margin: "0 0 6px" }}>
                Custom Domains &amp; Edge CDN
              </h3>
              <p style={{ fontSize: 13, color: "var(--color-muted-foreground)", margin: 0, lineHeight: 1.5 }}>
                Connect your brand domain (<code style={{ color: "var(--color-primary-light)" }}>store.yourbrand.com</code>) with 1 click. We host everything on our global edge network with automatic SSL certificates and DDoS protection.
              </p>
            </div>
          </div>

          {/* Card 2: Multi-Duration Key Vault */}
          <div
            className="krypt-card"
            style={{
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              background: "var(--card-bg)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 8,
                  background: "rgba(55, 44, 102, 0.4)",
                  border: "1px solid rgba(139, 92, 246, 0.45)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#c4b5fd",
                }}
              >
                <Clock size={19} />
              </div>
              <span className="krypt-tag krypt-tag-violet" style={{ fontSize: 10 }}>
                DAY / MONTH / LIFETIME
              </span>
            </div>

            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--color-foreground)", margin: "0 0 6px" }}>
                Multi-Duration Key Vaults
              </h3>
              <p style={{ fontSize: 13, color: "var(--color-muted-foreground)", margin: 0, lineHeight: 1.5 }}>
                Set separate stock pools and distinct prices for Daily, Weekly, Monthly, and Lifetime tiers under a single product listing. Paste serials in bulk line-by-line.
              </p>
            </div>
          </div>

          {/* Card 3: Instant 0-Second Delivery */}
          <div
            className="krypt-card"
            style={{
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              background: "var(--card-bg)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 8,
                  background: "rgba(55, 44, 102, 0.4)",
                  border: "1px solid rgba(139, 92, 246, 0.45)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#c4b5fd",
                }}
              >
                <Zap size={19} />
              </div>
              <span className="krypt-tag krypt-tag-violet" style={{ fontSize: 10 }}>
                0-SECOND DISPATCH
              </span>
            </div>

            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--color-foreground)", margin: "0 0 6px" }}>
                Automated Fulfillment &amp; Anti-Duplicate
              </h3>
              <p style={{ fontSize: 13, color: "var(--color-muted-foreground)", margin: 0, lineHeight: 1.5 }}>
                Keys are automatically assigned and revealed instantly upon confirmed payment. Built-in atomic locking guarantees zero double-sells across all traffic spikes.
              </p>
            </div>
          </div>

          {/* Card 4: HMAC Webhooks & API */}
          <div
            className="krypt-card"
            style={{
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              background: "var(--card-bg)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 8,
                  background: "rgba(55, 44, 102, 0.4)",
                  border: "1px solid rgba(139, 92, 246, 0.45)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#c4b5fd",
                }}
              >
                <Code2 size={19} />
              </div>
              <span className="krypt-tag krypt-tag-violet" style={{ fontSize: 10 }}>
                HMAC-SHA256
              </span>
            </div>

            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--color-foreground)", margin: "0 0 6px" }}>
                Developer Webhooks &amp; REST API
              </h3>
              <p style={{ fontSize: 13, color: "var(--color-muted-foreground)", margin: 0, lineHeight: 1.5 }}>
                Trigger external loaders, server APIs, and backend auth databases with cryptographically signed order payloads and customizable retry policies.
              </p>
            </div>
          </div>

          {/* Card 5: Discord Community Sync */}
          <div
            className="krypt-card"
            style={{
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              background: "var(--card-bg)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 8,
                  background: "rgba(55, 44, 102, 0.4)",
                  border: "1px solid rgba(139, 92, 246, 0.45)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#c4b5fd",
                }}
              >
                <Bot size={19} />
              </div>
              <span className="krypt-tag krypt-tag-violet" style={{ fontSize: 10 }}>
                AUTO-ROLE SYNC
              </span>
            </div>

            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--color-foreground)", margin: "0 0 6px" }}>
                Discord Server &amp; Social Widgets
              </h3>
              <p style={{ fontSize: 13, color: "var(--color-muted-foreground)", margin: 0, lineHeight: 1.5 }}>
                Display live online community member counts, showcase verified buyer reviews, and link your Telegram, YouTube, and Trustpilot channels directly.
              </p>
            </div>
          </div>

          {/* Card 6: Self-Service Order Lookup */}
          <div
            className="krypt-card"
            style={{
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              background: "var(--card-bg)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 8,
                  background: "rgba(55, 44, 102, 0.4)",
                  border: "1px solid rgba(139, 92, 246, 0.45)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#c4b5fd",
                }}
              >
                <Key size={19} />
              </div>
              <span className="krypt-tag krypt-tag-violet" style={{ fontSize: 10 }}>
                ZERO SUPPORT TICKETS
              </span>
            </div>

            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--color-foreground)", margin: "0 0 6px" }}>
                Self-Service Key Recovery
              </h3>
              <p style={{ fontSize: 13, color: "var(--color-muted-foreground)", margin: 0, lineHeight: 1.5 }}>
                Customers can lookup and retrieve all past keys and receipt links with their email anytime, eliminating 90% of routine support requests.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3-Step Workflow ──────────────────────────────────────────── */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1040,
          margin: "0 auto 70px",
          padding: "0 20px",
        }}
      >
        <div style={{ textAlign: "left", marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--color-primary-light)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4, fontFamily: "var(--font-mono, monospace)" }}>
            Quick Setup
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--color-foreground)", letterSpacing: "-0.02em", margin: 0 }}>
            Start Selling in 3 Simple Steps
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {[
            {
              phase: "01",
              title: "Create Store & Domain",
              desc: "Pick your store URL or link your own custom domain. We automatically host and secure it on Cloudflare edge.",
              tag: "FREE HOSTING",
            },
            {
              phase: "02",
              title: "Add Products & Keys",
              desc: "Paste license serials line-by-line. Configure duration tiers (Daily, Weekly, Monthly, Lifetime) with custom prices.",
              tag: "INVENTORY",
            },
            {
              phase: "03",
              title: "Instant 24/7 Delivery",
              desc: "Accept Card & Crypto payments. Customers receive their unique license key immediately on-screen and by email.",
              tag: "AUTOMATED",
            },
          ].map((s) => (
            <div
              key={s.phase}
              className="krypt-card"
              style={{
                padding: "22px",
                background: "var(--card-bg)",
                border: "1px solid var(--color-border)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 900,
                    fontFamily: "var(--font-mono, monospace)",
                    color: "var(--color-primary-light)",
                  }}
                >
                  STEP {s.phase}
                </span>
                <span className="krypt-tag krypt-tag-violet" style={{ fontSize: 9 }}>
                  {s.tag}
                </span>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 8px", color: "var(--color-foreground)" }}>
                {s.title}
              </h3>
              <p style={{ fontSize: 13, color: "var(--color-muted-foreground)", margin: 0, lineHeight: 1.5 }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Transparent 5% Platform Fee Card ─────────────────────────── */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 680,
          margin: "0 auto 80px",
          padding: "0 20px",
        }}
      >
        <div
          className="krypt-card"
          style={{
            padding: "40px 32px",
            textAlign: "center",
            background: "var(--card-bg)",
            border: "1px solid var(--color-border)",
            boxShadow: "var(--card-shadow)",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--color-primary-light)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8, fontFamily: "var(--font-mono, monospace)" }}>
            TRANSPARENT PRICING
          </div>
          <div
            style={{
              fontSize: 64,
              fontWeight: 900,
              letterSpacing: "-0.04em",
              color: "var(--color-foreground)",
              lineHeight: 1,
              marginBottom: 6,
              fontFamily: "var(--font-mono, monospace)",
            }}
          >
            {feePercent}%
          </div>
          <p style={{ fontSize: 14, color: "var(--color-muted-foreground)", margin: "0 auto 24px", maxWidth: 460, lineHeight: 1.5 }}>
            Flat platform fee per completed checkout (+ payment processing fees). Zero monthly subscription, free custom domain hosting, fast payouts.
          </p>

          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "center",
              flexWrap: "wrap",
              marginBottom: 28,
            }}
          >
            {["ZERO MONTHLY RENT", "CUSTOM DOMAIN HOSTING", "INSTANT KEY DISPATCH", "FAST PAYOUTS"].map((item) => (
              <div
                key={item}
                className="krypt-tag krypt-tag-violet"
              >
                <CheckCircle2 size={12} />
                <span>{item}</span>
              </div>
            ))}
          </div>

          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="interactive-pill krypt-btn-primary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 28px",
                borderRadius: 8,
                fontSize: 13,
                textDecoration: "none",
              }}
            >
              <LayoutDashboard size={15} />
              <span>Go to Dashboard</span>
            </Link>
          ) : (
            <Link
              href="/register"
              className="interactive-pill krypt-btn-primary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 28px",
                borderRadius: 8,
                fontSize: 13,
                textDecoration: "none",
              }}
            >
              <span>Create Your Store</span>
              <ArrowRight size={14} />
            </Link>
          )}
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────── */}
      <footer
        style={{
          position: "relative",
          zIndex: 1,
          borderTop: "1px solid var(--color-border)",
          padding: "28px 20px",
          background: "var(--header-bg)",
        }}
      >
        <div
          style={{
            maxWidth: 1040,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
            fontSize: 12,
            fontFamily: "var(--font-mono, monospace)",
            color: "var(--color-muted-foreground)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 800, color: "var(--color-foreground)" }}>KRYPT MARKET</span>
            <span>&bull;</span>
            <span style={{ color: "var(--color-primary-light)" }}>Digital Key &amp; License E-Commerce</span>
          </div>

          <div>&copy; {new Date().getFullYear()} KRYPT. All rights reserved.</div>

          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <Link
              href="/lookup"
              style={{
                color: "var(--color-primary-light)",
                textDecoration: "none",
              }}
            >
              Order Lookup
            </Link>

            <Link
              href="/terms"
              style={{
                color: "var(--color-muted-foreground)",
                textDecoration: "none",
              }}
            >
              Terms of Service
            </Link>

            <a
              href={DISCORD_INVITE}
              target="_blank"
              rel="noreferrer"
              style={{
                color: "var(--color-muted-foreground)",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span>Discord</span>
              <ExternalLink size={11} />
            </a>

            {isAuthenticated ? (
              <Link
                href="/dashboard"
                style={{
                  color: "var(--color-primary-light)",
                  textDecoration: "none",
                  fontWeight: 700,
                }}
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  style={{
                    color: "var(--color-muted-foreground)",
                    textDecoration: "none",
                  }}
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  style={{
                    color: "var(--color-primary-light)",
                    textDecoration: "none",
                    fontWeight: 700,
                  }}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
