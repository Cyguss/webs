"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Key,
  ShoppingCart,
  Search,
  X,
  Layers,
  Sparkles,
  Filter,
  Terminal,
  Cpu,
  ShieldCheck,
  Zap,
  LayoutGrid,
  List,
  Clock,
  ArrowUpDown,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { getKeyDurationDisplay } from "@/lib/key-duration";
import { getCategoryIcon, PRESET_CATEGORIES } from "@/components/product-category-selector";

export interface StorefrontProductItem {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  price: string;
  currency: string;
  stock: number;
  thumbnailUrl: string | null;
  images: string | null;
  imageUrl?: string | null;
  duration: string;
  durationDays: number;
  customDurationLabel: string | null;
  variants: string | null;
  type: string;
  isUnlimitedStock?: boolean;
}

export interface StorefrontShopCategory {
  id: string;
  name: string;
  icon?: string;
  description?: string;
}

interface StorefrontProductsCatalogProps {
  products: StorefrontProductItem[];
  shopSlug: string;
  shopName: string;
  accentColor: string;
  textColor: string;
  textMuted: string;
  cardBg: string;
  cardBorder: string;
  isLight: boolean;
  shopCategories?: StorefrontShopCategory[];
}

export function StorefrontProductsCatalog({
  products,
  shopSlug,
  shopName,
  accentColor = "rgb(55, 44, 102)",
  textColor,
  textMuted,
  cardBg,
  cardBorder,
  isLight,
  shopCategories = [],
}: StorefrontProductsCatalogProps) {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "all";
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"default" | "price-asc" | "price-desc">("default");

  // Track user-selected duration per product ID on the catalog
  const [selectedVariantPerProduct, setSelectedVariantPerProduct] = useState<Record<string, string>>({});

  // Sync state if URL changes
  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) {
      setSelectedCategory(cat.toLowerCase());
    } else {
      setSelectedCategory("all");
    }
  }, [searchParams]);

  // Aggregate category list with counts
  const categoryTabs = useMemo(() => {
    const countMap: Record<string, number> = { all: products.length };
    const nameMap: Record<string, string> = { all: "ALL PROTOCOLS" };
    const iconMap: Record<string, string> = { all: "Layers" };

    // Register presets
    for (const p of PRESET_CATEGORIES) {
      nameMap[p.id.toLowerCase()] = p.name.toUpperCase();
      if (p.icon) iconMap[p.id.toLowerCase()] = p.icon;
    }

    // Register shop custom categories
    for (const c of shopCategories) {
      const idLower = c.id.toLowerCase();
      nameMap[idLower] = c.name.toUpperCase();
      if (c.icon) iconMap[idLower] = c.icon;
    }

    // Count products per category
    for (const p of products) {
      if (p.category && p.category.trim()) {
        const catKey = p.category.trim().toLowerCase();
        countMap[catKey] = (countMap[catKey] || 0) + 1;
        if (!nameMap[catKey]) {
          nameMap[catKey] = p.category.toUpperCase();
        }
      } else {
        countMap["uncategorized"] = (countMap["uncategorized"] || 0) + 1;
      }
    }

    const tabs: Array<{ id: string; name: string; count: number; icon: string }> = [
      { id: "all", name: "ALL PROTOCOLS", count: products.length, icon: "Layers" },
    ];

    const addedKeys = new Set<string>(["all"]);

    // First add shop configured categories
    for (const c of shopCategories) {
      const idLower = c.id.toLowerCase();
      if (!addedKeys.has(idLower)) {
        tabs.push({
          id: idLower,
          name: c.name.toUpperCase(),
          count: countMap[idLower] || 0,
          icon: c.icon || "Layers",
        });
        addedKeys.add(idLower);
      }
    }

    // Then add any other categories present in products
    for (const [catKey, count] of Object.entries(countMap)) {
      if (!addedKeys.has(catKey) && catKey !== "uncategorized") {
        tabs.push({
          id: catKey,
          name: nameMap[catKey] || catKey.toUpperCase(),
          count,
          icon: iconMap[catKey] || "Layers",
        });
        addedKeys.add(catKey);
      }
    }

    if (countMap["uncategorized"] && tabs.length > 1) {
      tabs.push({
        id: "uncategorized",
        name: "GENERAL / AUX",
        count: countMap["uncategorized"],
        icon: "Layers",
      });
    }

    return tabs;
  }, [products, shopCategories]);

  function handleSelectCategory(catId: string) {
    setSelectedCategory(catId);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (catId === "all") {
        url.searchParams.delete("category");
      } else {
        url.searchParams.set("category", catId);
      }
      window.history.replaceState({}, "", url.toString());
    }
  }

  // Filter & sort products
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // 1. Category Filter
    if (selectedCategory !== "all") {
      if (selectedCategory === "uncategorized") {
        list = list.filter((p) => !p.category || !p.category.trim());
      } else {
        list = list.filter((p) => {
          if (!p.category) return false;
          return p.category.trim().toLowerCase() === selectedCategory;
        });
      }
    }

    // 2. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) => {
        const titleMatch = (p.title || "").toLowerCase().includes(q);
        const descMatch = (p.description || "").toLowerCase().includes(q);
        const catMatch = (p.category || "").toLowerCase().includes(q);
        return titleMatch || descMatch || catMatch;
      });
    }

    // 3. In-Stock Only
    if (inStockOnly) {
      list = list.filter((p) => p.isUnlimitedStock || p.stock > 0);
    }

    // 4. Sort
    if (sortBy === "price-asc") {
      list.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    } else if (sortBy === "price-desc") {
      list.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    }

    return list;
  }, [products, selectedCategory, searchQuery, inStockOnly, sortBy]);

  // Helper to parse variants for a product
  function getProductVariants(p: StorefrontProductItem) {
    if (!p.variants) return [];
    try {
      const arr = JSON.parse(p.variants);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ─── Weaponized Command Deck (Search, Filters, View Modes) ─── */}
      <div
        style={{
          padding: "16px 20px",
          background: "linear-gradient(180deg, #090812 0%, #05040a 100%)",
          border: "1px solid rgba(55, 44, 102, 0.45)",
          borderRadius: 14,
          backdropFilter: "blur(16px)",
          boxShadow: "0 10px 32px rgba(0, 0, 0, 0.8)",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle top scanline */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            background: "linear-gradient(90deg, transparent, rgb(55, 44, 102), #8b5cf6, transparent)",
          }}
        />

        {/* Top Control Bar: Search Input + Mode Toggles */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          {/* Search Input */}
          <div style={{ position: "relative", flex: 1, minWidth: 240 }}>
            <Search
              size={13}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#c4b5fd",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              placeholder="QUERY CATALOG PROTOCOLS... [ / ]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 30px 8px 34px",
                borderRadius: 8,
                background: "rgba(3, 3, 5, 0.9)",
                border: "1px solid rgba(139, 92, 246, 0.25)",
                color: "#ffffff",
                fontSize: 12,
                fontFamily: "var(--font-mono, monospace)",
                letterSpacing: "0.03em",
                outline: "none",
                transition: "all 0.15s ease",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#8b5cf6";
                e.currentTarget.style.boxShadow = "0 0 12px rgba(139, 92, 246, 0.25)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.25)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "rgba(255, 255, 255, 0.6)",
                  cursor: "pointer",
                  display: "flex",
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Right Controls: In-Stock Toggle + Sort + View Mode */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {/* In Stock Only Switch */}
            <button
              type="button"
              onClick={() => setInStockOnly(!inStockOnly)}
              style={{
                padding: "6px 10px",
                borderRadius: 6,
                background: inStockOnly ? "rgba(55, 44, 102, 0.45)" : "rgba(255, 255, 255, 0.03)",
                border: inStockOnly ? "1px solid #8b5cf6" : "1px solid rgba(255, 255, 255, 0.1)",
                color: inStockOnly ? "#c4b5fd" : "rgba(255, 255, 255, 0.6)",
                fontSize: 11,
                fontFamily: "var(--font-mono, monospace)",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
                transition: "all 0.15s ease",
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: inStockOnly ? "#a78bfa" : "rgba(255, 255, 255, 0.3)",
                  boxShadow: inStockOnly ? "0 0 8px #8b5cf6" : "none",
                }}
              />
              <span>[IN_STOCK_ONLY]</span>
            </button>

            {/* Sort Dropdown */}
            <div style={{ position: "relative" }}>
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  background: "rgba(3, 3, 5, 0.9)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  color: "#c4b5fd",
                  fontSize: 11,
                  fontFamily: "var(--font-mono, monospace)",
                  fontWeight: 700,
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="default">SORT: DEFAULT</option>
                <option value="price-asc">PRICE: LOW &rarr; HIGH</option>
                <option value="price-desc">PRICE: HIGH &rarr; LOW</option>
              </select>
            </div>

            {/* View Mode Toggle: Grid vs Table */}
            <div
              style={{
                display: "flex",
                background: "rgba(3, 3, 5, 0.9)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: 6,
                padding: 2,
              }}
            >
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                title="Grid Matrix View"
                style={{
                  padding: "5px 8px",
                  borderRadius: 4,
                  background: viewMode === "grid" ? "rgb(55, 44, 102)" : "transparent",
                  border: viewMode === "grid" ? "1px solid #8b5cf6" : "1px solid transparent",
                  color: viewMode === "grid" ? "#ffffff" : "rgba(255, 255, 255, 0.5)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <LayoutGrid size={13} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                title="Dense Telemetry Table View"
                style={{
                  padding: "5px 8px",
                  borderRadius: 4,
                  background: viewMode === "table" ? "rgb(55, 44, 102)" : "transparent",
                  border: viewMode === "table" ? "1px solid #8b5cf6" : "1px solid transparent",
                  color: viewMode === "table" ? "#ffffff" : "rgba(255, 255, 255, 0.5)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <List size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Category Tabs: Military / Cyber Index Chips */}
        {categoryTabs.length > 1 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              overflowX: "auto",
              paddingBottom: 2,
              scrollbarWidth: "none",
            }}
          >
            {categoryTabs.map((tab, idx) => {
              const isSelected = selectedCategory === tab.id;
              const formattedIndex = idx.toString().padStart(2, "0");
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleSelectCategory(tab.id)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 6,
                    border: isSelected
                      ? "1px solid #8b5cf6"
                      : "1px solid rgba(255, 255, 255, 0.08)",
                    background: isSelected
                      ? "rgb(55, 44, 102)"
                      : "rgba(255, 255, 255, 0.02)",
                    color: isSelected ? "#ffffff" : "rgba(255, 255, 255, 0.65)",
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: "0.06em",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    boxShadow: isSelected ? "0 0 14px rgba(139, 92, 246, 0.35)" : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span style={{ color: isSelected ? "#ffffff" : "#c4b5fd", opacity: isSelected ? 0.9 : 0.7 }}>
                    [{formattedIndex}]
                  </span>
                  <span>{tab.name}</span>
                  <span
                    style={{
                      padding: "1px 5px",
                      borderRadius: 3,
                      background: isSelected ? "rgba(255, 255, 255, 0.18)" : "rgba(255, 255, 255, 0.06)",
                      color: isSelected ? "#ffffff" : "rgba(255, 255, 255, 0.5)",
                      fontSize: 9.5,
                    }}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Empty State ─── */}
      {filteredProducts.length === 0 ? (
        <div
          style={{
            padding: "48px 24px",
            textAlign: "center",
            background: "rgba(6, 6, 10, 0.8)",
            border: "1px dashed rgba(255, 255, 255, 0.1)",
            borderRadius: 14,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
              color: "#ef4444",
            }}
          >
            <Lock size={22} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#ffffff", fontFamily: "var(--font-mono, monospace)" }}>
            [0_PROTOCOLS_MATCHED]
          </div>
          <p style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.5)", marginTop: 6, fontFamily: "var(--font-mono, monospace)" }}>
            No active protocols matched your current query or category filter.
          </p>
          {(searchQuery || selectedCategory !== "all" || inStockOnly) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setInStockOnly(false);
              }}
              style={{
                marginTop: 14,
                padding: "6px 14px",
                borderRadius: 6,
                background: "rgba(55, 44, 102, 0.4)",
                border: "1px solid rgba(139, 92, 246, 0.4)",
                color: "#c4b5fd",
                fontSize: 11,
                fontFamily: "var(--font-mono, monospace)",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              [RESET_ALL_FILTERS]
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        /* ─── CATALOG VIEW MODE 1: CYBER GRID MATRIX ─── */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {filteredProducts.map((p, pIdx) => {
            const variants = getProductVariants(p);
            const activeVarId = selectedVariantPerProduct[p.id] || (variants[0]?.id ?? "");
            const activeVariant = variants.find((v: any) => v.id === activeVarId) || variants[0];
            const currentPrice = activeVariant ? parseFloat(activeVariant.price) : parseFloat(p.price);

            const dMeta = getKeyDurationDisplay(
              activeVariant?.duration || p.duration,
              activeVariant?.durationDays || p.durationDays,
              activeVariant?.customDurationLabel || p.customDurationLabel
            );

            const isOutOfStock = !p.isUnlimitedStock && p.stock <= 0;

            return (
              <div
                key={p.id}
                className="interactive-pill"
                style={{
                  background: "linear-gradient(180deg, #090812 0%, #05040a 100%)",
                  border: "1px solid rgba(55, 44, 102, 0.4)",
                  borderRadius: 12,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.7)",
                  transition: "all 0.2s ease",
                }}
              >
                {/* Cyber Corner HUD Notch */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    width: 0,
                    height: 0,
                    borderStyle: "solid",
                    borderWidth: "0 24px 24px 0",
                    borderColor: `transparent ${isOutOfStock ? "#ef4444" : "#8b5cf6"} transparent transparent`,
                    zIndex: 10,
                  }}
                />

                {/* Top Telemetry Header */}
                <div
                  style={{
                    padding: "8px 12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                    background: "rgba(255, 255, 255, 0.02)",
                    fontSize: 10,
                    fontFamily: "var(--font-mono, monospace)",
                  }}
                >
                  <span style={{ color: "rgba(255, 255, 255, 0.5)", letterSpacing: "0.06em" }}>
                    PROTO_{pIdx.toString().padStart(3, "0")}
                  </span>

                  <span
                    style={{
                      fontWeight: 800,
                      color: isOutOfStock ? "#ef4444" : "#c4b5fd",
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
                        background: isOutOfStock ? "#ef4444" : "#a78bfa",
                        boxShadow: `0 0 6px ${isOutOfStock ? "#ef4444" : "#8b5cf6"}`,
                      }}
                    />
                    {p.isUnlimitedStock
                      ? "[INSTANT_KEY]"
                      : isOutOfStock
                      ? "[DEPLETED]"
                      : `[VAULT: ${p.stock}]`}
                  </span>
                </div>

                {/* Product Media */}
                <Link
                  href={`/${shopSlug}/product/${p.id}`}
                  style={{
                    display: "block",
                    height: 140,
                    position: "relative",
                    background: "#030305",
                    overflow: "hidden",
                    textDecoration: "none",
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
                        transition: "transform 0.3s ease",
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
                        background: "radial-gradient(circle, rgba(55,44,102,0.4) 0%, rgba(3,3,5,0.95) 100%)",
                        color: "#c4b5fd",
                      }}
                    >
                      <Terminal size={36} />
                    </div>
                  )}

                  {/* Scanline Grid Overlay */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundImage: "linear-gradient(rgba(0,0,0,0) 50%, rgba(0,0,0,0.4) 50%)",
                      backgroundSize: "100% 4px",
                      pointerEvents: "none",
                    }}
                  />
                </Link>

                {/* Card Body */}
                <div style={{ padding: "14px 14px 12px", display: "flex", flexDirection: "column", flex: 1, gap: 10 }}>
                  {/* Title & Category */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <span
                        style={{
                          fontSize: 9.5,
                          fontFamily: "var(--font-mono, monospace)",
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: 4,
                          background: "rgba(55, 44, 102, 0.35)",
                          color: "#c4b5fd",
                          border: "1px solid rgba(139, 92, 246, 0.3)",
                          textTransform: "uppercase",
                        }}
                      >
                        {p.category || "GENERAL"}
                      </span>
                    </div>

                    <Link
                      href={`/${shopSlug}/product/${p.id}`}
                      style={{
                        textDecoration: "none",
                        color: "#ffffff",
                        fontWeight: 800,
                        fontSize: 14,
                        letterSpacing: "-0.01em",
                        lineHeight: 1.3,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {p.title}
                    </Link>
                  </div>

                  {/* Hardware-Chip Duration Selector on Card (If Multi-Duration) */}
                  {variants.length > 0 && (
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {variants.map((v: any) => {
                        const isVarActive = activeVarId === v.id;
                        const vMeta = getKeyDurationDisplay(v.duration, v.durationDays, v.customDurationLabel);
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedVariantPerProduct((prev) => ({ ...prev, [p.id]: v.id }));
                            }}
                            style={{
                              padding: "2px 7px",
                              borderRadius: 4,
                              background: isVarActive ? "rgb(55, 44, 102)" : "rgba(255, 255, 255, 0.03)",
                              border: isVarActive ? "1px solid #8b5cf6" : "1px solid rgba(255, 255, 255, 0.08)",
                              color: isVarActive ? "#ffffff" : "rgba(255, 255, 255, 0.6)",
                              fontSize: 10,
                              fontFamily: "var(--font-mono, monospace)",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            {v.label || vMeta.shortLabel}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Pricing & CTA */}
                  <div
                    style={{
                      marginTop: "auto",
                      paddingTop: 10,
                      borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <div>
                      <span style={{ fontSize: 9.5, color: "rgba(255, 255, 255, 0.4)", fontFamily: "var(--font-mono, monospace)", display: "block" }}>
                        PRICE
                      </span>
                      <span
                        style={{
                          fontSize: 18,
                          fontWeight: 800,
                          fontFamily: "var(--font-mono, monospace)",
                          color: "#ffffff",
                          letterSpacing: "-0.02em",
                        }}
                      >
                        ${currentPrice.toFixed(2)}
                      </span>
                    </div>

                    <Link
                      href={`/${shopSlug}/product/${p.id}`}
                      style={{
                        padding: "7px 14px",
                        borderRadius: 6,
                        background: isOutOfStock
                          ? "rgba(255, 255, 255, 0.05)"
                          : "linear-gradient(135deg, rgb(55, 44, 102) 0%, rgb(78, 62, 140) 100%)",
                        color: isOutOfStock ? "rgba(255, 255, 255, 0.4)" : "#ffffff",
                        border: isOutOfStock ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(167, 139, 250, 0.45)",
                        textDecoration: "none",
                        fontSize: 11,
                        fontWeight: 800,
                        fontFamily: "var(--font-mono, monospace)",
                        letterSpacing: "0.05em",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        boxShadow: isOutOfStock ? "none" : "0 0 14px rgba(55, 44, 102, 0.6)",
                        pointerEvents: isOutOfStock ? "none" : "auto",
                      }}
                    >
                      <span>{isOutOfStock ? "[DEPLETED]" : "[PURCHASE]"}</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ─── CATALOG VIEW MODE 2: HIGH-DENSITY DARKNET TABLE ─── */
        <div
          style={{
            background: "linear-gradient(180deg, #090812 0%, #05040a 100%)",
            border: "1px solid rgba(55, 44, 102, 0.45)",
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 10px 32px rgba(0, 0, 0, 0.8)",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 12, fontFamily: "var(--font-mono, monospace)" }}>
              <thead>
                <tr
                  style={{
                    background: "rgba(55, 44, 102, 0.25)",
                    borderBottom: "1px solid rgba(139, 92, 246, 0.25)",
                    color: "#c4b5fd",
                    fontSize: 10,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  <th style={{ padding: "10px 14px" }}>INDEX</th>
                  <th style={{ padding: "10px 14px" }}>PROTOCOL / TITLE</th>
                  <th style={{ padding: "10px 14px" }}>CATEGORY</th>
                  <th style={{ padding: "10px 14px" }}>VAULT STOCK</th>
                  <th style={{ padding: "10px 14px" }}>AVAILABLE TIERS</th>
                  <th style={{ padding: "10px 14px" }}>PRICE (USD)</th>
                  <th style={{ padding: "10px 14px", textAlign: "right" }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p, idx) => {
                  const variants = getProductVariants(p);
                  const activeVarId = selectedVariantPerProduct[p.id] || (variants[0]?.id ?? "");
                  const activeVariant = variants.find((v: any) => v.id === activeVarId) || variants[0];
                  const currentPrice = activeVariant ? parseFloat(activeVariant.price) : parseFloat(p.price);
                  const isOutOfStock = !p.isUnlimitedStock && p.stock <= 0;

                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                        transition: "background 0.15s ease",
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.background = "rgba(55, 44, 102, 0.15)")}
                      onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {/* Index */}
                      <td style={{ padding: "12px 14px", color: "rgba(255, 255, 255, 0.4)", fontSize: 11 }}>
                        {idx.toString().padStart(2, "0")}
                      </td>

                      {/* Title & Media */}
                      <td style={{ padding: "12px 14px" }}>
                        <Link
                          href={`/${shopSlug}/product/${p.id}`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            textDecoration: "none",
                            color: "#ffffff",
                            fontWeight: 700,
                          }}
                        >
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 6,
                              background: "#000",
                              border: "1px solid rgba(255, 255, 255, 0.1)",
                              overflow: "hidden",
                              flexShrink: 0,
                            }}
                          >
                            {p.thumbnailUrl || p.imageUrl ? (
                              <img src={p.thumbnailUrl || p.imageUrl || ""} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#c4b5fd" }}>
                                <Terminal size={14} />
                              </div>
                            )}
                          </div>
                          <span>{p.title}</span>
                        </Link>
                      </td>

                      {/* Category */}
                      <td style={{ padding: "12px 14px" }}>
                        <span
                          style={{
                            fontSize: 10,
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: "rgba(55, 44, 102, 0.35)",
                            color: "#c4b5fd",
                            border: "1px solid rgba(139, 92, 246, 0.3)",
                          }}
                        >
                          {p.category || "GENERAL"}
                        </span>
                      </td>

                      {/* Vault Stock */}
                      <td style={{ padding: "12px 14px" }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: isOutOfStock ? "#ef4444" : "#c4b5fd",
                          }}
                        >
                          {p.isUnlimitedStock ? "INSTANT" : isOutOfStock ? "DEPLETED" : `${p.stock} units`}
                        </span>
                      </td>

                      {/* Available Tiers Chips */}
                      <td style={{ padding: "12px 14px" }}>
                        {variants.length > 0 ? (
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            {variants.map((v: any) => {
                              const isVarActive = activeVarId === v.id;
                              const vMeta = getKeyDurationDisplay(v.duration, v.durationDays, v.customDurationLabel);
                              return (
                                <button
                                  key={v.id}
                                  type="button"
                                  onClick={() => setSelectedVariantPerProduct((prev) => ({ ...prev, [p.id]: v.id }))}
                                  style={{
                                    padding: "2px 6px",
                                    borderRadius: 4,
                                    background: isVarActive ? "rgb(55, 44, 102)" : "rgba(255, 255, 255, 0.04)",
                                    border: isVarActive ? "1px solid #8b5cf6" : "1px solid rgba(255, 255, 255, 0.08)",
                                    color: isVarActive ? "#ffffff" : "rgba(255, 255, 255, 0.6)",
                                    fontSize: 9.5,
                                    cursor: "pointer",
                                  }}
                                >
                                  {v.label || vMeta.shortLabel}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <span style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.4)" }}>Standard</span>
                        )}
                      </td>

                      {/* Price */}
                      <td style={{ padding: "12px 14px", fontWeight: 800, color: "#ffffff", fontSize: 13 }}>
                        ${currentPrice.toFixed(2)}
                      </td>

                      {/* Action */}
                      <td style={{ padding: "12px 14px", textAlign: "right" }}>
                        <Link
                          href={`/${shopSlug}/product/${p.id}`}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "5px 12px",
                            borderRadius: 6,
                            background: isOutOfStock ? "rgba(255, 255, 255, 0.05)" : "linear-gradient(135deg, rgb(55, 44, 102) 0%, rgb(78, 62, 140) 100%)",
                            border: isOutOfStock ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(167, 139, 250, 0.4)",
                            color: isOutOfStock ? "rgba(255, 255, 255, 0.4)" : "#ffffff",
                            textDecoration: "none",
                            fontSize: 10.5,
                            fontWeight: 800,
                            letterSpacing: "0.05em",
                            pointerEvents: isOutOfStock ? "none" : "auto",
                          }}
                        >
                          <span>{isOutOfStock ? "DEPLETED" : "ACQUIRE"}</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
