"use client";

import { useState } from "react";
import { Clock, Shield, Sparkles, Check, HelpCircle, Calendar } from "lucide-react";
import {
  KeyDurationType,
  DURATION_OPTIONS,
  getKeyDurationDisplay,
} from "@/lib/key-duration";

interface KeyDurationSelectorProps {
  value: KeyDurationType;
  durationDays?: number;
  customDurationLabel?: string;
  onChange: (duration: KeyDurationType, days: number, label: string) => void;
  disabled?: boolean;
}

export function KeyDurationSelector({
  value = "lifetime",
  durationDays = 0,
  customDurationLabel = "",
  onChange,
  disabled = false,
}: KeyDurationSelectorProps) {
  const currentPreview = getKeyDurationDisplay(value, durationDays, customDurationLabel);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <label className="label" style={{ display: "flex", alignItems: "center", gap: 7, margin: 0, fontSize: 13, fontWeight: 700, color: "var(--color-foreground)" }}>
            <Clock size={16} style={{ color: "#c4b5fd" }} />
            <span>License Validity Period</span>
          </label>
          <span
            style={{
              fontSize: 11,
              fontFamily: "var(--font-mono, monospace)",
              padding: "3px 9px",
              borderRadius: 6,
              background: "rgba(55, 44, 102, 0.35)",
              border: "1px solid rgba(139, 92, 246, 0.45)",
              color: "#c4b5fd",
              fontWeight: 800,
            }}
          >
            {currentPreview.label}
          </span>
        </div>
        <p style={{ fontSize: 12, color: "var(--color-muted-foreground)", marginTop: 4, marginBottom: 0, lineHeight: 1.4 }}>
          Select the active time window granted to the buyer once this digital key is redeemed.
        </p>
      </div>

      {/* Preset pills grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
          gap: 8,
        }}
      >
        {DURATION_OPTIONS.map((opt) => {
          const isSelected = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              onClick={() => {
                const days = opt.id === "custom" ? (durationDays || 14) : opt.days;
                const label = opt.id === "custom" ? customDurationLabel : "";
                onChange(opt.id, days, label);
              }}
              className="interactive-pill"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                padding: "10px 12px",
                borderRadius: 8,
                border: isSelected
                  ? "1px solid rgba(139, 92, 246, 0.65)"
                  : "1px solid var(--color-border)",
                background: isSelected
                  ? "linear-gradient(180deg, rgba(55, 44, 102, 0.4) 0%, rgba(30, 24, 60, 0.25) 100%)"
                  : "var(--color-surface)",
                cursor: disabled ? "not-allowed" : "pointer",
                textAlign: "left",
                position: "relative",
                boxShadow: isSelected ? "0 0 16px rgba(55, 44, 102, 0.35)" : "none",
                transform: isSelected ? "translateY(-1px)" : "none",
                transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  marginBottom: 3,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    fontFamily: "var(--font-mono, monospace)",
                    color: isSelected ? "#ffffff" : "var(--color-foreground)",
                  }}
                >
                  {opt.shortLabel}
                </span>
                {isSelected && (
                  <span
                    className="animate-checkmark"
                    style={{
                      width: 15,
                      height: 15,
                      borderRadius: "50%",
                      background: "rgb(55, 44, 102)",
                      border: "1px solid #c4b5fd",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#c4b5fd",
                    }}
                  >
                    <Check size={9} strokeWidth={3} />
                  </span>
                )}
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontFamily: "var(--font-mono, monospace)",
                  color: isSelected ? "#c4b5fd" : "var(--color-muted-foreground)",
                }}
              >
                {opt.id === "lifetime"
                  ? "Permanent"
                  : opt.id === "custom"
                  ? "Custom Days"
                  : `${opt.days} Day${opt.days > 1 ? "s" : ""}`}
              </span>
            </button>
          );
        })}
      </div>

      {/* Custom Duration Fields (if custom is selected) */}
      {value === "custom" && (
        <div
          className="animate-slide-up"
          style={{
            padding: 16,
            borderRadius: 10,
            background: "linear-gradient(180deg, rgba(55, 44, 102, 0.2) 0%, rgba(9, 8, 18, 0.4) 100%)",
            border: "1px solid rgba(139, 92, 246, 0.35)",
            display: "grid",
            gridTemplateColumns: "1fr 1.5fr",
            gap: 14,
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.4)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label className="label" style={{ fontSize: 11, fontWeight: 700, margin: 0, color: "var(--color-foreground)" }}>
              Validity Duration (Days) *
            </label>
            <input
              type="number"
              min={1}
              max={36500}
              className="input"
              style={{ fontSize: 13, height: 38, fontFamily: "var(--font-mono, monospace)" }}
              placeholder="e.g. 14"
              value={durationDays || ""}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                onChange("custom", isNaN(val) ? 0 : Math.max(1, val), customDurationLabel);
              }}
              required
            />
            <span style={{ fontSize: 10, color: "var(--color-muted-foreground)" }}>
              Number of days license remains valid
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label className="label" style={{ fontSize: 11, fontWeight: 700, margin: 0, color: "var(--color-foreground)" }}>
              Display Label (Optional)
            </label>
            <input
              type="text"
              maxLength={60}
              className="input"
              style={{ fontSize: 13, height: 38, fontFamily: "var(--font-mono, monospace)" }}
              placeholder="e.g. Weekend Pass, 14-Day Trial"
              value={customDurationLabel}
              onChange={(e) => {
                onChange("custom", durationDays, e.target.value);
              }}
            />
            <span style={{ fontSize: 10, color: "var(--color-muted-foreground)" }}>
              Shown on storefront and checkout page
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default KeyDurationSelector;
