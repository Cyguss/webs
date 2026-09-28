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
          background: "linear-gradient(180deg, #090812 0%, #05040a 100%)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(55, 44, 102, 0.45)",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.8)",
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
            background: "linear-gradient(90deg, rgb(55, 44, 102) 0%, #8b5cf6 50%, rgba(255, 255, 255, 0.4) 100%)",
          }}
        />

        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              background: "rgba(55, 44, 102, 0.4)",
              border: "1px solid rgba(139, 92, 246, 0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#c4b5fd",
              margin: "0 auto 16px",
              boxShadow: "0 0 16px rgba(55, 44, 102, 0.5)",
            }}
          >
            <Terminal size={24} />
          </div>
          <div style={{ fontSize: 10, fontFamily: "var(--font-mono, monospace)", color: "#c4b5fd", letterSpacing: "0.04em", marginBottom: 4, textTransform: "uppercase" }}>
            Order History Lookup
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.01em", color: "#fff" }}>
            Find My Purchased Orders & Keys
          </h1>
          <p style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.5)", margin: 0, lineHeight: 1.5 }}>
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
                color: "#c4b5fd",
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
                background: "rgba(3, 3, 5, 0.9)",
                border: "1px solid rgba(139, 92, 246, 0.25)",
                color: "#ffffff",
                outline: "none",
                transition: "all 0.15s ease",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#8b5cf6";
                e.currentTarget.style.boxShadow = "0 0 12px rgba(139, 92, 246, 0.25)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.25)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="krypt-btn-primary"
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
              cursor: "pointer",
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
          <div className="animate-slide-up" style={{ marginTop: 24, borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: 20 }}>
            {emailSent && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "rgba(55, 44, 102, 0.35)",
                  border: "1px solid rgba(139, 92, 246, 0.45)",
                  color: "#c4b5fd",
                  fontSize: 12,
                  fontFamily: "var(--font-mono, monospace)",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 16,
                  boxShadow: "0 0 16px rgba(55, 44, 102, 0.4)",
                }}
              >
                <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
                <span>Receipt links sent to <strong>{email}</strong>.</span>
              </div>
            )}

            {results.length === 0 ? (
              <div
                style={{
                  padding: "28px 16px",
                  textAlign: "center",
                  background: "rgba(255, 255, 255, 0.02)",
                  borderRadius: 8,
                  border: "1px dashed rgba(255, 255, 255, 0.1)",
                  fontFamily: "var(--font-mono, monospace)",
                }}
              >
                <AlertCircle size={26} style={{ color: "#ef4444", margin: "0 auto 10px" }} />
                <div style={{ fontWeight: 800, fontSize: 13, color: "#fff", marginBottom: 4 }}>No Orders Found</div>
                <div style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.5)", maxWidth: 360, margin: "0 auto" }}>
                  No completed orders matching <strong>{email}</strong> were found.
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 11, fontFamily: "var(--font-mono, monospace)", fontWeight: 700, color: "rgba(255, 255, 255, 0.5)", marginBottom: 4 }}>
                  Found Orders ({results.length})
                </div>

                {results.map((ord, oIdx) => (
                  <div
                    key={ord.id}
                    style={{
                      padding: "12px 14px",
                      borderRadius: 8,
                      background: "rgba(3, 3, 5, 0.9)",
                      border: "1px solid rgba(55, 44, 102, 0.4)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 14,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 14, color: "#ffffff", display: "flex", alignItems: "center", gap: 8 }}>
                        <span>{ord.productTitle}</span>
                        <span
                          style={{
                            fontSize: 9,
                            padding: "1px 5px",
                            borderRadius: 3,
                            fontWeight: 800,
                            fontFamily: "var(--font-mono, monospace)",
                            background: ord.paymentStatus === "completed" ? "rgba(55, 44, 102, 0.4)" : "rgba(245, 158, 11, 0.15)",
                            color: ord.paymentStatus === "completed" ? "#c4b5fd" : "#fbbf24",
                            border: ord.paymentStatus === "completed" ? "1px solid rgba(139, 92, 246, 0.45)" : "1px solid rgba(245, 158, 11, 0.3)",
                          }}
                        >
                          {ord.paymentStatus.toUpperCase()}
                        </span>
                      </div>

                      <div style={{ fontSize: 11, fontFamily: "var(--font-mono, monospace)", color: "rgba(255, 255, 255, 0.5)", marginTop: 4, display: "flex", gap: 10 }}>
                        <span>Store: <strong style={{ color: "#ffffff" }}>{ord.shopName}</strong></span>
                        <span>•</span>
                        <span>Order: #{ord.shortId}</span>
                        <span>•</span>
                        <span>{new Date(ord.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 14, fontWeight: 800, fontFamily: "var(--font-mono, monospace)", color: "#ffffff" }}>
                          ${parseFloat(ord.totalAmount).toFixed(2)} {ord.currency}
                        </div>
                      </div>

                      <Link
                        href={ord.receiptUrl}
                        className="krypt-btn-primary"
                        style={{
                          padding: "6px 12px",
                          fontSize: 11,
                          fontFamily: "var(--font-mono, monospace)",
                          fontWeight: 700,
                          borderRadius: 6,
                          gap: 5,
                          display: "inline-flex",
                          alignItems: "center",
                          textDecoration: "none",
                        }}
                      >
                        <Key size={12} />
                        <span>View Order</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ marginTop: 20, textAlign: "center", fontSize: 11, fontFamily: "var(--font-mono, monospace)", color: "rgba(255, 255, 255, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <ShieldCheck size={13} color="#c4b5fd" />
        <span>Secure Order Lookup • Instant Delivery</span>
      </div>
    </div>
  );
}

