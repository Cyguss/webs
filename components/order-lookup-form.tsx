"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, Mail, Key, CheckCircle2, AlertCircle, ArrowRight, Loader2, Sparkles, Terminal, ShieldCheck, Cpu } from "lucide-react";
import { useToast } from "@/components/toast-context";

interface OrderLookupFormProps {
  initialEmail?: string;
  shopSlug?: string;
  shopName?: string;
  accentColor?: string;
}

export function OrderLookupForm({
  initialEmail = "",
  shopSlug,
  shopName,
  accentColor = "rgb(55, 44, 102)",
}: OrderLookupFormProps) {
  const toast = useToast();
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [emailSent, setEmailSent] = useState(false);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setSearched(false);
    try {
      const res = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), shopSlug }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to query order records");
      } else {
        setResults(data.orders || []);
        setEmailSent(Boolean(data.emailSent));
        setSearched(true);
        if ((data.orders || []).length === 0) {
          toast.info("No purchase records matched this mailbox.");
        } else {
          toast.success(`Found ${data.orders.length} decrypted order record(s)!`);
        }
      }
    } catch (err: any) {
      toast.error(err?.message || "Network error while retrieving records");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", width: "100%" }}>
      {/* Lookup Card */}
      <div
        style={{
          padding: 32,
          background: "var(--color-surface)",
          backdropFilter: "blur(16px)",
          border: "1px solid var(--color-border)",
          boxShadow: "var(--card-shadow)",
          borderRadius: 16,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Tactical Top Accent Indicator */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: `linear-gradient(90deg, ${accentColor} 0%, ${accentColor} 50%, rgba(255, 255, 255, 0.4) 100%)`,
          }}
        />

        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              background: `${accentColor}18`,
              border: `1px solid ${accentColor}45`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: accentColor,
              margin: "0 auto 16px",
              boxShadow: `0 0 16px ${accentColor}35`,
            }}
          >
            <Terminal size={24} />
          </div>
          <div style={{ fontSize: 10, fontFamily: "var(--font-mono, monospace)", color: accentColor, letterSpacing: "0.04em", marginBottom: 4, textTransform: "uppercase", fontWeight: 700 }}>
            Order History Lookup
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.01em", color: "var(--color-foreground)" }}>
            Find My Purchased Orders & Keys
          </h1>
          <p style={{ fontSize: 13, color: "var(--color-muted-foreground)", margin: 0, lineHeight: 1.5 }}>
            Lost your active tab or need to retrieve your license keys? Enter the email address you used during checkout.
          </p>
        </div>

        <form onSubmit={handleLookup} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ position: "relative" }}>
            <Mail
              size={16}
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                color: accentColor,
                opacity: 0.8,
              }}
            />
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                paddingLeft: 42,
                height: 46,
                fontSize: 13,
                fontFamily: "var(--font-mono, monospace)",
                borderRadius: 8,
                width: "100%",
                background: "var(--input-bg)",
                border: "1px solid var(--color-border)",
                color: "var(--color-foreground)",
                outline: "none",
                transition: "all 0.15s ease",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = accentColor;
                e.currentTarget.style.boxShadow = `0 0 12px ${accentColor}40`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--color-border)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              height: 44,
              fontSize: 12,
              fontFamily: "var(--font-mono, monospace)",
              fontWeight: 800,
              gap: 8,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              letterSpacing: "0.05em",
              cursor: loading ? "not-allowed" : "pointer",
              background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}dd 100%)`,
              border: `1px solid ${accentColor}88`,
              color: "#ffffff",
              boxShadow: `0 0 14px ${accentColor}50`,
              transition: "all 0.15s ease",
            }}
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Search size={15} />
                <span>Find Orders & Keys</span>
              </>
            )}
          </button>
        </form>

        {searched && (
          <div className="animate-slide-up" style={{ marginTop: 24, borderTop: "1px solid var(--color-border)", paddingTop: 20 }}>
            <div
              style={{
                padding: "20px",
                borderRadius: 12,
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                textAlign: "center",
                fontFamily: "var(--font-mono, monospace)",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: `${accentColor}18`,
                  border: `1px solid ${accentColor}40`,
                  color: accentColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px",
                }}
              >
                <Mail size={20} />
              </div>
              <div style={{ fontWeight: 800, fontSize: 14, color: "var(--color-foreground)", marginBottom: 6 }}>
                Recovery Dispatched
              </div>
              <p style={{ fontSize: 12, color: "var(--color-muted-foreground)", margin: "0 auto 12px", maxWidth: 420, lineHeight: 1.6 }}>
                If any completed orders were found matching <strong style={{ color: "var(--color-foreground)" }}>{email}</strong>, secure access links with your decrypted license keys have been dispatched to your inbox.
              </p>
              <div style={{ fontSize: 11, color: "var(--color-muted-foreground)" }}>
                Please check your inbox (and spam / junk folders) for your receipt link.
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 20, textAlign: "center", fontSize: 11, fontFamily: "var(--font-mono, monospace)", color: "var(--color-muted-foreground)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <ShieldCheck size={13} color={accentColor} />
        <span>Secure Order Lookup • Instant Delivery</span>
      </div>
    </div>
  );
}

