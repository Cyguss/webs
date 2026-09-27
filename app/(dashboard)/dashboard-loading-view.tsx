"use client";

import React from "react";
import { Database, Terminal, Shield, Sparkles } from "lucide-react";

interface DashboardLoadingViewProps {
  targetPath?: string | null;
  className?: string;
}

const routeTitleMap: Record<string, string> = {
  "/dashboard": "Overview & Metrics",
  "/dashboard/products": "Products & Stock Inventory",
  "/dashboard/products/new": "Create New Product",
  "/dashboard/orders": "Orders & Live Transactions",
  "/dashboard/coupons": "Discounts & Promo Codes",
  "/dashboard/earnings": "Earnings & Payout Ledger",
  "/dashboard/analytics": "Performance & Conversion Analytics",
  "/dashboard/tickets": "Customer Support Tickets",
  "/dashboard/storefront": "Storefront & Visual Customizer",
  "/dashboard/settings": "Account & Security Settings",
  "/dashboard/inbox": "Merchant Notifications & Inbox",
  "/onboarding": "Storefront Onboarding",
};

export function getRouteTitle(targetPath?: string | null): string {
  if (!targetPath) return "Store Records";
  if (routeTitleMap[targetPath]) return routeTitleMap[targetPath];
  if (targetPath.includes("/products/new")) return "Create New Product";
  if (targetPath.includes("/keys")) return "License Keys Inventory";
  if (targetPath.includes("/edit")) return "Product Editor";
  if (targetPath.includes("/onboarding")) return "Storefront Onboarding";
  if (targetPath.startsWith("/dashboard/products/")) return "Product Details";
  return "Store Records";
}

