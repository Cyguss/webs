"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Key, Mail, Search, ArrowRight, Loader2, CheckCircle2, ShieldCheck, ExternalLink, X, Lock } from "lucide-react";
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
  const [modalOpen, setModalOpen] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);

  async function handleQuickLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Invalid Destination", "Please enter a valid email address to query.");
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
        toast.error("Query Failed", data.error || "Failed to retrieve license records.");
      } else {
        setResults(data.orders || []);
        setSearched(true);
        setModalOpen(true);
        if ((data.orders || []).length === 0) {
          toast.info("No Records Found", "No orders matched this mailbox for this node.");
        } else {
          toast.success("Decryption Successful", `Retrieved ${data.orders.length} order record(s)!`);
        }
      }
    } catch (err: any) {
      toast.error("Network Error", err?.message || "Failed to connect to decryption node.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Sidebar Tactical Key Recovery Widget */}
      <div
        style={{
          background: "linear-gradient(180deg, #090812 0%, #05040a 100%)",
          border: "1px solid rgba(55, 44, 102, 0.5)",
          borderRadius: 12,
          padding: 16,
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.7)",
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
            background: "linear-gradient(90deg, rgba(139, 92, 246, 0.8) 0%, rgba(255, 255, 255, 0.6) 100%)",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: "rgba(55, 44, 102, 0.4)",
                border: "1px solid rgba(139, 92, 246, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#c4b5fd",
              }}
            >
              <Key size={13} />
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                fontFamily: "var(--font-mono, monospace)",
                color: "#ffffff",
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
              color: "#c4b5fd",
              padding: "2px 6px",
              borderRadius: 4,
              background: "rgba(55, 44, 102, 0.35)",
              border: "1px solid rgba(139, 92, 246, 0.35)",
              fontWeight: 700,
            }}
          >
            Instant
          </span>
        </div>

        <p
          style={{
            fontSize: 11.5,
            color: "rgba(255, 255, 255, 0.65)",
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
                color: "rgba(255, 255, 255, 0.5)",
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
                background: "rgba(4, 4, 6, 0.9)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "#ffffff",
                fontSize: 11.5,
                fontFamily: "var(--font-mono, monospace)",
                outline: "none",
                transition: "all 0.15s ease",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.6)";
                e.currentTarget.style.boxShadow = "0 0 10px rgba(55, 44, 102, 0.5)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)";
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
              background: "linear-gradient(135deg, rgb(55, 44, 102) 0%, rgb(78, 62, 140) 100%)",
              color: "#ffffff",
              border: "1px solid rgba(167, 139, 250, 0.45)",
              fontSize: 11,
              fontWeight: 800,
              fontFamily: "var(--font-mono, monospace)",
              letterSpacing: "0.04em",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              boxShadow: "0 0 14px rgba(55, 44, 102, 0.5)",
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

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
          <span style={{ fontSize: 9.5, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-mono, monospace)" }}>
            Instant Delivery
          </span>
          <Link
            href={`/${shopSlug}/lookup`}
            style={{
              fontSize: 10,
              color: "#c4b5fd",
              fontFamily: "var(--font-mono, monospace)",
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

      {/* Modal / Overlay for results */}
      {modalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.88)",
            backdropFilter: "blur(12px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setModalOpen(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 580,
              maxHeight: "85vh",
              overflowY: "auto",
              background: "#08080c",
              border: "1px solid rgba(55, 44, 102, 0.6)",
              borderRadius: 14,
              padding: 24,
              boxShadow: "0 25px 65px rgba(0, 0, 0, 0.95), 0 0 30px rgba(55, 44, 102, 0.3)",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ShieldCheck size={18} color="#c4b5fd" />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#ffffff", fontFamily: "var(--font-mono, monospace)" }}>
                  Order Results
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 6,
                  color: "#ffffff",
                  padding: "4px 8px",
                  cursor: "pointer",
                  display: "flex",
                }}
              >
                <X size={14} />
              </button>
            </div>

            <div style={{ marginBottom: 14, fontSize: 12, color: "rgba(255,255,255,0.6)", fontFamily: "var(--font-mono, monospace)" }}>
              Found orders for: <strong style={{ color: "#ffffff" }}>{email}</strong>
            </div>

            {results.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 16px", background: "rgba(255,255,255,0.02)", borderRadius: 10, border: "1px dashed rgba(255,255,255,0.1)" }}>
                <Lock size={28} color="#ff2a4b" style={{ margin: "0 auto 10px" }} />
                <div style={{ fontSize: 13, fontWeight: 700, color: "#ffffff", fontFamily: "var(--font-mono, monospace)" }}>
                  No Orders Found
                </div>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 6, fontFamily: "var(--font-mono, monospace)" }}>
                  No completed deliveries registered under this email address for this store.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {results.map((ord: any) => (
                  <div
                    key={ord.id}
                    style={{
                      padding: 14,
                      borderRadius: 10,
                      background: "rgba(3, 3, 5, 0.9)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#ffffff", fontFamily: "var(--font-mono, monospace)" }}>
                        {ord.productTitle || "Digital Key"}
                      </div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-mono, monospace)", marginTop: 2 }}>
                        Order ID: #{ord.id.slice(0, 10)} • {ord.formattedDate || new Date(ord.createdAt).toLocaleDateString()}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#ffffff", fontFamily: "var(--font-mono, monospace)", marginTop: 4 }}>
                        ${parseFloat(ord.totalAmount || "0").toFixed(2)} USD
                      </div>
                    </div>

                    <Link
                      href={`/order/${ord.id}`}
                      style={{
                        padding: "7px 14px",
                        borderRadius: 6,
                        background: "rgba(55, 44, 102, 0.4)",
                        border: "1px solid rgba(139, 92, 246, 0.45)",
                        color: "#c4b5fd",
                        textDecoration: "none",
                        fontSize: 11,
                        fontWeight: 800,
                        fontFamily: "var(--font-mono, monospace)",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        flexShrink: 0,
                      }}
                    >
                      <span>View Key</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
