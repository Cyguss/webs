"use client";

import { useTheme } from "@/lib/theme";
import { Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";

interface ThemeToggleProps {
  variant?: "icon" | "pill" | "subtle";
  className?: string;
  style?: React.CSSProperties;
}

export function ThemeToggle({ variant = "icon", className = "", style = {} }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsClicked(true);
    toggleTheme();
    setTimeout(() => setIsClicked(false), 300);
  };

  if (!mounted) {
    return (
      <div
        style={{
          width: variant === "pill" ? 84 : 32,
          height: 32,
          borderRadius: 8,
          background: "var(--btn-ghost-bg, rgba(255, 255, 255, 0.04))",
          border: "1px solid var(--color-border, rgba(255, 255, 255, 0.08))",
          ...style,
        }}
      />
    );
  }

  const isDark = theme === "dark";

  if (variant === "pill") {
    return (
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        type="button"
        aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
        title={`Switch to ${isDark ? "light" : "dark"} mode`}
        className={`theme-toggle-btn ${className}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "5px 10px",
          borderRadius: 8,
          fontSize: 11,
          fontWeight: 700,
          fontFamily: "var(--font-mono, monospace)",
          color: "var(--color-foreground)",
          background: isHovered
            ? "var(--btn-ghost-bg-hover, rgba(255,255,255,0.08))"
            : "var(--btn-ghost-bg, rgba(255,255,255,0.04))",
          border: `1px solid ${isHovered ? "var(--color-border-hover, rgba(139,92,246,0.4))" : "var(--color-border, rgba(255,255,255,0.08))"}`,
          cursor: "pointer",
          transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          transform: isClicked ? "scale(0.92)" : isHovered ? "translateY(-1px)" : "scale(1)",
          boxShadow: isHovered ? "0 4px 12px rgba(55, 44, 102, 0.25)" : "none",
          userSelect: "none",
          ...style,
        }}
      >
        <div
          style={{
            position: "relative",
            width: 16,
            height: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
            transform: isDark ? "rotate(0deg)" : "rotate(360deg)",
          }}
        >
          {isDark ? (
            <Moon size={14} color="#a78bfa" style={{ filter: "drop-shadow(0 0 4px rgba(167, 139, 250, 0.5))" }} />
          ) : (
            <Sun size={14} color="#f59e0b" style={{ filter: "drop-shadow(0 0 4px rgba(245, 158, 11, 0.5))" }} />
          )}
        </div>
        <span>{isDark ? "DARK" : "LIGHT"}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      type="button"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      className={`theme-toggle-btn ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 32,
        height: 32,
        borderRadius: 8,
        color: "var(--color-foreground)",
        background: isHovered
          ? "var(--btn-ghost-bg-hover, rgba(255, 255, 255, 0.08))"
          : "var(--btn-ghost-bg, rgba(255, 255, 255, 0.04))",
        border: `1px solid ${isHovered ? "var(--color-border-hover, rgba(139, 92, 246, 0.4))" : "var(--color-border, rgba(255, 255, 255, 0.08))"}`,
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        transform: isClicked ? "scale(0.9)" : isHovered ? "translateY(-1px)" : "scale(1)",
        boxShadow: isHovered ? "0 4px 14px rgba(55, 44, 102, 0.3)" : "none",
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)",
          transform: isDark ? "rotate(0deg) scale(1)" : "rotate(180deg) scale(1.05)",
        }}
      >
        {isDark ? (
          <Moon
            size={15}
            color="#c4b5fd"
            style={{
              filter: isHovered ? "drop-shadow(0 0 6px rgba(196, 181, 253, 0.7))" : "none",
              transition: "filter 0.2s ease",
            }}
          />
        ) : (
          <Sun
            size={15}
            color="#f59e0b"
            style={{
              filter: isHovered ? "drop-shadow(0 0 6px rgba(245, 158, 11, 0.8))" : "none",
              transition: "filter 0.2s ease",
            }}
          />
        )}
      </div>
    </button>
  );
}
