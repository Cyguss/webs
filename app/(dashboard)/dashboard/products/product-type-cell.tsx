"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Key, Package, Layers, ChevronDown, X, Sparkles } from "lucide-react";
import { getKeyDurationDisplay, KeyDurationType } from "@/lib/key-duration";
import { ProductVariant } from "@/lib/validations/product";

interface ProductTypeCellProps {
  type: string | null;
  duration?: string | null;
  durationDays?: number | null;
  customDurationLabel?: string | null;
  variants?: string | null;
  price?: string | number | null;
}

export function ProductTypeCell({
  type,
  duration,
  durationDays,
  customDurationLabel,
  variants,
  price,
}: ProductTypeCellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Parse variants safely
  let parsedVariants: ProductVariant[] = [];
  if (variants) {
    try {
      const data = JSON.parse(variants);
      if (Array.isArray(data) && data.length > 0) {
        parsedVariants = data;
      }
    } catch {}
  }

  const hasMultipleTypes = parsedVariants.length > 1;

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const popoverEstimatedHeight = Math.min(260, 48 + parsedVariants.length * 36);
      const spaceBelow = window.innerHeight - rect.bottom;

      let top = rect.bottom + 6;
      if (spaceBelow < popoverEstimatedHeight && rect.top > popoverEstimatedHeight) {
        top = rect.top - popoverEstimatedHeight - 6;
      }

      let left = rect.left;
      if (left + 280 > window.innerWidth) {
        left = window.innerWidth - 290;
      }

      setCoords({
        top: Math.max(8, top),
        left: Math.max(8, left),
      });
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen, parsedVariants.length]);

  // Single type case: Render clean badge
  if (!hasMultipleTypes) {
    const singleDuration = parsedVariants[0]?.duration || duration;
    const singleDays = parsedVariants[0]?.durationDays ?? durationDays;
    const singleLabel = parsedVariants[0]?.customDurationLabel || customDurationLabel;
    const dMeta = getKeyDurationDisplay(singleDuration, singleDays, singleLabel);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
        <span className={`badge ${type === "key" ? "badge-primary" : "badge-muted"}`}>
          {type === "key" ? (
            <>
              <Key size={11} /> Keys
            </>
          ) : (
            <>
              <Package size={11} /> {type === "service" ? "Service" : "Manual"}
            </>
          )}
        </span>
        <span
          style={{
            fontSize: 10,
            fontFamily: "monospace",
            fontWeight: 700,
            padding: "1px 6px",
            borderRadius: 4,
            background: `${dMeta.badgeColor}18`,
            color: dMeta.badgeColor,
            border: `1px solid ${dMeta.badgeColor}35`,
            whiteSpace: "nowrap",
          }}
        >
          {dMeta.shortLabel}
        </span>
      </div>
    );
  }

  // Multiple types case: Clickable box that expands and shows all types/variants
  return (
    <div style={{ position: "relative", display: "inline-flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        title="Click to view all duration types"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 9px",
          borderRadius: 6,
          border: isOpen
            ? "1px solid var(--color-primary, #6366f1)"
            : "1px solid var(--color-border, rgba(255, 255, 255, 0.12))",
          background: isOpen
            ? "rgba(99, 102, 241, 0.16)"
            : "var(--color-surface-2, rgba(255, 255, 255, 0.04))",
          cursor: "pointer",
          fontSize: 11.5,
          fontWeight: 600,
          color: "var(--color-foreground)",
          transition: "all 0.15s ease",
          boxShadow: isOpen ? "0 0 0 2px rgba(99, 102, 241, 0.22)" : "none",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          {type === "key" ? <Key size={12} color="#818cf8" /> : <Package size={12} color="#818cf8" />}
          <span>{type === "key" ? "Keys" : "Product"}</span>
        </span>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 3,
            fontSize: 10,
            fontWeight: 700,
            background: "rgba(99, 102, 241, 0.18)",
            color: "#a5b4fc",
            padding: "1px 6px",
            borderRadius: 4,
            border: "1px solid rgba(99, 102, 241, 0.3)",
          }}
        >
          <Layers size={10} />
          <span>{parsedVariants.length} Types</span>
        </span>

        <ChevronDown
          size={12}
          color="var(--color-muted-foreground)"
          style={{
            transition: "transform 0.18s ease",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {/* Floating Popover Dropdown via Portal */}
      {isOpen &&
        mounted &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            {/* Backdrop to catch clicks outside */}
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 99998,
                background: "transparent",
              }}
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
            />

            {/* Dropdown Menu Card */}
            <div
              style={{
                position: "fixed",
                top: coords.top,
                left: coords.left,
                zIndex: 99999,
                width: 280,
                background: "var(--color-surface, #12131a)",
                border: "1px solid var(--color-border, #2a2d3d)",
                borderRadius: 10,
                boxShadow: "0 14px 38px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05)",
                padding: "8px 10px 10px",
                animation: "fadeIn 0.12s ease",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingBottom: 6,
                  marginBottom: 6,
                  borderBottom: "1px solid var(--color-border, rgba(255, 255, 255, 0.08))",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--color-muted-foreground)",
                  }}
                >
                  <Layers size={11} color="#818cf8" />
                  <span>Configured Types ({parsedVariants.length})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--color-muted-foreground)",
                    cursor: "pointer",
                    padding: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 4,
                  }}
                >
                  <X size={12} />
                </button>
              </div>

              {/* Items List */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  maxHeight: 220,
                  overflowY: "auto",
                }}
              >
                {parsedVariants.map((v) => {
                  const vMeta = getKeyDurationDisplay(v.duration, v.durationDays, v.customDurationLabel);
                  return (
                    <div
                      key={v.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "6px 8px",
                        borderRadius: 6,
                        background: "var(--color-surface-2, rgba(255, 255, 255, 0.03))",
                        border: "1px solid rgba(255, 255, 255, 0.05)",
                        gap: 8,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, flex: 1 }}>
                        <span
                          style={{
                            fontSize: 9.5,
                            fontFamily: "monospace",
                            fontWeight: 800,
                            padding: "1px 5px",
                            borderRadius: 4,
                            background: `${vMeta.badgeColor}22`,
                            color: vMeta.badgeColor,
                            border: `1px solid ${vMeta.badgeColor}44`,
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                          }}
                        >
                          {vMeta.shortLabel}
                        </span>
                        <span
                          style={{
                            fontSize: 11.5,
                            fontWeight: 600,
                            color: "var(--color-foreground)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={v.label || vMeta.label}
                        >
                          {v.label || vMeta.label}
                        </span>
                      </div>

                      <span
                        style={{
                          fontSize: 11.5,
                          fontWeight: 700,
                          color: "var(--color-foreground)",
                          fontFamily: "monospace",
                          flexShrink: 0,
                        }}
                      >
                        ${parseFloat(v.price.toString()).toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>,
          document.body
        )}
    </div>
  );
}
