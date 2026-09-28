"use client";

import React from "react";
import { Plus, Trash2, Clock, Check, Sparkles, Layers, CheckCircle2, Sliders, ToggleLeft, ToggleRight, AlertCircle } from "lucide-react";
import { DURATION_OPTIONS, getKeyDurationDisplay, KeyDurationType } from "@/lib/key-duration";
import { ProductVariant } from "@/lib/validations/product";

interface ProductVariantsManagerProps {
  enabled: boolean;
  onToggleEnabled: (val: boolean) => void;
  variants: ProductVariant[];
  onChangeVariants: (variants: ProductVariant[]) => void;
  basePrice: string;
}

export function ProductVariantsManager({
  enabled,
  onToggleEnabled,
  variants,
  onChangeVariants,
  basePrice,
}: ProductVariantsManagerProps) {
  // Count of custom duration variants
  const customVariantsCount = variants.filter((v) => v.duration === "custom").length;
  // Set of predefined non-custom duration keys currently in use
  const usedPredefinedDurations = new Set(variants.filter((v) => v.duration !== "custom").map((v) => v.duration));

  function handleAddPreset(durationId: KeyDurationType) {
    if (durationId === "custom") {
      if (customVariantsCount >= 5) return; // Max 5 custom durations
    } else {
      if (usedPredefinedDurations.has(durationId)) return; // Max 1 per predefined duration
    }

    const opt = DURATION_OPTIONS.find((o) => o.id === durationId);
    if (!opt) return;

    // Default suggested price factor based on base price
    const base = parseFloat(basePrice) || 10;
    let price = base;
    if (durationId === "daily") price = Math.max(1, Math.round(base * 0.25 * 100) / 100);
    else if (durationId === "weekly") price = Math.max(2, Math.round(base * 0.55 * 100) / 100);
    else if (durationId === "monthly") price = base;
    else if (durationId === "3month") price = Math.round(base * 2.6 * 100) / 100;
    else if (durationId === "6month") price = Math.round(base * 4.8 * 100) / 100;
    else if (durationId === "year") price = Math.round(base * 8.5 * 100) / 100;
    else if (durationId === "lifetime") price = Math.round(base * 2.5 * 100) / 100;
    else if (durationId === "custom") price = base;

    const defaultDays = durationId === "custom" ? 14 : opt.days;
    const defaultLabel = durationId === "custom" ? `Custom Pass (${customVariantsCount + 1})` : opt.label;

    const newVariant: ProductVariant = {
      id: `${durationId}_${Date.now()}`,
      label: defaultLabel,
      duration: durationId,
      durationDays: defaultDays,
      price: price,
      customDurationLabel: durationId === "custom" ? `${defaultDays} Days` : null,
    };

    onChangeVariants([...variants, newVariant]);
  }

  function handleRemoveVariant(idx: number) {
    onChangeVariants(variants.filter((_, i) => i !== idx));
  }

  function handleUpdateVariant(idx: number, updates: Partial<ProductVariant>) {
    const updated = variants.map((v, i) => (i === idx ? { ...v, ...updates } : v));
    onChangeVariants(updated);
  }

  function handleToggleMode(nextState: boolean) {
    onToggleEnabled(nextState);
    if (nextState && variants.length === 0) {
      // Initialize with standard unique default presets: Daily + Monthly + Lifetime
      const base = parseFloat(basePrice) || 20;
      onChangeVariants([
        {
          id: `daily_${Date.now()}`,
          label: "1 Day (Daily Access)",
          duration: "daily",
          durationDays: 1,
          price: Math.max(1, Math.round(base * 0.25 * 100) / 100),
          customDurationLabel: null,
        },
        {
          id: `monthly_${Date.now() + 1}`,
          label: "30 Days (Monthly Access)",
          duration: "monthly",
          durationDays: 30,
          price: base,
          customDurationLabel: null,
        },
        {
          id: `lifetime_${Date.now() + 2}`,
          label: "Lifetime Access",
          duration: "lifetime",
          durationDays: 0,
          price: Math.round(base * 2.5 * 100) / 100,
          customDurationLabel: null,
        },
      ]);
    }
  }

  return (
    <div
      className="card interactive-card"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        border: enabled ? "1px solid rgba(99, 102, 241, 0.35)" : "1px solid var(--color-border)",
        background: enabled ? "linear-gradient(180deg, rgba(99, 102, 241, 0.04) 0%, rgba(0, 0, 0, 0) 100%)" : "inherit",
        transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Explicit Modern Mode Switcher */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: enabled ? "rgba(99, 102, 241, 0.15)" : "rgba(255, 255, 255, 0.05)",
              border: enabled ? "1px solid rgba(99, 102, 241, 0.35)" : "1px solid var(--color-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: enabled ? "#818cf8" : "var(--color-muted-foreground)",
              transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
              transform: enabled ? "scale(1.05)" : "scale(1)",
            }}
          >
            <Layers size={20} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--color-foreground)" }}>
                Multiple Duration Tiers (Daily / Weekly / Monthly / Lifetime)
              </h3>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: "2px 7px",
                  borderRadius: 4,
                  background: enabled ? "rgba(16, 185, 129, 0.15)" : "rgba(255, 255, 255, 0.06)",
                  color: enabled ? "#34d399" : "var(--color-muted-foreground)",
                  border: enabled ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid var(--color-border)",
                  transition: "all 0.2s ease",
                }}
              >
                {enabled ? "MULTI-TIER ACTIVE" : "SINGLE DURATION"}
              </span>
            </div>
            <p style={{ fontSize: 12, color: "var(--color-muted-foreground)", margin: "3px 0 0" }}>
              {enabled
                ? "Customers can choose their desired access period with independent prices and categorized keys."
                : "Product has a single fixed price and single duration. Toggle ON to offer multiple duration options."}
            </p>
          </div>
        </div>

        {/* Clear iOS-Style ON/OFF Toggle Switch */}
        <div
          onClick={() => handleToggleMode(!enabled)}
          className="interactive-pill"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            cursor: "pointer",
            padding: "6px 12px",
            borderRadius: 10,
            background: enabled ? "rgba(99, 102, 241, 0.14)" : "rgba(255, 255, 255, 0.03)",
            border: enabled ? "1px solid rgba(99, 102, 241, 0.35)" : "1px solid var(--color-border)",
            userSelect: "none",
            boxShadow: enabled ? "0 0 12px rgba(99, 102, 241, 0.2)" : "none",
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: enabled ? "#818cf8" : "var(--color-muted-foreground)", transition: "color 0.2s ease" }}>
            {enabled ? "ON (Multi-Option)" : "OFF (Single Price)"}
          </span>
          <div
            style={{
              width: 44,
              height: 24,
              borderRadius: 24,
              background: enabled ? "#6366f1" : "rgba(255, 255, 255, 0.15)",
              position: "relative",
              transition: "background 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: "#ffffff",
                position: "absolute",
                top: 3,
                left: enabled ? 23 : 3,
                transition: "left 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
                boxShadow: "0 2px 5px rgba(0,0,0,0.3)",
              }}
            />
          </div>
        </div>
      </div>

      {enabled && (
        <div
          className="animate-slide-up"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            paddingTop: 12,
            borderTop: "1px solid var(--color-border)",
          }}
        >
          {/* Quick preset chips - strictly 1 per duration type */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-muted-foreground)" }}>
                Add Duration Tier (Max 1 per duration):
              </span>
              <span style={{ fontSize: 11, color: "var(--color-muted-foreground)" }}>
                {variants.length} / {DURATION_OPTIONS.length} active
              </span>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {DURATION_OPTIONS.map((opt, oIdx) => {
                const isCustom = opt.id === "custom";
                const isAlreadyAdded = isCustom ? customVariantsCount >= 5 : usedPredefinedDurations.has(opt.id);

                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={isAlreadyAdded}
                    onClick={() => handleAddPreset(opt.id)}
                    className={!isAlreadyAdded ? "interactive-pill" : ""}
                    style={{
                      fontSize: 12,
                      padding: "6px 12px",
                      borderRadius: 8,
                      border: isAlreadyAdded
                        ? isCustom
                          ? "1px solid rgba(239, 68, 68, 0.2)"
                          : "1px solid rgba(16, 185, 129, 0.25)"
                        : "1px solid var(--color-border)",
                      background: isAlreadyAdded
                        ? isCustom
                          ? "rgba(239, 68, 68, 0.05)"
                          : "rgba(16, 185, 129, 0.08)"
                        : "rgba(255, 255, 255, 0.03)",
                      color: isAlreadyAdded
                        ? isCustom
                          ? "var(--color-muted-foreground)"
                          : "#34d399"
                        : "var(--color-foreground)",
                      opacity: isAlreadyAdded ? 0.75 : 1,
                      cursor: isAlreadyAdded ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontWeight: 600,
                      transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                  >
                    {!isCustom && isAlreadyAdded ? (
                      <span className="animate-checkmark"><Check size={13} strokeWidth={3} /></span>
                    ) : (
                      <Plus size={13} />
                    )}
                    <span>{isCustom ? `Custom Tier (${customVariantsCount}/5)` : opt.shortLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Configured Variants List */}
          {variants.length === 0 ? (
            <div
              className="animate-pop"
              style={{
                padding: 28,
                textAlign: "center",
                border: "1px dashed var(--color-border)",
                borderRadius: 12,
                color: "var(--color-muted-foreground)",
                fontSize: 13,
                background: "rgba(255, 255, 255, 0.01)",
              }}
            >
              <AlertCircle size={22} style={{ margin: "0 auto 8px", color: "#f59e0b" }} />
              <div>No duration tiers added yet. Click above to add options like <strong>Daily</strong>, <strong>Weekly</strong>, or <strong>Monthly</strong>.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {variants.map((v, idx) => {
                const isCustom = v.duration === "custom";
                const meta = getKeyDurationDisplay(v.duration, v.durationDays, v.customDurationLabel);
                return (
                  <div
                    key={v.id || idx}
                    className="animate-slide-up interactive-card"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 14,
                      padding: "14px 16px",
                      borderRadius: 12,
                      background: "var(--color-surface-2)",
                      border: "1px solid var(--color-border)",
                      flexWrap: "wrap",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                      animationDelay: `${Math.min(idx * 0.04, 0.24)}s`,
                    }}
                  >
                    {/* Left: Duration Badge & Custom Label */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 240 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          padding: "4px 10px",
                          borderRadius: 6,
                          background: `${meta.badgeColor}20`,
                          border: `1px solid ${meta.badgeColor}45`,
                          color: meta.badgeColor,
                          whiteSpace: "nowrap",
                          fontFamily: "monospace",
                        }}
                      >
                        {meta.shortLabel.toUpperCase()}
                      </span>

                      <div style={{ flex: 1, display: "flex", gap: 8, alignItems: "center" }}>
                        <input
                          type="text"
                          value={v.label}
                          onChange={(e) => handleUpdateVariant(idx, { label: e.target.value })}
                          className="input"
                          placeholder="Option label displayed to buyer"
                          style={{ fontSize: 13, height: 36, padding: "0 12px", width: "100%" }}
                        />

                        {isCustom && (
                          <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }} className="animate-pop">
                            <span style={{ fontSize: 11, color: "var(--color-muted-foreground)", fontWeight: 600 }}>Days:</span>
                            <input
                              type="number"
                              min="1"
                              max="3650"
                              value={v.durationDays || 1}
                              onChange={(e) => {
                                const days = Math.max(1, parseInt(e.target.value) || 1);
                                handleUpdateVariant(idx, {
                                  durationDays: days,
                                  customDurationLabel: `${days} Days`,
                                });
                              }}
                              className="input"
                              style={{ width: 64, height: 36, fontSize: 13, textAlign: "center", padding: "0 6px" }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Price & Delete */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 13, color: "var(--color-muted-foreground)", fontWeight: 700 }}>$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={v.price || ""}
                          onChange={(e) => handleUpdateVariant(idx, { price: parseFloat(e.target.value) || 0 })}
                          className="input"
                          placeholder="0.00"
                          style={{ width: 100, height: 36, fontSize: 14, fontWeight: 700, padding: "0 10px", textAlign: "right" }}
                        />
                        <span style={{ fontSize: 12, color: "var(--color-muted-foreground)", fontWeight: 600 }}>USD</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(idx)}
                        className="btn btn-ghost"
                        style={{ padding: "8px", color: "#f87171", borderRadius: 8, transition: "transform 0.15s ease, background 0.15s ease" }}
                        title="Remove duration option"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "scale(1.1)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "scale(1)";
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
