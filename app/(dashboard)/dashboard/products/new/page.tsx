"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Key,
  Loader2,
  Plus,
  Trash2,
  Copy,
  Check,
  FileText,
  Search,
  X,
  ExternalLink,
  AlertCircle,
  Layers,
  Sparkles,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "@/components/toast-context";
import { KeyDurationSelector } from "@/components/key-duration-selector";
import { DURATION_OPTIONS, getKeyDurationDisplay, KeyDurationType } from "@/lib/key-duration";
import { ProductVariantsManager } from "@/components/product-variants-manager";
import { ProductVariant } from "@/lib/validations/product";
import { ProductCategorySelector } from "@/components/product-category-selector";

export default function NewProductPage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [receiptNote, setReceiptNote] = useState("");
  const type = "key";
  const [price, setPrice] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [imageInput, setImageInput] = useState("");

  // Key duration state
  const [duration, setDuration] = useState<KeyDurationType>("lifetime");
  const [durationDays, setDurationDays] = useState<number>(0);
  const [customDurationLabel, setCustomDurationLabel] = useState("");

  // Multi-duration variants state
  const [variantsEnabled, setVariantsEnabled] = useState(false);
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  function handleAddImage() {
    const trimmed = imageInput.trim();
    if (!trimmed) return;
    if (images.length >= 5) return;
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) return;
    setImages([...images, trimmed]);
    setImageInput("");
  }

  function handleRemoveImage(idx: number) {
    setImages(images.filter((_, i) => i !== idx));
  }

  function handleSetPrimary(idx: number) {
    if (idx === 0) return;
    const item = images[idx];
    const filtered = images.filter((_, i) => i !== idx);
    setImages([item, ...filtered]);
  }

  // Single duration license keys state
  const [keysList, setKeysList] = useState<string[]>([]);

  // Multi-duration categorized keys state: { [variantId]: string[] }
  const [categorizedKeys, setCategorizedKeys] = useState<Record<string, string[]>>({});
  const [activeVariantTabId, setActiveVariantTabId] = useState<string>("");

  // Active variant resolution
  const currentVariant = useMemo(() => {
    if (!variantsEnabled || variants.length === 0) return null;
    const found = variants.find((v) => v.id === activeVariantTabId);
    return found || variants[0];
  }, [variantsEnabled, variants, activeVariantTabId]);

  const currentVariantId = currentVariant?.id || "";

  // Active key list depending on mode
  const currentActiveKeys = useMemo(() => {
    if (variantsEnabled && variants.length > 0) {
      return categorizedKeys[currentVariantId] || [];
    }
    return keysList;
  }, [variantsEnabled, variants, categorizedKeys, currentVariantId, keysList]);

  const previewKeys = useMemo(() => currentActiveKeys.slice(0, 5), [currentActiveKeys]);

  // Total keys across all categories
  const totalKeysCount = useMemo(() => {
    if (variantsEnabled && variants.length > 0) {
      return Object.values(categorizedKeys).reduce((acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0), 0);
    }
    return keysList.length;
  }, [variantsEnabled, variants, categorizedKeys, keysList]);

  const [keyInput, setKeyInput] = useState("");
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkInput, setBulkInput] = useState("");
  const [bulkTargetVariantId, setBulkTargetVariantId] = useState<string>("");
  const [bulkMultiCategoryInputs, setBulkMultiCategoryInputs] = useState<Record<string, string>>({});
  const [bulkModalMode, setBulkModalMode] = useState<"single" | "multi">("single");

  const [showAllModal, setShowAllModal] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [allModalCategoryFilter, setAllModalCategoryFilter] = useState<string>("all");
  const [copiedIndex, setCopiedIndex] = useState<string | number | null>(null);

  function handleAddKey() {
    if (!keyInput.trim()) return;
    const splitKeys = keyInput
      .split(/[\n,]/)
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    if (variantsEnabled && variants.length > 0 && currentVariantId) {
      const existing = categorizedKeys[currentVariantId] || [];
      const uniqueNew = splitKeys.filter((k) => !existing.includes(k));
      setCategorizedKeys({
        ...categorizedKeys,
        [currentVariantId]: [...existing, ...uniqueNew],
      });
    } else {
      const uniqueNew = splitKeys.filter((k) => !keysList.includes(k));
      setKeysList([...keysList, ...uniqueNew]);
    }
    setKeyInput("");
  }

  function handleRemoveKey(index: number, targetVarId?: string) {
    if (variantsEnabled && variants.length > 0) {
      const vId = targetVarId || currentVariantId;
      const existing = categorizedKeys[vId] || [];
      setCategorizedKeys({
        ...categorizedKeys,
        [vId]: existing.filter((_, i) => i !== index),
      });
    } else {
      setKeysList(keysList.filter((_, i) => i !== index));
    }
  }

  function handleOpenBulkModal() {
    setBulkTargetVariantId(currentVariantId || (variants[0]?.id ?? ""));
    setBulkInput("");
    // Pre-populate multi inputs
    const initialMulti: Record<string, string> = {};
    for (const v of variants) {
      initialMulti[v.id] = "";
    }
    setBulkMultiCategoryInputs(initialMulti);
    setShowBulkModal(true);
  }

  function handleAddBulk() {
    if (variantsEnabled && variants.length > 0) {
      if (bulkModalMode === "multi") {
        const nextCategorized = { ...categorizedKeys };
        let addedCount = 0;
        for (const [vId, text] of Object.entries(bulkMultiCategoryInputs)) {
          if (!text.trim()) continue;
          const split = text
            .split(/[\r\n,]+/)
            .map((k) => k.trim())
            .filter((k) => k.length > 0);
          const existing = nextCategorized[vId] || [];
          const uniqueNew = split.filter((k) => !existing.includes(k));
          nextCategorized[vId] = [...existing, ...uniqueNew];
          addedCount += uniqueNew.length;
        }
        setCategorizedKeys(nextCategorized);
        toast.success("Bulk Import Complete", `Imported ${addedCount} keys across duration tiers.`);
      } else {
        const targetVId = bulkTargetVariantId || currentVariantId;
        if (!bulkInput.trim() || !targetVId) return;
        const split = bulkInput
          .split(/[\r\n,]+/)
          .map((k) => k.trim())
          .filter((k) => k.length > 0);
        const existing = categorizedKeys[targetVId] || [];
        const uniqueNew = split.filter((k) => !existing.includes(k));
        setCategorizedKeys({
          ...categorizedKeys,
          [targetVId]: [...existing, ...uniqueNew],
        });
        toast.success("Keys Imported", `Added ${uniqueNew.length} keys to duration category.`);
      }
    } else {
      if (!bulkInput.trim()) return;
      const splitKeys = bulkInput
        .split(/[\r\n,]+/)
        .map((k) => k.trim())
        .filter((k) => k.length > 0);
      const uniqueNew = splitKeys.filter((k) => !keysList.includes(k));
      setKeysList([...keysList, ...uniqueNew]);
      toast.success("Keys Imported", `Added ${uniqueNew.length} keys.`);
    }

    setBulkInput("");
    setShowBulkModal(false);
  }

  function copyKey(keyVal: string, id: string | number) {
    navigator.clipboard.writeText(keyVal);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 1500);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const isMulti = variantsEnabled && variants.length > 0;
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category: category?.trim() || null,
          receiptNote: receiptNote.trim() || null,
          type: "key",
          price: parseFloat(price),
          thumbnailUrl: images[0] || thumbnailUrl || null,
          images,
          duration,
          durationDays: duration === "lifetime" ? 0 : durationDays,
          customDurationLabel: duration === "custom" ? customDurationLabel.trim() || null : null,
          variants: isMulti ? variants : null,
          isUnlimitedStock: false,
          stockLimit: null,
          keys: !isMulti ? keysList : [],
          categorizedKeys: isMulti ? categorizedKeys : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create product");
      }

      toast.success("Product Created", `"${title}" has been added to your storefront.`);
      router.push("/dashboard/products");
    } catch (err: any) {
      setError(err.message);
      toast.error("Failed to Create Product", err.message || "Please check the form fields.");
    } finally {
      setLoading(false);
    }
  }

  const filteredAllKeys = keysList.filter((k) =>
    !searchFilter.trim() || k.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="page-fly-in" style={{ maxWidth: 900, margin: "0 auto", width: "100%" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <Link
          href="/dashboard/products"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 14,
            color: "var(--color-muted-foreground)",
            textDecoration: "none",
            marginBottom: 16,
          }}
        >
          <ArrowLeft size={16} /> Back to products
        </Link>

        <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--color-foreground)", letterSpacing: "-0.02em" }}>
          Create Key Product
        </h1>
        <p style={{ color: "var(--color-muted-foreground)", fontSize: 14, marginTop: 4 }}>
          Add license keys or serial codes for instant automated delivery upon payment.
        </p>
      </div>


      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Product Type — Keys Only */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(99,102,241,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Key size={20} color="#818cf8" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--color-foreground)" }}>License Keys / Serials</div>
              <div style={{ fontSize: 13, color: "var(--color-muted-foreground)" }}>Instant auto-delivery of digital codes upon payment</div>
            </div>
          </div>
        </div>

        {/* Basic Details */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-foreground)" }}>Product Details</h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label className="label">Title *</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Premium VIP Pass - 30 Days"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Category Selector */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label className="label" style={{ margin: 0 }}>Category</label>
              <span style={{ fontSize: 11, color: "var(--color-muted-foreground)" }}>
                Organize product into custom storefront tabs (e.g. Softwares, Scripts)
              </span>
            </div>
            <ProductCategorySelector
              value={category}
              onChange={setCategory}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label className="label">Description</label>
            <textarea
              className="input"
              rows={4}
              placeholder="Describe features, activation steps, terms..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label className="label" style={{ margin: 0 }}>Custom Note for Email Receipt</label>
              <span style={{ fontSize: 11, color: "var(--color-muted-foreground)" }}>Optional</span>
            </div>
            <textarea
              className="input"
              rows={3}
              placeholder="e.g. Thank you for your purchase! Join discord.gg/krypt to claim your role, or review the activation manual at docs.krypt.market"
              value={receiptNote}
              onChange={(e) => setReceiptNote(e.target.value)}
            />
            <span style={{ fontSize: 11, color: "var(--color-muted-foreground)" }}>
              This custom note or instructions will be prominently displayed on the customer's email receipt after checkout.
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label className="label">Price ($ USD) *</label>
              <input
                type="number"
                step="0.01"
                min="0.50"
                className="input"
                placeholder="19.99"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>

            {/* Multi-Image Product Gallery (Max 5) */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label className="label" style={{ margin: 0 }}>Product Images (Max 5)</label>
                <span className={`badge ${images.length === 5 ? "badge-warning" : "badge-neutral"}`} style={{ fontSize: 11 }}>
                  {images.length} / 5 Images
                </span>
              </div>
              
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="url"
                  className="input"
                  placeholder="https://example.com/product-image.png"
                  value={imageInput}
                  onChange={(e) => setImageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddImage();
                    }
                  }}
                  disabled={images.length >= 5}
                />
                <button
                  type="button"
                  onClick={handleAddImage}
                  className="btn btn-secondary"
                  disabled={!imageInput.trim() || images.length >= 5}
                  style={{ flexShrink: 0, gap: 6 }}
                >
                  <Plus size={15} /> Add Image
                </button>
              </div>

              {/* Images preview list */}
              {images.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10, marginTop: 4 }}>
                  {images.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: "relative",
                        borderRadius: "var(--radius-md)",
                        border: idx === 0 ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
                        background: "var(--color-surface-2)",
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <div style={{ height: 85, width: "100%", background: "#000", position: "relative" }}>
                        <img
                          src={imgUrl}
                          alt={`Product view ${idx + 1}`}
                          referrerPolicy="no-referrer"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          style={{
                            position: "absolute",
                            top: 4,
                            right: 4,
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            background: "rgba(0,0,0,0.75)",
                            color: "#ef4444",
                            border: "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                          }}
                          title="Remove image"
                        >
                          <X size={13} />
                        </button>
                        {idx === 0 && (
                          <span
                            style={{
                              position: "absolute",
                              bottom: 4,
                              left: 4,
                              fontSize: 9,
                              fontWeight: 800,
                              background: "#4f46e5",
                              color: "#ffffff",
                              padding: "2px 7px",
                              borderRadius: 4,
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
                            }}
                          >
                            Cover
                          </span>
                        )}
                      </div>
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(idx)}
                          className="btn btn-ghost"
                          style={{ fontSize: 10, padding: "4px 6px", height: "auto", justifyContent: "center" }}
                        >
                          Make Cover
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 12, color: "var(--color-muted-foreground)", margin: "2px 0 0" }}>
                  Add up to 5 image URLs. The first image serves as the main storefront thumbnail. Customers can flip through all images when purchasing.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* License Key Duration & Validity Settings */}
        {!variantsEnabled && (
          <div className="card">
            <KeyDurationSelector
              value={duration}
              durationDays={durationDays}
              customDurationLabel={customDurationLabel}
              onChange={(newDuration: KeyDurationType, newDays?: number | null, newLabel?: string | null) => {
                setDuration(newDuration);
                setDurationDays(newDays ?? 0);
                setCustomDurationLabel(newLabel ?? "");
              }}
            />
          </div>
        )}

        {/* Multi-Duration Key Variants */}
        <ProductVariantsManager
          enabled={variantsEnabled}
          onToggleEnabled={setVariantsEnabled}
          variants={variants}
          onChangeVariants={setVariants}
          basePrice={price}
        />

        {/* Redesigned Inventory / License Keys Section */}
        <div className="card interactive-card" style={{ display: "flex", flexDirection: "column", gap: 18, border: "1px solid var(--color-border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "rgba(55, 44, 102, 0.4)",
                    border: "1px solid rgba(139, 92, 246, 0.45)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#c4b5fd",
                  }}
                >
                  <Key size={16} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-foreground)", margin: 0 }}>
                  License Keys & Inventory Stock
                </h3>
                {variantsEnabled && variants.length > 0 && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      padding: "2px 8px",
                      borderRadius: 4,
                      background: "rgba(55, 44, 102, 0.4)",
                      color: "#c4b5fd",
                      border: "1px solid rgba(139, 92, 246, 0.45)",
                      fontFamily: "var(--font-mono, monospace)",
                    }}
                  >
                    TIER-CATEGORIZED
                  </span>
                )}
              </div>
              <p style={{ fontSize: 12, color: "var(--color-muted-foreground)", margin: "4px 0 0" }}>
                {variantsEnabled && variants.length > 0
                  ? "Manage and paste stock separated for each duration variant tier."
                  : "Add codes to deliver automatically to buyers upon instant checkout."}
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  fontFamily: "var(--font-mono, monospace)",
                  padding: "4px 10px",
                  borderRadius: 6,
                  background: totalKeysCount > 0 ? "rgba(34, 197, 94, 0.15)" : "rgba(255, 255, 255, 0.05)",
                  border: totalKeysCount > 0 ? "1px solid rgba(34, 197, 94, 0.3)" : "1px solid var(--color-border)",
                  color: totalKeysCount > 0 ? "#34d399" : "var(--color-muted-foreground)",
                }}
              >
                {totalKeysCount} Total Keys
              </span>
              <button
                type="button"
                onClick={handleOpenBulkModal}
                className="btn btn-secondary"
                style={{ fontSize: 12, padding: "6px 14px", gap: 6 }}
              >
                <FileText size={14} /> Bulk Paste
              </button>
            </div>
          </div>

          {/* If Multi-Duration is enabled: Category Tabs */}
          {variantsEnabled && variants.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--color-muted-foreground)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Select Duration Category to Add / View Keys:
              </span>
              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
                {variants.map((v) => {
                  const isSelected = v.id === currentVariantId;
                  const vKeys = categorizedKeys[v.id] || [];
                  const dMeta = getKeyDurationDisplay(v.duration, v.durationDays, v.customDurationLabel);
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setActiveVariantTabId(v.id)}
                      className="interactive-pill"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 14px",
                        borderRadius: 8,
                        border: isSelected ? "1px solid rgba(139, 92, 246, 0.65)" : "1px solid var(--color-border)",
                        background: isSelected ? "linear-gradient(180deg, rgba(55, 44, 102, 0.4) 0%, rgba(30, 24, 60, 0.25) 100%)" : "var(--color-surface)",
                        color: isSelected ? "#ffffff" : "var(--color-muted-foreground)",
                        fontWeight: isSelected ? 700 : 500,
                        fontSize: 12,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        whiteSpace: "nowrap",
                        boxShadow: isSelected ? "0 0 12px rgba(55, 44, 102, 0.3)" : "none",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: "2px 6px",
                          borderRadius: 4,
                          background: isSelected ? "rgba(55, 44, 102, 0.8)" : "rgba(255, 255, 255, 0.06)",
                          color: isSelected ? "#c4b5fd" : "var(--color-muted-foreground)",
                          fontFamily: "var(--font-mono, monospace)",
                        }}
                      >
                        {dMeta.shortLabel}
                      </span>
                      <span>{v.label}</span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          fontFamily: "var(--font-mono, monospace)",
                          padding: "2px 7px",
                          borderRadius: 12,
                          background: vKeys.length > 0 ? "rgba(34, 197, 94, 0.15)" : "rgba(255, 255, 255, 0.06)",
                          color: vKeys.length > 0 ? "#34d399" : "var(--color-muted-foreground)",
                          border: vKeys.length > 0 ? "1px solid rgba(34, 197, 94, 0.3)" : "1px solid transparent",
                        }}
                      >
                        {vKeys.length} keys
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add Key Input */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Key size={15} style={{ position: "absolute", left: 12, top: 12, color: "var(--color-muted-foreground)" }} />
              <input
                type="text"
                className="input"
                placeholder={
                  variantsEnabled && currentVariant
                    ? `Enter serial key for [${currentVariant.label}] (e.g. VIP-2026-ABCD-1234)...`
                    : "Enter key code (e.g. VIP-2026-ABCD-1234) and press Add"
                }
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddKey();
                  }
                }}
                style={{ paddingLeft: 36, fontFamily: "var(--font-mono, monospace)", fontSize: 13 }}
              />
            </div>
            <button
              type="button"
              onClick={handleAddKey}
              disabled={!keyInput.trim()}
              className="btn btn-primary"
              style={{ flexShrink: 0, gap: 6 }}
            >
              <Plus size={15} /> Add Key
            </button>
          </div>

          {/* Keys Scrollable List (Max 5 previewed) */}
          {currentActiveKeys.length === 0 ? (
            <div
              style={{
                padding: "28px 16px",
                textAlign: "center",
                background: "rgba(255,255,255,0.015)",
                border: "1px dashed var(--color-border)",
                borderRadius: "var(--radius-md)",
                color: "var(--color-muted-foreground)",
                fontSize: 13,
              }}
            >
              {variantsEnabled && currentVariant ? (
                <div>
                  No keys loaded for <strong>{currentVariant.label}</strong> yet. Type a code above or use <strong>Bulk Paste</strong>.
                </div>
              ) : (
                <div>
                  No license keys added yet. Type a code above and click <strong>Add Key</strong> or use <strong>Bulk Paste</strong>.
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  maxHeight: 250,
                  overflowY: "auto",
                  paddingRight: 4,
                }}
              >
                {previewKeys.map((k, idx) => (
                  <div
                    key={idx}
                    className="interactive-pill"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      borderRadius: 8,
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      fontSize: 13,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          fontFamily: "var(--font-mono, monospace)",
                          color: "var(--color-muted-foreground)",
                          minWidth: 24,
                        }}
                      >
                        #{idx + 1}
                      </span>
                      <code
                        style={{
                          fontFamily: "var(--font-mono, monospace)",
                          color: "var(--color-foreground)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {k}
                      </code>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => copyKey(k, idx)}
                        className="btn btn-ghost"
                        style={{ padding: "4px 8px" }}
                        title="Copy key"
                      >
                        {copiedIndex === idx ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveKey(idx)}
                        className="btn btn-ghost"
                        style={{ padding: "4px 8px", color: "var(--color-danger)" }}
                        title="Remove key"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* View All button if more than 5 */}
              {currentActiveKeys.length > 5 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 4 }}>
                  <span style={{ fontSize: 12, color: "var(--color-muted-foreground)", fontFamily: "var(--font-mono, monospace)" }}>
                    Showing 5 of {currentActiveKeys.length} loaded keys for {currentVariant?.label || "this product"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAllModalCategoryFilter(variantsEnabled ? currentVariantId : "all");
                      setShowAllModal(true);
                    }}
                    className="btn btn-secondary"
                    style={{ fontSize: 12, padding: "5px 12px", gap: 6 }}
                  >
                    <ExternalLink size={13} /> View All {totalKeysCount} Total Keys
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Submit */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <Link href="/dashboard/products" className="btn btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: 140 }}>
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Creating...
              </>
            ) : (
              <>
                <Key size={16} /> Publish Product
              </>
            )}
          </button>
        </div>
      </form>

      {/* Bulk Paste Modal */}
      {showBulkModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: variantsEnabled && variants.length > 0 ? 680 : 520,
              width: "100%",
              padding: 24,
              border: "1px solid rgba(139, 92, 246, 0.35)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.7)",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    background: "rgba(55, 44, 102, 0.4)",
                    border: "1px solid rgba(139, 92, 246, 0.45)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#c4b5fd",
                  }}
                >
                  <FileText size={17} />
                </div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: "var(--color-foreground)" }}>Bulk Import License Keys</h3>
                  <p style={{ fontSize: 12, color: "var(--color-muted-foreground)", margin: "2px 0 0" }}>
                    Paste serial keys separated by newlines or commas.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="btn btn-ghost"
                style={{ padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Mode selector if multi-variants */}
            {variantsEnabled && variants.length > 0 && (
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <button
                  type="button"
                  onClick={() => setBulkModalMode("single")}
                  className={bulkModalMode === "single" ? "btn btn-primary" : "btn btn-secondary"}
                  style={{ fontSize: 12, padding: "6px 14px", flex: 1 }}
                >
                  Single Category Paste
                </button>
                <button
                  type="button"
                  onClick={() => setBulkModalMode("multi")}
                  className={bulkModalMode === "multi" ? "btn btn-primary" : "btn btn-secondary"}
                  style={{ fontSize: 12, padding: "6px 14px", flex: 1 }}
                >
                  Multi-Category Batch Paste
                </button>
              </div>
            )}

            {/* Single category paste or single product */}
            {(!variantsEnabled || variants.length === 0 || bulkModalMode === "single") && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                {variantsEnabled && variants.length > 0 && (
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "var(--color-muted-foreground)", marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Target Duration Category:
                    </label>
                    <select
                      className="input"
                      value={bulkTargetVariantId}
                      onChange={(e) => setBulkTargetVariantId(e.target.value)}
                      style={{ fontSize: 13, height: 38 }}
                    >
                      {variants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.label} (${v.price} USD)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <textarea
                  className="input"
                  rows={8}
                  placeholder={"XXXX-YYYY-ZZZZ-1111\nXXXX-YYYY-ZZZZ-2222\nXXXX-YYYY-ZZZZ-3333"}
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 13 }}
                />
              </div>
            )}

            {/* Multi-category batch paste */}
            {variantsEnabled && variants.length > 0 && bulkModalMode === "multi" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1, overflowY: "auto", paddingRight: 4 }}>
                {variants.map((v) => {
                  const dMeta = getKeyDurationDisplay(v.duration, v.durationDays, v.customDurationLabel);
                  return (
                    <div key={v.id} style={{ background: "var(--color-surface)", padding: 12, borderRadius: 8, border: "1px solid var(--color-border)" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 4, background: "rgba(55, 44, 102, 0.4)", color: "#c4b5fd", border: "1px solid rgba(139, 92, 246, 0.45)", fontFamily: "var(--font-mono, monospace)" }}>
                            {dMeta.shortLabel}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 700 }}>{v.label}</span>
                        </div>
                        <span style={{ fontSize: 11, color: "var(--color-muted-foreground)", fontFamily: "var(--font-mono, monospace)" }}>
                          {(bulkMultiCategoryInputs[v.id] || "").split(/[\r\n,]+/).filter(Boolean).length} keys in draft
                        </span>
                      </div>
                      <textarea
                        className="input"
                        rows={3}
                        placeholder={`Paste serial keys for ${v.label} here...`}
                        value={bulkMultiCategoryInputs[v.id] || ""}
                        onChange={(e) =>
                          setBulkMultiCategoryInputs({
                            ...bulkMultiCategoryInputs,
                            [v.id]: e.target.value,
                          })
                        }
                        style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 12 }}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--color-border)" }}>
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddBulk}
                className="btn btn-primary"
              >
                Import Keys
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View All Keys Modal */}
      {showAllModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: 680,
              width: "100%",
              padding: 24,
              border: "1px solid rgba(139, 92, 246, 0.35)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.7)",
              display: "flex",
              flexDirection: "column",
              maxHeight: "85vh",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: "var(--color-foreground)" }}>All Loaded License Keys</h3>
                <span className="badge badge-primary">{totalKeysCount} Total</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAllModal(false)}
                className="btn btn-ghost"
                style={{ padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Filter by category and search */}
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              {variantsEnabled && variants.length > 0 && (
                <select
                  className="input"
                  value={allModalCategoryFilter}
                  onChange={(e) => setAllModalCategoryFilter(e.target.value)}
                  style={{ width: 180, fontSize: 13, height: 36 }}
                >
                  <option value="all">All Tiers ({totalKeysCount})</option>
                  {variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label} ({(categorizedKeys[v.id] || []).length})
                    </option>
                  ))}
                </select>
              )}

              <div style={{ position: "relative", flex: 1 }}>
                <Search size={14} style={{ position: "absolute", left: 10, top: 11, color: "var(--color-muted-foreground)" }} />
                <input
                  type="text"
                  placeholder="Filter keys by text..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="input"
                  style={{ paddingLeft: 32, fontSize: 13, height: 36, fontFamily: "var(--font-mono, monospace)" }}
                />
              </div>
            </div>

            {/* Full Keys List */}
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6, paddingRight: 4 }}>
              {(() => {
                const listToDisplay: Array<{ key: string; varId: string; varLabel: string; origIdx: number }> = [];

                if (variantsEnabled && variants.length > 0) {
                  for (const v of variants) {
                    if (allModalCategoryFilter !== "all" && allModalCategoryFilter !== v.id) continue;
                    const arr = categorizedKeys[v.id] || [];
                    arr.forEach((k, idx) => {
                      if (!searchFilter.trim() || k.toLowerCase().includes(searchFilter.toLowerCase())) {
                        listToDisplay.push({ key: k, varId: v.id, varLabel: v.label, origIdx: idx });
                      }
                    });
                  }
                } else {
                  keysList.forEach((k, idx) => {
                    if (!searchFilter.trim() || k.toLowerCase().includes(searchFilter.toLowerCase())) {
                      listToDisplay.push({ key: k, varId: "default", varLabel: "Single Duration", origIdx: idx });
                    }
                  });
                }

                if (listToDisplay.length === 0) {
                  return (
                    <div style={{ padding: 24, textAlign: "center", color: "var(--color-muted-foreground)", fontSize: 13 }}>
                      No matching keys found.
                    </div>
                  );
                }

                return listToDisplay.map((item, idx) => (
                  <div
                    key={`${item.varId}_${item.origIdx}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      borderRadius: 8,
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      fontSize: 13,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--font-mono, monospace)", color: "var(--color-muted-foreground)", minWidth: 30 }}>
                        #{idx + 1}
                      </span>
                      {variantsEnabled && variants.length > 0 && (
                        <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 4, background: "rgba(55, 44, 102, 0.4)", color: "#c4b5fd", border: "1px solid rgba(139, 92, 246, 0.45)", fontFamily: "var(--font-mono, monospace)" }}>
                          {item.varLabel}
                        </span>
                      )}
                      <code style={{ fontFamily: "var(--font-mono, monospace)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.key}
                      </code>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => copyKey(item.key, `${item.varId}_${item.origIdx}`)}
                        className="btn btn-ghost"
                        style={{ padding: "4px 8px" }}
                        title="Copy key"
                      >
                        {copiedIndex === `${item.varId}_${item.origIdx}` ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveKey(item.origIdx, item.varId)}
                        className="btn btn-ghost"
                        style={{ padding: "4px 8px", color: "var(--color-danger)" }}
                        title="Remove key"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ));
              })()}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--color-border)" }}>
              <button
                type="button"
                onClick={() => {
                  if (confirm("Are you sure you want to clear all keys?")) {
                    setKeysList([]);
                    setCategorizedKeys({});
                  }
                }}
                className="btn btn-ghost"
                style={{ color: "var(--color-danger)", fontSize: 12 }}
              >
                Clear All Keys
              </button>
              <button
                type="button"
                onClick={() => setShowAllModal(false)}
                className="btn btn-primary"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
