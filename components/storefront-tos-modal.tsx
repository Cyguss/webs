"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Scale, X, ShieldCheck, Mail, MessageSquare, ExternalLink, FileText } from "lucide-react";

interface StorefrontTosModalProps {
  shopName: string;
  termsOfService?: string | null;
  supportEmail?: string | null;
  contactInfo?: string | null;
  discordUrl?: string | null;
  telegramUrl?: string | null;
  accentColor?: string;
}

export function StorefrontTosModal({
  shopName,
  termsOfService,
  supportEmail,
  contactInfo,
  discordUrl,
  telegramUrl,
  accentColor = "#8b5cf6",
}: StorefrontTosModalProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const defaultTos = `1. Digital License Delivery: All license keys and digital items are generated and dispatched instantly upon confirmed payment.
2. Warranty & Replacement: If a license key is invalid or non-functional upon initial receipt, please contact support within 24 hours with order reference and proof for an immediate replacement.
3. Usage & Fair Play: Purchased licenses are strictly for personal use by the buyer. Sharing, reselling, or attempting unauthorized chargebacks will result in license revocation.
4. Support Desk: For technical assistance or setup guidance, reach out via the official merchant support channels listed below.`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          color: "var(--color-muted-foreground)",
          fontSize: 11,
          fontFamily: "var(--font-mono, monospace)",
          cursor: "pointer",
          textDecoration: "underline",
          textUnderlineOffset: 3,
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          transition: "color 0.15s ease",
        }}
        onMouseOver={(e) => (e.currentTarget.style.color = "var(--color-foreground)")}
        onMouseOut={(e) => (e.currentTarget.style.color = "var(--color-muted-foreground)")}
      >
        <FileText size={12} />
        <span>Terms of Service & Refund Policy</span>
      </button>

      {open && mounted && createPortal(
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(8px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setOpen(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 580,
              maxHeight: "85vh",
              overflowY: "auto",
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 14,
              padding: 24,
              boxShadow: "0 25px 65px rgba(0, 0, 0, 0.4)",
              position: "relative",
              color: "var(--color-foreground)",
              fontFamily: "var(--font-mono, monospace)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 18,
                borderBottom: "1px solid var(--color-border)",
                paddingBottom: 14,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: `${accentColor}18`,
                    border: `1px solid ${accentColor}40`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: accentColor,
                  }}
                >
                  <Scale size={16} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>
                    {shopName} Terms & Policy
                  </h3>
                  <span style={{ fontSize: 10, color: "var(--color-muted-foreground)" }}>
                    Merchant Store Agreement
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  background: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 6,
                  color: "var(--color-foreground)",
                  padding: "4px 8px",
                  cursor: "pointer",
                  display: "flex",
                }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Terms Body */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: "var(--color-foreground)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Store Terms of Service
                </div>
                <div
                  style={{
                    padding: 14,
                    borderRadius: 8,
                    background: "var(--color-surface-2)",
                    border: "1px solid var(--color-border)",
                    fontSize: 12,
                    lineHeight: 1.6,
                    color: "var(--color-foreground)",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {termsOfService?.trim() ? termsOfService : defaultTos}
                </div>
              </div>

              {/* Merchant Contact Channels */}
              {(supportEmail || contactInfo || discordUrl || telegramUrl) && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "var(--color-foreground)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Merchant Support & Inquiries
                  </div>
                  <div
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      background: "var(--color-surface-2)",
                      border: "1px solid var(--color-border)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      fontSize: 12,
                    }}
                  >
                    {supportEmail && (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--color-muted-foreground)" }}>
                          <Mail size={13} />
                          <span>Support Email:</span>
                        </div>
                        <a
                          href={`mailto:${supportEmail}`}
                          style={{ color: accentColor, fontWeight: 700, textDecoration: "none" }}
                        >
                          {supportEmail}
                        </a>
                      </div>
                    )}

                    {contactInfo && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontSize: 11, color: "var(--color-muted-foreground)" }}>Contact Details:</span>
                        <span style={{ fontSize: 12, color: "var(--color-foreground)" }}>{contactInfo}</span>
                      </div>
                    )}

                    {discordUrl && (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <span style={{ color: "var(--color-muted-foreground)" }}>Discord Community:</span>
                        <a
                          href={discordUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: accentColor, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}
                        >
                          <span>Join Server</span>
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    )}

                    {telegramUrl && (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <span style={{ color: "var(--color-muted-foreground)" }}>Telegram:</span>
                        <a
                          href={telegramUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: accentColor, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}
                        >
                          <span>Direct Chat</span>
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Close Button */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="btn btn-secondary"
                  style={{ fontSize: 12, padding: "6px 16px" }}
                >
                  I Understand
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
