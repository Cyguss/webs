"use client";

import { useState, useEffect, use } from "react";
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
  ShoppingCart,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useToast } from "@/components/toast-context";

export default function ProductKeysPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: productId } = use(params);
  const router = useRouter();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);
  const [keys, setKeys] = useState<any[]>([]);

  // Key adding state
  const [keyInput, setKeyInput] = useState("");
  const [addingKey, setAddingKey] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkInput, setBulkInput] = useState("");

  // Filters
  const [filterTab, setFilterTab] = useState<"all" | "unused" | "used">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadData() {
    try {
      const res = await fetch(`/api/products/${productId}/keys`);
      if (!res.ok) throw new Error("Failed to load product keys");
      const data = await res.json();
      setProduct(data.product);
      setKeys(data.keys || []);
    } catch (err: any) {
      toast.error("Error", err.message || "Failed to load keys");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [productId]);

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
        body: JSON.stringify({ keys: split }),
      });

      if (!res.ok) throw new Error("Failed to add keys");
      toast.success("Success", `Added ${split.length} license key(s) to inventory.`);
      setKeyInput("");
      await loadData();
    } catch (err: any) {
      toast.error("Failed to add key", err.message);
    } finally {
      setAddingKey(false);
    }
  }

  async function handleAddBulkKeys() {
    if (!bulkInput.trim()) return;
    setAddingKey(true);
    try {
      const split = bulkInput
        .split("\n")
        .map((k) => k.trim())
        .filter((k) => k.length > 0);

      const res = await fetch(`/api/products/${productId}/keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keys: split }),
      });

      if (!res.ok) throw new Error("Failed to bulk add keys");
      toast.success("Bulk Imported", `Added ${split.length} license keys.`);
      setBulkInput("");
      setShowBulkModal(false);
      await loadData();
    } catch (err: any) {
      toast.error("Failed to bulk add", err.message);
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
        style={{ maxWidth: 1000, margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: 24 }}
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
        <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="skeleton" style={{ width: "100%", height: 42, borderRadius: 8 }} />
          <div className="skeleton" style={{ width: "100%", height: 180, borderRadius: 8 }} />
        </div>
      </div>
    );
  }

  const unusedCount = keys.filter((k) => !k.isUsed).length;
  const usedCount = keys.filter((k) => k.isUsed).length;

  const filteredKeys = keys.filter((k) => {
    if (filterTab === "unused" && k.isUsed) return false;
    if (filterTab === "used" && !k.isUsed) return false;
    if (searchQuery.trim() && !k.keyValue.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="page-fly-in" style={{ maxWidth: 1000, margin: "0 auto", width: "100%" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
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
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--color-foreground)", letterSpacing: "-0.02em", margin: 0 }}>
                {product?.title || "Product"} — Keys Inventory
              </h1>
              <span className="badge badge-primary">
                ${product?.price || "0.00"} USD
              </span>
            </div>
            <p style={{ color: "var(--color-muted-foreground)", fontSize: 14, marginTop: 4 }}>
              Manage active license codes for instant automated buyer fulfillment.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowBulkModal(true)}
            className="btn btn-secondary"
            style={{ fontSize: 13, gap: 6 }}
          >
            <FileText size={15} /> Bulk Import Keys
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 18 }}>
          <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "var(--color-muted-foreground)" }}>
            Available Stock
          </span>
          <div style={{ fontSize: 26, fontWeight: 800, color: unusedCount > 0 ? "#22c55e" : "#ef4444", marginTop: 4 }}>
            {unusedCount}
          </div>
          <span style={{ fontSize: 12, color: "var(--color-muted-foreground)" }}>Ready for instant delivery</span>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "var(--color-muted-foreground)" }}>
            Delivered to Buyers
          </span>
          <div style={{ fontSize: 26, fontWeight: 800, color: "var(--color-foreground)", marginTop: 4 }}>
            {usedCount}
          </div>
          <span style={{ fontSize: 12, color: "var(--color-muted-foreground)" }}>Completed fulfillments</span>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "var(--color-muted-foreground)" }}>
            Total Keys Loaded
          </span>
          <div style={{ fontSize: 26, fontWeight: 800, color: "var(--color-foreground)", marginTop: 4 }}>
            {keys.length}
          </div>
          <span style={{ fontSize: 12, color: "var(--color-muted-foreground)" }}>Lifetime inventory</span>
        </div>
      </div>

      {/* Add Key Input */}
      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px 0" }}>Add License Keys</h3>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Key size={16} style={{ position: "absolute", left: 12, top: 12, color: "var(--color-muted-foreground)" }} />
            <input
              type="text"
              className="input"
              placeholder="Enter license key (e.g. ABCD-EFGH-1234-5678) and press Add"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddSingleKey();
                }
              }}
              style={{ paddingLeft: 38, fontFamily: "monospace", fontSize: 13 }}
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
            <span>Add Key</span>
          </button>
        </div>
      </div>

      {/* Keys List with Filter Tabs */}
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          {/* Tabs */}
          <div style={{ display: "flex", background: "var(--color-surface-2)", padding: 3, borderRadius: 8, gap: 4 }}>
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
              All ({keys.length})
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
                color: filterTab === "unused" ? "var(--color-foreground)" : "var(--color-muted-foreground)",
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

          {/* Search Filter */}
          <div style={{ position: "relative", width: 240 }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: 11, color: "var(--color-muted-foreground)" }} />
            <input
              type="text"
              placeholder="Search keys..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input"
              style={{ paddingLeft: 32, fontSize: 12, height: 34 }}
            />
          </div>
        </div>

        {/* List */}
        {filteredKeys.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--color-muted-foreground)", fontSize: 13 }}>
            No keys found matching the current filter.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {filteredKeys.map((k, idx) => (
              <div
                key={k.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  fontSize: 13,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, overflow: "hidden" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--color-muted-foreground)", minWidth: 32 }}>
                    #{idx + 1}
                  </span>
                  <code style={{ fontFamily: "monospace", fontWeight: 600, color: "var(--color-foreground)" }}>
                    {k.keyValue}
                  </code>
                  <span className={`badge ${k.isUsed ? "badge-neutral" : "badge-success"}`} style={{ fontSize: 10 }}>
                    {k.isUsed ? "Delivered" : "Available"}
                  </span>
                  {k.orderId && (
                    <span style={{ fontSize: 11, color: "var(--color-muted-foreground)" }}>
                      Order: #{k.orderId.slice(0, 8)}
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => copyKey(k.keyValue, k.id)}
                    className="btn btn-ghost"
                    style={{ padding: "4px 8px" }}
                    title="Copy key"
                  >
                    {copiedKeyId === k.id ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
                  </button>
                  {!k.isUsed && (
                    <button
                      type="button"
                      onClick={() => handleDeleteKey(k.id)}
                      disabled={deletingId === k.id}
                      className="btn btn-ghost"
                      style={{ padding: "4px 8px", color: "var(--color-danger)" }}
                      title="Remove key"
                    >
                      {deletingId === k.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bulk Import Modal */}
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
                onClick={handleAddBulkKeys}
                disabled={addingKey || !bulkInput.trim()}
                className="btn btn-primary"
              >
                {addingKey ? "Importing..." : "Import Keys"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
