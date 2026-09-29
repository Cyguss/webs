"use client";

import React, { useState, useRef, useEffect } from "react";
import { ArrowUpDown, Check, ChevronDown } from "lucide-react";

export type SortOptionValue = "default" | "price-asc" | "price-desc";

export interface SortOptionItem {
  value: SortOptionValue;
  label: string;
  shortLabel: string;
}

const SORT_OPTIONS: SortOptionItem[] = [
  {
    value: "default",
    label: "SORT: DEFAULT",
    shortLabel: "DEFAULT",
  },
  {
    value: "price-asc",
    label: "PRICE: LOW → HIGH",
    shortLabel: "PRICE: LOW → HIGH",
  },
  {
    value: "price-desc",
    label: "PRICE: HIGH → LOW",
    shortLabel: "PRICE: HIGH → LOW",
  },
];

interface StorefrontSortSelectorProps {
  value: SortOptionValue;
  onChange: (val: SortOptionValue) => void;
  size?: "sm" | "md";
  surfaceColor?: string;
  borderColor?: string;
  textColor?: string;
  mutedColor?: string;
  accentColor?: string;
}

export function StorefrontSortSelector({
  value,
  onChange,
  size = "md",
  surfaceColor,
  borderColor,
  textColor,
  mutedColor,
  accentColor = "#8b5cf6",
}: StorefrontSortSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption =
    SORT_OPTIONS.find((opt) => opt.value === value) || SORT_OPTIONS[0];

  const isSmall = size === "sm";

  // Check available space below to decide if we should open upward
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 180 && rect.top > 180) {
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
        display: "inline-block",
        zIndex: isOpen ? 100 : 1,
      }}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: isSmall ? "5px 9px" : "6px 12px",
          borderRadius: 6,
          background: isOpen ? `${accentColor}25` : bg,
          border: isOpen ? `1px solid ${accentColor}` : `1px solid ${border}`,
          color: text,
          fontSize: isSmall ? 10 : 11,
          fontFamily: "var(--font-mono, monospace)",
          fontWeight: 700,
          letterSpacing: "0.03em",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
          whiteSpace: "nowrap",
          boxShadow: isOpen
            ? `0 0 14px ${accentColor}40, 0 2px 6px rgba(0,0,0,0.2)`
            : "none",
          transition: "all 0.15s ease",
          outline: "none",
          boxSizing: "border-box",
        }}
      >
        <ArrowUpDown size={isSmall ? 11 : 12} color={accentColor} style={{ flexShrink: 0 }} />
        <span>{selectedOption.label}</span>
        <ChevronDown
          size={isSmall ? 11 : 12}
          color={isOpen ? accentColor : muted}
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.18s ease, color 0.15s ease",
            marginLeft: 2,
            flexShrink: 0,
          }}
        />
      </button>

      {/* Floating Dropdown Popover */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: openUpward ? "auto" : "calc(100% + 5px)",
            bottom: openUpward ? "calc(100% + 5px)" : "auto",
            right: 0,
            zIndex: 1000,
            minWidth: isSmall ? 175 : 195,
            borderRadius: 8,
            background: popoverBg,
            border: `1px solid ${border}`,
            boxShadow: `0 16px 36px rgba(0, 0, 0, 0.75), 0 0 16px ${accentColor}30`,
            backdropFilter: "blur(20px)",
            padding: 4,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            animation: "kryptFadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
            boxSizing: "border-box",
          }}
        >
          {SORT_OPTIONS.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                style={{
                  width: "100%",
                  padding: isSmall ? "6px 8px" : "7px 10px",
                  borderRadius: 5,
                  background: isSelected
                    ? `${accentColor}25`
                    : "transparent",
                  border: isSelected
                    ? `1px solid ${accentColor}`
                    : "1px solid transparent",
                  color: isSelected ? "#ffffff" : text,
                  fontSize: isSmall ? 10 : 11,
                  fontFamily: "var(--font-mono, monospace)",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  textAlign: "left",
                  transition: "all 0.12s ease",
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = "var(--color-surface-2)";
                    e.currentTarget.style.color = "#ffffff";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = text;
                  }
                }}
              >
                <span>{opt.label}</span>
                {isSelected && (
                  <Check size={isSmall ? 11 : 12} color={accentColor} style={{ marginLeft: 6, flexShrink: 0 }} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
