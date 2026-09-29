"use client";

import React, { useState, useMemo } from "react";
import {
  Monitor,
  Laptop,
  Smartphone,
  Key,
  ShoppingBag,
  Clock,
  ExternalLink,
  Search,
  X,
  LayoutGrid,
  List,
  ShieldCheck,
  Zap,
  CheckCircle2,
  FileText,
  Terminal,
  Radio,
  Sparkles,
  Sun,
  Moon,
  Mail,
  Star,
  Lock,
  Layers,
} from "lucide-react";
import { DiscordIcon, YoutubeIcon, TelegramIcon, TrustpilotIcon } from "./storefront-constants";
import { parseMerchantSupport } from "@/lib/support-channels";
import { parseDiscordInput } from "@/lib/social";
import { getKeyDurationDisplay } from "@/lib/key-duration";
import { PRESET_CATEGORIES } from "@/components/product-category-selector";
import { StorefrontSortSelector } from "@/components/storefront-sort-selector";
import { StorefrontPlanSelector } from "@/components/storefront-plan-selector";
import { useTheme } from "@/lib/theme";

interface StorefrontPreviewProps {
  previewSize: "desktop" | "laptop" | "mobile";
  setPreviewSize: (val: "desktop" | "laptop" | "mobile") => void;
  backgroundColor: string;
  accentColor: string;
  textColor: string;
  mutedTextColor: string;
  cardColor: string;
  borderColor: string;
  previewFont: string;
  fontStylesheetUrl?: string | null;
  customFontUrl: string;
  bannerUrl: string;
  logoUrl: string;
  name: string;
  description: string;
  trustpilotUrl: string;
  discordUrl: string;
  youtubeUrl: string;
  telegramUrl: string;
  contactInfo?: string;
  supportEmail?: string;
  discordInfo: any;
  socialPreviews: any;
  products?: any[];
  shopCategories?: any[];
}

