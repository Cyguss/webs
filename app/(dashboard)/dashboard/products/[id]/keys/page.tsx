"use client";

import { useState, useEffect, use, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  Search,
  FileText,
  X,
  Loader2,
  Package,
  CheckCircle2,
  Clock,
  Upload,
  Layers,
  AlertTriangle,
  Sparkles,
  Filter,
} from "lucide-react";
import { useToast } from "@/components/toast-context";
import { DURATION_OPTIONS, getKeyDurationDisplay, KeyDurationType } from "@/lib/key-duration";

export default function ProductKeysPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: productId } = use(params);
  const router = useRouter();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);
  const [keys, setKeys] = useState<any[]>([]);

  // Key adding state
  const [keyInput, setKeyInput] = useState("");
  const [addingKey, setAddingKey] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkInput, setBulkInput] = useState("");
  const [selectedDuration, setSelectedDuration] = useState<string>("daily");
  const [selectedCustomDays, setSelectedCustomDays] = useState<number>(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [bulkModalMode, setBulkModalMode] = useState<"single" | "multi">("single");
  const [bulkMultiCategoryInputs, setBulkMultiCategoryInputs] = useState<Record<string, string>>({});

  // Filters
  const [filterTab, setFilterTab] = useState<"all" | "unused" | "used">("all");
  const [activeDurationCategory, setActiveDurationCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Product variants list (if multi-duration enabled)
  const productVariants: any[] = useMemo(() => {
    if (!product?.variants) return [];
    try {
      const parsed = JSON.parse(product.variants);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [product]);

  async function loadData() {
    try {
      const res = await fetch(`/api/products/${productId}/keys`);
      if (!res.ok) throw new Error("Failed to load product keys");
      const data = await res.json();
      setProduct(data.product);
      setKeys(data.keys || []);

      // Auto-select initial duration
      if (data.product?.variants) {
        try {
          const vList = JSON.parse(data.product.variants);
          if (Array.isArray(vList) && vList.length > 0) {
            setSelectedDuration(vList[0].duration || "daily");
            setSelectedCustomDays(vList[0].durationDays || 1);
            setSelectedVariantId(vList[0].id || "");
          }
        } catch {}
      } else if (data.product?.duration) {
        setSelectedDuration(data.product.duration);
        setSelectedCustomDays(data.product.durationDays || 0);
      }
    } catch (err: any) {
      toast.error("Error", err.message || "Failed to load keys");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [productId]);

  // Bulk stats parser
  const bulkStats = useMemo(() => {
    if (!bulkInput.trim()) {
      return { totalLines: 0, validKeys: [], duplicateCount: 0, emptyLines: 0 };
    }
    const lines = bulkInput.split(/[\r\n]+/);
    const validKeys: string[] = [];
    const seen = new Set<string>();
    let duplicateCount = 0;
    let emptyLines = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        emptyLines++;
        continue;
      }
      if (seen.has(trimmed)) {
        duplicateCount++;
      } else {
        seen.add(trimmed);
        validKeys.push(trimmed);
      }
    }

    return {
      totalLines: lines.length,
      validKeys,
      duplicateCount,
      emptyLines,
    };
  }, [bulkInput]);

  // Categorized stock breakdown by duration
  const durationBreakdown = useMemo(() => {
    const map: Record<string, { total: number; available: number; delivered: number; label: string; badgeColor: string }> = {};

    // First populate from configured product variants
    if (productVariants.length > 0) {
      for (const v of productVariants) {
        const dMeta = getKeyDurationDisplay(v.duration, v.durationDays, v.customDurationLabel);
        map[v.duration] = {
          total: 0,
          available: 0,
          delivered: 0,
          label: v.label || dMeta.label,
          badgeColor: dMeta.badgeColor,
        };
      }
    } else if (product?.duration) {
      const dMeta = getKeyDurationDisplay(product.duration, product.durationDays, product.customDurationLabel);
      map[product.duration] = {
        total: 0,
        available: 0,
        delivered: 0,
        label: dMeta.label,
        badgeColor: dMeta.badgeColor,
      };
    }

    // Now tally actual keys
    for (const k of keys) {
      const dur = k.duration || "lifetime";
      if (!map[dur]) {
        const dMeta = getKeyDurationDisplay(dur, k.durationDays, k.customDurationLabel);
        map[dur] = {
          total: 0,
          available: 0,
          delivered: 0,
          label: dMeta.label,
          badgeColor: dMeta.badgeColor,
        };
      }
      map[dur].total++;
      if (k.isUsed) {
        map[dur].delivered++;
      } else {
        map[dur].available++;
      }
    }

    return map;
  }, [keys, product, productVariants]);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setBulkInput((prev) => (prev ? `${prev}\n${content}` : content));
        setShowBulkModal(true);
        toast.info("File Loaded", `Read ${file.name} successfully.`);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  async function handleAddSingleKey() {
    if (!keyInput.trim()) return;
    setAddingKey(true);
    try {
      const split = keyInput
        .split(/[\n,]/)
        .map((k) => k.trim())
        .filter((k) => k.length > 0);

      const res = await fetch(`/api/products/${productId}/keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keys: split,
          duration: selectedDuration || product?.duration || "lifetime",
          durationDays: selectedCustomDays || product?.durationDays || 0,
          variantId: selectedVariantId || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to add keys");
      toast.success("Success", `Added ${split.length} license key(s) categorized as ${selectedDuration.toUpperCase()}.`);
      setKeyInput("");
      await loadData();
    } catch (err: any) {
      toast.error("Failed to add key", err.message);
    } finally {
      setAddingKey(false);
    }
  }

  async function handleAddBulkKeys() {
    if (bulkStats.validKeys.length === 0) {
      toast.error("Empty Input", "Please enter at least one valid license key.");
      return;
    }

    setAddingKey(true);
    try {
      const res = await fetch(`/api/products/${productId}/keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keys: bulkStats.validKeys,
          duration: selectedDuration || product?.duration || "lifetime",
          durationDays: selectedCustomDays || product?.durationDays || 0,
          variantId: selectedVariantId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to bulk add keys");

      toast.success(
        "Bulk Import Complete",
        `Successfully loaded ${data.count} keys into category [${selectedDuration.toUpperCase()}].${
          bulkStats.duplicateCount > 0 ? ` (${bulkStats.duplicateCount} duplicate lines removed)` : ""
        }`
      );
      setBulkInput("");
      setShowBulkModal(false);
      await loadData();
    } catch (err: any) {
      toast.error("Failed to bulk add", err.message);
    } finally {
      setAddingKey(false);
    }
  }

  async function handleAddMultiCategoryBulkKeys() {
    const entries = Object.entries(bulkMultiCategoryInputs).filter(([_, text]) => text && text.trim().length > 0);
    if (entries.length === 0) {
      toast.error("Empty Inputs", "Please paste keys into at least one duration category.");
      return;
    }

    setAddingKey(true);
    try {
      let totalImported = 0;
      for (const [varId, rawText] of entries) {
        const splitKeys = rawText
          .split(/[\r\n,]+/)
          .map((k) => k.trim())
          .filter((k) => k.length > 0);

        if (splitKeys.length === 0) continue;

        const matchV = productVariants.find((v) => v.id === varId);
        const dur = matchV?.duration || product?.duration || "lifetime";
        const days = matchV?.durationDays ?? (product?.durationDays || 0);

        const res = await fetch(`/api/products/${productId}/keys`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            keys: splitKeys,
            duration: dur,
            durationDays: days,
            variantId: matchV?.id || null,
          }),
        });

        if (res.ok) {
          const d = await res.json();
          totalImported += d.count || splitKeys.length;
        }
      }

      toast.success("Multi-Category Import Complete", `Successfully imported ${totalImported} keys across categories.`);
      setBulkMultiCategoryInputs({});
      setShowBulkModal(false);
      await loadData();
    } catch (err: any) {
      toast.error("Multi-Category import failed", err.message);
    } finally {
      setAddingKey(false);
    }
  }

  async function handleDeleteKey(keyId: string) {
    if (!confirm("Are you sure you want to remove this license key?")) return;
    setDeletingId(keyId);
    try {
      const res = await fetch(`/api/products/${productId}/keys?keyId=${keyId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete key");
      setKeys((prev) => prev.filter((k) => k.id !== keyId));
      toast.success("Deleted", "License key removed.");
    } catch (err: any) {
      toast.error("Delete failed", err.message);
    } finally {
      setDeletingId(null);
    }
  }

  function copyKey(value: string, id: string) {
    navigator.clipboard.writeText(value);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 1500);
  }

  if (loading) {
    return (
      <div
        className="page-fly-in"
        style={{ maxWidth: 1080, margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: 24 }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="skeleton" style={{ width: 140, height: 18 }} />
          <div className="skeleton" style={{ width: 300, height: 32, borderRadius: 8 }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          <div className="card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="skeleton" style={{ width: 80, height: 14 }} />
            <div className="skeleton" style={{ width: 50, height: 28, borderRadius: 6 }} />
          </div>
          <div className="card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="skeleton" style={{ width: 80, height: 14 }} />
            <div className="skeleton" style={{ width: 50, height: 28, borderRadius: 6 }} />
          </div>
        </div>
      </div>
    );
  }

  const unusedCount = keys.filter((k) => !k.isUsed).length;
  const usedCount = keys.filter((k) => k.isUsed).length;

  // Filtered keys by status, duration category, and search query
  const filteredKeys = keys.filter((k) => {
    if (filterTab === "unused" && k.isUsed) return false;
    if (filterTab === "used" && !k.isUsed) return false;
    if (activeDurationCategory !== "all" && (k.duration || "lifetime") !== activeDurationCategory) return false;
    if (searchQuery.trim() && !k.keyValue.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="page-fly-in" style={{ maxWidth: 1080, margin: "0 auto", width: "100%" }}>
      {/* Hidden file input for bulk .txt import */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".txt,.csv,.text"
        style={{ display: "none" }}
        onChange={handleFileUpload}
      />

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Link
          href={`/dashboard/products/${productId}/edit`}
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
          <ArrowLeft size={16} /> Back to product editor
        </Link>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "rgba(55, 44, 102, 0.4)",
                  border: "1px solid rgba(139, 92, 246, 0.45)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#c4b5fd",
                }}
              >
                <Key size={18} />
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--color-foreground)", letterSpacing: "-0.02em", margin: 0 }}>
                {product?.title || "Product"} — Key Vault & Inventory
              </h1>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  fontFamily: "var(--font-mono, monospace)",
                  padding: "3px 8px",
                  borderRadius: 6,
                  background: "rgba(55, 44, 102, 0.4)",
                  border: "1px solid rgba(139, 92, 246, 0.45)",
                  color: "#c4b5fd",
                }}
              >
                ${product?.price || "0.00"} USD
              </span>
              {productVariants.length > 0 ? (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    padding: "3px 8px",
                    borderRadius: 4,
                    background: "rgba(55, 44, 102, 0.35)",
                    border: "1px solid rgba(139, 92, 246, 0.45)",
                    color: "#c4b5fd",
                    fontFamily: "var(--font-mono, monospace)",
                  }}
                >
                  {productVariants.length} DURATION TIERS
                </span>
              ) : (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    padding: "3px 8px",
                    borderRadius: 4,
                    background: "rgba(34, 197, 94, 0.15)",
                    border: "1px solid rgba(34, 197, 94, 0.3)",
                    color: "#34d399",
                    fontFamily: "var(--font-mono, monospace)",
                  }}
                >
                  SINGLE DURATION
                </span>
              )}
            </div>
            <p style={{ color: "var(--color-muted-foreground)", fontSize: 13, marginTop: 6 }}>
              License keys are categorized by duration for precision automated delivery.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-secondary"
              style={{ fontSize: 13, gap: 6 }}
              title="Upload text file with keys"
            >
              <Upload size={15} /> Upload .txt File
            </button>
            <button
              type="button"
              onClick={() => setShowBulkModal(true)}
              className="btn btn-primary"
              style={{ fontSize: 13, gap: 6 }}
            >
              <FileText size={15} /> Bulk Importer (500+ Keys)
            </button>
          </div>
        </div>
      </div>

      {/* Categorized Duration Stock Breakdown Cards */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-muted-foreground)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
          <Layers size={14} color="#c4b5fd" /> Duration Category Breakdown & Live Stock:
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          {/* All Durations Card */}
          <div
            onClick={() => setActiveDurationCategory("all")}
            className="interactive-pill"
            style={{
              padding: "14px 16px",
              borderRadius: 10,
              background: activeDurationCategory === "all" ? "linear-gradient(180deg, rgba(55, 44, 102, 0.4) 0%, rgba(30, 24, 60, 0.25) 100%)" : "var(--color-surface)",
              border: activeDurationCategory === "all" ? "1px solid rgba(139, 92, 246, 0.65)" : "1px solid var(--color-border)",
              cursor: "pointer",
              transition: "all 0.18s ease",
              boxShadow: activeDurationCategory === "all" ? "0 0 14px rgba(55, 44, 102, 0.35)" : "none",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: activeDurationCategory === "all" ? "#fff" : "var(--color-foreground)" }}>
                All Categories
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: "rgba(255,255,255,0.06)", color: "var(--color-muted-foreground)", fontFamily: "var(--font-mono, monospace)" }}>
                TOTAL
              </span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "var(--font-mono, monospace)", color: unusedCount > 0 ? "#34d399" : "#f87171", marginTop: 4 }}>
              {unusedCount} <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-muted-foreground)" }}>available</span>
            </div>
            <div style={{ fontSize: 11, color: "var(--color-muted-foreground)", marginTop: 2, fontFamily: "var(--font-mono, monospace)" }}>
              {keys.length} total • {usedCount} delivered
            </div>
          </div>

          {/* Individual Duration Categories */}
          {Object.entries(durationBreakdown).map(([durKey, data]) => {
            const isSelected = activeDurationCategory === durKey;
            return (
              <div
                key={durKey}
                onClick={() => setActiveDurationCategory(durKey)}
                className="interactive-pill"
                style={{
                  padding: "14px 16px",
                  borderRadius: 10,
                  background: isSelected ? "linear-gradient(180deg, rgba(55, 44, 102, 0.4) 0%, rgba(30, 24, 60, 0.25) 100%)" : "var(--color-surface)",
                  border: isSelected ? "1px solid rgba(139, 92, 246, 0.65)" : "1px solid var(--color-border)",
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                  transform: isSelected ? "translateY(-1px)" : "none",
                  boxShadow: isSelected ? "0 0 14px rgba(55, 44, 102, 0.35)" : "none",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: isSelected ? "#fff" : "var(--color-foreground)" }}>
                    {data.label}
                  </span>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      padding: "1px 5px",
                      borderRadius: 3,
                      background: isSelected ? "rgba(55, 44, 102, 0.8)" : "rgba(255, 255, 255, 0.06)",
                      color: isSelected ? "#c4b5fd" : "var(--color-muted-foreground)",
                      fontFamily: "var(--font-mono, monospace)",
                      textTransform: "uppercase",
                    }}
                  >
                    {durKey}
                  </span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "var(--font-mono, monospace)", color: data.available > 0 ? "#34d399" : "#f87171", marginTop: 4 }}>
                  {data.available} <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-muted-foreground)" }}>avail</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--color-muted-foreground)", marginTop: 2, fontFamily: "var(--font-mono, monospace)" }}>
                  {data.total} loaded • {data.delivered} delivered
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Add Key with Target Duration Category */}
      <div className="card interactive-card" style={{ padding: 20, marginBottom: 24, border: "1px solid var(--color-border)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 6, color: "var(--color-foreground)" }}>
            <Plus size={16} color="#c4b5fd" /> Quick Add Key to Duration Category
          </h3>

          {/* Duration category target selector */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-muted-foreground)" }}>
              Assign to Duration:
            </span>
            <select
              value={selectedDuration}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedDuration(val);
                const matchV = productVariants.find((v) => v.duration === val);
                if (matchV) {
                  setSelectedCustomDays(matchV.durationDays || 0);
                  setSelectedVariantId(matchV.id || "");
                } else {
                  const opt = DURATION_OPTIONS.find((o) => o.id === val);
                  setSelectedCustomDays(opt?.days || 0);
                  setSelectedVariantId("");
                }
              }}
              className="input"
              style={{ fontSize: 12, padding: "4px 10px", height: 34, width: "auto", fontWeight: 700 }}
            >
              {productVariants.length > 0
                ? productVariants.map((v) => (
                    <option key={v.id || v.duration} value={v.duration}>
                      {v.label || v.duration.toUpperCase()} ({v.duration.toUpperCase()})
                    </option>
                  ))
                : DURATION_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Key size={16} style={{ position: "absolute", left: 12, top: 12, color: "var(--color-muted-foreground)" }} />
            <input
              type="text"
              className="input"
              placeholder={`Enter ${selectedDuration.toUpperCase()} license key (e.g. ABCD-EFGH-1234-5678) and press Enter`}
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddSingleKey();
                }
              }}
              style={{ paddingLeft: 38, fontFamily: "var(--font-mono, monospace)", fontSize: 13 }}
            />
          </div>
          <button
            type="button"
            onClick={handleAddSingleKey}
            disabled={addingKey || !keyInput.trim()}
            className="btn btn-primary"
            style={{ gap: 6, flexShrink: 0 }}
          >
            {addingKey ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            <span>Add to {selectedDuration.toUpperCase()}</span>
          </button>
        </div>
      </div>

      {/* Keys List with Filter Tabs & Search */}
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16, padding: 20, border: "1px solid var(--color-border)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          {/* Status Tabs */}
          <div style={{ display: "flex", background: "var(--color-surface-2)", padding: 3, borderRadius: 8, gap: 4, border: "1px solid var(--color-border)" }}>
            <button
              type="button"
              onClick={() => setFilterTab("all")}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "none",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                background: filterTab === "all" ? "var(--color-surface)" : "transparent",
                color: filterTab === "all" ? "var(--color-foreground)" : "var(--color-muted-foreground)",
              }}
            >
              All Statuses ({keys.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("unused")}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "none",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                background: filterTab === "unused" ? "var(--color-surface)" : "transparent",
                color: filterTab === "unused" ? "#34d399" : "var(--color-muted-foreground)",
              }}
            >
              Available ({unusedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("used")}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "none",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                background: filterTab === "used" ? "var(--color-surface)" : "transparent",
                color: filterTab === "used" ? "var(--color-foreground)" : "var(--color-muted-foreground)",
              }}
            >
              Delivered ({usedCount})
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Search query */}
            <div style={{ position: "relative" }}>
              <Search
                size={14}
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--color-muted-foreground)",
                }}
              />
              <input
                type="text"
                placeholder="Search key codes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input"
                style={{ paddingLeft: 30, height: 34, fontSize: 12, width: 220, fontFamily: "var(--font-mono, monospace)" }}
              />
            </div>
          </div>
        </div>

        {/* Categorized Keys Table */}
        {filteredKeys.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "var(--color-muted-foreground)" }}>
            <Key size={32} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
            <div style={{ fontWeight: 600, fontSize: 14 }}>No license keys found in this view</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>
              {keys.length === 0
                ? "Add keys individually or use the Bulk Importer above to load your inventory."
                : "Try selecting 'All Categories' or clearing the search filter."}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filteredKeys.map((k) => {
              const dMeta = getKeyDurationDisplay(k.duration, k.durationDays, k.customDurationLabel);
              return (
                <div
                  key={k.id}
                  className="interactive-pill"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    borderRadius: 8,
                    background: "var(--color-surface)",
                    border: k.isUsed ? "1px solid var(--color-border)" : "1px solid var(--color-border)",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 260 }}>
                    {/* Duration category badge */}
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        fontFamily: "var(--font-mono, monospace)",
                        padding: "3px 8px",
                        borderRadius: 4,
                        background: "rgba(55, 44, 102, 0.4)",
                        border: "1px solid rgba(139, 92, 246, 0.45)",
                        color: "#c4b5fd",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {dMeta.shortLabel}
                    </span>

                    <span
                      style={{
                        fontFamily: "var(--font-mono, monospace)",
                        fontSize: 13,
                        fontWeight: 700,
                        color: k.isUsed ? "var(--color-muted-foreground)" : "var(--color-foreground)",
                        textDecoration: k.isUsed ? "line-through" : "none",
                        wordBreak: "break-all",
                      }}
                    >
                      {k.keyValue}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {k.isUsed ? (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 4,
                          background: "rgba(255,255,255,0.06)",
                          color: "var(--color-muted-foreground)",
                          fontFamily: "var(--font-mono, monospace)",
                        }}
                      >
                        Delivered
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 4,
                          background: "rgba(34, 197, 94, 0.15)",
                          border: "1px solid rgba(34, 197, 94, 0.3)",
                          color: "#34d399",
                          fontFamily: "var(--font-mono, monospace)",
                        }}
                      >
                        Available
                      </span>
                    )}

                    <span style={{ fontSize: 11, color: "var(--color-muted-foreground)", fontFamily: "var(--font-mono, monospace)" }}>
                      {new Date(k.createdAt).toLocaleDateString()}
                    </span>

                    <button
                      type="button"
                      onClick={() => copyKey(k.keyValue, k.id)}
                      className="btn btn-ghost"
                      style={{ padding: "6px 8px" }}
                      title="Copy Key"
                    >
                      {copiedKeyId === k.id ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteKey(k.id)}
                      disabled={deletingId === k.id}
                      className="btn btn-ghost"
                      style={{ padding: "6px 8px", color: "var(--color-danger)" }}
                      title="Delete Key"
                    >
                      {deletingId === k.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bulk Key Importer Modal */}
      {showBulkModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 20,
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: 640,
              width: "100%",
              padding: 26,
              border: "1px solid rgba(139, 92, 246, 0.35)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.7)",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: "rgba(55, 44, 102, 0.4)",
                    border: "1px solid rgba(139, 92, 246, 0.45)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#c4b5fd",
                  }}
                >
                  <FileText size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: "var(--color-foreground)" }}>
                    Bulk License Key Importer (500+ Keys)
                  </h3>
                  <p style={{ fontSize: 12, color: "var(--color-muted-foreground)", margin: "2px 0 0" }}>
                    Paste a list of keys or drag & drop a .txt/.csv file. Whitespace and duplicates are automatically cleaned.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="btn btn-ghost"
                style={{ padding: 6, borderRadius: "50%" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Mode selector if product has multiple duration variants */}
            {productVariants.length > 0 && (
              <div style={{ display: "flex", gap: 8 }}>
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
                  Multi-Category Batch Paste ({productVariants.length} Tiers)
                </button>
              </div>
            )}

            {/* Single Category Paste */}
            {(!productVariants.length || bulkModalMode === "single") && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Target Duration Category Selector */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6, background: "var(--color-surface)", padding: "12px 14px", borderRadius: 8, border: "1px solid var(--color-border)" }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "var(--color-muted-foreground)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Target Duration Category / Variant:
                  </label>
                  <select
                    value={selectedDuration}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedDuration(val);
                      const matchV = productVariants.find((v) => v.duration === val || v.id === val);
                      if (matchV) {
                        setSelectedCustomDays(matchV.durationDays || 0);
                        setSelectedVariantId(matchV.id || "");
                      } else {
                        const opt = DURATION_OPTIONS.find((o) => o.id === val);
                        setSelectedCustomDays(opt?.days || 0);
                        setSelectedVariantId("");
                      }
                    }}
                    className="input"
                    style={{ fontSize: 13, height: 38, fontWeight: 700 }}
                  >
                    {productVariants.length > 0
                      ? productVariants.map((v) => (
                          <option key={v.id || v.duration} value={v.duration}>
                            {v.label || v.duration.toUpperCase()} ({v.duration.toUpperCase()} Access Tier)
                          </option>
                        ))
                      : DURATION_OPTIONS.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        ))}
                  </select>
                  <span style={{ fontSize: 11, color: "var(--color-muted-foreground)" }}>
                    All keys pasted below will be assigned to this specific duration tier.
                  </span>
                </div>

                {/* Keys Textarea */}
                <div>
                  <textarea
                    rows={8}
                    value={bulkInput}
                    onChange={(e) => setBulkInput(e.target.value)}
                    placeholder="Paste keys here (one key per line)...&#10;KEY-AAA-111&#10;KEY-BBB-222&#10;KEY-CCC-333"
                    className="input"
                    style={{
                      width: "100%",
                      fontFamily: "var(--font-mono, monospace)",
                      fontSize: 12,
                      resize: "vertical",
                      minHeight: 160,
                    }}
                  />
                </div>

                {/* Live Stats */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, background: "var(--color-surface)", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--color-border)", fontFamily: "var(--font-mono, monospace)" }}>
                  <div style={{ display: "flex", gap: 14 }}>
                    <span>
                      Valid Unique: <strong style={{ color: "#34d399" }}>{bulkStats.validKeys.length}</strong>
                    </span>
                    {bulkStats.duplicateCount > 0 && (
                      <span>
                        Duplicates Filtered: <strong style={{ color: "#f59e0b" }}>{bulkStats.duplicateCount}</strong>
                      </span>
                    )}
                    {bulkStats.emptyLines > 0 && (
                      <span style={{ color: "var(--color-muted-foreground)" }}>
                        Empty lines: {bulkStats.emptyLines}
                      </span>
                    )}
                  </div>

                  <span style={{ color: "var(--color-muted-foreground)" }}>
                    Total lines: {bulkStats.totalLines}
                  </span>
                </div>

                {/* Modal Actions */}
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
                    onClick={handleAddBulkKeys}
                    disabled={addingKey || bulkStats.validKeys.length === 0}
                    className="btn btn-primary"
                    style={{ gap: 6, fontWeight: 700 }}
                  >
                    {addingKey ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                    <span>Import {bulkStats.validKeys.length} Keys to {selectedDuration.toUpperCase()}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Multi-Category Batch Paste */}
            {productVariants.length > 0 && bulkModalMode === "multi" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 360, overflowY: "auto", paddingRight: 4 }}>
                  {productVariants.map((v) => {
                    const dMeta = getKeyDurationDisplay(v.duration, v.durationDays, v.customDurationLabel);
                    const currentDraft = bulkMultiCategoryInputs[v.id] || "";
                    const countInDraft = currentDraft.split(/[\r\n,]+/).filter(Boolean).length;

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
                            {countInDraft} keys in draft
                          </span>
                        </div>
                        <textarea
                          className="input"
                          rows={3}
                          placeholder={`Paste serial keys for ${v.label} here (one per line)...`}
                          value={currentDraft}
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

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 8, borderTop: "1px solid var(--color-border)" }}>
                  <button
                    type="button"
                    onClick={() => setShowBulkModal(false)}
                    className="btn btn-ghost"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddMultiCategoryBulkKeys}
                    disabled={addingKey}
                    className="btn btn-primary"
                    style={{ gap: 6, fontWeight: 700 }}
                  >
                    {addingKey ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                    <span>Import All Categorized Keys</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
