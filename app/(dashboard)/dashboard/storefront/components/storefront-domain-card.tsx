"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Globe, Search, Webhook, ArrowRight, Loader2, CheckCircle2, MessageSquare, Copy, Check, Server } from "lucide-react";

interface StorefrontDomainCardProps {
  name: string;
  shopSlug: string;
  customDomain: string;
  setCustomDomain: (val: string) => void;
  metaTitle: string;
  setMetaTitle: (val: string) => void;
  metaDescription: string;
  setMetaDescription: (val: string) => void;
  discordWebhookUrl: string;
  setDiscordWebhookUrl: (val: string) => void;
  webhookChecking: boolean;
  onVerifyWebhook: () => void;
  onTestWebhook: () => void;
}

export function StorefrontDomainCard({
  name,
  shopSlug,
  customDomain,
  setCustomDomain,
  metaTitle,
  setMetaTitle,
  metaDescription,
  setMetaDescription,
  discordWebhookUrl,
  setDiscordWebhookUrl,
  webhookChecking,
  onVerifyWebhook,
  onTestWebhook,
}: StorefrontDomainCardProps) {
  const [copiedTarget, setCopiedTarget] = useState(false);
  const cnameTarget = "cname.krypt.market";

  const cleanDomain = customDomain ? customDomain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "") : "";
  const parts = cleanDomain.split(".");
  const hostRecord = parts.length > 2 ? parts[0] : "@";

  const handleCopy = () => {
    navigator.clipboard.writeText(cnameTarget);
    setCopiedTarget(true);
    setTimeout(() => setCopiedTarget(false), 2000);
  };

  return (
    <>
      {/* Custom Domain */}
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "var(--color-foreground)",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Globe size={16} color="var(--color-primary-light)" /> Custom Domain (DNS)
          </h3>
          <span className="badge badge-secondary text-[11px]">
            {cleanDomain ? "DNS Ready" : "Optional"}
          </span>
        </div>

        <p style={{ fontSize: 13, color: "var(--color-muted-foreground)", margin: 0 }}>
          Connect your own branded domain to your store. Your standard subdomain{" "}
          <code style={{ fontSize: 12, padding: "2px 6px", borderRadius: 4, background: "var(--color-surface-2)", fontFamily: "var(--font-mono)" }}>{shopSlug}.krypt.market</code>{" "}
          will always remain active as a fallback.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label className="label">Custom Hostname</label>
          <input
            type="text"
            className="input"
            placeholder="store.yourbrand.com"
            value={customDomain}
            onChange={(e) => setCustomDomain(e.target.value)}
            style={{ fontFamily: "monospace" }}
          />
        </div>

        {cleanDomain && (
          <div
            style={{
              padding: 16,
              borderRadius: "var(--radius-md)",
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
              fontSize: 13,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 700, color: "var(--color-foreground)", display: "flex", alignItems: "center", gap: 6 }}>
                <Server size={15} color="var(--color-primary)" /> Required DNS Record
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="btn btn-secondary"
                style={{ padding: "4px 10px", fontSize: 12, gap: 6 }}
              >
                {copiedTarget ? <Check size={13} color="var(--color-success)" /> : <Copy size={13} />}
                {copiedTarget ? "Copied Target" : "Copy Target"}
              </button>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ color: "var(--color-muted-foreground)", textAlign: "left", borderBottom: "1px solid var(--color-border)" }}>
                    <th style={{ padding: "6px 8px" }}>Type</th>
                    <th style={{ padding: "6px 8px" }}>Name / Host</th>
                    <th style={{ padding: "6px 8px" }}>Value / Target</th>
                    <th style={{ padding: "6px 8px" }}>TTL</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: "8px", fontWeight: 700, color: "var(--color-primary-light)" }}>CNAME</td>
                    <td style={{ padding: "8px", fontFamily: "monospace", color: "var(--color-foreground)" }}>{hostRecord}</td>
                    <td style={{ padding: "8px", fontFamily: "monospace", color: "var(--color-foreground)" }}>{cnameTarget}</td>
                    <td style={{ padding: "8px", color: "var(--color-muted-foreground)" }}>Automatic / 3600</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ fontSize: 12, color: "var(--color-muted-foreground)", lineHeight: 1.5, borderTop: "1px solid var(--color-border)", paddingTop: 10 }}>
              • If using <strong>Cloudflare</strong>, ensure proxy status is set to <strong>DNS Only (Grey Cloud)</strong> and SSL mode is <strong>Full (Strict)</strong>.<br />
              • Once DNS propagates (typically 5-30 minutes), visitors heading to <strong>{cleanDomain}</strong> will be served your storefront directly.
            </div>
          </div>
        )}
      </div>

      {/* SEO */}
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h3
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "var(--color-foreground)",
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Search size={16} color="var(--color-primary-light)" /> SEO & Meta Tags
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label className="label">Meta Title</label>
          <input
            type="text"
            className="input"
            placeholder={`${name || "My Store"} — Digital Products`}
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            maxLength={60}
          />
          <span style={{ fontSize: 11, color: "var(--color-muted-foreground)" }}>
            {metaTitle.length}/60 characters
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label className="label">Meta Description</label>
          <textarea
            className="input"
            rows={3}
            placeholder="Describe your store for search engines..."
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            maxLength={160}
          />
          <span style={{ fontSize: 11, color: "var(--color-muted-foreground)" }}>
            {metaDescription.length}/160 characters
          </span>
        </div>
        <div
          style={{
            padding: "14px 16px",
            borderRadius: "var(--radius-md)",
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--color-muted-foreground)",
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Google Preview
          </div>
          <div style={{ fontSize: 18, color: "#1a0dab", fontWeight: 400, marginBottom: 2 }}>
            {metaTitle || `${name || "My Store"} — Digital Products`}
          </div>
          <div style={{ fontSize: 13, color: "#006621", marginBottom: 2, fontFamily: "var(--font-mono)" }}>krypt.market/{shopSlug}</div>
          <div style={{ fontSize: 13, color: "#545454" }}>
            {metaDescription || "Your storefront description will appear here in search results."}
          </div>
        </div>
      </div>

      {/* Webhooks & Alerts */}
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "rgba(99, 102, 241, 0.12)",
                border: "1px solid rgba(99, 102, 241, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#818cf8",
                flexShrink: 0,
              }}
            >
              <Webhook size={18} />
            </div>
            <div>
              <h3
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "var(--color-foreground)",
                  margin: 0,
                }}
              >
                Order & Discord Webhooks
              </h3>
              <p style={{ fontSize: 13, color: "var(--color-muted-foreground)", margin: "3px 0 0" }}>
                Send instant Discord channel alerts and API callbacks with customizable event filters.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/developer?tab=webhooks&createWebhook=true"
            className="btn btn-primary"
            style={{
              padding: "9px 16px",
              fontSize: 13,
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              textDecoration: "none",
            }}
          >
            <span>Create & Manage Webhooks</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </>
  );
}