export function DashboardLoadingView({ targetPath, className = "" }: DashboardLoadingViewProps) {
  const currentTitle = getRouteTitle(targetPath);

  return (
    <div
      className={`page-fly-in ${className}`}
      style={{
        width: "100%",
        maxWidth: 1040,
        margin: "0 auto",
        minHeight: "65vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
        padding: "36px 20px",
      }}
    >
      {/* Precision Tactical Vault Spinner */}
      <div
        style={{
          position: "relative",
          width: 88,
          height: 88,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Ambient Subtle Aura Glow (Monochromatic) */}
        <div
          style={{
            position: "absolute",
            inset: -12,
            borderRadius: "50%",
            background: "radial-gradient(circle, var(--color-primary-glow) 0%, transparent 70%)",
            animation: "stealthPulse 2.4s infinite ease-in-out",
          }}
        />

        {/* Outer Minimalist Precision Rotating Arc */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "2.5px solid transparent",
            borderTopColor: "var(--color-foreground)",
            borderRightColor: "var(--color-border-hover)",
            animation: "spinWheelForward 0.9s cubic-bezier(0.5, 0.15, 0.5, 0.85) infinite",
            filter: "drop-shadow(0 0 6px var(--color-primary-glow))",
          }}
        />

        {/* Inner Counter-Rotating Hairline Tick Ring */}
        <div
          style={{
            position: "absolute",
            inset: 9,
            borderRadius: "50%",
            border: "1.5px dashed var(--color-border)",
            borderTopColor: "var(--color-foreground-muted)",
            animation: "spinWheelBackward 1.8s linear infinite",
          }}
        />

        {/* Core Tactical Vault Indicator */}
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border-hover)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-foreground)",
            zIndex: 3,
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.25)",
            animation: "coreSubtleScale 2.4s ease-in-out infinite",
          }}
        >
          <Database size={20} color="var(--color-foreground)" />
        </div>
      </div>

      {/* Main Status Text & Live Route Badge */}
      <div style={{ textAlign: "center", maxWidth: 540 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "5px 14px",
            borderRadius: 999,
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            marginBottom: 12,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--color-success)",
              boxShadow: "0 0 8px var(--color-success)",
              display: "inline-block",
            }}
          />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: "var(--color-foreground-muted)",
              textTransform: "uppercase",
              fontFamily: "monospace",
            }}
          >
            SYNCHRONIZING SECURE STATE
          </span>
        </div>

        <h3
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: "var(--color-foreground)",
            letterSpacing: "-0.02em",
            margin: "0 0 6px 0",
          }}
        >
          Loading {currentTitle}
        </h3>

        <p
          style={{
            fontSize: 13,
            color: "var(--color-muted-foreground)",
            margin: 0,
            lineHeight: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <span>Fetching encrypted records and real-time metrics</span>
          <span className="dot-wave">
            <span>.</span><span>.</span><span>.</span>
          </span>
        </p>
      </div>

      {/* Fully Theme-Adaptive Minimalist Skeleton Table Container */}
      <div
        style={{
          width: "100%",
          maxWidth: 960,
          background: "var(--card-bg)",
          border: "1px solid var(--color-border)",
          borderRadius: 14,
          padding: "24px 28px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
          boxShadow: "var(--card-shadow, 0 10px 30px rgba(0, 0, 0, 0.15))",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Dynamic Light/Dark Shimmer Sweep */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "-100%",
            width: "200%",
            height: "100%",
            background: "linear-gradient(90deg, transparent 0%, var(--skeleton-shimmer) 50%, transparent 100%)",
            animation: "shimmerSweep 1.8s infinite linear",
            pointerEvents: "none",
          }}
        />

        {/* Skeleton Top Header Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 170, height: 18, borderRadius: 6, background: "var(--skeleton-base)" }} />
            <div style={{ width: 64, height: 16, borderRadius: 99, background: "var(--skeleton-base)", opacity: 0.7 }} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ width: 110, height: 32, borderRadius: 8, background: "var(--skeleton-base)" }} />
            <div style={{ width: 85, height: 32, borderRadius: 8, background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }} />
          </div>
        </div>

        <div style={{ height: 1, background: "var(--color-border)", opacity: 0.6 }} />

        {/* Skeleton Column Headers */}
        <div style={{ display: "grid", gridTemplateColumns: "2.2fr 1fr 1fr 1fr 100px", gap: 16, padding: "4px 0" }}>
          <div style={{ width: "55%", height: 11, borderRadius: 4, background: "var(--skeleton-base)" }} />
          <div style={{ width: "45%", height: 11, borderRadius: 4, background: "var(--skeleton-base)" }} />
          <div style={{ width: "45%", height: 11, borderRadius: 4, background: "var(--skeleton-base)" }} />
          <div style={{ width: "35%", height: 11, borderRadius: 4, background: "var(--skeleton-base)" }} />
          <div style={{ width: "60%", height: 11, borderRadius: 4, background: "var(--skeleton-base)" }} />
        </div>

        {/* Skeleton Data Rows with Staggered Widths */}
        {[
          { w1: "55%", w2: "65%", tagW: 68 },
          { w1: "42%", w2: "45%", tagW: 56 },
          { w1: "68%", w2: "50%", tagW: 72 },
          { w1: "48%", w2: "60%", tagW: 64 },
        ].map((row, idx) => (
          <div
            key={idx}
            style={{
              display: "grid",
              gridTemplateColumns: "2.2fr 1fr 1fr 1fr 100px",
              gap: 16,
              alignItems: "center",
              padding: "10px 0",
              borderTop: "1px solid var(--color-border)",
              opacity: 0.9,
            }}
          >
            {/* Title & Icon Placeholder */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  background: "var(--skeleton-base)",
                  border: "1px solid var(--color-border)",
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ width: row.w1, height: 12, borderRadius: 4, background: "var(--skeleton-base)" }} />
                <div style={{ width: row.w2, height: 9, borderRadius: 4, background: "var(--skeleton-base)", opacity: 0.6 }} />
              </div>
            </div>

            {/* Price / Type */}
            <div style={{ width: "55%", height: 12, borderRadius: 4, background: "var(--skeleton-base)" }} />

            {/* Metric */}
            <div style={{ width: "45%", height: 12, borderRadius: 4, background: "var(--skeleton-base)" }} />

            {/* Status Pill */}
            <div>
              <div
                style={{
                  width: row.tagW,
                  height: 20,
                  borderRadius: 99,
                  background: "var(--badge-neutral-bg)",
                  border: "1px solid var(--badge-neutral-border)",
                }}
              />
            </div>

            {/* Action Button */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: "var(--skeleton-base)",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes spinWheelForward {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes spinWheelBackward {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes stealthPulse {
          0%, 100% { opacity: 0.3; transform: scale(0.96); }
          50% { opacity: 0.8; transform: scale(1.14); }
        }
        @keyframes coreSubtleScale {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
        @keyframes shimmerSweep {
          0% { transform: translateX(-60%); }
          100% { transform: translateX(60%); }
        }
        .dot-wave span {
          animation: dotBlink 1.4s infinite;
          display: inline-block;
        }
        .dot-wave span:nth-child(2) {
          animation-delay: 0.25s;
        }
        .dot-wave span:nth-child(3) {
          animation-delay: 0.5s;
        }
        @keyframes dotBlink {
          0%, 20% { opacity: 0; }
          40%, 100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
