"use client";

import React, { useState } from "react";
import { Mail, MessageSquare, Copy, Check, ExternalLink, Clock, Headphones, Info } from "lucide-react";
import { DiscordIcon, TelegramIcon } from "@/app/(dashboard)/dashboard/storefront/components/storefront-constants";
import { parseMerchantSupport } from "@/lib/support-channels";

interface StorefrontSupportChannelsProps {
  supportEmail?: string | null;
  discordUrl?: string | null;
  telegramUrl?: string | null;
  contactInfo?: string | null;
  discordPresenceCount?: number | null;
  accentColor?: string;
}

export function StorefrontSupportChannels({
  supportEmail,
  discordUrl,
  telegramUrl,
  contactInfo,
  discordPresenceCount,
  accentColor = "#8b5cf6",
}: StorefrontSupportChannelsProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const support = parseMerchantSupport({
    supportEmail,
    discordUrl,
    telegramUrl,
    contactInfo,
  });

  // When no support details are provided, render NOTHING
  if (!support.hasAnySupport) {
    return null;
  }

  return (
    <div
      style={{
        paddingTop: 12,
        borderTop: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Headphones size={13} color={accentColor} />
          <span style={{ fontSize: 10, fontWeight: 800, color: "var(--color-muted-foreground)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Support Channels
          </span>
        </div>
        <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}35` }}>
          Direct Help
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {/* Discord Support */}
        {support.discord && (
          support.discord.type === "server" && support.discord.href ? (
            <a
              href={support.discord.href}
              target="_blank"
              rel="noreferrer"
              style={{
                padding: "8px 11px",
                borderRadius: 8,
                background: `${accentColor}18`,
                border: `1px solid ${accentColor}35`,
                color: "var(--color-foreground)",
                textDecoration: "none",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: 11,
                fontWeight: 700,
                transition: "all 0.15s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <DiscordIcon size={14} color={accentColor} />
                <span>Discord Server</span>
              </div>
              <span style={{ fontSize: 9.5, color: accentColor, display: "flex", alignItems: "center", gap: 4 }}>
                <span>Join</span>
                <ExternalLink size={10} />
              </span>
            </a>
          ) : support.discord.href ? (
            <div
              style={{
                padding: "8px 11px",
                borderRadius: 8,
                background: `${accentColor}18`,
                border: `1px solid ${accentColor}35`,
                color: "var(--color-foreground)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: 11,
                fontWeight: 700,
                transition: "all 0.15s ease",
              }}
            >
              <a
                href={support.discord.href}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "var(--color-foreground)",
                  textDecoration: "none",
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <DiscordIcon size={14} color={accentColor} />
                <span>Discord User</span>
              </a>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <a
                  href={support.discord.href}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: 9.5,
                    color: accentColor,
                    textDecoration: "none",
                    maxWidth: 110,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {support.discord.handle || "Profile"}
                </a>
                <button
                  type="button"
                  onClick={(e) => copyToClipboard(support.discord!.handle || support.discord!.value, "discord", e)}
                  style={{
                    background: "transparent",
                    border: "none",
                    padding: 2,
                    cursor: "pointer",
                    color: accentColor,
                    display: "flex",
                    alignItems: "center",
                  }}
                  title="Copy Discord handle"
                >
                  {copiedKey === "discord" ? <Check size={11} color="#22c55e" /> : <Copy size={11} />}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={(e) => copyToClipboard(support.discord!.handle || support.discord!.value, "discord", e)}
              style={{
                padding: "8px 11px",
                borderRadius: 8,
                background: `${accentColor}18`,
                border: `1px solid ${accentColor}35`,
                color: "var(--color-foreground)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                width: "100%",
                textAlign: "left",
                transition: "all 0.15s ease",
              }}
              title="Click to copy Discord handle"
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <DiscordIcon size={14} color={accentColor} />
                <span>Discord User</span>
              </div>
              <span style={{ fontSize: 9.5, color: accentColor, display: "flex", alignItems: "center", gap: 4, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {copiedKey === "discord" ? (
                  <>
                    <Check size={11} color="#22c55e" />
                    <span style={{ color: "#22c55e" }}>Copied!</span>
                  </>
                ) : (
                  <>
                    <span>{support.discord.handle}</span>
                    <Copy size={10} color={accentColor} />
                  </>
                )}
              </span>
            </button>
          )
        )}

        {/* Email Support */}
        {support.email && (
          <div
            style={{
              padding: "8px 11px",
              borderRadius: 8,
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            <a
              href={`mailto:${support.email}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "var(--color-foreground)",
                textDecoration: "none",
                flex: 1,
                minWidth: 0,
              }}
            >
              <Mail size={14} color={accentColor} />
              <span>Email Support</span>
            </a>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <a
                href={`mailto:${support.email}`}
                style={{
                  fontSize: 9.5,
                  color: accentColor,
                  textDecoration: "none",
                  maxWidth: 110,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {support.email}
              </a>
              <button
                type="button"
                onClick={(e) => copyToClipboard(support.email!, "email", e)}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: 2,
                  cursor: "pointer",
                  color: "var(--color-muted-foreground)",
                  display: "flex",
                  alignItems: "center",
                }}
                title="Copy email address"
              >
                {copiedKey === "email" ? <Check size={11} color="#22c55e" /> : <Copy size={11} />}
              </button>
            </div>
          </div>
        )}

        {/* Telegram Support */}
        {support.telegram && (
          support.telegram.isUrl && support.telegram.href ? (
            <a
              href={support.telegram.href}
              target="_blank"
              rel="noreferrer"
              style={{
                padding: "8px 11px",
                borderRadius: 8,
                background: "rgba(34, 158, 217, 0.08)",
                border: "1px solid rgba(34, 158, 217, 0.28)",
                color: "var(--color-foreground)",
                textDecoration: "none",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: 11,
                fontWeight: 700,
                transition: "all 0.15s ease",
              }}
              className="hover:border-[#229ED9] hover:bg-[rgba(34,158,217,0.15)]"
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <TelegramIcon size={14} color="#38bdf8" />
                <span>Telegram Support</span>
              </div>
              <span style={{ fontSize: 9.5, color: "#38bdf8", display: "flex", alignItems: "center", gap: 4 }}>
                <span>{support.telegram.handle || "Chat"}</span>
                <ExternalLink size={10} />
              </span>
            </a>
          ) : (
            <button
              type="button"
              onClick={(e) => copyToClipboard(support.telegram!.value, "telegram", e)}
              style={{
                padding: "8px 11px",
                borderRadius: 8,
                background: "rgba(34, 158, 217, 0.08)",
                border: "1px solid rgba(34, 158, 217, 0.28)",
                color: "var(--color-foreground)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                width: "100%",
                textAlign: "left",
              }}
              title="Click to copy Telegram handle"
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <TelegramIcon size={14} color="#38bdf8" />
                <span>Telegram Support</span>
              </div>
              <span style={{ fontSize: 9.5, color: "#38bdf8", display: "flex", alignItems: "center", gap: 4 }}>
                {copiedKey === "telegram" ? (
                  <>
                    <Check size={11} color="#22c55e" />
                    <span style={{ color: "#22c55e" }}>Copied!</span>
                  </>
                ) : (
                  <>
                    <span>{support.telegram.handle}</span>
                    <Copy size={10} color="#38bdf8" />
                  </>
                )}
              </span>
            </button>
          )
        )}

        {/* Structured Working Hours */}
        {support.workingHours && (
          <div
            style={{
              padding: "7px 10px",
              borderRadius: 6,
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
              fontSize: 10.5,
              fontWeight: 600,
              color: "var(--color-foreground)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 6,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Clock size={12} color="#f59e0b" />
              <span>Hours:</span>
              <span style={{ color: "var(--color-foreground-muted)" }}>{support.workingHours.display}</span>
            </div>
            <span style={{ fontSize: 8.5, fontWeight: 700, padding: "1px 4px", borderRadius: 3, background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" }}>
              Active
            </span>
          </div>
        )}

        {/* Separate Support Instructions & Notes */}
        {support.instructions && (
          <div
            style={{
              padding: "7px 10px",
              borderRadius: 6,
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
              fontSize: 10.5,
              lineHeight: 1.4,
              color: "var(--color-muted-foreground)",
              display: "flex",
              alignItems: "flex-start",
              gap: 6,
            }}
          >
            <Info size={12} color={accentColor} style={{ marginTop: 2, flexShrink: 0 }} />
            <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {support.instructions}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
