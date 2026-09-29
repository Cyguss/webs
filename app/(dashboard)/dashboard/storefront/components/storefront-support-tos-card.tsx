"use client";

import React, { useState, useEffect } from "react";
import { Mail, ShieldAlert, Headphones, Clock, Info, Check, Calendar } from "lucide-react";
import { DiscordIcon, TelegramIcon } from "./storefront-constants";

interface StorefrontSupportTosCardProps {
  supportEmail: string;
  setSupportEmail: (v: string) => void;
  discordUrl?: string;
  setDiscordUrl?: (v: string) => void;
  telegramUrl?: string;
  setTelegramUrl?: (v: string) => void;
  contactInfo: string;
  setContactInfo: (v: string) => void;
  termsOfService: string;
  setTermsOfService: (v: string) => void;
}

export function StorefrontSupportTosCard({
  supportEmail,
  setSupportEmail,
  discordUrl = "",
  setDiscordUrl,
  telegramUrl = "",
  setTelegramUrl,
  contactInfo,
  setContactInfo,
  termsOfService,
  setTermsOfService,
}: StorefrontSupportTosCardProps) {
  // Parse internal working hours & instructions from contactInfo
  const [hoursEnabled, setHoursEnabled] = useState(false);
  const [hoursFrom, setHoursFrom] = useState("10:00");
  const [hoursTo, setHoursTo] = useState("22:00");
  const [timezone, setTimezone] = useState("UTC");
  const [days, setDays] = useState("Mon - Sun");
  const [instructions, setInstructions] = useState("");

  // Initialize from contactInfo on mount or external reset
  useEffect(() => {
    if (!contactInfo) {
      setHoursEnabled(false);
      setInstructions("");
      return;
    }

    if (contactInfo.startsWith("{") && contactInfo.endsWith("}")) {
      try {
        const parsed = JSON.parse(contactInfo);
        setHoursEnabled(Boolean(parsed.hoursEnabled));
        if (parsed.hoursFrom) setHoursFrom(parsed.hoursFrom);
        if (parsed.hoursTo) setHoursTo(parsed.hoursTo);
        if (parsed.timezone) setTimezone(parsed.timezone);
        if (parsed.days) setDays(parsed.days);
        if (parsed.instructions) setInstructions(parsed.instructions);
        return;
      } catch (e) {
        // Fallback to plain text
      }
    }

    // Plain text legacy fallback
    const lines = contactInfo.split("\n");
    const otherLines: string[] = [];
    let foundHours = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (/^(?:hours|working hours|support hours)\s*[:=]\s*(.+)$/i.test(trimmed)) {
        foundHours = true;
        setHoursEnabled(true);
      } else {
        otherLines.push(trimmed);
      }
    }

    if (otherLines.length > 0) {
      setInstructions(otherLines.join("\n"));
    }
  }, [contactInfo]);

  // Sync state back to contactInfo JSON string
  const updateContactInfo = (
    newHoursEnabled: boolean,
    newFrom: string,
    newTo: string,
    newTz: string,
    newDays: string,
    newInstructions: string
  ) => {
    if (!newHoursEnabled && !newInstructions.trim()) {
      setContactInfo("");
      return;
    }

    const payload = {
      hoursEnabled: newHoursEnabled,
      hoursFrom: newFrom,
      hoursTo: newTo,
      timezone: newTz,
      days: newDays,
      instructions: newInstructions.trim(),
    };

    setContactInfo(JSON.stringify(payload));
  };

  const applyPreset = (from: string, to: string, tz: string, d: string) => {
    setHoursEnabled(true);
    setHoursFrom(from);
    setHoursTo(to);
    setTimezone(tz);
    setDays(d);
    updateContactInfo(true, from, to, tz, d, instructions);
  };

  return (
    <div
      className="card"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 18,
        padding: 20,
        background: "var(--card-bg)",
        border: "1px solid var(--color-border)",
        borderRadius: 14,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid var(--color-border)", paddingBottom: 12 }}>
        <Headphones size={18} style={{ color: "var(--color-primary-light, #8b5cf6)" }} />
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 800, margin: 0, color: "var(--color-foreground)" }}>
            Merchant Support Channels & Policies
          </h2>
          <p style={{ fontSize: 11, color: "var(--color-foreground-muted)", margin: "2px 0 0" }}>
            Configure verified support buttons (Discord, Email, Telegram), working hours, and separate instructions.
          </p>
        </div>
      </div>

      {/* Primary Customer Support Email */}
      <div>
        <label className="label" style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <Mail size={13} color="#8b5cf6" />
          Customer Support Email
        </label>
        <input
          type="email"
          className="input"
          placeholder="support@yourbrand.com"
          value={supportEmail}
          onChange={(e) => setSupportEmail(e.target.value)}
        />
        <span style={{ fontSize: 11, color: "var(--color-foreground-muted)", marginTop: 4, display: "block" }}>
          Displayed on your storefront and order receipts as your primary email contact.
        </span>
      </div>

      {/* Discord Support (Server / User) */}
      {setDiscordUrl && (
        <div>
          <label className="label" style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <DiscordIcon size={13} color="#a78bfa" />
            Discord Support (Server Invite or User Tag)
          </label>
          <input
            type="text"
            className="input"
            placeholder="https://discord.gg/yourserver or @support_agent"
            value={discordUrl}
            onChange={(e) => setDiscordUrl(e.target.value)}
          />
          <span style={{ fontSize: 11, color: "var(--color-foreground-muted)", marginTop: 4, display: "block" }}>
            Server invite link (opens Discord) or username tag (e.g. @admin, with copy to clipboard).
          </span>
        </div>
      )}

      {/* Telegram Support */}
      {setTelegramUrl && (
        <div>
          <label className="label" style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <TelegramIcon size={13} color="#38bdf8" />
            Telegram Support (Channel Link or @Username)
          </label>
          <input
            type="text"
            className="input"
            placeholder="https://t.me/your_support or @support_bot"
            value={telegramUrl}
            onChange={(e) => setTelegramUrl(e.target.value)}
          />
          <span style={{ fontSize: 11, color: "var(--color-foreground-muted)", marginTop: 4, display: "block" }}>
            Telegram channel URL or @handle for direct customer assistance.
          </span>
        </div>
      )}

      {/* ─── Structured Working Hours ─── */}
      <div
        style={{
          background: "var(--color-surface-2, rgba(255,255,255,0.03))",
          border: "1px solid var(--color-border)",
          borderRadius: 10,
          padding: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "var(--color-foreground)", display: "flex", alignItems: "center", gap: 6, margin: 0 }}>
            <Clock size={14} color="#f59e0b" />
            <span>Support Working Hours</span>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 11, color: "var(--color-foreground-muted)" }}>
            <input
              type="checkbox"
              checked={hoursEnabled}
              onChange={(e) => {
                const next = e.target.checked;
                setHoursEnabled(next);
                updateContactInfo(next, hoursFrom, hoursTo, timezone, days, instructions);
              }}
              style={{ accentColor: "#8b5cf6", cursor: "pointer" }}
            />
            <span>Enable Schedule</span>
          </label>
        </div>

        {hoursEnabled && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Quick Presets */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => applyPreset("00:00", "24:00", "UTC", "Everyday (24/7)")}
                style={{
                  padding: "3px 8px",
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 600,
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-foreground)",
                  cursor: "pointer",
                }}
              >
                24/7 Everyday
              </button>
              <button
                type="button"
                onClick={() => applyPreset("10:00", "22:00", "UTC", "Mon - Sun")}
                style={{
                  padding: "3px 8px",
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 600,
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-foreground)",
                  cursor: "pointer",
                }}
              >
                10:00 - 22:00 UTC
              </button>
              <button
                type="button"
                onClick={() => applyPreset("09:00", "21:00", "CET", "Mon - Fri")}
                style={{
                  padding: "3px 8px",
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 600,
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-foreground)",
                  cursor: "pointer",
                }}
              >
                09:00 - 21:00 CET (Mon-Fri)
              </button>
              <button
                type="button"
                onClick={() => applyPreset("08:00", "18:00", "EST", "Mon - Fri")}
                style={{
                  padding: "3px 8px",
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 600,
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-foreground)",
                  cursor: "pointer",
                }}
              >
                08:00 - 18:00 EST
              </button>
            </div>

            {/* From / To / Timezone / Days row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1.2fr", gap: 8 }}>
              <div>
                <span style={{ fontSize: 10, color: "var(--color-foreground-muted)", display: "block", marginBottom: 3 }}>
                  From
                </span>
                <input
                  type="text"
                  className="input"
                  placeholder="10:00"
                  value={hoursFrom}
                  onChange={(e) => {
                    setHoursFrom(e.target.value);
                    updateContactInfo(true, e.target.value, hoursTo, timezone, days, instructions);
                  }}
                  style={{ fontSize: 12, padding: "6px 8px" }}
                />
              </div>

              <div>
                <span style={{ fontSize: 10, color: "var(--color-foreground-muted)", display: "block", marginBottom: 3 }}>
                  To
                </span>
                <input
                  type="text"
                  className="input"
                  placeholder="22:00"
                  value={hoursTo}
                  onChange={(e) => {
                    setHoursTo(e.target.value);
                    updateContactInfo(true, hoursFrom, e.target.value, timezone, days, instructions);
                  }}
                  style={{ fontSize: 12, padding: "6px 8px" }}
                />
              </div>

              <div>
                <span style={{ fontSize: 10, color: "var(--color-foreground-muted)", display: "block", marginBottom: 3 }}>
                  Timezone
                </span>
                <input
                  type="text"
                  className="input"
                  placeholder="UTC / CET"
                  value={timezone}
                  onChange={(e) => {
                    setTimezone(e.target.value);
                    updateContactInfo(true, hoursFrom, hoursTo, e.target.value, days, instructions);
                  }}
                  style={{ fontSize: 12, padding: "6px 8px" }}
                />
              </div>

              <div>
                <span style={{ fontSize: 10, color: "var(--color-foreground-muted)", display: "block", marginBottom: 3 }}>
                  Days
                </span>
                <input
                  type="text"
                  className="input"
                  placeholder="Mon - Sun"
                  value={days}
                  onChange={(e) => {
                    setDays(e.target.value);
                    updateContactInfo(true, hoursFrom, hoursTo, timezone, e.target.value, instructions);
                  }}
                  style={{ fontSize: 12, padding: "6px 8px" }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Separate Support Instructions & Notes ─── */}
      <div>
        <label className="label" style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <Info size={13} color="#8b5cf6" />
          Support Instructions & Guidelines
        </label>
        <textarea
          className="input"
          rows={2}
          placeholder="e.g. For key replacements, open a ticket in our Discord server with your order number. Response time under 15 minutes."
          value={instructions}
          onChange={(e) => {
            setInstructions(e.target.value);
            updateContactInfo(hoursEnabled, hoursFrom, hoursTo, timezone, days, e.target.value);
          }}
          style={{ resize: "vertical", minHeight: 65 }}
        />
        <span style={{ fontSize: 11, color: "var(--color-foreground-muted)", marginTop: 4, display: "block" }}>
          Specific ticket instructions, replacement rules, or notes displayed below your support buttons.
        </span>
      </div>

      {/* ─── Terms of Service & Refund Policy ─── */}
      <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 14 }}>
        <label className="label" style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <ShieldAlert size={13} color="#f59e0b" />
          Store Terms of Service & Warranty / Refund Policy
        </label>
        <textarea
          className="input"
          rows={5}
          placeholder="Write your store's terms, replacement policy, and warranty conditions here...&#10;&#10;1. Replacement Policy: Faulty keys must be reported within 24 hours.&#10;2. Warranty: Lifetime support for active keys.&#10;3. Disputes: Contact support before filing a claim."
          value={termsOfService}
          onChange={(e) => setTermsOfService(e.target.value)}
          style={{ resize: "vertical", minHeight: 110, fontFamily: "var(--font-mono, monospace)", fontSize: 12 }}
        />
        <span style={{ fontSize: 11, color: "var(--color-foreground-muted)", marginTop: 4, display: "block" }}>
          Accessible to buyers via the Terms of Service modal on your storefront and checkout page.
        </span>
      </div>
    </div>
  );
}
