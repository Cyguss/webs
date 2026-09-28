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
} from "lucide-react";

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

  const DISCORD_INVITE = "https://discord.gg/krypt";

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAuthenticated = Boolean(session?.user);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#030305",
        color: "#ffffff",
        fontFamily: "var(--font-sans, Inter, sans-serif)",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      {/* Cyber Grid & Ambient Background */}
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

      {/* Top Ambient Glow */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 1000,
          height: 380,
          background: "radial-gradient(ellipse at 50% 0%, rgba(55, 44, 102, 0.4) 0%, rgba(139, 92, 246, 0.12) 35%, transparent 70%)",
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
          maxWidth: 1080,
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
            background: "rgba(5, 5, 8, 0.92)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(55, 44, 102, 0.45)",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.8)",
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
                background: "#08080c",
                border: "1px solid rgba(139, 92, 246, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#c4b5fd",
                boxShadow: "0 0 12px rgba(55, 44, 102, 0.5)",
              }}
            >
              <ShoppingBag size={16} />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 900,
                    letterSpacing: "0.04em",
                    color: "#ffffff",
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
                    background: "rgba(55, 44, 102, 0.4)",
                    border: "1px solid rgba(139, 92, 246, 0.4)",
                    color: "#c4b5fd",
                    fontFamily: "var(--font-mono, monospace)",
                  }}
                >
                  MARKET
                </span>
              </div>
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
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                color: "#c4b5fd",
                fontWeight: 600,
                fontSize: 12,
                textDecoration: "none",
                fontFamily: "var(--font-mono, monospace)",
              }}
            >
              <Key size={13} />
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
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                color: "#9ca3af",
                fontWeight: 600,
                fontSize: 12,
                textDecoration: "none",
              }}
            >
              <DiscordLogo size={14} />
              <span>Discord</span>
            </a>

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
                    color: "#9ca3af",
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
          maxWidth: 960,
          margin: "0 auto",
          padding: "80px 24px 40px",
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
            marginBottom: 24,
            padding: "5px 14px",
            borderRadius: 99,
          }}
        >
          <Sparkles size={13} />
          <span>Automated Digital Key & License Delivery</span>
        </div>

        {/* Hero Title */}
        <h1
          style={{
            fontSize: "clamp(34px, 5.5vw, 64px)",
            fontWeight: 900,
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
            margin: "0 0 20px",
            color: "#ffffff",
          }}
        >
          The Modern E-Commerce Platform for Digital Goods
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: "clamp(15px, 2vw, 17px)",
            color: "#8b949e",
            maxWidth: 620,
            margin: "0 auto 36px",
            lineHeight: 1.6,
          }}
        >
          Launch your automated store in minutes. Deposit software serials, license keys, and accounts. Accept Card and Crypto payments with zero-delay instant key fulfillment.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 48 }}>
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
            <>
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
              <Link
                href="/login"
                className="interactive-pill"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "13px 24px",
                  borderRadius: 10,
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: 14,
                  textDecoration: "none",
                }}
              >
                Sign In
              </Link>
            </>
          )}
        </div>

        {/* Highlights Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14,
            maxWidth: 820,
            margin: "0 auto",
          }}
        >
          <div className="krypt-card" style={{ padding: "18px 20px", textAlign: "left" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#c4b5fd", fontFamily: "var(--font-mono)", marginBottom: 4 }}>
              INSTANT DELIVERY
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#ffffff", marginBottom: 4 }}>
              0-Second Dispatch
            </div>
            <div style={{ fontSize: 12, color: "#8b949e", lineHeight: 1.4 }}>
              Keys revealed on-screen and emailed instantly upon payment confirmation.
            </div>
          </div>

          <div className="krypt-card" style={{ padding: "18px 20px", textAlign: "left" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#c4b5fd", fontFamily: "var(--font-mono)", marginBottom: 4 }}>
              MULTIPLE DURATION TIERS
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#ffffff", marginBottom: 4 }}>
              Day / Week / Month / Lifetime
            </div>
            <div style={{ fontSize: 12, color: "#8b949e", lineHeight: 1.4 }}>
              Separate stock vaults and custom pricing for every license duration.
            </div>
          </div>

          <div className="krypt-card" style={{ padding: "18px 20px", textAlign: "left" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#c4b5fd", fontFamily: "var(--font-mono)", marginBottom: 4 }}>
              ZERO DOUBLE-SELLS
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#ffffff", marginBottom: 4 }}>
              Single-Use Key Vault
            </div>
            <div style={{ fontSize: 12, color: "#8b949e", lineHeight: 1.4 }}>
              Mathematical lock on key delivery prevents duplicate deliveries forever.
            </div>
          </div>
        </div>
      </section>

      {/* ─── Supported Payment Rails ───────────────────────────────────── */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 960,
          margin: "40px auto 60px",
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
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#ffffff" }}>
                  Card Checkout Gateway
                </h3>
                <span style={{ fontSize: 11, color: "#8b949e" }}>
                  Stripe Card & Digital Wallets
                </span>
              </div>
            </div>
            <p style={{ fontSize: 13, color: "#8b949e", margin: "0 0 16px", lineHeight: 1.5 }}>
              Process credit and debit card payments securely with bank-grade encrypted checkout tunnels.
            </p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["VISA", "MASTERCARD", "AMEX", "APPLE PAY", "GOOGLE PAY"].map((badge) => (
                <span
                  key={badge}
                  className="krypt-tag krypt-tag-violet"
                >
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
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#ffffff" }}>
                  Cryptocurrency Payments
                </h3>
                <span style={{ fontSize: 11, color: "#8b949e" }}>
                  Automated Blockchain Invoicing
                </span>
              </div>
            </div>
            <p style={{ fontSize: 13, color: "#8b949e", margin: "0 0 16px", lineHeight: 1.5 }}>
              Native crypto invoicing with zero chargeback risk and direct automated payment confirmation.
            </p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["BTC", "LTC", "XMR", "USDT", "ETH", "SOL"].map((coin) => (
                <span
                  key={coin}
                  className="krypt-tag krypt-tag-violet"
                >
                  {coin}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3-Step Workflow ──────────────────────────────────────────── */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 960,
          margin: "0 auto 60px",
          padding: "0 20px",
        }}
      >
        <div style={{ textAlign: "left", marginBottom: 20 }}>
          <div className="krypt-hud-label" style={{ marginBottom: 4 }}>
            HOW IT WORKS
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em", margin: 0 }}>
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
              phase: "STEP 01",
              title: "Create Your Store",
              desc: "Set up your storefront URL, custom branding, logo, and optional custom domain.",
              tag: "SETUP",
            },
            {
              phase: "STEP 02",
              title: "Add Products & Keys",
              desc: "Paste license keys line-by-line. Set duration tiers (Daily, Weekly, Monthly, Lifetime).",
              tag: "INVENTORY",
            },
            {
              phase: "STEP 03",
              title: "Automated Instant Delivery",
              desc: "Buyers complete checkout. One unique key is unlocked and delivered immediately 24/7.",
              tag: "AUTOMATION",
            },
          ].map((s) => (
            <div
              key={s.phase}
              className="krypt-card"
              style={{
                padding: "22px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    fontFamily: "var(--font-mono, monospace)",
                    color: "#c4b5fd",
                  }}
                >
                  {s.phase}
                </span>
                <span className="krypt-tag krypt-tag-violet" style={{ fontSize: 9 }}>
                  {s.tag}
                </span>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 8px", color: "#ffffff" }}>
                {s.title}
              </h3>
              <p style={{ fontSize: 13, color: "#8b949e", margin: 0, lineHeight: 1.5 }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Security Matrix & Merchant Controls ──────────────────────── */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 960,
          margin: "0 auto 60px",
          padding: "0 20px",
        }}
      >
        <div style={{ textAlign: "left", marginBottom: 20 }}>
          <div className="krypt-hud-label" style={{ marginBottom: 4 }}>
            FEATURES & SECURITY
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em", margin: 0 }}>
            Built for High-Volume Digital Sellers
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          <div className="krypt-card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, color: "#c4b5fd" }}>
              <Key size={17} />
              <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--font-mono, monospace)" }}>Single-Use Key Vault</span>
            </div>
            <p style={{ fontSize: 13, color: "#8b949e", margin: 0, lineHeight: 1.5 }}>
              Each serial is marked as delivered automatically upon payment, mathematically preventing double-sells.
            </p>
          </div>

          <div className="krypt-card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, color: "#ffffff" }}>
              <Globe size={17} />
              <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--font-mono, monospace)" }}>Custom Domains</span>
            </div>
            <p style={{ fontSize: 13, color: "#8b949e", margin: 0, lineHeight: 1.5 }}>
              Connect your branded domain or subdomain directly with automatic SSL certificate provisioning.
            </p>
          </div>

          <div className="krypt-card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, color: "#c4b5fd" }}>
              <Code2 size={17} />
              <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--font-mono, monospace)" }}>HMAC Webhooks</span>
            </div>
            <p style={{ fontSize: 13, color: "#8b949e", margin: 0, lineHeight: 1.5 }}>
              Cryptographically signed HMAC-SHA256 order webhooks for Discord bot role assignments or external server automation.
            </p>
          </div>

          <div className="krypt-card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, color: "#ffffff" }}>
              <Lock size={17} />
              <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--font-mono, monospace)" }}>TOTP 2FA Security</span>
            </div>
            <p style={{ fontSize: 13, color: "#8b949e", margin: 0, lineHeight: 1.5 }}>
              Protect merchant settings, API credentials, and payout destinations with multi-factor authentication.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Transparent 5% Platform Fee Card ─────────────────────────── */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 640,
          margin: "0 auto 80px",
          padding: "0 20px",
        }}
      >
        <div
          className="krypt-card"
          style={{
            padding: "40px 32px",
            textAlign: "center",
            border: "1px solid rgba(55, 44, 102, 0.5)",
            boxShadow: "0 0 30px rgba(55, 44, 102, 0.35)",
          }}
        >
          <div className="krypt-hud-label" style={{ marginBottom: 8, color: "#c4b5fd" }}>
            TRANSPARENT PRICING
          </div>
          <div
            style={{
              fontSize: 64,
              fontWeight: 900,
              letterSpacing: "-0.04em",
              color: "#ffffff",
              lineHeight: 1,
              marginBottom: 6,
              fontFamily: "var(--font-mono, monospace)",
            }}
          >
            5%
          </div>
          <p style={{ fontSize: 14, color: "#8b949e", margin: "0 auto 24px", maxWidth: 420 }}>
            Flat platform fee per completed checkout. Keep 95% of your sales. No subscriptions, zero hidden charges.
          </p>

          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
              marginBottom: 28,
            }}
          >
            {["ZERO SETUP FEES", "ZERO MONTHLY RENT", "INSTANT DISPATCH", "FAST PAYOUTS"].map((item) => (
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
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "28px 20px",
          background: "#020305",
        }}
      >
        <div
          style={{
            maxWidth: 960,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
            fontSize: 12,
            fontFamily: "var(--font-mono, monospace)",
            color: "#6b7280",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 800, color: "#ffffff" }}>KRYPT MARKET</span>
            <span>//</span>
            <span style={{ color: "#c4b5fd" }}>DIGITAL GOODS & KEYS</span>
          </div>

          <div>&copy; {new Date().getFullYear()} KRYPT. All rights reserved.</div>

          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <Link
              href="/lookup"
              style={{
                color: "#c4b5fd",
                textDecoration: "none",
              }}
            >
              Order Lookup
            </Link>

            <a
              href={DISCORD_INVITE}
              target="_blank"
              rel="noreferrer"
              style={{
                color: "#9ca3af",
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
                  color: "#c4b5fd",
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
                    color: "#9ca3af",
                    textDecoration: "none",
                  }}
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  style={{
                    color: "#c4b5fd",
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
