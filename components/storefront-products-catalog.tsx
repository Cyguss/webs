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
import { StorefrontSortSelector } from "@/components/storefront-sort-selector";
import { StorefrontPlanSelector } from "@/components/storefront-plan-selector";

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
  variantStocks?: Record<string, number>;
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
  const effAccent = accentColor || "rgb(55, 44, 102)";
  const effSurface = cardBg || "var(--color-surface)";
  const effBorder = cardBorder || "var(--color-border)";
  const effText = textColor || "var(--color-foreground)";
  const effMuted = textMuted || "var(--color-muted-foreground)";
  const effSurface2 = isLight ? "rgba(0,0,0,0.04)" : "var(--color-surface-2)";

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

  // Aggregate category list with counts - only show categories with products > 0
  const categoryTabs = useMemo(() => {
    const countMap: Record<string, number> = { all: products.length };
    const nameMap: Record<string, string> = { all: "All Products" };
    const iconMap: Record<string, string> = { all: "Layers" };

    // Register presets
    for (const p of PRESET_CATEGORIES) {
      nameMap[p.id.toLowerCase()] = p.name;
      if (p.icon) iconMap[p.id.toLowerCase()] = p.icon;
    }

    // Register shop custom categories
    for (const c of shopCategories) {
      const idLower = c.id.toLowerCase();
      nameMap[idLower] = c.name;
      if (c.icon) iconMap[idLower] = c.icon;
    }

    // Count products per category
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

    const tabs: Array<{ id: string; name: string; count: number; icon: string }> = [
      { id: "all", name: "All Products", count: products.length, icon: "Layers" },
    ];

    const addedKeys = new Set<string>(["all"]);

    // First add shop configured categories ONLY if they have items
    for (const c of shopCategories) {
      const idLower = c.id.toLowerCase();
      const cnt = countMap[idLower] || 0;
      if (!addedKeys.has(idLower) && cnt > 0) {
        tabs.push({
          id: idLower,
          name: c.name,
          count: cnt,
          icon: c.icon || "Layers",
        });
        addedKeys.add(idLower);
      }
    }

    // Then add any other categories present in products that have items
    for (const [catKey, count] of Object.entries(countMap)) {
      if (!addedKeys.has(catKey) && catKey !== "uncategorized" && count > 0) {
        tabs.push({
          id: catKey,
          name: nameMap[catKey] || catKey,
          count,
          icon: iconMap[catKey] || "Layers",
        });
        addedKeys.add(catKey);
      }
    }

    if (countMap["uncategorized"] && countMap["uncategorized"] > 0 && tabs.length > 1) {
      tabs.push({
        id: "uncategorized",
        name: "Other",
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
      {/* ─── Command Deck (Search, Filters, View Modes) ─── */}
      <div
        style={{
          padding: "16px 20px",
          background: effSurface,
          border: `1px solid ${effBorder}`,
          borderRadius: 14,
          backdropFilter: "blur(16px)",
          boxShadow: "0 10px 32px rgba(0, 0, 0, 0.06)",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          position: "relative",
          overflow: "visible",
          zIndex: 30,
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
            borderRadius: "14px 14px 0 0",
            background: `linear-gradient(90deg, transparent, ${effAccent}, transparent)`,
            pointerEvents: "none",
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
                color: effAccent,
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
                padding: "8px 30px 8px 34px",
                borderRadius: 8,
                background: effSurface2,
                border: `1px solid ${effBorder}`,
                color: effText,
                fontSize: 12,
                fontFamily: "var(--font-mono, monospace)",
                letterSpacing: "0.03em",
                outline: "none",
                transition: "all 0.15s ease",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = effAccent;
                e.currentTarget.style.boxShadow = `0 0 12px ${effAccent}40`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = effBorder;
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
                  color: effMuted,
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
                background: inStockOnly ? `${effAccent}25` : effSurface2,
                border: inStockOnly ? `1px solid ${effAccent}` : `1px solid ${effBorder}`,
                color: inStockOnly ? effAccent : effMuted,
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
                  background: inStockOnly ? effAccent : effMuted,
                  boxShadow: inStockOnly ? `0 0 8px ${effAccent}` : "none",
                }}
              />
              <span>In Stock</span>
            </button>

            {/* Sort Dropdown */}
            <StorefrontSortSelector
              value={sortBy}
              onChange={setSortBy}
              surfaceColor={effSurface2}
              borderColor={effBorder}
              textColor={effText}
              mutedColor={effMuted}
              accentColor={effAccent}
            />

            {/* View Mode Toggle: Grid vs Table */}
            <div
              style={{
                display: "flex",
                background: effSurface2,
                border: `1px solid ${effBorder}`,
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
                  background: viewMode === "grid" ? effAccent : "transparent",
                  border: viewMode === "grid" ? `1px solid ${effAccent}` : "1px solid transparent",
                  color: viewMode === "grid" ? "#ffffff" : effMuted,
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
                  background: viewMode === "table" ? effAccent : "transparent",
                  border: viewMode === "table" ? `1px solid ${effAccent}` : "1px solid transparent",
                  color: viewMode === "table" ? "#ffffff" : effMuted,
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

        {/* Category Tabs */}
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
                      ? `1px solid ${effAccent}`
                      : `1px solid ${effBorder}`,
                    background: isSelected
                      ? effAccent
                      : effSurface2,
                    color: isSelected ? "#ffffff" : effText,
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: "0.06em",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    boxShadow: isSelected ? `0 0 14px ${effAccent}55` : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span style={{ color: isSelected ? "#ffffff" : effAccent, opacity: isSelected ? 0.9 : 0.8 }}>
                    [{formattedIndex}]
                  </span>
                  <span>{tab.name}</span>
                  <span
                    style={{
                      padding: "1px 5px",
                      borderRadius: 3,
                      background: isSelected ? "rgba(255, 255, 255, 0.2)" : effBorder,
                      color: isSelected ? "#ffffff" : effMuted,
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
            background: effSurface,
            border: `1px dashed ${effBorder}`,
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
          <div style={{ fontSize: 14, fontWeight: 800, color: effText, fontFamily: "var(--font-mono, monospace)" }}>
            No Products Found
          </div>
          <p style={{ fontSize: 12, color: effMuted, marginTop: 6, fontFamily: "var(--font-mono, monospace)" }}>
            No products matched your search or filters.
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
                background: `${effAccent}20`,
                border: `1px solid ${effAccent}55`,
                color: effAccent,
                fontSize: 11,
                fontFamily: "var(--font-mono, monospace)",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        /* ─── CATALOG VIEW MODE 1: GRID MATRIX ─── */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {filteredProducts.map((p, pIdx) => {
            const variants = getProductVariants(p);
            const variantStocks = p.variantStocks || {};
            const activeVarId = selectedVariantPerProduct[p.id] || (variants[0]?.id ?? "");
            const activeVariant = variants.find((v: any) => v.id === activeVarId) || variants[0];
            const currentPrice = activeVariant ? parseFloat(activeVariant.price) : parseFloat(p.price);

            const activeVariantStock = p.isUnlimitedStock
              ? 9999
              : activeVariant
              ? (variantStocks[activeVariant.id] ?? variantStocks[activeVariant.duration] ?? p.stock)
              : p.stock;

            const dMeta = getKeyDurationDisplay(
              activeVariant?.duration || p.duration,
              activeVariant?.durationDays || p.durationDays,
              activeVariant?.customDurationLabel || p.customDurationLabel
            );

            const isOutOfStock = !p.isUnlimitedStock && activeVariantStock <= 0;

            return (
              <div
                key={p.id}
                className="interactive-pill"
                style={{
                  background: effSurface,
                  border: `1px solid ${effBorder}`,
                  borderRadius: 12,
                  overflow: "visible",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.06)",
                  transition: "all 0.2s ease",
                }}
              >
                {/* Top Header */}
                <div
                  style={{
                    padding: "8px 12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: `1px solid ${effBorder}`,
                    background: effSurface2,
                    borderTopLeftRadius: 11,
                    borderTopRightRadius: 11,
                    fontSize: 10,
                    fontFamily: "var(--font-mono, monospace)",
                  }}
                >
                  <span style={{ color: effMuted, letterSpacing: "0.02em" }}>
                    {p.type === "key" ? "Digital Key" : "Instant Delivery"}
                  </span>

                  <span
                    style={{
                      fontWeight: 800,
                      color: isOutOfStock ? "#ef4444" : effAccent,
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
                        background: isOutOfStock ? "#ef4444" : effAccent,
                        boxShadow: `0 0 6px ${isOutOfStock ? "#ef4444" : effAccent}`,
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
                <Link
                  href={`/${shopSlug}/product/${p.id}`}
                  style={{
                    display: "block",
                    height: 140,
                    position: "relative",
                    background: effSurface2,
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
                        background: `radial-gradient(circle, ${effAccent}25 0%, ${effSurface2} 100%)`,
                        color: effAccent,
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
                      backgroundImage: "linear-gradient(rgba(0,0,0,0) 50%, rgba(0,0,0,0.15) 50%)",
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
                          background: `${effAccent}18`,
                          color: effAccent,
                          border: `1px solid ${effAccent}35`,
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
                        color: effText,
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
                        fullWidth
                        surfaceColor={effSurface}
                        borderColor={effBorder}
                        textColor={effText}
                        mutedColor={effMuted}
                        accentColor={effAccent}
                      />
                    </div>
                  )}

                  {/* Pricing & CTA */}
                  <div
                    style={{
                      marginTop: "auto",
                      paddingTop: 10,
                      borderTop: `1px solid ${effBorder}`,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <div>
                      <span style={{ fontSize: 9.5, color: effMuted, fontFamily: "var(--font-mono, monospace)", display: "block" }}>
                        PRICE
                      </span>
                      <span
                        style={{
                          fontSize: 18,
                          fontWeight: 800,
                          fontFamily: "var(--font-mono, monospace)",
                          color: effText,
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
                          ? effSurface2
                          : `linear-gradient(135deg, ${effAccent} 0%, ${effAccent} 100%)`,
                        color: isOutOfStock ? effMuted : "#ffffff",
                        border: isOutOfStock ? `1px solid ${effBorder}` : `1px solid ${effAccent}88`,
                        textDecoration: "none",
                        fontSize: 11,
                        fontWeight: 800,
                        fontFamily: "var(--font-mono, monospace)",
                        letterSpacing: "0.05em",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        boxShadow: isOutOfStock ? "none" : `0 0 14px ${effAccent}50`,
                        pointerEvents: isOutOfStock ? "none" : "auto",
                      }}
                    >
                      <span>{isOutOfStock ? "Out of Stock" : "Buy Now"}</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ─── CATALOG VIEW MODE 2: TABLE ─── */
        <div
          style={{
            background: effSurface,
            border: `1px solid ${effBorder}`,
            borderRadius: 12,
            minHeight: 220,
            overflow: "visible",
            boxShadow: "0 10px 32px rgba(0, 0, 0, 0.06)",
          }}
        >
          <div style={{ overflowX: "visible" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 12, fontFamily: "var(--font-mono, monospace)" }}>
              <thead>
                <tr
                  style={{
                    background: effSurface2,
                    borderBottom: `1px solid ${effBorder}`,
                    color: effText,
                    fontSize: 10,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  <th style={{ padding: "12px 14px", verticalAlign: "middle" }}>#</th>
                  <th style={{ padding: "12px 14px", verticalAlign: "middle" }}>Product</th>
                  <th style={{ padding: "12px 14px", verticalAlign: "middle" }}>Category</th>
                  <th style={{ padding: "12px 14px", verticalAlign: "middle" }}>Stock</th>
                  <th style={{ padding: "12px 14px", verticalAlign: "middle" }}>Plans</th>
                  <th style={{ padding: "12px 14px", verticalAlign: "middle" }}>Price</th>
                  <th style={{ padding: "12px 14px", textAlign: "right", verticalAlign: "middle", width: 120 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p, idx) => {
                  const variants = getProductVariants(p);
                  const variantStocks = p.variantStocks || {};
                  const activeVarId = selectedVariantPerProduct[p.id] || (variants[0]?.id ?? "");
                  const activeVariant = variants.find((v: any) => v.id === activeVarId) || variants[0];
                  const currentPrice = activeVariant ? parseFloat(activeVariant.price) : parseFloat(p.price);

                  // Compute active stock for the chosen variant
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
                        borderBottom: `1px solid ${effBorder}`,
                        transition: "background 0.15s ease",
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.background = effSurface2)}
                      onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "14px 14px", color: effMuted, fontSize: 11, verticalAlign: "middle" }}>
                        {idx.toString().padStart(2, "0")}
                      </td>
                      <td style={{ padding: "14px 14px", verticalAlign: "middle" }}>
                        <Link
                          href={`/${shopSlug}/product/${p.id}`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            textDecoration: "none",
                            color: effText,
                            fontWeight: 700,
                          }}
                        >
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 6,
                              background: effSurface2,
                              border: `1px solid ${effBorder}`,
                              overflow: "hidden",
                              flexShrink: 0,
                            }}
                          >
                            {p.thumbnailUrl || p.imageUrl ? (
                              <img src={p.thumbnailUrl || p.imageUrl || ""} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: effAccent }}>
                                <Terminal size={14} />
                              </div>
                            )}
                          </div>
                          <span>{p.title}</span>
                        </Link>
                      </td>
                      <td style={{ padding: "14px 14px", verticalAlign: "middle" }}>
                        <span
                          style={{
                            fontSize: 10,
                            padding: "3px 7px",
                            borderRadius: 4,
                            background: `${effAccent}18`,
                            color: effAccent,
                            border: `1px solid ${effAccent}35`,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {p.category || "General"}
                        </span>
                      </td>
                      <td style={{ padding: "14px 14px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: isOutOfStock ? "#ef4444" : effAccent,
                          }}
                        >
                          {p.isUnlimitedStock ? "Instant" : isOutOfStock ? "Out of Stock" : `${activeVariantStock} in stock`}
                        </span>
                      </td>
                      <td style={{ padding: "14px 14px", verticalAlign: "middle" }}>
                        {variants.length > 0 ? (
                          <StorefrontPlanSelector
                            variants={variants}
                            activeVariantId={activeVarId}
                            onSelectVariant={(varId) =>
                              setSelectedVariantPerProduct((prev) => ({ ...prev, [p.id]: varId }))
                            }
                            product={p}
                            size="sm"
                            surfaceColor={effSurface}
                            borderColor={effBorder}
                            textColor={effText}
                            mutedColor={effMuted}
                            accentColor={effAccent}
                          />
                        ) : (
                          <span style={{ fontSize: 11, color: effMuted }}>Standard</span>
                        )}
                      </td>
                      <td style={{ padding: "14px 14px", fontWeight: 800, color: effText, fontSize: 13, verticalAlign: "middle", whiteSpace: "nowrap" }}>
                        ${currentPrice.toFixed(2)}
                      </td>
                      <td style={{ padding: "14px 14px", textAlign: "right", verticalAlign: "middle", width: 120, whiteSpace: "nowrap" }}>
                        <Link
                          href={`/${shopSlug}/product/${p.id}`}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            height: 32,
                            padding: "0 14px",
                            borderRadius: 6,
                            background: isOutOfStock
                              ? effSurface2
                              : `linear-gradient(135deg, ${effAccent} 0%, ${effAccent} 100%)`,
                            border: isOutOfStock
                              ? `1px solid ${effBorder}`
                              : `1px solid ${effAccent}88`,
                            color: isOutOfStock ? effMuted : "#ffffff",
                            textDecoration: "none",
                            fontSize: 11,
                            fontWeight: 800,
                            letterSpacing: "0.04em",
                            whiteSpace: "nowrap",
                            boxShadow: isOutOfStock ? "none" : `0 0 10px ${effAccent}50`,
                            pointerEvents: isOutOfStock ? "none" : "auto",
                          }}
                        >
                          <span>{isOutOfStock ? "Out of Stock" : "Buy Now"}</span>
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
