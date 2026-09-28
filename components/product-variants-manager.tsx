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
  const customVariantsCount = variants.filter((v) => v.duration === "custom").length;
  const usedPredefinedDurations = new Set(variants.filter((v) => v.duration !== "custom").map((v) => v.duration));

  function handleAddPreset(durationId: KeyDurationType) {
    if (durationId === "custom") {
      if (customVariantsCount >= 5) return;
    } else {
      if (usedPredefinedDurations.has(durationId)) return;
    }

    const opt = DURATION_OPTIONS.find((o) => o.id === durationId);
    if (!opt) return;

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
        border: enabled ? "1px solid rgba(139, 92, 246, 0.4)" : "1px solid var(--color-border)",
        background: enabled ? "linear-gradient(180deg, rgba(55, 44, 102, 0.15) 0%, rgba(8, 8, 12, 0) 100%)" : "inherit",
        transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Modern Mode Switcher */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: enabled ? "rgba(55, 44, 102, 0.4)" : "rgba(255, 255, 255, 0.05)",
              border: enabled ? "1px solid rgba(139, 92, 246, 0.45)" : "1px solid var(--color-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: enabled ? "#c4b5fd" : "var(--color-muted-foreground)",
              transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
              transform: enabled ? "scale(1.04)" : "scale(1)",
            }}
          >
            <Layers size={20} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--color-foreground)" }}>
                Multi-Duration Tiers (Day / Week / Month / Lifetime)
              </h3>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: "2px 7px",
                  borderRadius: 4,
                  background: enabled ? "rgba(55, 44, 102, 0.4)" : "rgba(255, 255, 255, 0.06)",
                  color: enabled ? "#c4b5fd" : "var(--color-muted-foreground)",
                  border: enabled ? "1px solid rgba(139, 92, 246, 0.45)" : "1px solid var(--color-border)",
                  transition: "all 0.2s ease",
                  fontFamily: "var(--font-mono, monospace)",
                }}
              >
                {enabled ? "MULTI-TIER ACTIVE" : "SINGLE DURATION"}
              </span>
            </div>
            <p style={{ fontSize: 12, color: "var(--color-muted-foreground)", margin: "3px 0 0" }}>
              {enabled
                ? "Customers can choose their desired access period with independent prices and separated key stock pools."
                : "Enable to sell 1 Day, 30 Days, or Lifetime tiers under this single product listing."}
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        <div
          onClick={() => handleToggleMode(!enabled)}
          className="interactive-pill"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            cursor: "pointer",
            padding: "6px 12px",
            borderRadius: 8,
            background: enabled ? "rgba(55, 44, 102, 0.3)" : "var(--btn-ghost-bg, rgba(255, 255, 255, 0.03))",
            border: enabled ? "1px solid rgba(139, 92, 246, 0.5)" : "1px solid var(--color-border)",
            userSelect: "none",
            boxShadow: enabled ? "0 0 14px rgba(55, 44, 102, 0.4)" : "none",
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 800, fontFamily: "var(--font-mono, monospace)", color: enabled ? "#c4b5fd" : "var(--color-muted-foreground)", transition: "color 0.2s ease" }}>
            {enabled ? "ENABLED" : "DISABLED"}
          </span>
          <div
            style={{
              width: 40,
              height: 22,
              borderRadius: 22,
              background: enabled ? "rgb(55, 44, 102)" : "rgba(255, 255, 255, 0.15)",
              border: enabled ? "1px solid #8b5cf6" : "1px solid transparent",
              position: "relative",
              transition: "all 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: "#ffffff",
                position: "absolute",
                top: 2,
                left: enabled ? 20 : 2,
                transition: "left 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
                boxShadow: "0 2px 5px rgba(0,0,0,0.4)",
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
            paddingTop: 14,
            borderTop: "1px solid var(--color-border)",
          }}
        >
          {/* Quick preset chips */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-muted-foreground)", fontFamily: "var(--font-mono, monospace)" }}>
                Add Duration Tier (Max 1 per duration):
              </span>
              <span style={{ fontSize: 11, color: "var(--color-muted-foreground)", fontFamily: "var(--font-mono, monospace)" }}>
                {variants.length} / {DURATION_OPTIONS.length} active
              </span>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {DURATION_OPTIONS.map((opt) => {
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
                      fontSize: 11,
                      fontFamily: "var(--font-mono, monospace)",
                      padding: "6px 12px",
                      borderRadius: 6,
                      border: isAlreadyAdded
                        ? "1px solid rgba(139, 92, 246, 0.3)"
                        : "1px solid var(--color-border)",
                      background: isAlreadyAdded
                        ? "rgba(55, 44, 102, 0.25)"
                        : "rgba(255, 255, 255, 0.03)",
                      color: isAlreadyAdded
                        ? "#c4b5fd"
                        : "var(--color-foreground)",
                      opacity: isAlreadyAdded ? 0.75 : 1,
                      cursor: isAlreadyAdded ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontWeight: 700,
                      transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                  >
                    {!isCustom && isAlreadyAdded ? (
                      <span className="animate-checkmark"><Check size={12} strokeWidth={3} /></span>
                    ) : (
                      <Plus size={12} />
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
                padding: 24,
                textAlign: "center",
                border: "1px dashed var(--color-border)",
                borderRadius: 10,
                color: "var(--color-muted-foreground)",
                fontSize: 12.5,
                background: "rgba(255, 255, 255, 0.01)",
              }}
            >
              <AlertCircle size={20} style={{ margin: "0 auto 8px", color: "#f59e0b" }} />
              <div>No duration tiers added yet. Click above to add options like <strong>1 Day</strong>, <strong>30 Days</strong>, or <strong>Lifetime</strong>.</div>
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
                      padding: "12px 16px",
                      borderRadius: 10,
                      background: "var(--color-surface-2)",
                      border: "1px solid var(--color-border)",
                      flexWrap: "wrap",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.25)",
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
                          background: "rgba(55, 44, 102, 0.35)",
                          border: "1px solid rgba(139, 92, 246, 0.45)",
                          color: "#c4b5fd",
                          whiteSpace: "nowrap",
                          fontFamily: "var(--font-mono, monospace)",
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
                          style={{ fontSize: 13, height: 36, padding: "0 12px", width: "100%", fontFamily: "var(--font-mono, monospace)" }}
                        />

                        {isCustom && (
                          <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }} className="animate-pop">
                            <span style={{ fontSize: 11, color: "var(--color-muted-foreground)", fontWeight: 700, fontFamily: "var(--font-mono, monospace)" }}>Days:</span>
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
                              style={{ width: 64, height: 36, fontSize: 13, textAlign: "center", padding: "0 6px", fontFamily: "var(--font-mono, monospace)" }}
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
                          style={{ width: 96, height: 36, fontSize: 14, fontWeight: 800, padding: "0 10px", textAlign: "right", fontFamily: "var(--font-mono, monospace)" }}
                        />
                        <span style={{ fontSize: 11, color: "var(--color-muted-foreground)", fontWeight: 700, fontFamily: "var(--font-mono, monospace)" }}>USD</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(idx)}
                        className="btn btn-ghost"
                        style={{ padding: "8px", color: "var(--color-danger)", borderRadius: 6, transition: "transform 0.15s ease, background 0.15s ease" }}
                        title="Remove duration option"
                      >
                        <Trash2 size={15} />
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
