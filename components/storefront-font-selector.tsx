"use client";

import React, { useState, useRef, useEffect } from "react";
import { Type, Check, ChevronDown, Sparkles } from "lucide-react";
import {
  STOREFRONT_FONT_OPTIONS,
  ALL_PRESET_FONTS_STYLESHEET,
  StorefrontFontOption,
} from "@/lib/fonts";

interface StorefrontFontSelectorProps {
  value: string;
  onChange: (val: string) => void;
}

export function StorefrontFontSelector({ value, onChange }: StorefrontFontSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedFont =
    STOREFRONT_FONT_OPTIONS.find((f) => f.value === (value || "inter").toLowerCase()) ||
    STOREFRONT_FONT_OPTIONS[0];

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

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      {/* Preload all Google Fonts so options render in their exact font */}
      <link rel="stylesheet" href={ALL_PRESET_FONTS_STYLESHEET} />

      {/* Custom Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "100%",
          padding: "10px 14px",
          borderRadius: 8,
          background: "var(--color-surface-2)",
          border: isOpen
            ? "1px solid var(--color-primary-light)"
            : "1px solid var(--color-border)",
          color: "var(--color-foreground)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          textAlign: "left",
          transition: "all 0.2s ease",
          boxShadow: isOpen
            ? "0 0 16px rgba(139, 92, 246, 0.25), 0 2px 8px rgba(0,0,0,0.15)"
            : "0 1px 3px rgba(0,0,0,0.1)",
          outline: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: "rgba(139, 92, 246, 0.15)",
              border: "1px solid rgba(139, 92, 246, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-primary-light)",
              flexShrink: 0,
            }}
          >
            <Type size={16} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", minWidth: 0, gap: 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: selectedFont.family,
                  color: "var(--color-foreground)",
                }}
              >
                {selectedFont.label}
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "1px 6px",
                  borderRadius: 4,
                  background: "rgba(139, 92, 246, 0.18)",
                  color: "var(--color-primary-light)",
                  letterSpacing: "0.03em",
                }}
              >
                {selectedFont.category}
              </span>
            </div>
            <span
              style={{
                fontSize: 11,
                color: "var(--color-muted-foreground)",
                fontFamily: selectedFont.family,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {selectedFont.sampleText || "Aa Bb Gg 123 • $49.99 Instant Key"}
            </span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            color: isOpen ? "var(--color-primary-light)" : "var(--color-muted-foreground)",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease, color 0.2s ease",
            marginLeft: 8,
            flexShrink: 0,
          }}
        >
          <ChevronDown size={16} />
        </div>
      </button>

      {/* Floating Dropdown List */}
      {isOpen && (
        <div
          className="animate-in fade-in zoom-in-95 duration-150"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 120,
            borderRadius: 12,
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            boxShadow: "0 16px 40px rgba(0, 0, 0, 0.45), 0 0 20px rgba(139, 92, 246, 0.15)",
            backdropFilter: "blur(20px)",
            padding: "6px",
            maxHeight: 320,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <div
            style={{
              padding: "6px 10px 4px",
              fontSize: 10,
              fontWeight: 800,
              color: "var(--color-muted-foreground)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>Preset Typography ({STOREFRONT_FONT_OPTIONS.length})</span>
            <span style={{ color: "var(--color-primary-light)", fontSize: 9 }}>
              LIVE PREVIEW
            </span>
          </div>

          {STOREFRONT_FONT_OPTIONS.map((option: StorefrontFontOption) => {
            const isSelected = option.value === selectedFont.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: isSelected
                    ? "1px solid rgba(139, 92, 246, 0.4)"
                    : "1px solid transparent",
                  background: isSelected
                    ? "rgba(139, 92, 246, 0.14)"
                    : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.12s ease",
                  outline: "none",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = "var(--color-surface-2)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        fontFamily: option.family,
                        color: isSelected ? "var(--color-primary-light)" : "var(--color-foreground)",
                      }}
                    >
                      {option.label}
                    </span>
                    <span
                      style={{
                        fontSize: 9.5,
                        fontWeight: 700,
                        padding: "1px 5px",
                        borderRadius: 4,
                        background: isSelected
                          ? "rgba(139, 92, 246, 0.25)"
                          : "var(--color-surface-2)",
                        color: isSelected
                          ? "var(--color-primary-light)"
                          : "var(--color-muted-foreground)",
                      }}
                    >
                      {option.category}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: option.family,
                      color: isSelected ? "var(--color-foreground)" : "var(--color-muted-foreground)",
                      letterSpacing: "0.01em",
                    }}
                  >
                    {option.sampleText || "Aa Bb Gg 123 • $49.99 Instant Key"}
                  </span>
                </div>

                {isSelected && (
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      background: "var(--color-primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#ffffff",
                      flexShrink: 0,
                      boxShadow: "0 0 10px rgba(139, 92, 246, 0.5)",
                    }}
                  >
                    <Check size={13} strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
