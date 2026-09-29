"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Info, AlertTriangle, ShieldAlert, Sparkles, ExternalLink, X } from "lucide-react";

export interface GlobalBannerConfig {
  active?: boolean;
  text?: string;
  type?: "info" | "warning" | "alert" | "promo";
  target?: "all" | "platform" | "home" | "dashboard" | "storefronts";
  linkUrl?: string;
  linkText?: string;
  dismissible?: boolean;
}

interface GlobalAnnouncementBannerProps {
  config?: GlobalBannerConfig | null;
  currentLocation: "home" | "dashboard" | "storefront" | "platform";
  className?: string;
}

export function GlobalAnnouncementBanner({
  config: initialConfig,
  currentLocation,
  className = "",
}: GlobalAnnouncementBannerProps) {
  const [loadedConfig, setLoadedConfig] = useState<GlobalBannerConfig | null | undefined>(
    initialConfig !== undefined ? initialConfig : undefined
  );
  const [dismissed, setDismissed] = useState(false);

  // If no initialConfig was provided (e.g. on client pages like home or dashboard), fetch from public API
  useEffect(() => {
    if (initialConfig !== undefined) {
      setLoadedConfig(initialConfig);
      return;
    }

    let isMounted = true;
    fetch("/api/platform/announcement")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data) {
          setLoadedConfig(data);
        }
      })
      .catch(() => {
        // Ignore fetch errors gracefully
      });

    return () => {
      isMounted = false;
    };
  }, [initialConfig]);

  const activeConfig = loadedConfig;

  useEffect(() => {
    if (!activeConfig?.text) return;
    try {
      const key = `krypt_banner_dismissed_${encodeURIComponent(activeConfig.text.slice(0, 30))}`;
      if (sessionStorage.getItem(key) === "true") {
        setDismissed(true);
      } else {
        setDismissed(false);
      }
    } catch {
      // Ignore storage errors
    }
  }, [activeConfig?.text]);

  if (!activeConfig || !activeConfig.active || !activeConfig.text || !activeConfig.text.trim()) {
    return null;
  }

  if (dismissed && activeConfig.dismissible !== false) {
    return null;
  }

  // Target Location Filter Check
  const target = activeConfig.target || "all";
  let matches = false;

  if (target === "all") {
    matches = true;
  } else if (target === "platform") {
    matches = currentLocation !== "storefront";
  } else if (target === "home") {
    matches = currentLocation === "home";
  } else if (target === "dashboard") {
    matches = currentLocation === "dashboard";
  } else if (target === "storefronts") {
    matches = currentLocation === "storefront";
  }

  if (!matches) {
    return null;
  }

  function handleDismiss() {
    setDismissed(true);
    if (!activeConfig?.text) return;
    try {
      const key = `krypt_banner_dismissed_${encodeURIComponent(activeConfig.text.slice(0, 30))}`;
      sessionStorage.setItem(key, "true");
    } catch {
      // Ignore
    }
  }

  const type = activeConfig.type || "info";

  // Palette and styling tokens based on type
  const themeStyles = {
    info: {
      background: "linear-gradient(90deg, rgba(45, 35, 88, 0.96) 0%, rgba(67, 24, 130, 0.96) 50%, rgba(45, 35, 88, 0.96) 100%)",
      borderBottom: "1px solid rgba(139, 92, 246, 0.4)",
      textColor: "#e0e7ff",
      accentColor: "#a78bfa",
      buttonBg: "rgba(139, 92, 246, 0.25)",
      buttonBorder: "rgba(167, 139, 250, 0.5)",
      buttonColor: "#ffffff",
      Icon: Info,
    },
    warning: {
      background: "linear-gradient(90deg, rgba(88, 38, 10, 0.96) 0%, rgba(146, 64, 14, 0.96) 50%, rgba(88, 38, 10, 0.96) 100%)",
      borderBottom: "1px solid rgba(245, 158, 11, 0.45)",
      textColor: "#fef3c7",
      accentColor: "#fbbf24",
      buttonBg: "rgba(245, 158, 11, 0.25)",
      buttonBorder: "rgba(251, 191, 36, 0.5)",
      buttonColor: "#ffffff",
      Icon: AlertTriangle,
    },
    alert: {
      background: "linear-gradient(90deg, rgba(88, 15, 15, 0.96) 0%, rgba(153, 27, 27, 0.96) 50%, rgba(88, 15, 15, 0.96) 100%)",
      borderBottom: "1px solid rgba(239, 68, 68, 0.5)",
      textColor: "#fee2e2",
      accentColor: "#f87171",
      buttonBg: "rgba(239, 68, 68, 0.28)",
      buttonBorder: "rgba(248, 113, 113, 0.5)",
      buttonColor: "#ffffff",
      Icon: ShieldAlert,
    },
    promo: {
      background: "linear-gradient(90deg, rgba(6, 60, 45, 0.96) 0%, rgba(4, 120, 87, 0.96) 50%, rgba(6, 60, 45, 0.96) 100%)",
      borderBottom: "1px solid rgba(16, 185, 129, 0.45)",
      textColor: "#d1fae5",
      accentColor: "#34d399",
      buttonBg: "rgba(16, 185, 129, 0.25)",
      buttonBorder: "rgba(52, 211, 153, 0.5)",
      buttonColor: "#ffffff",
      Icon: Sparkles,
    },
  }[type];

  const { Icon } = themeStyles;

  return (
    <aside
      aria-label="Platform Announcement"
      className={className}
      style={{
        background: themeStyles.background,
        borderBottom: themeStyles.borderBottom,
        color: themeStyles.textColor,
        padding: "8px 16px",
        fontSize: 12,
        fontWeight: 600,
        position: "relative",
        zIndex: 100,
        backdropFilter: "blur(12px)",
        boxShadow: "0 2px 14px rgba(0,0,0,0.3)",
      }}
    >
      <div
        style={{
          maxWidth: 1380,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          flexWrap: "wrap",
          textAlign: "center",
          paddingRight: activeConfig.dismissible !== false ? 28 : 0,
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
          <Icon size={14} color={themeStyles.accentColor} style={{ flexShrink: 0 }} />
          <span>{activeConfig.text}</span>
        </div>

        {activeConfig.linkUrl && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            {activeConfig.linkUrl.startsWith("http") ? (
              <a
                href={activeConfig.linkUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "2px 10px",
                  borderRadius: 4,
                  background: themeStyles.buttonBg,
                  border: `1px solid ${themeStyles.buttonBorder}`,
                  color: themeStyles.buttonColor,
                  fontSize: 11,
                  fontWeight: 700,
                  textDecoration: "none",
                  transition: "all 0.15s ease",
                }}
              >
                <span>{activeConfig.linkText || "Learn More"}</span>
                <ExternalLink size={10} />
              </a>
            ) : (
              <Link
                href={activeConfig.linkUrl}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "2px 10px",
                  borderRadius: 4,
                  background: themeStyles.buttonBg,
                  border: `1px solid ${themeStyles.buttonBorder}`,
                  color: themeStyles.buttonColor,
                  fontSize: 11,
                  fontWeight: 700,
                  textDecoration: "none",
                  transition: "all 0.15s ease",
                }}
              >
                <span>{activeConfig.linkText || "Learn More"}</span>
              </Link>
            )}
          </div>
        )}

        {activeConfig.dismissible !== false && (
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss announcement"
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: themeStyles.textColor,
              opacity: 0.7,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 4,
              borderRadius: 4,
              transition: "opacity 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
          >
            <X size={14} />
          </button>
        )}
      </div>
    </aside>
  );
}
