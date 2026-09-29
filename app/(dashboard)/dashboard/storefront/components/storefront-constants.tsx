import React from "react";

export function DiscordIcon({ size = 18, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

export function TelegramIcon({ size = 18, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="m20.665 3.717-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l-.002.001-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.785l3.019-14.228c.309-1.239-.473-1.8-1.282-1.434z" />
    </svg>
  );
}

export function TrustpilotIcon({
  size = 18,
  color = "#00b67a",
  starColor,
}: {
  size?: number;
  color?: string;
  starColor?: string;
}) {
  const fill = starColor || color;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2l2.87 6.75 7.13.62-5.4 4.7 1.63 7.04L12 17.38l-6.23 3.73 1.63-7.04-5.4-4.7 7.13-.62L12 2z"
        fill={fill}
      />
      <path
        d="M14.2 14.1l-2.2 2.4 1.3 5.3 5.4-3.2-4.5-4.5z"
        fill="#000000"
        opacity="0.18"
      />
    </svg>
  );
}

export function YoutubeIcon({ size = 18, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

export function getPresetTextColor(bgHex: string): string {
  const c = bgHex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16) || 0;
  const g = parseInt(c.substring(2, 4), 16) || 0;
  const b = parseInt(c.substring(4, 6), 16) || 0;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.55 ? "#0f172a" : "#ffffff";
}

import { STOREFRONT_FONT_OPTIONS } from "@/lib/fonts";
export const FONT_OPTIONS = STOREFRONT_FONT_OPTIONS;

export const COLOR_PRESETS = [
  {
    bg: "#0a0b10",
    accent: "#6366f1",
    card: "#121420",
    text: "#ffffff",
    mutedText: "#94a3b8",
    border: "#232738",
    label: "Midnight Indigo",
  },
  {
    bg: "#060b14",
    accent: "#38bdf8",
    card: "#0c1524",
    text: "#f0f9ff",
    mutedText: "#7dd3fc",
    border: "#1a2c42",
    label: "Cyber Blue",
  },
  {
    bg: "#05100c",
    accent: "#10b981",
    card: "#0a1c15",
    text: "#ecfdf5",
    mutedText: "#6ee7b7",
    border: "#133e2f",
    label: "Emerald Dark",
  },
  {
    bg: "#120e0a",
    accent: "#f59e0b",
    card: "#1c150e",
    text: "#fffbeb",
    mutedText: "#fcd34d",
    border: "#3a2c1a",
    label: "Amber Glow",
  },
  {
    bg: "#13070b",
    accent: "#f43f5e",
    card: "#1e0b12",
    text: "#fff1f2",
    mutedText: "#fda4af",
    border: "#3d1320",
    label: "Crimson Rose",
  },
  {
    bg: "#f8fafc",
    accent: "#4f46e5",
    card: "#ffffff",
    text: "#0f172a",
    mutedText: "#64748b",
    border: "#e2e8f0",
    label: "Clean Light",
  },
];
