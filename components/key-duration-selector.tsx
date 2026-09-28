"use client";

import { useState } from "react";
import { Clock, Shield, Sparkles, Check, HelpCircle } from "lucide-react";
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <label className="label" style={{ display: "flex", alignItems: "center", gap: 6, margin: 0 }}>
            <Clock size={15} style={{ color: "#38bdf8" }} />
            <span>Key Validity & Duration *</span>
          </label>
          <span
            style={{
              fontSize: 11,
              fontFamily: "monospace",
              padding: "2px 8px",
              borderRadius: 6,
              background: `${currentPreview.badgeColor}18`,
              border: `1px solid ${currentPreview.badgeColor}35`,
              color: currentPreview.badgeColor,
              fontWeight: 700,
            }}
          >
            {currentPreview.label}
          </span>
        </div>
        <p style={{ fontSize: 12, color: "var(--color-muted-foreground)", marginTop: 4, marginBottom: 0 }}>
          Specify the active license period once the buyer activates or receives this key.
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
                borderRadius: 10,
                border: isSelected
                  ? `1px solid ${opt.badgeColor}`
                  : "1px solid var(--color-border)",
                background: isSelected
                  ? `${opt.badgeColor}15`
                  : "var(--color-surface)",
                cursor: disabled ? "not-allowed" : "pointer",
                textAlign: "left",
                position: "relative",
                boxShadow: isSelected ? `0 0 14px ${opt.badgeColor}25` : "none",
                transform: isSelected ? "scale(1.02)" : "scale(1)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  marginBottom: 2,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: isSelected ? opt.badgeColor : "var(--color-foreground)",
                  }}
                >
                  {opt.shortLabel}
                </span>
                {isSelected && (
                  <span
                    className="animate-checkmark"
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      background: opt.badgeColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#000",
                    }}
                  >
                    <Check size={10} strokeWidth={3} />
                  </span>
                )}
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontFamily: "monospace",
                  color: isSelected ? "var(--color-foreground)" : "var(--color-muted-foreground)",
                }}
              >
                {opt.id === "lifetime"
                  ? "Permanent"
                  : opt.id === "custom"
                  ? "Configurable"
                  : `${opt.days} days`}
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
            padding: 14,
            borderRadius: 12,
            background: "rgba(6, 182, 212, 0.05)",
            border: "1px solid rgba(6, 182, 212, 0.25)",
            display: "grid",
            gridTemplateColumns: "1fr 1.5fr",
            gap: 12,
            boxShadow: "0 4px 16px rgba(6, 182, 212, 0.08)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label className="label" style={{ fontSize: 12, margin: 0 }}>
              Validity Duration (Days) *
            </label>
            <input
              type="number"
              min={1}
              max={36500}
              className="input"
              style={{ fontSize: 13, height: 38 }}
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

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label className="label" style={{ fontSize: 12, margin: 0 }}>
              Display Label (Optional)
            </label>
            <input
              type="text"
              maxLength={60}
              className="input"
              style={{ fontSize: 13, height: 38 }}
              placeholder="e.g. Weekend Pass, 14-Day Trial"
              value={customDurationLabel}
              onChange={(e) => {
                onChange("custom", durationDays, e.target.value);
              }}
            />
            <span style={{ fontSize: 10, color: "var(--color-muted-foreground)" }}>
              Custom label shown to buyers on storefront
            </span>
          </div>
        </div>
      )}

      {/* Live Buyer Experience Preview */}
      <div
        className="interactive-pill"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 12px",
          borderRadius: 8,
          background: "var(--color-surface-2)",
          border: "1px solid var(--color-border)",
          fontSize: 12,
        }}
      >
        <Shield size={14} style={{ color: currentPreview.badgeColor, flexShrink: 0 }} />
        <span style={{ color: "var(--color-muted-foreground)" }}>
          Storefront Badge Preview:
        </span>
        <span
          className="animate-pop"
          key={currentPreview.shortLabel}
          style={{
            fontFamily: "monospace",
            fontWeight: 700,
            fontSize: 11,
            padding: "2px 8px",
            borderRadius: 4,
            background: `${currentPreview.badgeColor}15`,
            color: currentPreview.badgeColor,
            border: `1px solid ${currentPreview.badgeColor}30`,
          }}
        >
          {currentPreview.shortLabel} Access
        </span>
      </div>
    </div>
  );
}

export default KeyDurationSelector;
