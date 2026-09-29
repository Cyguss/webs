"use client";

import React, { useState, useRef, useEffect } from "react";
import { Clock, ChevronDown, Check, Sparkles, CheckCircle2, ShieldAlert } from "lucide-react";
import { getKeyDurationDisplay } from "@/lib/key-duration";

export interface StorefrontPlanVariant {
  id: string;
  duration?: string;
  durationDays?: number;
  customDurationLabel?: string | null;
  price: string;
  label?: string;
}

interface StorefrontPlanSelectorProps {
  variants: StorefrontPlanVariant[];
  activeVariantId: string;
  onSelectVariant: (variantId: string) => void;
  product: {
    id: string;
    stock: number;
    isUnlimitedStock?: boolean;
    variantStocks?: Record<string, number>;
    price?: string;
  };
  size?: "sm" | "md";
  surfaceColor?: string;
  borderColor?: string;
  textColor?: string;
  mutedColor?: string;
  accentColor?: string;
  fullWidth?: boolean;
}

export function StorefrontPlanSelector({
  variants,
  activeVariantId,
  onSelectVariant,
  product,
  size = "md",
  surfaceColor,
  borderColor,
  textColor,
  mutedColor,
  accentColor = "#8b5cf6",
  fullWidth = false,
}: StorefrontPlanSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check available space below to decide if we should open upward (e.g. near bottom of page/footer)
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 250 && rect.top > 200) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!variants || variants.length === 0) {
    return null;
  }

  const activeVariant = variants.find((v) => v.id === activeVariantId) || variants[0];
  const activeMeta = getKeyDurationDisplay(
    activeVariant.duration,
    activeVariant.durationDays,
    activeVariant.customDurationLabel
  );

  const variantStocks = product.variantStocks || {};

  function getVariantStock(v: StorefrontPlanVariant): number {
    if (product.isUnlimitedStock) return 9999;
    if (variantStocks[v.id] !== undefined) return variantStocks[v.id];
    if (v.duration && variantStocks[v.duration] !== undefined) return variantStocks[v.duration];
    if (Object.keys(variantStocks).length === 0) return product.stock;
    return 0;
  }

  const activeStock = getVariantStock(activeVariant);
  const isActiveDepleted = !product.isUnlimitedStock && activeStock <= 0;

  const isSmall = size === "sm";
  const bg = surfaceColor || "var(--color-surface-2)";
  const border = borderColor || "var(--color-border)";
  const text = textColor || "var(--color-foreground)";
  const muted = mutedColor || "var(--color-muted-foreground)";

  const popoverBg = surfaceColor && !surfaceColor.startsWith("rgba") ? surfaceColor : "var(--color-surface, #11131a)";

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        display: fullWidth ? "block" : "inline-block",
        width: fullWidth ? "100%" : "auto",
        zIndex: isOpen ? 60 : 1,
      }}
      onClick={(e) => {
        // Stop bubbling so card link doesn't open
        e.stopPropagation();
      }}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        style={{
          width: fullWidth ? "100%" : "auto",
          padding: isSmall ? "5px 8px" : "6px 10px",
          borderRadius: 6,
          background: isOpen ? `${accentColor}25` : bg,
          border: isOpen ? `1px solid ${accentColor}` : `1px solid ${border}`,
          color: text,
          fontSize: isSmall ? 10 : 11,
          fontFamily: "var(--font-mono, monospace)",
          fontWeight: 700,
          letterSpacing: "0.02em",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 6,
          boxShadow: isOpen
            ? `0 0 14px ${accentColor}55, 0 4px 10px rgba(0,0,0,0.3)`
            : "0 2px 4px rgba(0,0,0,0.05)",
          transition: "all 0.15s ease",
          outline: "none",
          boxSizing: "border-box",
        }}
      >
        {/* Left: Clock Icon + Active Plan Label */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0, overflow: "hidden" }}>
          <Clock size={isSmall ? 11 : 12} color={accentColor} style={{ flexShrink: 0 }} />
          <span
            style={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              color: text,
            }}
          >
            {activeVariant.label || activeMeta.shortLabel}
          </span>
        </div>

        {/* Right: Plan Price + Stock Badge + Chevron */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
          {/* Price Badge */}
          <span
            style={{
              fontSize: isSmall ? 9 : 10,
              fontWeight: 800,
              padding: "1px 4px",
              borderRadius: 3,
              background: `${accentColor}18`,
              color: accentColor,
              border: `1px solid ${accentColor}35`,
            }}
          >
            ${parseFloat(activeVariant.price).toFixed(2)}
          </span>

          {/* Stock Count */}
          {!product.isUnlimitedStock && (
            <span
              style={{
                fontSize: isSmall ? 8.5 : 9,
                fontWeight: 700,
                color: isActiveDepleted ? "#ef4444" : "#22c55e",
              }}
            >
              {isActiveDepleted ? "Out" : `(${activeStock})`}
            </span>
          )}

          {/* Dropdown Chevron */}
          <ChevronDown
            size={isSmall ? 11 : 12}
            color={isOpen ? accentColor : muted}
            style={{
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.18s ease, color 0.15s ease",
            }}
          />
        </div>
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: openUpward ? "auto" : "calc(100% + 4px)",
            bottom: openUpward ? "calc(100% + 4px)" : "auto",
            left: 0,
            right: fullWidth ? 0 : "auto",
            minWidth: fullWidth ? "100%" : isSmall ? 200 : 230,
            borderRadius: 8,
            background: popoverBg,
            border: `1px solid ${border}`,
            boxShadow: `0 24px 50px rgba(0, 0, 0, 0.88), 0 0 25px ${accentColor}40`,
            backdropFilter: "blur(24px)",
            padding: 4,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            zIndex: 1000,
            animation: "kryptFadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
            boxSizing: "border-box",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Options List */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 3,
              maxHeight: 280,
              overflowY: "auto",
              padding: "2px 2px",
              boxSizing: "border-box",
            }}
          >
            {variants.map((v) => {
              const isSelected = v.id === activeVariant.id;
              const vMeta = getKeyDurationDisplay(v.duration, v.durationDays, v.customDurationLabel);
              const vStock = getVariantStock(v);
              const isVDepleted = !product.isUnlimitedStock && vStock <= 0;

              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelectVariant(v.id);
                    setIsOpen(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: isSmall ? "6px 8px" : "7px 10px",
                    borderRadius: 6,
                    background: isSelected
                      ? `${accentColor}25`
                      : "transparent",
                    border: isSelected
                      ? `1px solid ${accentColor}`
                      : "1px solid transparent",
                    color: isSelected
                      ? "#ffffff"
                      : isVDepleted
                      ? muted
                      : text,
                    fontSize: isSmall ? 10 : 11,
                    fontFamily: "var(--font-mono, monospace)",
                    fontWeight: isSelected ? 800 : 600,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.12s ease",
                    opacity: isVDepleted && !isSelected ? 0.5 : 1,
                    boxSizing: "border-box",
                    width: "100%",
                    outline: "none",
                  }}
                  onMouseOver={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = "var(--color-surface-2)";
                      e.currentTarget.style.borderColor = "var(--color-border)";
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.borderColor = "transparent";
                    }
                  }}
                >
                  {/* Left: Duration Label & Sub-info */}
                  <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        border: isSelected ? `2px solid ${accentColor}` : `1px solid ${border}`,
                        background: isSelected ? accentColor : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        boxSizing: "border-box",
                      }}
                    >
                      {isSelected && (
                        <div
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: "50%",
                            background: "#ffffff",
                          }}
                        />
                      )}
                    </div>
                    <div style={{ overflow: "hidden" }}>
                      <div style={{ fontWeight: isSelected ? 800 : 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {v.label || vMeta.shortLabel}
                      </div>
                      <div
                        style={{
                          fontSize: 8.5,
                          color: isSelected ? "rgba(255,255,255,0.75)" : muted,
                          letterSpacing: "0.02em",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {vMeta.label}
                      </div>
                    </div>
                  </div>

                  {/* Right: Price & Stock Badge */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2, flexShrink: 0, marginLeft: 8 }}>
                    <span
                      style={{
                        fontWeight: 800,
                        fontSize: isSmall ? 10 : 11,
                        color: isSelected ? "#ffffff" : accentColor,
                      }}
                    >
                      ${parseFloat(v.price).toFixed(2)}
                    </span>
                    <span
                      style={{
                        fontSize: 8,
                        fontWeight: 700,
                        color: product.isUnlimitedStock
                          ? "#22c55e"
                          : isVDepleted
                          ? "#ef4444"
                          : isSelected
                          ? accentColor
                          : "#22c55e",
                      }}
                    >
                      {product.isUnlimitedStock
                        ? "Instant"
                        : isVDepleted
                        ? "Out of stock"
                        : `${vStock} in stock`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