export function StorefrontPreview({
  previewSize,
  setPreviewSize,
  backgroundColor,
  accentColor,
  textColor,
  mutedTextColor,
  cardColor,
  borderColor,
  previewFont,
  fontStylesheetUrl,
  customFontUrl,
  bannerUrl,
  logoUrl,
  name,
  description,
  trustpilotUrl,
  discordUrl,
  youtubeUrl,
  telegramUrl,
  contactInfo,
  supportEmail,
  discordInfo,
  socialPreviews,
  products = [],
  shopCategories = [],
}: StorefrontPreviewProps) {
  const { theme } = useTheme();
  const isDashLight = theme === "light";

  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"default" | "price-asc" | "price-desc">("default");
  const [selectedVariantPerProduct, setSelectedVariantPerProduct] = useState<Record<string, string>>({});

  // Luminance calculation for intelligent fallback colors
  const c = (backgroundColor || "#0a0a0e").replace("#", "");
  const r = parseInt(c.substring(0, 2), 16) || 0;
  const g = parseInt(c.substring(2, 4), 16) || 0;
  const b = parseInt(c.substring(4, 6), 16) || 0;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  const defaultText = lum > 0.55 ? "#111827" : "#f1f5f9";
  const defaultMuted = lum > 0.55 ? "rgba(17, 24, 39, 0.65)" : "rgba(241, 245, 249, 0.6)";
  const defaultSurface = lum > 0.55 ? "#ffffff" : "#11131a";
  const defaultSurface2 = lum > 0.55 ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)";
  const defaultBorder = lum > 0.55 ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.08)";

  const previewTextColor = textColor || defaultText;
  const previewMutedColor = mutedTextColor || defaultMuted;
  const previewSurface = cardColor || defaultSurface;
  const previewBorder = borderColor || defaultBorder;
  const accent = accentColor || "rgb(55, 44, 102)";

  // Support parsing
  const support = parseMerchantSupport({
    supportEmail,
    discordUrl,
    telegramUrl,
    contactInfo,
  });

  // Dynamic category tabs with real counts
  const categoryTabs = useMemo(() => {
    const countMap: Record<string, number> = { all: products.length };
    const nameMap: Record<string, string> = { all: "All Products" };

    for (const p of PRESET_CATEGORIES) {
      nameMap[p.id.toLowerCase()] = p.name;
    }

    for (const c of shopCategories) {
      const idLower = c.id.toLowerCase();
      nameMap[idLower] = c.name;
    }

    for (const p of products) {
      if (p.category && p.category.trim()) {
        const catKey = p.category.trim().toLowerCase();
        countMap[catKey] = (countMap[catKey] || 0) + 1;
        if (!nameMap[catKey]) {
          nameMap[catKey] = p.category;
        }
      } else {
        countMap["uncategorized"] = (countMap["uncategorized"] || 0) + 1;
      }
    }

    const tabs: Array<{ id: string; name: string; count: number }> = [
      { id: "all", name: "All Products", count: products.length },
    ];

    const addedKeys = new Set<string>(["all"]);

    for (const c of shopCategories) {
      const idLower = c.id.toLowerCase();
      const cnt = countMap[idLower] || 0;
      if (!addedKeys.has(idLower) && cnt > 0) {
        tabs.push({
          id: idLower,
          name: c.name,
          count: cnt,
        });
        addedKeys.add(idLower);
      }
    }

    for (const [catKey, count] of Object.entries(countMap)) {
      if (!addedKeys.has(catKey) && catKey !== "uncategorized" && count > 0) {
        tabs.push({
          id: catKey,
          name: nameMap[catKey] || catKey,
          count,
        });
        addedKeys.add(catKey);
      }
    }

    if (countMap["uncategorized"] && countMap["uncategorized"] > 0 && tabs.length > 1) {
      tabs.push({
        id: "uncategorized",
        name: "Other",
        count: countMap["uncategorized"],
      });
    }

    return tabs;
  }, [products, shopCategories]);

  // Helper to parse variants for a product
  function getProductVariants(p: any) {
    if (!p.variants) return [];
    try {
      const arr = typeof p.variants === "string" ? JSON.parse(p.variants) : p.variants;
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  // Filter & sort real products
  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (activeCategory !== "all") {
      if (activeCategory === "uncategorized") {
        list = list.filter((p) => !p.category || !p.category.trim());
      } else {
        list = list.filter((p) => {
          if (!p.category) return false;
          return p.category.trim().toLowerCase() === activeCategory;
        });
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) => {
        const titleMatch = (p.title || "").toLowerCase().includes(q);
        const descMatch = (p.description || "").toLowerCase().includes(q);
        const catMatch = (p.category || "").toLowerCase().includes(q);
        return titleMatch || descMatch || catMatch;
      });
    }

    if (inStockOnly) {
      list = list.filter((p) => p.isUnlimitedStock || p.stock > 0);
    }

    if (sortBy === "price-asc") {
      list.sort((a, b) => parseFloat(a.price || "0") - parseFloat(b.price || "0"));
    } else if (sortBy === "price-desc") {
      list.sort((a, b) => parseFloat(b.price || "0") - parseFloat(a.price || "0"));
    }

    return list;
  }, [products, activeCategory, searchQuery, inStockOnly, sortBy]);

  const isMobile = previewSize === "mobile";
  const isLaptop = previewSize === "laptop";

  return (
    <div style={{ position: "sticky", top: 32, height: "fit-content" }}>
      {/* Top Controls Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: "var(--color-foreground)",
              letterSpacing: "0.04em",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Radio size={14} color="#22c55e" className="animate-pulse" />
            Live Storefront Mirror
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              padding: "2px 6px",
              borderRadius: 4,
              background: "rgba(34, 197, 94, 0.15)",
              color: "#22c55e",
            }}
          >
            SYNCED
          </span>
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          {[
            { key: "desktop", label: "Desktop", Icon: Monitor },
            { key: "laptop", label: "Laptop", Icon: Laptop },
            { key: "mobile", label: "Mobile", Icon: Smartphone },
          ].map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setPreviewSize(key as any)}
              style={{
                padding: "5px 10px",
                borderRadius: 8,
                background:
                  previewSize === key
                    ? "var(--color-primary-subtle)"
                    : "var(--color-surface-2)",
                border:
                  previewSize === key
                    ? "1px solid var(--color-primary-light)"
                    : "1px solid var(--color-border)",
                color:
                  previewSize === key
                    ? "var(--color-primary-light)"
                    : "var(--color-muted-foreground)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
                transition: "all 0.15s ease",
              }}
            >
              <Icon size={14} />
              <span style={{ fontSize: 11, fontWeight: 700 }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Frame Container */}
      <div
        style={{
          borderRadius: 16,
          border: isDashLight ? "1px solid var(--color-border, #e2e8f0)" : "1px solid var(--color-border, rgba(255, 255, 255, 0.08))",
          background: isDashLight ? "var(--color-surface, #ffffff)" : "var(--color-surface, #0c0e14)",
          padding: isMobile ? "24px 14px" : "18px 16px",
          display: "flex",
          justifyContent: "center",
          overflow: "visible",
          boxShadow: isDashLight
            ? "0 10px 30px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.03)"
            : "0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(139, 92, 246, 0.08)",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: isMobile ? 360 : isLaptop ? 540 : "100%",
            height: isMobile ? 700 : isLaptop ? 620 : 720,
            maxHeight: "calc(100vh - 120px)",
            borderRadius: isMobile ? 40 : isLaptop ? 12 : 14,
            border: isMobile
              ? isDashLight ? "8px solid #1e2028" : "8px solid #14161f"
              : isLaptop
              ? isDashLight ? "4px solid #334155" : "4px solid #1e293b"
              : isDashLight ? "1px solid rgba(0, 0, 0, 0.12)" : `1px solid ${previewBorder}`,
            boxShadow: isMobile
              ? isDashLight ? "0 20px 45px rgba(0,0,0,0.18)" : "0 25px 65px rgba(0,0,0,0.7), 0 0 30px rgba(139, 92, 246, 0.15)"
              : isLaptop
              ? isDashLight ? "0 16px 40px rgba(0,0,0,0.14)" : "0 22px 55px rgba(0,0,0,0.7), 0 0 25px rgba(99, 102, 241, 0.2)"
              : isDashLight ? "0 10px 30px rgba(0,0,0,0.08)" : "0 20px 50px rgba(0,0,0,0.65), 0 0 20px rgba(139, 92, 246, 0.15)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            background: backgroundColor || "#030305",
            color: previewTextColor,
            fontFamily: previewFont,
            position: "relative",
            transition: "max-width 0.4s cubic-bezier(0.16, 1, 0.3, 1), height 0.4s cubic-bezier(0.16, 1, 0.3, 1), border-radius 0.35s ease, border 0.35s ease, box-shadow 0.35s ease",
          }}
        >
          {/* Dynamic Google Fonts or Custom Webfont Stylesheet */}
          {fontStylesheetUrl ? (
            <link rel="stylesheet" href={fontStylesheetUrl} key={fontStylesheetUrl} />
          ) : customFontUrl ? (
            <link rel="stylesheet" href={customFontUrl} key={customFontUrl} />
          ) : null}

          {/* Top Chassis Bezel: Browser Address Bar (Desktop/Laptop) or Dynamic Island (Mobile) */}
          {isMobile ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "8px 0 6px",
                background: previewSurface,
                borderBottom: `1px solid ${previewBorder}`,
                flexShrink: 0,
                zIndex: 50,
              }}
            >
              <div
                style={{
                  width: 76,
                  height: 16,
                  borderRadius: 10,
                  background: "#000000",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  paddingRight: 6,
                }}
              >
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#1e293b" }} />
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 14px",
                background: isDashLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.03)",
                borderBottom: `1px solid ${previewBorder}`,
                flexShrink: 0,
                zIndex: 50,
              }}
            >
              {/* 3 traffic dots */}
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff5f56" }} />
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ffbd2e" }} />
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#27c93f" }} />
              </div>

              {/* URL Pill */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "3px 12px",
                  borderRadius: 6,
                  background: defaultSurface2,
                  border: `1px solid ${previewBorder}`,
                  fontSize: 9.5,
                  fontFamily: "var(--font-mono, monospace)",
                  color: previewMutedColor,
                }}
              >
                <Lock size={9} color="#22c55e" />
                <span>krypt.market/{name ? name.toLowerCase().replace(/\s+/g, "-") : "store"}</span>
              </div>

              <div style={{ width: 36 }} />
            </div>
          )}

          {/* ─── Scrollable Inner Viewport ─── */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden",
              display: "flex",
              flexDirection: "column",
              position: "relative",
            }}
          >

          {/* ─── Top Command Bar (Store Brand Header) ─── */}
          <header
            style={{
              position: "sticky",
              top: 0,
              zIndex: 40,
              background: previewSurface,
              backdropFilter: "blur(16px)",
              borderBottom: `1px solid ${previewBorder}`,
              padding: "10px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            {/* Left: Store Brand & Monogram */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: defaultSurface2,
                  border: `1px solid ${previewBorder}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: accent,
                  flexShrink: 0,
                  overflow: "hidden",
                }}
              >
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt=""
                    referrerPolicy="no-referrer"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <ShoppingBag size={14} color={accent} />
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                <span
                  style={{
                    fontWeight: 900,
                    fontSize: 12,
                    letterSpacing: "0.02em",
                    color: previewTextColor,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {name || "STORE NODE"}
                </span>
                <span style={{ fontSize: 8.5, color: previewMutedColor }}>
                  powered by krypt.market
                </span>
              </div>
            </div>
          </header>

          {/* ─── Main Content Grid (Sidebar + Catalog) ─── */}
          <div
            style={{
              padding: isMobile ? "14px 12px 60px" : isLaptop ? "14px 12px 60px" : "18px 16px 80px",
              display: "grid",
              gridTemplateColumns: isMobile
                ? "1fr"
                : isLaptop
                ? "180px 1fr"
                : "240px 1fr",
              gap: isLaptop ? 10 : 16,
              alignItems: "start",
              transition: "grid-template-columns 0.4s cubic-bezier(0.16, 1, 0.3, 1), gap 0.4s ease, padding 0.4s ease",
            }}
          >
            {/* ─── LEFT COLUMN: Merchant Node Panel ─── */}
            <aside style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Node Identity Card */}
              <div
                style={{
                  background: previewSurface,
                  border: `1px solid ${previewBorder}`,
                  borderRadius: 12,
                  padding: 14,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 8,
                      background: defaultSurface2,
                      border: `1px solid ${previewBorder}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      fontWeight: 900,
                      color: previewTextColor,
                      flexShrink: 0,
                      overflow: "hidden",
                    }}
                  >
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt=""
                        referrerPolicy="no-referrer"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      name[0] || "K"
                    )}
                  </div>

                  <div>
                    <h2 style={{ fontSize: 14, fontWeight: 900, color: previewTextColor, margin: 0 }}>
                      {name || "Store Name"}
                    </h2>
                  </div>
                </div>

                <p style={{ fontSize: 11, color: previewMutedColor, lineHeight: 1.4, margin: "0 0 10px 0" }}>
                  {description || "Automated digital license dispatch node. Instant peer-to-peer delivery."}
                </p>

                {/* Support Channels Block (ONLY when hasAnySupport is true) */}
                {support.hasAnySupport && (
                  <div
                    style={{
                      marginTop: 10,
                      paddingTop: 10,
                      borderTop: `1px solid ${previewBorder}`,
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 9.5, fontWeight: 800, color: previewMutedColor, textTransform: "uppercase" }}>
                        Support Channels
                      </span>
                      <span style={{ fontSize: 8.5, fontWeight: 700, padding: "1px 5px", borderRadius: 4, background: `${accent}25`, color: accent }}>
                        Direct Help
                      </span>
                    </div>

                    {support.discord && (
                      <div
                        style={{
                          padding: "6px 8px",
                          borderRadius: 6,
                          background: `${accent}15`,
                          border: `1px solid ${accent}35`,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: 10,
                          fontWeight: 700,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <DiscordIcon size={12} color={accent} />
                          <span style={{ color: previewTextColor }}>{support.discord.type === "server" ? "Discord Server" : "Discord User"}</span>
                        </div>
                        <span style={{ fontSize: 8.5, color: accent }}>
                          {support.discord.type === "server" ? "Join" : (support.discord.handle || support.discord.value)}
                        </span>
                      </div>
                    )}

                    {support.email && (
                      <div
                        style={{
                          padding: "6px 8px",
                          borderRadius: 6,
                          background: defaultSurface2,
                          border: `1px solid ${previewBorder}`,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: 10,
                          fontWeight: 700,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Mail size={12} color={accent} />
                          <span style={{ color: previewTextColor }}>Email Support</span>
                        </div>
                        <span style={{ fontSize: 8.5, color: accent, maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {support.email}
                        </span>
                      </div>
                    )}

                    {support.telegram && (
                      <div
                        style={{
                          padding: "6px 8px",
                          borderRadius: 6,
                          background: "rgba(34, 158, 217, 0.1)",
                          border: "1px solid rgba(34, 158, 217, 0.25)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: 10,
                          fontWeight: 700,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <TelegramIcon size={12} color="#38bdf8" />
                          <span style={{ color: previewTextColor }}>Telegram Support</span>
                        </div>
                        <span style={{ fontSize: 8.5, color: "#38bdf8" }}>
                          {support.telegram.handle || "Chat"}
                        </span>
                      </div>
                    )}

                    {support.workingHours && (
                      <div
                        style={{
                          padding: "5px 7px",
                          borderRadius: 5,
                          background: defaultSurface2,
                          border: `1px solid ${previewBorder}`,
                          fontSize: 9.5,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          fontWeight: 600,
                          color: previewTextColor,
                        }}
                      >
                        <Clock size={11} color="#f59e0b" />
                        <span>{support.workingHours.display}</span>
                      </div>
                    )}

                    {support.instructions && (
                      <div style={{ fontSize: 9, color: previewMutedColor, whiteSpace: "pre-wrap", lineHeight: 1.3 }}>
                        {support.instructions}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Sidebar Instant Key Recovery Widget */}
              <div
                style={{
                  background: previewSurface,
                  border: `1px solid ${previewBorder}`,
                  borderRadius: 12,
                  padding: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Key size={12} color={accent} />
                  <span style={{ fontSize: 10, fontWeight: 800, color: previewTextColor, letterSpacing: "0.03em" }}>
                    INSTANT KEY RECOVERY
                  </span>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <input
                    type="text"
                    placeholder="Enter order email..."
                    readOnly
                    style={{
                      width: "100%",
                      padding: "5px 8px",
                      borderRadius: 5,
                      background: defaultSurface2,
                      border: `1px solid ${previewBorder}`,
                      fontSize: 9.5,
                      color: previewTextColor,
                      outline: "none",
                    }}
                  />
                  <button
                    type="button"
                    style={{
                      padding: "5px 8px",
                      borderRadius: 5,
                      background: `${accent}35`,
                      border: `1px solid ${accent}60`,
                      color: accent,
                      fontSize: 9,
                      fontWeight: 800,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Query
                  </button>
                </div>
              </div>

              {/* Community & Social Channels */}
              {(discordUrl || youtubeUrl || telegramUrl || trustpilotUrl) && (
                <div
                  style={{
                    background: previewSurface,
                    border: `1px solid ${previewBorder}`,
                    borderRadius: 12,
                    padding: 12,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <span style={{ fontSize: 9.5, fontWeight: 800, color: previewMutedColor, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    Community & Links
                  </span>

                  {discordUrl && (() => {
                    const dc = parseDiscordInput(discordUrl);
                    return (
                      <div
                        style={{
                          padding: "6px 10px",
                          borderRadius: 6,
                          background: `${accent}18`,
                          border: `1px solid ${accent}33`,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: 10,
                          fontWeight: 700,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <DiscordIcon size={12} color={accent} />
                          <span style={{ color: previewTextColor }}>{dc.label}</span>
                        </div>
                        <span style={{ fontSize: 9, color: accent }}>
                          {dc.type === "server" ? "Join" : (dc.handle || "Contact")}
                        </span>
                      </div>
                    );
                  })()}

                  {telegramUrl && (
                    <div
                      style={{
                        padding: "6px 10px",
                        borderRadius: 6,
                        background: defaultSurface2,
                        border: `1px solid ${previewBorder}`,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <TelegramIcon size={12} color="#38bdf8" />
                        <span>Telegram Channel</span>
                      </div>
                      <ExternalLink size={10} color={previewMutedColor} />
                    </div>
                  )}

                  {trustpilotUrl && (
                    <div
                      style={{
                        padding: "6px 10px",
                        borderRadius: 6,
                        background: defaultSurface2,
                        border: `1px solid ${previewBorder}`,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <TrustpilotIcon size={12} color="#22c55e" />
                        <span>Trustpilot Reviews</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <Star size={10} fill="#22c55e" color="#22c55e" />
                        <span style={{ fontSize: 9, color: "#22c55e", fontWeight: 800 }}>5.0</span>
                      </div>
                    </div>
                  )}

                  {youtubeUrl && (
                    <div
                      style={{
                        padding: "6px 10px",
                        borderRadius: 6,
                        background: defaultSurface2,
                        border: `1px solid ${previewBorder}`,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <YoutubeIcon size={12} color="#ef4444" />
                        <span>YouTube Channel</span>
                      </div>
                      <ExternalLink size={10} color={previewMutedColor} />
                    </div>
                  )}
                </div>
              )}
            </aside>

            {/* ─── RIGHT COLUMN: Products Catalog & Hero Banner ─── */}
            <main style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Hero Banner Header */}
              <div
                style={{
                  height: isMobile ? 100 : isLaptop ? 120 : 140,
                  borderRadius: 12,
                  border: `1px solid ${previewBorder}`,
                  position: "relative",
                  overflow: "hidden",
                  background: previewSurface,
                  transition: "height 0.3s ease",
                }}
              >
                {bannerUrl ? (
                  <>
                    <img
                      src={bannerUrl}
                      alt=""
                      referrerPolicy="no-referrer"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.75) 100%)",
                      }}
                    />
                  </>
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      background: `radial-gradient(circle at 80% 20%, ${accent}50 0%, ${previewSurface} 75%)`,
                    }}
                  />
                )}

                {/* Scanline Grid Pattern */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: "linear-gradient(rgba(0,0,0,0) 50%, rgba(0,0,0,0.2) 50%)",
                    backgroundSize: "100% 4px",
                    pointerEvents: "none",
                  }}
                />

                <div style={{ position: "absolute", bottom: 12, left: 16, right: 16, zIndex: 2 }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#ffffff", letterSpacing: "0.02em", textShadow: "0 2px 10px rgba(0,0,0,0.7)" }}>
                    {name || "Store Name"}
                  </div>
                </div>
              </div>

              {/* Command Deck (Search, Filters, View Modes) */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  background: previewSurface,
                  border: `1px solid ${previewBorder}`,
                  borderRadius: 12,
                  padding: "12px 14px",
                }}
              >
                {/* Search Bar + Filters + View Switcher */}
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ position: "relative", flex: 1, minWidth: 160 }}>
                    <Search
                      size={12}
                      style={{
                        position: "absolute",
                        left: 10,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: accent,
                        pointerEvents: "none",
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "6px 26px 6px 28px",
                        borderRadius: 6,
                        background: defaultSurface2,
                        border: `1px solid ${previewBorder}`,
                        fontSize: 10.5,
                        color: previewTextColor,
                        outline: "none",
                      }}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        style={{
                          position: "absolute",
                          right: 8,
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          color: previewMutedColor,
                          cursor: "pointer",
                          display: "flex",
                        }}
                      >
                        <X size={11} />
                      </button>
                    )}
                  </div>

                  {/* In Stock Filter */}
                  <button
                    type="button"
                    onClick={() => setInStockOnly(!inStockOnly)}
                    style={{
                      padding: "5px 8px",
                      borderRadius: 6,
                      background: inStockOnly ? `${accent}25` : defaultSurface2,
                      border: inStockOnly ? `1px solid ${accent}` : `1px solid ${previewBorder}`,
                      color: inStockOnly ? accent : previewMutedColor,
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: inStockOnly ? accent : previewMutedColor,
                      }}
                    />
                    <span>In Stock</span>
                  </button>

                  {/* Sort */}
                  <StorefrontSortSelector
                    value={sortBy}
                    onChange={setSortBy}
                    size="sm"
                    surfaceColor={defaultSurface2}
                    borderColor={previewBorder}
                    textColor={previewTextColor}
                    mutedColor={previewMutedColor}
                    accentColor={accent}
                  />

                  {/* View Switcher */}
                  <div style={{ display: "flex", gap: 2, background: defaultSurface2, border: `1px solid ${previewBorder}`, borderRadius: 6, padding: 2 }}>
                    <button
                      type="button"
                      onClick={() => setViewMode("grid")}
                      title="Grid View"
                      style={{
                        padding: 4,
                        borderRadius: 4,
                        background: viewMode === "grid" ? accent : "transparent",
                        color: viewMode === "grid" ? "#ffffff" : previewMutedColor,
                        border: viewMode === "grid" ? `1px solid ${accent}` : "1px solid transparent",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <LayoutGrid size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("table")}
                      title="Table View"
                      style={{
                        padding: 4,
                        borderRadius: 4,
                        background: viewMode === "table" ? accent : "transparent",
                        color: viewMode === "table" ? "#ffffff" : previewMutedColor,
                        border: viewMode === "table" ? `1px solid ${accent}` : "1px solid transparent",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <List size={12} />
                    </button>
                  </div>
                </div>

                {/* Category Pills (Only show if > 1 category tab exists) */}
                {categoryTabs.length > 1 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
                    {categoryTabs.map((cat, idx) => {
                      const isSelected = activeCategory === cat.id;
                      const formattedIndex = idx.toString().padStart(2, "0");
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setActiveCategory(cat.id)}
                          style={{
                            padding: "4px 10px",
                            borderRadius: 6,
                            background: isSelected
                              ? accent
                              : defaultSurface2,
                            border: isSelected
                              ? `1px solid ${accent}`
                              : `1px solid ${previewBorder}`,
                            color: isSelected ? "#ffffff" : previewMutedColor,
                            fontSize: 9.5,
                            fontWeight: 800,
                            letterSpacing: "0.04em",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            whiteSpace: "nowrap",
                            boxShadow: isSelected ? `0 0 10px ${accent}50` : "none",
                          }}
                        >
                          <span style={{ color: isSelected ? "#ffffff" : accent, opacity: isSelected ? 0.9 : 0.8 }}>
                            [{formattedIndex}]
                          </span>
                          <span>{cat.name}</span>
                          <span
                            style={{
                              fontSize: 8.5,
                              padding: "1px 4px",
                              borderRadius: 3,
                              background: isSelected ? "rgba(255,255,255,0.2)" : defaultSurface2,
                              color: isSelected ? "#ffffff" : previewMutedColor,
                            }}
                          >
                            {cat.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ─── Real Products Catalog Content ─── */}
              {filteredProducts.length === 0 ? (
                <div
                  style={{
                    padding: "36px 20px",
                    textAlign: "center",
                    background: previewSurface,
                    border: `1px dashed ${previewBorder}`,
                    borderRadius: 12,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: `${accent}18`,
                      border: `1px solid ${accent}35`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 10px",
                      color: accent,
                    }}
                  >
                    <Lock size={18} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: previewTextColor }}>
                    {products.length === 0 ? "No Products Created Yet" : "No Products Found"}
                  </div>
                  <p style={{ fontSize: 11, color: previewMutedColor, marginTop: 4 }}>
                    {products.length === 0
                      ? "Add products in Dashboard > Products to display them in your live catalog."
                      : "No products matched your search or filters."}
                  </p>
                  {(searchQuery || activeCategory !== "all" || inStockOnly) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setActiveCategory("all");
                        setInStockOnly(false);
                      }}
                      style={{
                        marginTop: 10,
                        padding: "5px 12px",
                        borderRadius: 6,
                        background: `${accent}18`,
                        border: `1px solid ${accent}40`,
                        color: accent,
                        fontSize: 10.5,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              ) : viewMode === "grid" ? (
                /* ─── Grid View ─── */
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        isMobile ? "1fr" : isLaptop ? "1fr" : "repeat(auto-fill, minmax(210px, 1fr))",
                      gap: 12,
                      transition: "grid-template-columns 0.4s ease",
                    }}
                  >
                  {filteredProducts.map((p) => {
                    const variants = getProductVariants(p);
                    const variantStocks = p.variantStocks || {};
                    const activeVarId = selectedVariantPerProduct[p.id] || (variants[0]?.id ?? "");
                    const activeVariant = variants.find((v: any) => v.id === activeVarId) || variants[0];
                    const currentPrice = activeVariant ? parseFloat(activeVariant.price) : parseFloat(p.price || "0");

                    const activeVariantStock = p.isUnlimitedStock
                      ? 9999
                      : activeVariant
                      ? (variantStocks[activeVariant.id] ?? variantStocks[activeVariant.duration] ?? p.stock)
                      : p.stock;

                    const isOutOfStock = !p.isUnlimitedStock && activeVariantStock <= 0;

                    return (
                      <div
                        key={p.id}
                        style={{
                          background: previewSurface,
                          border: `1px solid ${previewBorder}`,
                          borderRadius: 10,
                          overflow: "visible",
                          display: "flex",
                          flexDirection: "column",
                          position: "relative",
                          boxShadow: "0 6px 18px rgba(0, 0, 0, 0.08)",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {/* Top Meta Header */}
                        <div
                          style={{
                            padding: "6px 10px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            borderBottom: `1px solid ${previewBorder}`,
                            background: defaultSurface2,
                            borderTopLeftRadius: 9,
                            borderTopRightRadius: 9,
                            fontSize: 9,
                          }}
                        >
                          <span style={{ color: previewMutedColor, letterSpacing: "0.02em" }}>
                            {p.type === "key" ? "Digital Key" : "Instant Delivery"}
                          </span>

                          <span
                            style={{
                              fontWeight: 800,
                              color: isOutOfStock ? "#ef4444" : "#22c55e",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <span
                              style={{
                                width: 5,
                                height: 5,
                                borderRadius: "50%",
                                background: isOutOfStock ? "#ef4444" : "#22c55e",
                                boxShadow: `0 0 6px ${isOutOfStock ? "#ef4444" : "#22c55e"}`,
                              }}
                            />
                            {p.isUnlimitedStock
                              ? "Instant"
                              : isOutOfStock
                              ? "Out of Stock"
                              : `${activeVariantStock} in Stock`}
                          </span>
                        </div>

                        {/* Product Media */}
                        <div
                          style={{
                            height: 110,
                            position: "relative",
                            background: defaultSurface2,
                            overflow: "hidden",
                          }}
                        >
                          {p.thumbnailUrl || p.imageUrl ? (
                            <img
                              src={p.thumbnailUrl || p.imageUrl || ""}
                              alt={p.title}
                              referrerPolicy="no-referrer"
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: `radial-gradient(circle, ${accent}25 0%, rgba(17,19,26,0.9) 100%)`,
                                color: accent,
                              }}
                            >
                              <Terminal size={26} />
                            </div>
                          )}

                          {/* Scanline Grid Overlay */}
                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              backgroundImage: "linear-gradient(rgba(0,0,0,0) 50%, rgba(0,0,0,0.15) 50%)",
                              backgroundSize: "100% 4px",
                              pointerEvents: "none",
                            }}
                          />
                        </div>

                        {/* Card Body */}
                        <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", flex: 1, gap: 8 }}>
                          {/* Title & Category */}
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                              <span
                                style={{
                                  fontSize: 8.5,
                                  fontWeight: 700,
                                  padding: "2px 5px",
                                  borderRadius: 4,
                                  background: `${accent}18`,
                                  color: accent,
                                  border: `1px solid ${accent}35`,
                                  textTransform: "uppercase",
                                }}
                              >
                                {p.category || "GENERAL"}
                              </span>
                            </div>

                            <div
                              style={{
                                color: previewTextColor,
                                fontWeight: 800,
                                fontSize: 12,
                                letterSpacing: "-0.01em",
                                lineHeight: 1.3,
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {p.title}
                            </div>
                          </div>

                          {/* Duration Plan Dropdown Selector */}
                          {variants.length > 0 && (
                            <div style={{ marginTop: 2 }}>
                              <StorefrontPlanSelector
                                variants={variants}
                                activeVariantId={activeVarId}
                                onSelectVariant={(varId) =>
                                  setSelectedVariantPerProduct((prev) => ({ ...prev, [p.id]: varId }))
                                }
                                product={p}
                                size="sm"
                                fullWidth
                                surfaceColor={previewSurface}
                                borderColor={previewBorder}
                                textColor={previewTextColor}
                                mutedColor={previewMutedColor}
                                accentColor={accent}
                              />
                            </div>
                          )}

                          {/* Pricing & CTA */}
                          <div
                            style={{
                              marginTop: "auto",
                              paddingTop: 8,
                              borderTop: `1px solid ${previewBorder}`,
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <div>
                              <span style={{ fontSize: 8.5, color: previewMutedColor, display: "block" }}>
                                PRICE
                              </span>
                              <span
                                style={{
                                  fontSize: 14,
                                  fontWeight: 900,
                                  color: previewTextColor,
                                }}
                              >
                                ${currentPrice.toFixed(2)}
                              </span>
                            </div>

                            <button
                              type="button"
                              disabled={isOutOfStock}
                              style={{
                                padding: "5px 12px",
                                borderRadius: 6,
                                background: isOutOfStock
                                  ? defaultSurface2
                                  : `linear-gradient(135deg, ${accent} 0%, ${accent} 100%)`,
                                color: isOutOfStock ? previewMutedColor : "#ffffff",
                                border: isOutOfStock ? `1px solid ${previewBorder}` : `1px solid ${accent}88`,
                                fontSize: 9.5,
                                fontWeight: 800,
                                letterSpacing: "0.04em",
                                cursor: isOutOfStock ? "not-allowed" : "pointer",
                                boxShadow: isOutOfStock ? "none" : `0 0 10px ${accent}50`,
                              }}
                            >
                              {isOutOfStock ? "Out of Stock" : "Buy Now"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* ─── Table View ─── */
                <div
                  style={{
                    background: previewSurface,
                    border: `1px solid ${previewBorder}`,
                    borderRadius: 12,
                    minHeight: 200,
                    overflow: "visible",
                    boxShadow: "0 6px 20px rgba(0, 0, 0, 0.08)",
                  }}
                >
                  <div style={{ overflowX: "visible" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 11 }}>
                      <thead>
                        <tr
                          style={{
                            background: defaultSurface2,
                            borderBottom: `1px solid ${previewBorder}`,
                            color: previewTextColor,
                            fontSize: 9,
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                          }}
                        >
                          <th style={{ padding: "8px 10px", verticalAlign: "middle" }}>#</th>
                          <th style={{ padding: "8px 10px", verticalAlign: "middle" }}>Product</th>
                          <th style={{ padding: "8px 10px", verticalAlign: "middle" }}>Category</th>
                          <th style={{ padding: "8px 10px", verticalAlign: "middle" }}>Stock</th>
                          <th style={{ padding: "8px 10px", verticalAlign: "middle" }}>Plans</th>
                          <th style={{ padding: "8px 10px", verticalAlign: "middle" }}>Price</th>
                          <th style={{ padding: "8px 10px", textAlign: "right", verticalAlign: "middle" }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProducts.map((p, idx) => {
                          const variants = getProductVariants(p);
                          const variantStocks = p.variantStocks || {};
                          const activeVarId = selectedVariantPerProduct[p.id] || (variants[0]?.id ?? "");
                          const activeVariant = variants.find((v: any) => v.id === activeVarId) || variants[0];
                          const currentPrice = activeVariant ? parseFloat(activeVariant.price) : parseFloat(p.price || "0");

                          const activeVariantStock = p.isUnlimitedStock
                            ? 9999
                            : activeVariant
                            ? (variantStocks[activeVariant.id] ?? variantStocks[activeVariant.duration] ?? p.stock)
                            : p.stock;

                          const isOutOfStock = !p.isUnlimitedStock && activeVariantStock <= 0;

                          return (
                            <tr
                              key={p.id}
                              style={{
                                borderBottom: `1px solid ${previewBorder}`,
                              }}
                            >
                              <td style={{ padding: "8px 10px", color: previewMutedColor, fontSize: 9.5 }}>
                                {idx.toString().padStart(2, "0")}
                              </td>
                              <td style={{ padding: "8px 10px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <div
                                    style={{
                                      width: 26,
                                      height: 26,
                                      borderRadius: 5,
                                      background: defaultSurface2,
                                      border: `1px solid ${previewBorder}`,
                                      overflow: "hidden",
                                      flexShrink: 0,
                                    }}
                                  >
                                    {p.thumbnailUrl || p.imageUrl ? (
                                      <img src={p.thumbnailUrl || p.imageUrl || ""} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    ) : (
                                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: accent }}>
                                        <Terminal size={12} />
                                      </div>
                                    )}
                                  </div>
                                  <span style={{ fontWeight: 700, color: previewTextColor }}>{p.title}</span>
                                </div>
                              </td>
                              <td style={{ padding: "8px 10px" }}>
                                <span
                                  style={{
                                    fontSize: 8.5,
                                    padding: "2px 5px",
                                    borderRadius: 3,
                                    background: `${accent}18`,
                                    color: accent,
                                    border: `1px solid ${accent}35`,
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {p.category || "General"}
                                </span>
                              </td>
                              <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>
                                <span style={{ fontSize: 9.5, fontWeight: 700, color: isOutOfStock ? "#ef4444" : "#22c55e" }}>
                                  {p.isUnlimitedStock ? "Instant" : isOutOfStock ? "Out of Stock" : `${activeVariantStock} in stock`}
                                </span>
                              </td>
                              <td style={{ padding: "8px 10px", verticalAlign: "middle" }}>
                                {variants.length > 0 ? (
                                  <StorefrontPlanSelector
                                    variants={variants}
                                    activeVariantId={activeVarId}
                                    onSelectVariant={(varId) =>
                                      setSelectedVariantPerProduct((prev) => ({ ...prev, [p.id]: varId }))
                                    }
                                    product={p}
                                    size="sm"
                                    surfaceColor={previewSurface}
                                    borderColor={previewBorder}
                                    textColor={previewTextColor}
                                    mutedColor={previewMutedColor}
                                    accentColor={accent}
                                  />
                                ) : (
                                  <span style={{ fontSize: 9.5, color: previewMutedColor }}>Standard</span>
                                )}
                              </td>
                              <td style={{ padding: "8px 10px", fontWeight: 800, color: previewTextColor, whiteSpace: "nowrap" }}>
                                ${currentPrice.toFixed(2)}
                              </td>
                              <td style={{ padding: "8px 10px", textAlign: "right", whiteSpace: "nowrap" }}>
                                <button
                                  type="button"
                                  disabled={isOutOfStock}
                                  style={{
                                    padding: "4px 10px",
                                    borderRadius: 5,
                                    background: isOutOfStock
                                      ? defaultSurface2
                                      : `linear-gradient(135deg, ${accent} 0%, ${accent} 100%)`,
                                    border: isOutOfStock ? `1px solid ${previewBorder}` : `1px solid ${accent}88`,
                                    color: isOutOfStock ? previewMutedColor : "#ffffff",
                                    fontSize: 9.5,
                                    fontWeight: 800,
                                    cursor: isOutOfStock ? "not-allowed" : "pointer",
                                    boxShadow: isOutOfStock ? "none" : `0 0 10px ${accent}50`,
                                  }}
                                >
                                  {isOutOfStock ? "Out of Stock" : "Buy Now"}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </main>
          </div>

          {/* ─── Storefront Footer ─── */}
          <footer
            style={{
              borderTop: `1px solid ${previewBorder}`,
              background: previewSurface,
              padding: "12px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
              fontSize: 9.5,
              color: previewMutedColor,
              marginTop: "auto",
              position: "relative",
              zIndex: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: previewTextColor, fontWeight: 800 }}>KRYPT.MARKET</span>
              <span>•</span>
              <span>{name || "Store"}</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span>Terms of Service</span>
              <span>•</span>
              <span>Find My Order</span>
            </div>
          </footer>
        </div>

        {/* Bottom Chassis Bezel: iOS Home Indicator (Mobile Only) */}
        {isMobile && (
          <div
            style={{
              padding: "6px 0 8px",
              background: previewSurface,
              borderTop: `1px solid ${previewBorder}`,
              display: "flex",
              justifyContent: "center",
              flexShrink: 0,
              zIndex: 50,
            }}
          >
            <div
              style={{
                width: 110,
                height: 4,
                borderRadius: 2,
                background: isDashLight ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.35)",
              }}
            />
          </div>
        )}
      </div>
    </div>
  </div>
);
}
