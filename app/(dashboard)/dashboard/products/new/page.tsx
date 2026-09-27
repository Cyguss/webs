"use client";

import { useState } from "react";
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
} from "lucide-react";
import { useToast } from "@/components/toast-context";

export default function NewProductPage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [receiptNote, setReceiptNote] = useState("");
  const type = "key";
  const [price, setPrice] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [imageInput, setImageInput] = useState("");

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

  // License keys state
  const [keysList, setKeysList] = useState<string[]>([]);
  const [keyInput, setKeyInput] = useState("");
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkInput, setBulkInput] = useState("");
  const [showAllModal, setShowAllModal] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  function handleAddKey() {
    if (!keyInput.trim()) return;
    const splitKeys = keyInput
      .split(/[\n,]/)
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    const uniqueNew = splitKeys.filter((k) => !keysList.includes(k));
    setKeysList([...keysList, ...uniqueNew]);
    setKeyInput("");
  }

  function handleRemoveKey(index: number) {
    setKeysList(keysList.filter((_, i) => i !== index));
  }

  function handleAddBulk() {
    if (!bulkInput.trim()) return;
    const splitKeys = bulkInput
      .split(/[\n,]/)
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    const uniqueNew = splitKeys.filter((k) => !keysList.includes(k));
    setKeysList([...keysList, ...uniqueNew]);
    setBulkInput("");
    setShowBulkModal(false);
  }

  function copyKey(keyVal: string, idx: number) {
    navigator.clipboard.writeText(keyVal);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1500);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          receiptNote: receiptNote.trim() || null,
          type: "key",
          price: parseFloat(price),
          thumbnailUrl: images[0] || thumbnailUrl || null,
          images,
          isUnlimitedStock: false,
          stockLimit: null,
          keys: keysList,
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

  const previewKeys = keysList.slice(0, 5);
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

        {/* Redesigned Inventory / License Keys Section */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-foreground)", margin: 0 }}>
                License Keys & Stock
              </h3>
              <p style={{ fontSize: 13, color: "var(--color-muted-foreground)", margin: "4px 0 0" }}>
                Add codes to deliver automatically to buyers upon checkout.
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className={`badge ${keysList.length > 0 ? "badge-primary" : "badge-neutral"}`}>
                {keysList.length} Keys Loaded
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

          {/* Add Key Input with code button */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Key size={15} style={{ position: "absolute", left: 12, top: 12, color: "var(--color-muted-foreground)" }} />
              <input
                type="text"
                className="input"
                placeholder="Enter key code (e.g. VIP-2026-ABCD-1234) and press Add"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddKey();
                  }
                }}
                style={{ paddingLeft: 36, fontFamily: "monospace", fontSize: 13 }}
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
          {keysList.length === 0 ? (
            <div
              style={{
                padding: "28px 16px",
                textAlign: "center",
                background: "rgba(255,255,255,0.02)",
                border: "1px dashed var(--color-border)",
                borderRadius: "var(--radius-md)",
                color: "var(--color-muted-foreground)",
                fontSize: 13,
              }}
            >
              No license keys added yet. Type a code above and click <strong>Add Key</strong> or use <strong>Bulk Paste</strong>.
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
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "var(--color-muted-foreground)",
                          minWidth: 24,
                        }}
                      >
                        #{idx + 1}
                      </span>
                      <code
                        style={{
                          fontFamily: "monospace",
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
                        {copiedIndex === idx ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
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
              {keysList.length > 5 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 4 }}>
                  <span style={{ fontSize: 12, color: "var(--color-muted-foreground)" }}>
                    Showing 5 of {keysList.length} loaded keys
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAllModal(true)}
                    className="btn btn-secondary"
                    style={{ fontSize: 12, padding: "5px 12px", gap: 6 }}
                  >
                    <ExternalLink size={13} /> View All {keysList.length} Keys
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
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Bulk Import License Keys</h3>
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
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>All License Keys</h3>
                <span className="badge badge-primary">{keysList.length} Total</span>
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
              {filteredAllKeys.map((k, idx) => (
                <div
                  key={idx}
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
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--color-muted-foreground)", minWidth: 30 }}>
                      #{idx + 1}
                    </span>
                    <code style={{ fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
                      {copiedIndex === idx ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
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

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--color-border)" }}>
              <button
                type="button"
                onClick={() => setKeysList([])}
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
