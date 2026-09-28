"use client";

import { useState, useEffect, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Key,
  Save,
  Loader2,
  Plus,
  Trash2,
  Copy,
  Check,
  FileText,
  Search,
  X,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  Layers,
  Sparkles,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "@/components/toast-context";
import KeyDurationSelector from "@/components/key-duration-selector";
import { DURATION_OPTIONS, getKeyDurationDisplay, KeyDurationType } from "@/lib/key-duration";
import { ProductVariantsManager } from "@/components/product-variants-manager";
import { ProductVariant } from "@/lib/validations/product";
import { ProductCategorySelector } from "@/components/product-category-selector";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: productId } = use(params);
  const router = useRouter();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [receiptNote, setReceiptNote] = useState("");
  const [price, setPrice] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  const [imageInput, setImageInput] = useState("");

  // Key duration state
  const [duration, setDuration] = useState<KeyDurationType>("lifetime");
  const [durationDays, setDurationDays] = useState<number>(0);
  const [customDurationLabel, setCustomDurationLabel] = useState("");

  // Multi-duration variants state
  const [variantsEnabled, setVariantsEnabled] = useState(false);
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  // Unsaved changes state
  const [initialState, setInitialState] = useState<{
    title: string;
    description: string;
    category: string | null;
    receiptNote: string;
    price: string;
    isActive: boolean;
    images: string[];
    duration: KeyDurationType;
    durationDays: number;
    customDurationLabel: string;
  } | null>(null);
  const [confirmExitOpen, setConfirmExitOpen] = useState(false);

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

  // License keys from DB
  const [dbKeys, setDbKeys] = useState<any[]>([]);
  // Single-duration newly added keys
  const [newKeysList, setNewKeysList] = useState<string[]>([]);
  // Multi-duration newly added keys: { [variantId]: string[] }
  const [categorizedNewKeys, setCategorizedNewKeys] = useState<Record<string, string[]>>({});
  const [activeVariantTabId, setActiveVariantTabId] = useState<string>("");

  const [keyInput, setKeyInput] = useState("");
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkInput, setBulkInput] = useState("");
  const [bulkTargetVariantId, setBulkTargetVariantId] = useState<string>("");
  const [bulkMultiCategoryInputs, setBulkMultiCategoryInputs] = useState<Record<string, string>>({});
  const [bulkModalMode, setBulkModalMode] = useState<"single" | "multi">("single");

  const [showAllModal, setShowAllModal] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [allModalCategoryFilter, setAllModalCategoryFilter] = useState<string>("all");
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [deletingKeyId, setDeletingKeyId] = useState<string | null>(null);

  // Active variant resolution
  const currentVariant = useMemo(() => {
    if (!variantsEnabled || variants.length === 0) return null;
    const found = variants.find((v) => v.id === activeVariantTabId);
    return found || variants[0];
  }, [variantsEnabled, variants, activeVariantTabId]);

  const currentVariantId = currentVariant?.id || "";

  useEffect(() => {
    async function loadProduct() {
      try {
        const res = await fetch(`/api/products?id=${productId}`);
        if (!res.ok) {
          throw new Error("Failed to load product details");
        }
        const data = await res.json();
        if (data.product) {
          setTitle(data.product.title || "");
          setDescription(data.product.description || "");
          setReceiptNote(data.product.receiptNote || "");
          setPrice(data.product.price || "");
          setThumbnailUrl(data.product.thumbnailUrl || "");
          setIsActive(data.product.isActive ?? true);
          let loadedImages: string[] = [];
          if (Array.isArray(data.product.parsedImages) && data.product.parsedImages.length > 0) {
            loadedImages = data.product.parsedImages;
            setImages(loadedImages);
          } else if (data.product.thumbnailUrl) {
            loadedImages = [data.product.thumbnailUrl];
            setImages(loadedImages);
          }

          const loadedDuration = (data.product.duration || "lifetime") as KeyDurationType;
          const loadedDays = data.product.durationDays ?? 0;
          const loadedLabel = data.product.customDurationLabel || "";
          const loadedCategory = data.product.category || null;
          setCategory(loadedCategory);
          setDuration(loadedDuration);
          setDurationDays(loadedDays);
          setCustomDurationLabel(loadedLabel);

          let loadedVariants: ProductVariant[] = [];
          if (Array.isArray(data.product.parsedVariants) && data.product.parsedVariants.length > 0) {
            loadedVariants = data.product.parsedVariants;
            setVariants(loadedVariants);
            setVariantsEnabled(true);
            if (loadedVariants.length > 0) {
              setActiveVariantTabId(loadedVariants[0].id);
            }
          }

          setInitialState({
            title: data.product.title || "",
            description: data.product.description || "",
            category: loadedCategory,
            receiptNote: data.product.receiptNote || "",
            price: (data.product.price || "").toString(),
            isActive: data.product.isActive ?? true,
            images: loadedImages,
            duration: loadedDuration,
            durationDays: loadedDays,
            customDurationLabel: loadedLabel,
          });
        }
        if (Array.isArray(data.keys)) {
          setDbKeys(data.keys);
        }
      } catch (err: any) {
        toast.error("Failed to Load Product", err.message || "Could not fetch product details");
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [productId]);

  function handleAddNewKey() {
    if (!keyInput.trim()) return;
    const splitKeys = keyInput
      .split(/[\n,]/)
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    if (variantsEnabled && variants.length > 0 && currentVariantId) {
      const existing = categorizedNewKeys[currentVariantId] || [];
      const uniqueNew = splitKeys.filter((k) => !existing.includes(k));
      setCategorizedNewKeys({
        ...categorizedNewKeys,
        [currentVariantId]: [...existing, ...uniqueNew],
      });
    } else {
      setNewKeysList((prev) => [...prev, ...splitKeys]);
    }
    setKeyInput("");
  }

  function handleOpenBulkModal() {
    setBulkTargetVariantId(currentVariantId || (variants[0]?.id ?? ""));
    setBulkInput("");
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
        const nextCategorized = { ...categorizedNewKeys };
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
        setCategorizedNewKeys(nextCategorized);
        toast.success("Bulk Keys Added", `Staged ${addedCount} keys across duration tiers.`);
      } else {
        const targetVId = bulkTargetVariantId || currentVariantId;
        if (!bulkInput.trim() || !targetVId) return;
        const splitKeys = bulkInput
          .split(/[\r\n,]+/)
          .map((k) => k.trim())
          .filter((k) => k.length > 0);
        const existing = categorizedNewKeys[targetVId] || [];
        const uniqueNew = splitKeys.filter((k) => !existing.includes(k));
        setCategorizedNewKeys({
          ...categorizedNewKeys,
          [targetVId]: [...existing, ...uniqueNew],
        });
        toast.success("Keys Staged", `Added ${uniqueNew.length} keys to duration category.`);
      }
    } else {
      if (!bulkInput.trim()) return;
      const splitKeys = bulkInput
        .split(/[\r\n,]+/)
        .map((k) => k.trim())
        .filter((k) => k.length > 0);
      setNewKeysList((prev) => [...prev, ...splitKeys]);
      toast.success("Keys Staged", `Added ${splitKeys.length} new keys.`);
    }
    setBulkInput("");
    setShowBulkModal(false);
  }

  function handleRemoveNewKey(idx: number, varId?: string) {
    if (variantsEnabled && variants.length > 0) {
      const vId = varId || currentVariantId;
      const existing = categorizedNewKeys[vId] || [];
      setCategorizedNewKeys({
        ...categorizedNewKeys,
        [vId]: existing.filter((_, i) => i !== idx),
      });
    } else {
      setNewKeysList((prev) => prev.filter((_, i) => i !== idx));
    }
  }

  async function handleDeleteDbKey(keyId: string) {
    if (!confirm("Are you sure you want to remove this license key from inventory?")) return;
    setDeletingKeyId(keyId);
    try {
      const res = await fetch(`/api/products/${productId}/keys?keyId=${keyId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDbKeys((prev) => prev.filter((k) => k.id !== keyId));
        toast.success("Key Removed", "License key deleted from stock.");
      } else {
        toast.error("Error", "Could not remove license key");
      }
    } catch {
      toast.error("Error", "Failed to delete key");
    } finally {
      setDeletingKeyId(null);
    }
  }

  function copyKeyText(keyStr: string, id: string) {
    navigator.clipboard.writeText(keyStr);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 1500);
  }

  async function handleSave(e?: React.FormEvent) {
    e?.preventDefault();

    if (!title.trim() || !price || parseFloat(price) <= 0) {
      toast.error("Invalid Input", "Please provide a valid product title and price.");
      return;
    }

    setSaving(true);
    try {
      const isMulti = variantsEnabled && variants.length > 0;
      const res = await fetch("/api/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: productId,
          title,
          description,
          category: category?.trim() || null,
          receiptNote: receiptNote.trim() || null,
          price: parseFloat(price),
          thumbnailUrl: images[0] || thumbnailUrl || null,
          images,
          duration,
          durationDays: duration === "lifetime" ? 0 : durationDays,
          customDurationLabel: duration === "custom" ? customDurationLabel.trim() || null : null,
          variants: isMulti ? variants : null,
          isActive,
          newKeys: !isMulti ? newKeysList : [],
          categorizedKeys: isMulti ? categorizedNewKeys : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update product");
      }

      toast.success("Product Updated", "All changes have been saved successfully.");
      setInitialState({
        title,
        description,
        category,
        receiptNote,
        price,
        isActive,
        images,
        duration,
        durationDays,
        customDurationLabel,
      });
      setNewKeysList([]);
      setCategorizedNewKeys({});
      // Reload keys
      const keysRes = await fetch(`/api/products/${productId}/keys`);
      if (keysRes.ok) {
        const keysData = await keysRes.json();
        setDbKeys(keysData.keys || []);
      }
      return true;
    } catch (err: any) {
      toast.error("Save Failed", err.message || "Failed to update product");
      return false;
    } finally {
      setSaving(false);
    }
  }

  const stagedNewCount = variantsEnabled && variants.length > 0
    ? Object.values(categorizedNewKeys).reduce((acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0), 0)
    : newKeysList.length;

  const isDirty = Boolean(
    initialState &&
      (title !== initialState.title ||
        description !== initialState.description ||
        category !== initialState.category ||
        receiptNote !== initialState.receiptNote ||
        price !== initialState.price ||
        isActive !== initialState.isActive ||
        duration !== initialState.duration ||
        durationDays !== initialState.durationDays ||
        customDurationLabel !== initialState.customDurationLabel ||
        JSON.stringify(images) !== JSON.stringify(initialState.images) ||
        stagedNewCount > 0)
  );

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  function handleBack() {
    if (isDirty) {
      setConfirmExitOpen(true);
    } else {
      router.push("/dashboard/products");
    }
  }

  if (loading) {
    return (
      <div
        className="page-fly-in"
        style={{ maxWidth: 960, margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: 24 }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="skeleton" style={{ width: 140, height: 18 }} />
          <div className="skeleton" style={{ width: 280, height: 32, borderRadius: 8 }} />
        </div>
        <div className="card" style={{ padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="skeleton" style={{ width: 120, height: 16 }} />
          <div className="skeleton" style={{ width: "100%", height: 44, borderRadius: 8 }} />
          <div className="skeleton" style={{ width: 160, height: 16 }} />
          <div className="skeleton" style={{ width: "100%", height: 96, borderRadius: 8 }} />
        </div>
      </div>
    );
  }

  const unusedDbKeys = dbKeys.filter((k) => !k.isUsed);
  const usedDbKeys = dbKeys.filter((k) => k.isUsed);

  // Combine preview: up to 5 keys preview
  const combinedUnused = [
    ...unusedDbKeys.map((k) => ({ id: k.id, value: k.keyValue, isNew: false, date: k.createdAt })),
    ...newKeysList.map((k, idx) => ({ id: `new_${idx}`, value: k, isNew: true, date: new Date() })),
  ];
  const previewKeys = combinedUnused.slice(0, 5);
  const filteredAllKeys = combinedUnused.filter((k) =>
    !searchFilter.trim() || k.value.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="page-fly-in" style={{ maxWidth: 960, margin: "0 auto", width: "100%" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <button
          type="button"
          onClick={handleBack}
          className="btn btn-ghost"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 14,
            color: "var(--color-muted-foreground)",
            marginBottom: 16,
            padding: "4px 8px",
          }}
        >
          <ArrowLeft size={16} /> Back to products
        </button>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--color-foreground)", letterSpacing: "-0.02em", margin: 0 }}>
                Edit Product
              </h1>
              <span className={`badge ${isActive ? "badge-success" : "badge-neutral"}`}>
                {isActive ? "Active" : "Draft / Inactive"}
              </span>
              {isDirty && (
                <span className="badge badge-warning" style={{ fontSize: 11 }}>
                  Unsaved Changes
                </span>
              )}
            </div>
            <p style={{ color: "var(--color-muted-foreground)", fontSize: 14, marginTop: 4 }}>
              Update details, price, and license keys stock for automated buyer delivery.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <Link
              href={`/dashboard/products/${productId}/keys`}
              className="btn btn-secondary"
              style={{ fontSize: 13, gap: 6 }}
            >
              <Key size={15} /> Keys Vault ({unusedDbKeys.length} Available)
            </Link>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Basic Details */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-foreground)", margin: 0 }}>
              Product Details
            </h3>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: "var(--color-primary)" }}
              />
              <span>Listed in Storefront</span>
            </label>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label className="label">Title *</label>
            <input
              type="text"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. VIP Subscription Key"
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
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your item, delivery details, terms..."
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
              onChange={(newDuration, newDays, newLabel) => {
                setDuration(newDuration);
                setDurationDays(newDays);
                setCustomDurationLabel(newLabel);
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

        {/* License Keys & Stock Manager */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-foreground)", margin: 0 }}>
                  License Keys & Stock Inventory
                </h3>
                {variantsEnabled && variants.length > 0 && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      padding: "2px 8px",
                      borderRadius: 4,
                      background: "rgba(99, 102, 241, 0.15)",
                      color: "#818cf8",
                      border: "1px solid rgba(99, 102, 241, 0.3)",
                    }}
                  >
                    CATEGORIZED BY DURATION
                  </span>
                )}
              </div>
              <p style={{ fontSize: 13, color: "var(--color-muted-foreground)", margin: "4px 0 0" }}>
                {unusedDbKeys.length} in stock • {usedDbKeys.length} delivered
                {stagedNewCount > 0 && ` • +${stagedNewCount} ready to save`}
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Link
                href={`/dashboard/products/${productId}/keys`}
                className="btn btn-ghost"
                style={{ fontSize: 12, padding: "6px 12px", gap: 6, color: "#818cf8" }}
              >
                <Layers size={14} /> Open Keys Vault
              </Link>
              <button
                type="button"
                onClick={handleOpenBulkModal}
                className="btn btn-secondary"
                style={{ fontSize: 12, padding: "6px 12px", gap: 6 }}
              >
                <FileText size={14} /> Bulk Paste
              </button>
            </div>
          </div>

          {/* If Multi-Duration is enabled: Category Tabs */}
          {variantsEnabled && variants.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-muted-foreground)" }}>
                Filter & Add Keys by Duration Tier:
              </span>
              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
                {variants.map((v) => {
                  const isSelected = v.id === currentVariantId;
                  const dMeta = getKeyDurationDisplay(v.duration, v.durationDays, v.customDurationLabel);
                  const vDbUnused = dbKeys.filter((k) => !k.isUsed && (k.variantId === v.id || k.duration === v.duration)).length;
                  const vStaged = (categorizedNewKeys[v.id] || []).length;
                  const totalV = vDbUnused + vStaged;

                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setActiveVariantTabId(v.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 14px",
                        borderRadius: 10,
                        border: isSelected ? `2px solid ${dMeta.badgeColor}` : "1px solid var(--color-border)",
                        background: isSelected ? `${dMeta.badgeColor}15` : "var(--color-surface-2)",
                        color: isSelected ? "var(--color-foreground)" : "var(--color-muted-foreground)",
                        fontWeight: isSelected ? 700 : 500,
                        fontSize: 13,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: "2px 6px",
                          borderRadius: 4,
                          background: `${dMeta.badgeColor}25`,
                          color: dMeta.badgeColor,
                        }}
                      >
                        {dMeta.shortLabel}
                      </span>
                      <span>{v.label}</span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "2px 7px",
                          borderRadius: 12,
                          background: totalV > 0 ? "rgba(16, 185, 129, 0.2)" : "rgba(255, 255, 255, 0.08)",
                          color: totalV > 0 ? "#34d399" : "var(--color-muted-foreground)",
                        }}
                      >
                        {totalV} keys
                        {vStaged > 0 && <span style={{ color: "#818cf8", marginLeft: 4 }}>(+{vStaged})</span>}
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
                    ? `Enter serial key for [${currentVariant.label}] and press Add...`
                    : "Type new license code (e.g. VIP-2026-ABCD-1234) and press Add"
                }
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddNewKey();
                  }
                }}
                style={{ paddingLeft: 36, fontFamily: "monospace", fontSize: 13 }}
              />
            </div>
            <button
              type="button"
              onClick={handleAddNewKey}
              disabled={!keyInput.trim()}
              className="btn btn-primary"
              style={{ flexShrink: 0, gap: 6 }}
            >
              <Plus size={15} /> Add Key
            </button>
          </div>

          {/* Preview list (max 5) */}
          {(() => {
            let activeItems: Array<{ id: string; value: string; isNew: boolean; varId?: string; varLabel?: string }> = [];

            if (variantsEnabled && variants.length > 0 && currentVariant) {
              const matchingDb = dbKeys
                .filter((k) => !k.isUsed && (k.variantId === currentVariant.id || k.duration === currentVariant.duration))
                .map((k) => ({ id: k.id, value: k.keyValue, isNew: false, varId: currentVariant.id, varLabel: currentVariant.label }));
              const matchingStaged = (categorizedNewKeys[currentVariant.id] || []).map((k, idx) => ({
                id: `new_${currentVariant.id}_${idx}`,
                value: k,
                isNew: true,
                varId: currentVariant.id,
                varLabel: currentVariant.label,
              }));
              activeItems = [...matchingDb, ...matchingStaged];
            } else {
              activeItems = [
                ...unusedDbKeys.map((k) => ({ id: k.id, value: k.keyValue, isNew: false })),
                ...newKeysList.map((k, idx) => ({ id: `new_${idx}`, value: k, isNew: true })),
              ];
            }

            if (activeItems.length === 0) {
              return (
                <div
                  style={{
                    padding: "26px 16px",
                    textAlign: "center",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px dashed var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--color-muted-foreground)",
                    fontSize: 13,
                  }}
                >
                  {variantsEnabled && currentVariant ? (
                    <div>
                      No available keys in stock for <strong>{currentVariant.label}</strong>. Type a code above or use <strong>Bulk Paste</strong>.
                    </div>
                  ) : (
                    <div>
                      No available license keys in stock. Add codes above to replenish inventory.
                    </div>
                  )}
                </div>
              );
            }

            const previewSlice = activeItems.slice(0, 5);

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {previewSlice.map((item, idx) => (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 12px",
                        borderRadius: 8,
                        background: item.isNew ? "rgba(99, 102, 241, 0.08)" : "var(--color-surface-2)",
                        border: item.isNew ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid var(--color-border)",
                        fontSize: 13,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--color-muted-foreground)", minWidth: 26 }}>
                          #{idx + 1}
                        </span>
                        <code style={{ fontFamily: "monospace", color: "var(--color-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.value}
                        </code>
                        {item.isNew && (
                          <span className="badge badge-primary" style={{ fontSize: 9, padding: "1px 5px" }}>
                            New (Unsaved)
                          </span>
                        )}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => copyKeyText(item.value, item.id)}
                          className="btn btn-ghost"
                          style={{ padding: "4px 8px" }}
                          title="Copy key"
                        >
                          {copiedKeyId === item.id ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (item.isNew) {
                              if (variantsEnabled && item.varId) {
                                const idxInVar = (categorizedNewKeys[item.varId] || []).indexOf(item.value);
                                if (idxInVar >= 0) handleRemoveNewKey(idxInVar, item.varId);
                              } else {
                                const idxInFlat = newKeysList.indexOf(item.value);
                                if (idxInFlat >= 0) handleRemoveNewKey(idxInFlat);
                              }
                            } else {
                              handleDeleteDbKey(item.id);
                            }
                          }}
                          disabled={deletingKeyId === item.id}
                          className="btn btn-ghost"
                          style={{ padding: "4px 8px", color: "var(--color-danger)" }}
                          title="Remove key"
                        >
                          {deletingKeyId === item.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* View All Keys Button */}
                {activeItems.length > 5 && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 4 }}>
                    <span style={{ fontSize: 12, color: "var(--color-muted-foreground)" }}>
                      Showing 5 of {activeItems.length} available keys for {currentVariant?.label || "this product"}
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
                      <ExternalLink size={13} /> View All {unusedDbKeys.length + stagedNewCount} Available Keys
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Submit Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button type="button" onClick={handleBack} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ minWidth: 150 }}>
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save size={16} /> Save Product
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
            background: "rgba(0,0,0,0.72)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: variantsEnabled && variants.length > 0 ? 680 : 500,
              width: "100%",
              padding: 24,
              border: "1px solid var(--color-border)",
              boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Bulk Import Keys</h3>
                <p style={{ fontSize: 12, color: "var(--color-muted-foreground)", margin: "2px 0 0" }}>
                  Paste serial keys separated by newlines or commas.
                </p>
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
                    <label style={{ fontSize: 12, fontWeight: 700, color: "var(--color-muted-foreground)", marginBottom: 6, display: "block" }}>
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
                  style={{ fontFamily: "monospace", fontSize: 13 }}
                />
              </div>
            )}

            {/* Multi-category batch paste */}
            {variantsEnabled && variants.length > 0 && bulkModalMode === "multi" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1, overflowY: "auto", paddingRight: 4 }}>
                {variants.map((v) => {
                  const dMeta = getKeyDurationDisplay(v.duration, v.durationDays, v.customDurationLabel);
                  return (
                    <div key={v.id} style={{ background: "var(--color-surface-2)", padding: 12, borderRadius: 10, border: "1px solid var(--color-border)" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 4, background: `${dMeta.badgeColor}25`, color: dMeta.badgeColor }}>
                            {dMeta.shortLabel}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 700 }}>{v.label}</span>
                        </div>
                        <span style={{ fontSize: 11, color: "var(--color-muted-foreground)" }}>
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
                        style={{ fontFamily: "monospace", fontSize: 12 }}
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
                Stage Keys
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
            background: "rgba(0,0,0,0.72)",
            backdropFilter: "blur(6px)",
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
              border: "1px solid var(--color-border)",
              boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
              display: "flex",
              flexDirection: "column",
              maxHeight: "85vh",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>All Available Inventory Keys</h3>
                <span className="badge badge-primary">{unusedDbKeys.length + stagedNewCount} Available</span>
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

            {/* Filter Search & Category Filter */}
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              {variantsEnabled && variants.length > 0 && (
                <select
                  className="input"
                  value={allModalCategoryFilter}
                  onChange={(e) => setAllModalCategoryFilter(e.target.value)}
                  style={{ width: 180, fontSize: 13, height: 36 }}
                >
                  <option value="all">All Tiers ({unusedDbKeys.length + stagedNewCount})</option>
                  {variants.map((v) => {
                    const dbCount = dbKeys.filter((k) => !k.isUsed && (k.variantId === v.id || k.duration === v.duration)).length;
                    const stgCount = (categorizedNewKeys[v.id] || []).length;
                    return (
                      <option key={v.id} value={v.id}>
                        {v.label} ({dbCount + stgCount})
                      </option>
                    );
                  })}
                </select>
              )}

              <div style={{ position: "relative", flex: 1 }}>
                <Search size={14} style={{ position: "absolute", left: 10, top: 11, color: "var(--color-muted-foreground)" }} />
                <input
                  type="text"
                  placeholder="Filter keys by code..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="input"
                  style={{ paddingLeft: 32, fontSize: 13, height: 36 }}
                />
              </div>
            </div>

            {/* Full Keys List */}
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6, paddingRight: 4 }}>
              {(() => {
                const listToDisplay: Array<{ id: string; value: string; isNew: boolean; varId?: string; varLabel?: string }> = [];

                if (variantsEnabled && variants.length > 0) {
                  for (const v of variants) {
                    if (allModalCategoryFilter !== "all" && allModalCategoryFilter !== v.id) continue;
                    const dbMatching = dbKeys
                      .filter((k) => !k.isUsed && (k.variantId === v.id || k.duration === v.duration))
                      .map((k) => ({ id: k.id, value: k.keyValue, isNew: false, varId: v.id, varLabel: v.label }));
                    const stagedMatching = (categorizedNewKeys[v.id] || []).map((k, idx) => ({
                      id: `new_${v.id}_${idx}`,
                      value: k,
                      isNew: true,
                      varId: v.id,
                      varLabel: v.label,
                    }));
                    listToDisplay.push(...dbMatching, ...stagedMatching);
                  }
                } else {
                  listToDisplay.push(
                    ...unusedDbKeys.map((k) => ({ id: k.id, value: k.keyValue, isNew: false, varId: "default", varLabel: "Single Duration" })),
                    ...newKeysList.map((k, idx) => ({ id: `new_${idx}`, value: k, isNew: true, varId: "default", varLabel: "Single Duration" }))
                  );
                }

                const filtered = listToDisplay.filter((item) =>
                  !searchFilter.trim() || item.value.toLowerCase().includes(searchFilter.toLowerCase())
                );

                if (filtered.length === 0) {
                  return (
                    <div style={{ padding: 24, textAlign: "center", color: "var(--color-muted-foreground)", fontSize: 13 }}>
                      No matching keys found.
                    </div>
                  );
                }

                return filtered.map((item, idx) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      borderRadius: 8,
                      background: item.isNew ? "rgba(99, 102, 241, 0.08)" : "var(--color-surface-2)",
                      border: item.isNew ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid var(--color-border)",
                      fontSize: 13,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--color-muted-foreground)", minWidth: 26 }}>
                        #{idx + 1}
                      </span>
                      {variantsEnabled && variants.length > 0 && item.varLabel && (
                        <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 4, background: "rgba(99, 102, 241, 0.15)", color: "#818cf8" }}>
                          {item.varLabel}
                        </span>
                      )}
                      <code style={{ fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.value}
                      </code>
                      {item.isNew && (
                        <span className="badge badge-primary" style={{ fontSize: 9, padding: "1px 5px" }}>
                          New
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => copyKeyText(item.value, item.id)}
                        className="btn btn-ghost"
                        style={{ padding: "4px 8px" }}
                        title="Copy key"
                      >
                        {copiedKeyId === item.id ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (item.isNew) {
                            if (variantsEnabled && item.varId) {
                              const idxInVar = (categorizedNewKeys[item.varId] || []).indexOf(item.value);
                              if (idxInVar >= 0) handleRemoveNewKey(idxInVar, item.varId);
                            } else {
                              const idxInFlat = newKeysList.indexOf(item.value);
                              if (idxInFlat >= 0) handleRemoveNewKey(idxInFlat);
                            }
                          } else {
                            handleDeleteDbKey(item.id);
                          }
                        }}
                        disabled={deletingKeyId === item.id}
                        className="btn btn-ghost"
                        style={{ padding: "4px 8px", color: "var(--color-danger)" }}
                        title="Remove key"
                      >
                        {deletingKeyId === item.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </div>
                ));
              })()}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--color-border)" }}>
              <button
                type="button"
                onClick={() => setShowAllModal(false)}
                className="btn btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unsaved Changes Exit Confirmation Modal */}
      {confirmExitOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: 460,
              width: "100%",
              padding: 26,
              boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg, 16px)",
              background: "var(--color-surface)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "rgba(245, 158, 11, 0.15)",
                  color: "#f59e0b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "var(--color-foreground)" }}>
                  Unsaved Product Changes
                </h3>
                <p style={{ margin: "3px 0 0", fontSize: 13, color: "var(--color-muted-foreground)" }}>
                  Are you sure you want to exit without saving?
                </p>
              </div>
            </div>

            <p style={{ fontSize: 13, color: "var(--color-muted-foreground)", lineHeight: 1.5, marginBottom: 20 }}>
              You have modified this product or added new license keys. If you exit now, any unsaved adjustments will be discarded.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                type="button"
                className="btn btn-primary"
                disabled={saving}
                onClick={async () => {
                  const ok = await handleSave();
                  if (ok) {
                    setConfirmExitOpen(false);
                    router.push("/dashboard/products");
                  }
                }}
                style={{ justifyContent: "center", gap: 8, padding: "10px 18px", fontSize: 13, fontWeight: 700 }}
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save and Close
              </button>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setConfirmExitOpen(false)}
                  style={{ justifyContent: "center", fontSize: 13 }}
                >
                  Continue Editing
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setConfirmExitOpen(false);
                    router.push("/dashboard/products");
                  }}
                  style={{ justifyContent: "center", color: "var(--color-danger)", fontSize: 13 }}
                >
                  Discard & Exit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
