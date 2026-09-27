"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import {
  Key,
  Zap,
  Shield,
  CreditCard,
  ArrowRight,
  CheckCircle2,
  Coins,
  LayoutDashboard,
  Terminal,
  ExternalLink,
} from "lucide-react";

function DiscordLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
  );
}


export default function LandingPage() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  const DISCORD_INVITE = "https://discord.gg/vaultly";

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#07080a",
        color: "#f3f4f6",
        fontFamily: "Inter, -apple-system, sans-serif",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      {/* Subtle Ambient Glow Mesh */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "radial-gradient(ellipse 60% 40% at 50% -10%, rgba(99,102,241,0.14) 0%, rgba(0,0,0,0) 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ─── Minimalist Clean Animated Header ───────────────────────── */}
      <header
        style={{
          position: "sticky",
          top: 16,
          zIndex: 50,
          maxWidth: 1120,
          margin: "0 auto",
          padding: "0 16px",
        }}
      >
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 22px",
            borderRadius: 18,
            background: "rgba(13, 14, 19, 0.85)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 12px 36px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.03)",
          }}
        >
          {/* Brand with Terminal Badge */}
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
                width: 34,
                height: 34,
                borderRadius: 10,
                background: "linear-gradient(135deg, #181a24 0%, #0f1015 100%)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
              }}
            >
              <Terminal size={17} color="#ffffff" />
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  color: "#ffffff",
                }}
              >
                VAULTLY
              </span>
            </div>
          </Link>

          {/* Action Links */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Join Discord Button */}
            <a
              href={DISCORD_INVITE}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "8px 16px",
                borderRadius: 10,
                background: "rgba(88, 101, 242, 0.12)",
                border: "1px solid rgba(88, 101, 242, 0.3)",
                color: "#818cf8",
                fontWeight: 700,
                fontSize: 13,
                textDecoration: "none",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background = "#5865f2";
                (e.currentTarget as HTMLAnchorElement).style.color = "#ffffff";
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 4px 16px rgba(88, 101, 242, 0.4)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background = "rgba(88, 101, 242, 0.12)";
                (e.currentTarget as HTMLAnchorElement).style.color = "#818cf8";
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = "none";
              }}
            >
              <DiscordLogo size={16} />
              <span>Join Discord</span>
            </a>

            {session?.user ? (
              <Link
                href="/dashboard"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 18px",
                  borderRadius: 10,
                  background: "#ffffff",
                  color: "#000000",
                  fontWeight: 700,
                  fontSize: 13,
                  textDecoration: "none",
                  boxShadow: "0 4px 16px rgba(255, 255, 255, 0.15)",
                  transition: "transform 0.15s ease",
                }}
              >
                <LayoutDashboard size={15} />
                Open Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  style={{
                    padding: "8px 14px",
                    borderRadius: 10,
                    color: "rgba(255, 255, 255, 0.7)",
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  Sign In
                </Link>
                <Link
                  href="/dashboard"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "8px 18px",
                    borderRadius: 10,
                    background: "#ffffff",
                    color: "#000000",
                    fontWeight: 700,
                    fontSize: 13,
                    textDecoration: "none",
                    boxShadow: "0 4px 16px rgba(255, 255, 255, 0.15)",
                    transition: "all 0.15s ease",
                  }}
                >
                  <LayoutDashboard size={15} />
                  Open Dashboard
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
          maxWidth: 980,
          margin: "0 auto",
          padding: "90px 24px 60px",
          textAlign: "center",
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 0.5s ease, transform 0.5s ease",
        }}
      >
        {/* Hero Title */}
        <h1
          style={{
            fontSize: "clamp(44px, 7vw, 80px)",
            fontWeight: 900,
            lineHeight: 1.05,
            letterSpacing: "-0.04em",
            margin: "0 0 24px",
            color: "#ffffff",
          }}
        >
          Sell Digital Keys.
          <br />
          <span
            style={{
              background: "linear-gradient(135deg, #ffffff 30%, #818cf8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Zero Friction.
          </span>
        </h1>

        {/* Subtitle with corrected grammar */}
        <p
          style={{
            fontSize: "clamp(16px, 2.2vw, 19px)",
            color: "rgba(255, 255, 255, 0.65)",
            maxWidth: 620,
            margin: "0 auto 40px",
            lineHeight: 1.6,
          }}
        >
          Open your storefront in under 60 seconds. Pre-load your keys into our automated vault. We&apos;re accepting Stripe and crypto with a flat 5% platform fee.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 9,
              padding: "14px 30px",
              borderRadius: 12,
              background: "#ffffff",
              color: "#000000",
              fontWeight: 800,
              fontSize: 15,
              textDecoration: "none",
              boxShadow: "0 6px 24px rgba(255, 255, 255, 0.2)",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)";
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 10px 30px rgba(255, 255, 255, 0.25)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 6px 24px rgba(255, 255, 255, 0.2)";
            }}
          >
            <LayoutDashboard size={18} />
            Open Dashboard
          </Link>

          <Link
            href="/register"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "14px 28px",
              borderRadius: 12,
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: 15,
              textDecoration: "none",
              transition: "background 0.15s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255, 255, 255, 0.09)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255, 255, 255, 0.05)";
            }}
          >
            Start Selling Free <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ─── Supported Payment Methods ─────────────────────────────── */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1040,
          margin: "0 auto",
          padding: "20px 24px 60px",
        }}
      >
        <div
          style={{
            padding: "36px 32px",
            borderRadius: 20,
            background: "rgba(15, 16, 21, 0.6)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
          }}
        >
          {/* Clean Title */}
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#ffffff", margin: 0, letterSpacing: "-0.02em" }}>
              Supported Payment Methods
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            {/* 1. Stripe (Not Stripe Connect) */}
            <div
              className="card-hover-glow"
              style={{
                padding: "24px 22px",
                borderRadius: 14,
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: "rgba(99, 102, 241, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#818cf8",
                  }}
                >
                  <CreditCard size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: "#ffffff" }}>
                    Stripe
                  </h3>
                  <span style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.5)" }}>Direct Card Checkout</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["Cards", "Visa", "Mastercard", "Amex", "Apple Pay", "Google Pay"].map((badge) => (
                  <span
                    key={badge}
                    style={{
                      padding: "5px 11px",
                      borderRadius: 6,
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "rgba(255, 255, 255, 0.85)",
                    }}
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            {/* 2. Crypto (BTC, LTC, XMR, USDT, ETH) */}
            <div
              className="card-hover-glow"
              style={{
                padding: "24px 22px",
                borderRadius: 14,
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: "rgba(245, 158, 11, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#f59e0b",
                  }}
                >
                  <Coins size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: "#ffffff" }}>
                    Crypto
                  </h3>
                  <span style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.5)" }}>On-Chain Verification</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["BTC", "LTC", "XMR", "USDT", "ETH"].map((badge) => (
                  <span
                    key={badge}
                    style={{
                      padding: "5px 11px",
                      borderRadius: 6,
                      background: "rgba(245, 158, 11, 0.08)",
                      border: "1px solid rgba(245, 158, 11, 0.2)",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#f59e0b",
                    }}
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Core Highlights: No KYC, 5%, Keys Only ──────────────────── */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1040,
          margin: "0 auto",
          padding: "20px 24px 70px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
            gap: 16,
          }}
        >
          {[
            {
              icon: <Shield size={22} color="#818cf8" />,
              title: "Zero KYC Required",
              desc: "Sell freely without passport scans, utility bills, or invasive identity checks.",
            },
            {
              icon: <Coins size={22} color="#10b981" />,
              title: "5% Flat Commission",
              desc: "100% free to open. No monthly subscriptions, no setup fees. Only 5% on sales.",
            },
            {
              icon: <Key size={22} color="#f59e0b" />,
              title: "License Keys Only",
              desc: "Engineered specifically for digital keys, activation codes, serials, and vouchers.",
            },
            {
              icon: <Zap size={22} color="#38bdf8" />,
              title: "Instant Key Dispatch",
              desc: "Buyers see their serial immediately upon confirmation and receive an email copy.",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="card-hover-glow"
              style={{
                padding: "26px 22px",
                borderRadius: 16,
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  background: "rgba(255, 255, 255, 0.04)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                {item.icon}
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 6px", color: "#ffffff" }}>
                {item.title}
              </h3>
              <p style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.5)", lineHeight: 1.5, margin: 0 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 3-Step Flow ─────────────────────────────────────────────── */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1040,
          margin: "0 auto",
          padding: "20px 24px 70px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em" }}>
            How It Works
          </h2>
          <p style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.5)", marginTop: 6 }}>
            Three simple steps to automate your digital key sales
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 20,
          }}
        >
          {[
            {
              step: "01",
              title: "Create Storefront",
              desc: "Register in 10 seconds, choose your store name and slug. No KYC required.",
            },
            {
              step: "02",
              title: "Paste License Keys",
              desc: "Add your key inventory line-by-line. The vault securely handles distribution.",
            },
            {
              step: "03",
              title: "Collect Payments",
              desc: "Buyers check out with card or crypto. Keys deliver automatically 24/7.",
            },
          ].map((s) => (
            <div
              key={s.step}
              className="card-hover-glow"
              style={{
                padding: "28px 24px",
                borderRadius: 16,
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                position: "relative",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: "#818cf8",
                  letterSpacing: "0.08em",
                  marginBottom: 10,
                }}
              >
                STEP {s.step}
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 8px", color: "#ffffff" }}>
                {s.title}
              </h3>
              <p style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.5)", margin: 0, lineHeight: 1.5 }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Transparent 5% Pricing Card ─────────────────────────────── */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          padding: "20px 24px 80px",
        }}
      >
        <div
          className="card-hover-glow"
          style={{
            maxWidth: 680,
            margin: "0 auto",
            padding: "44px 36px",
            borderRadius: 20,
            background: "linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: "#818cf8",
              letterSpacing: "0.1em",
              marginBottom: 12,
            }}
          >
            TRANSPARENT PRICING
          </div>
          <div
            style={{
              fontSize: "clamp(64px, 12vw, 96px)",
              fontWeight: 900,
              letterSpacing: "-0.05em",
              color: "#ffffff",
              lineHeight: 1,
              marginBottom: 6,
            }}
          >
            5%
          </div>
          <div style={{ fontSize: 16, color: "rgba(255, 255, 255, 0.6)", marginBottom: 26 }}>
            Flat platform fee per successful sale. Keep 95% of your revenue.
          </div>

          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
              marginBottom: 32,
            }}
          >
            {["Zero monthly fee", "Zero setup cost", "No KYC verification", "Instant payouts"].map(
              (item) => (
                <div
                  key={item}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    color: "rgba(255, 255, 255, 0.75)",
                  }}
                >
                  <CheckCircle2 size={14} color="#10b981" />
                  {item}
                </div>
              )
            )}
          </div>

          <Link
            href="/dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "13px 28px",
              borderRadius: 12,
              background: "#ffffff",
              color: "#000000",
              fontWeight: 800,
              fontSize: 15,
              textDecoration: "none",
              boxShadow: "0 6px 20px rgba(255, 255, 255, 0.2)",
            }}
          >
            <LayoutDashboard size={17} />
            Open Dashboard
          </Link>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────── */}
      <footer
        style={{
          position: "relative",
          zIndex: 1,
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "28px 24px",
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
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 6,
                background: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#000000",
              }}
            >
              <Terminal size={14} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#ffffff" }}>VAULTLY</span>
          </div>

          <div style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.4)" }}>
            © {new Date().getFullYear()} Vaultly. All rights reserved.
          </div>

          <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
            {/* Support redirects directly to Discord invite as requested */}
            <a
              href={DISCORD_INVITE}
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: 13,
                color: "rgba(255, 255, 255, 0.6)",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 5,
                transition: "color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = "#818cf8";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255, 255, 255, 0.6)";
              }}
            >
              <span>Support</span>
              <ExternalLink size={12} />
            </a>
            <Link
              href="/dashboard"
              style={{
                fontSize: 13,
                color: "rgba(255, 255, 255, 0.6)",
                textDecoration: "none",
                transition: "color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = "#ffffff";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255, 255, 255, 0.6)";
              }}
            >
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
