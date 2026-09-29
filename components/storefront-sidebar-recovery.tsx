"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Key, Mail, Search, Loader2, CheckCircle2, ShieldCheck, ExternalLink, RefreshCw } from "lucide-react";
import { useToast } from "@/components/toast-context";

interface StorefrontSidebarRecoveryProps {
  shopSlug: string;
  shopName: string;
  accentColor?: string;
}

export function StorefrontSidebarRecovery({
  shopSlug,
  shopName,
  accentColor = "rgb(55, 44, 102)",
}: StorefrontSidebarRecoveryProps) {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleQuickLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Invalid Destination", "Please enter a valid email address to query.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), shopSlug }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error("Query Failed", data.error || "Failed to process recovery request.");
      } else {
        setSubmitted(true);
        toast.success("Recovery Dispatched", "If matching orders exist, access links were sent to your email!");
      }
    } catch (err: any) {
      toast.error("Network Error", err?.message || "Failed to connect to recovery service.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 12,
        padding: 16,
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.06)",
      }}
    >
      {/* Top Accent Line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, ${accentColor} 0%, rgba(255, 255, 255, 0.6) 100%)`,
        }}
      />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              background: `${accentColor}18`,
              border: `1px solid ${accentColor}40`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: accentColor,
            }}
          >
            <Key size={13} />
          </div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              fontFamily: "var(--font-mono, monospace)",
              color: "var(--color-foreground)",
              letterSpacing: "0.04em",
            }}
          >
            Find My Order
          </span>
        </div>

        <span
          style={{
            fontSize: 9,
            fontFamily: "var(--font-mono, monospace)",
            color: accentColor,
            padding: "2px 6px",
            borderRadius: 4,
            background: `${accentColor}18`,
            border: `1px solid ${accentColor}35`,
            fontWeight: 700,
          }}
        >
          Instant
        </span>
      </div>

      {!submitted ? (
        <>
          <p
            style={{
              fontSize: 11.5,
              color: "var(--color-muted-foreground)",
              lineHeight: 1.45,
              marginBottom: 12,
              fontFamily: "var(--font-mono, monospace)",
            }}
          >
            Lost access to your licenses? Enter your order email below to retrieve your keys.
          </p>

          <form onSubmit={handleQuickLookup} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ position: "relative" }}>
              <Mail
                size={13}
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--color-muted-foreground)",
                  pointerEvents: "none",
                }}
              />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px 8px 30px",
                  borderRadius: 6,
                  background: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-foreground)",
                  fontSize: 11.5,
                  fontFamily: "var(--font-mono, monospace)",
                  outline: "none",
                  transition: "all 0.15s ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = accentColor;
                  e.currentTarget.style.boxShadow = `0 0 10px ${accentColor}40`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 6,
                background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}dd 100%)`,
                color: "#ffffff",
                border: `1px solid ${accentColor}88`,
                fontSize: 11,
                fontWeight: 800,
                fontFamily: "var(--font-mono, monospace)",
                letterSpacing: "0.04em",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                boxShadow: `0 0 14px ${accentColor}50`,
                transition: "all 0.15s ease",
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search size={12} />
                  <span>Find My Keys</span>
                </>
              )}
            </button>
          </form>
        </>
      ) : (
        <div
          style={{
            padding: "12px",
            borderRadius: 8,
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            textAlign: "center",
            fontFamily: "var(--font-mono, monospace)",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: "#22c55e" }}>
            <CheckCircle2 size={15} />
            <span style={{ fontSize: 12, fontWeight: 800 }}>Links Dispatched</span>
          </div>
          <p style={{ fontSize: 11, color: "var(--color-muted-foreground)", margin: 0, lineHeight: 1.45 }}>
            If matching orders exist for <strong style={{ color: "var(--color-foreground)" }}>{email}</strong>, secure access links with your keys were emailed to your inbox.
          </p>
          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              setEmail("");
            }}
            style={{
              marginTop: 4,
              padding: "5px 10px",
              borderRadius: 5,
              background: "transparent",
              border: "1px solid var(--color-border)",
              color: "var(--color-muted-foreground)",
              fontSize: 10,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              fontFamily: "var(--font-mono, monospace)",
            }}
          >
            <RefreshCw size={10} />
            <span>Search another email</span>
          </button>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
        <span style={{ fontSize: 9.5, color: "var(--color-muted-foreground)", fontFamily: "var(--font-mono, monospace)" }}>
          Instant Delivery
        </span>
        <Link
          href={`/${shopSlug}/lookup`}
          style={{
            fontSize: 10,
            color: accentColor,
            fontFamily: "var(--font-mono, monospace)",
            fontWeight: 700,
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 3,
          }}
        >
          <span>Full Portal</span>
          <ExternalLink size={10} />
        </Link>
      </div>
    </div>
  );
}
