"use client";

import { useState, useEffect, use } from "react";
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
} from "lucide-react";
import { useToast } from "@/components/toast-context";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: productId } = use(params);
  const router = useRouter();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [receiptNote, setReceiptNote] = useState("");
  const [price, setPrice] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  const [imageInput, setImageInput] = useState("");

  // Unsaved changes state
  const [initialState, setInitialState] = useState<{
    title: string;
    description: string;
    receiptNote: string;
    price: string;
    isActive: boolean;
    images: string[];
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
  const [newKeysList, setNewKeysList] = useState<string[]>([]);
  const [keyInput, setKeyInput] = useState("");
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkInput, setBulkInput] = useState("");
  const [showAllModal, setShowAllModal] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [deletingKeyId, setDeletingKeyId] = useState<string | null>(null);

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

          setInitialState({
            title: data.product.title || "",
            description: data.product.description || "",
            receiptNote: data.product.receiptNote || "",
            price: (data.product.price || "").toString(),
            isActive: data.product.isActive ?? true,
            images: loadedImages,
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
    setNewKeysList((prev) => [...prev, ...splitKeys]);
    setKeyInput("");
  }

  function handleAddBulk() {
    if (!bulkInput.trim()) return;
    const splitKeys = bulkInput
      .split("\n")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);
    setNewKeysList((prev) => [...prev, ...splitKeys]);
    setBulkInput("");
    setShowBulkModal(false);
  }

  function handleRemoveNewKey(idx: number) {
    setNewKeysList((prev) => prev.filter((_, i) => i !== idx));
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
      const res = await fetch("/api/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: productId,
          title,
          description,
          receiptNote: receiptNote.trim() || null,
          price: parseFloat(price),
          thumbnailUrl: images[0] || thumbnailUrl || null,
          images,
          isActive,
          newKeys: newKeysList,
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
        receiptNote,
        price,
        isActive,
        images,
      });
      setNewKeysList([]);
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

  const isDirty = Boolean(
    initialState &&
      (title !== initialState.title ||
        description !== initialState.description ||
        price !== initialState.price ||
        isActive !== initialState.isActive ||
        JSON.stringify(images) !== JSON.stringify(initialState.images) ||
        newKeysList.length > 0)
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
              placeholder="e.g. Thank you for your purchase! Join discord.gg/vaultly to claim your role, or review the activation manual at docs.vaultly.io"
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

        {/* License Keys & Stock Manager */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-foreground)", margin: 0 }}>
                License Keys & Stock Management
              </h3>
              <p style={{ fontSize: 13, color: "var(--color-muted-foreground)", margin: "4px 0 0" }}>
                {unusedDbKeys.length} keys in stock • {usedDbKeys.length} delivered
                {newKeysList.length > 0 && ` • +${newKeysList.length} ready to save`}
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className={`badge ${unusedDbKeys.length > 0 ? "badge-success" : "badge-danger"}`}>
                {unusedDbKeys.length + newKeysList.length} Available
              </span>
              <button
                type="button"
                onClick={() => setShowBulkModal(true)}
                className="btn btn-secondary"
                style={{ fontSize: 12, padding: "6px 12px", gap: 6 }}
              >
                <FileText size={14} /> Bulk Paste
              </button>
            </div>
          </div>

          {/* Add Key Input */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Key size={15} style={{ position: "absolute", left: 12, top: 12, color: "var(--color-muted-foreground)" }} />
              <input
                type="text"
                className="input"
                placeholder="Type new license code and press Add"
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
          {combinedUnused.length === 0 ? (
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
              No available license keys in stock. Add codes above to replenish inventory.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {previewKeys.map((item, idx) => (
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
                            const newIdx = parseInt(item.id.replace("new_", ""), 10);
                            handleRemoveNewKey(newIdx);
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
              {combinedUnused.length > 5 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 4 }}>
                  <span style={{ fontSize: 12, color: "var(--color-muted-foreground)" }}>
                    Showing 5 of {combinedUnused.length} available keys
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAllModal(true)}
                    className="btn btn-secondary"
                    style={{ fontSize: 12, padding: "5px 12px", gap: 6 }}
                  >
                    <ExternalLink size={13} /> View All {combinedUnused.length} Keys
                  </button>
                </div>
              )}
            </div>
          )}
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
              maxWidth: 500,
              width: "100%",
              padding: 24,
              border: "1px solid var(--color-border)",
              boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Bulk Import Keys</h3>
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="btn btn-ghost"
                style={{ padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 13, color: "var(--color-muted-foreground)", marginBottom: 12 }}>
              Paste your serial keys below, one key per line:
            </p>

            <textarea
              className="input"
              rows={8}
              placeholder={"XXXX-YYYY-ZZZZ-1111\nXXXX-YYYY-ZZZZ-2222\nXXXX-YYYY-ZZZZ-3333"}
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              style={{ fontFamily: "monospace", fontSize: 13, marginBottom: 16 }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
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
                disabled={!bulkInput.trim()}
                className="btn btn-primary"
              >
                Add to Product
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
              maxWidth: 600,
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
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>All Available Keys</h3>
                <span className="badge badge-primary">{combinedUnused.length} Total</span>
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

            {/* Filter Search */}
            <div style={{ position: "relative", marginBottom: 14 }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: 11, color: "var(--color-muted-foreground)" }} />
              <input
                type="text"
                placeholder="Filter keys..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="input"
                style={{ paddingLeft: 32, fontSize: 13, height: 36 }}
              />
            </div>

            {/* Full Keys List */}
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6, paddingRight: 4 }}>
              {filteredAllKeys.map((item, idx) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    borderRadius: 8,
                    background: "var(--color-surface-2)",
                    border: "1px solid var(--color-border)",
                    fontSize: 13,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--color-muted-foreground)", minWidth: 26 }}>
                      #{idx + 1}
                    </span>
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
                          const newIdx = parseInt(item.id.replace("new_", ""), 10);
                          handleRemoveNewKey(newIdx);
                        } else {
                          handleDeleteDbKey(item.id);
                        }
                      }}
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
