"use client";

import { useTheme } from "@/lib/theme";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label="Toggle theme"
      title="Toggle light/dark mode"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 30,
        height: 30,
        borderRadius: "var(--radius-sm)",
        color: "var(--color-foreground)",
        background: "var(--color-surface-2)",
        border: "1px solid var(--color-border)",
        cursor: "pointer",
        transition: "all 0.15s ease",
      }}
    >
      {theme === "dark" ? <Sun size={15} color="#f59e0b" /> : <Moon size={15} color="#6366f1" />}
    </button>
  );
}
