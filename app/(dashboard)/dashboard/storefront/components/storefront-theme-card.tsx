"use client";

import React from "react";
import { Palette, Type } from "lucide-react";
import { COLOR_PRESETS, FONT_OPTIONS, getPresetTextColor } from "./storefront-constants";
import { StorefrontFontSelector } from "@/components/storefront-font-selector";

interface StorefrontThemeCardProps {
  backgroundColor: string;
  setBackgroundColor: (val: string) => void;
  accentColor: string;
  setAccentColor: (val: string) => void;
  textColor: string;
  setTextColor: (val: string) => void;
  mutedTextColor: string;
  setMutedTextColor: (val: string) => void;
  cardColor: string;
  setCardColor: (val: string) => void;
  borderColor: string;
  setBorderColor: (val: string) => void;
  fontStyle: string;
  setFontStyle: (val: string) => void;
  customFontUrl: string;
  setCustomFontUrl: (val: string) => void;
}

export function StorefrontThemeCard({
  backgroundColor,
  setBackgroundColor,
  accentColor,
  setAccentColor,
  textColor,
  setTextColor,
  mutedTextColor,
  setMutedTextColor,
  cardColor,
  setCardColor,
  borderColor,
  setBorderColor,
  fontStyle,
  setFontStyle,
  customFontUrl,
  setCustomFontUrl,
}: StorefrontThemeCardProps) {
  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h3
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: "var(--color-foreground)",
          margin: 0,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Palette size={16} color="var(--color-primary-light)" /> Colors & Typography
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label className="label">Background Color</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="color"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              style={{
                width: 44,
                height: 40,
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                background: "none",
              }}
            />
            <input
              type="text"
              className="input"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
            />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label className="label">Accent Color</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="color"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              style={{
                width: 44,
                height: 40,
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                background: "none",
              }}
            />
            <input
              type="text"
              className="input"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Extended Color Customization */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label className="label">Header & Title Text Color</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="color"
              value={textColor || "#ffffff"}
              onChange={(e) => setTextColor(e.target.value)}
              style={{
                width: 44,
                height: 40,
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                background: "none",
              }}
            />
            <input
              type="text"
              className="input"
              placeholder="Default (#ffffff)"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
            />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label className="label">Subtext / Description Color</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="color"
              value={mutedTextColor || "#94a3b8"}
              onChange={(e) => setMutedTextColor(e.target.value)}
              style={{
                width: 44,
                height: 40,
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                background: "none",
              }}
            />
            <input
              type="text"
              className="input"
              placeholder="Default (#94a3b8)"
              value={mutedTextColor}
              onChange={(e) => setMutedTextColor(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label className="label">Product Card Background</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="color"
              value={cardColor || "#141620"}
              onChange={(e) => setCardColor(e.target.value)}
              style={{
                width: 44,
                height: 40,
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                background: "none",
              }}
            />
            <input
              type="text"
              className="input"
              placeholder="Default (Surface)"
              value={cardColor}
              onChange={(e) => setCardColor(e.target.value)}
            />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label className="label">Border & Outline Color</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="color"
              value={borderColor || "#262938"}
              onChange={(e) => setBorderColor(e.target.value)}
              style={{
                width: 44,
                height: 40,
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                background: "none",
              }}
            />
            <input
              type="text"
              className="input"
              placeholder="Default (Subtle)"
              value={borderColor}
              onChange={(e) => setBorderColor(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div>
        <label className="label" style={{ marginBottom: 8 }}>Curated Color Palettes</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {COLOR_PRESETS.map((preset) => {
            const presetTxt = getPresetTextColor(preset.bg);
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setBackgroundColor(preset.bg);
                  setAccentColor(preset.accent);
                  setCardColor(preset.card);
                  setTextColor(preset.text);
                  setMutedTextColor(preset.mutedText);
                  setBorderColor(preset.border);
                }}
                style={{
                  padding: "6px 12px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                  background: preset.bg,
                  color: presetTxt,
                  fontSize: 12,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  cursor: "pointer",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                }}
              >
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: preset.accent }} />
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label className="label">Preset Font Family</label>
        <StorefrontFontSelector value={fontStyle} onChange={setFontStyle} />
      </div>

      {/* Custom Font URL */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label className="label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Type size={14} color="var(--color-primary-light)" />
          Custom Font URL (Google Fonts or Webfont CSS)
        </label>
        <input
          type="url"
          className="input"
          placeholder="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;800&display=swap"
          value={customFontUrl}
          onChange={(e) => setCustomFontUrl(e.target.value)}
        />
        <span style={{ fontSize: 11, color: "var(--color-muted-foreground)" }}>
          Paste any stylesheet URL from Google Fonts or your CDN. Overrides standard font choice.
        </span>
      </div>
    </div>
  );
}
