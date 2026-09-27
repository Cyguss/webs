"use client";

import { useState } from "react";
import { Store, ExternalLink, Save, Loader2, Edit3, Check, X } from "lucide-react";
import { useToast } from "@/components/toast-context";

interface Shop {
  id: string;
  name: string;
  slug: string;
  isAccepted: boolean;
}

export function StoreSettingsClient({ shops }: { shops: Shop[] }) {
  const toast = useToast();
  const [shopList, setShopList] = useState<Shop[]>(shops);
  const [editingShopId, setEditingShopId] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [slugInput, setSlugInput] = useState("");
  const [saving, setSaving] = useState(false);

  function startEdit(shop: Shop) {
    setEditingShopId(shop.id);
    setNameInput(shop.name);
    setSlugInput(shop.slug);
  }

  function cancelEdit() {
    setEditingShopId(null);
    setNameInput("");
    setSlugInput("");
  }

  async function handleSave(shopId: string) {
    if (!nameInput.trim() || !slugInput.trim()) {
      toast.error("Name and slug cannot be empty");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/storefront", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId,
          name: nameInput.trim(),
          slug: slugInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, ""),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to update store");
        return;
      }

      toast.success("Store details updated!");
      setShopList((prev) =>
        prev.map((s) =>
          s.id === shopId
            ? { ...s, name: data.name || nameInput.trim(), slug: data.slug || slugInput.trim() }
            : s
        )
      );
      setEditingShopId(null);
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Store size={16} color="var(--color-muted-foreground)" />
        </div>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--color-foreground)" }}>
          Store Settings
        </h3>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {shopList.map((shop) => (
          <div
            key={shop.id}
            style={{
              padding: 16,
              borderRadius: 12,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid var(--color-border)",
            }}
          >
            {editingShopId === shop.id ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label className="label">Store Name</label>
                    <input
                      type="text"
                      className="input"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="My Awesome Store"
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label className="label">Store Slug (URL)</label>
                    <div style={{ position: "relative" }}>
                      <span
                        style={{
                          position: "absolute",
                          left: 12,
                          top: "50%",
                          transform: "translateY(-50%)",
                          fontSize: 13,
                          color: "var(--color-muted-foreground)",
                          pointerEvents: "none",
                        }}
                      >
                        /
                      </span>
                      <input
                        type="text"
                        className="input"
                        value={slugInput}
                        onChange={(e) => setSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                        placeholder="my-store"
                        style={{ paddingLeft: 22, fontFamily: "monospace" }}
                      />
                    </div>
                    <span style={{ fontSize: 11, color: "var(--color-muted-foreground)" }}>
                      Changing the slug will break existing links
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => handleSave(shop.id)}
                    disabled={saving}
                    className="btn btn-primary"
                    style={{ padding: "8px 16px", fontSize: 13 }}
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Save Changes
                  </button>
                  <button onClick={cancelEdit} className="btn btn-ghost" style={{ padding: "8px 12px", fontSize: 13 }}>
                    <X size={14} /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                <div style={{ display: "flex", flex: 1, gap: 24 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--color-muted-foreground)", marginBottom: 2, textTransform: "uppercase", fontWeight: 600 }}>Name</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--color-foreground)" }}>{shop.name}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--color-muted-foreground)", marginBottom: 2, textTransform: "uppercase", fontWeight: 600 }}>Slug</div>
                    <div style={{ fontSize: 14, fontFamily: "monospace", color: "var(--color-foreground)" }}>/{shop.slug}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--color-muted-foreground)", marginBottom: 2, textTransform: "uppercase", fontWeight: 600 }}>Status</div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 4,
                        background: shop.isAccepted ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)",
                        color: shop.isAccepted ? "#10b981" : "#f59e0b",
                      }}
                    >
                      {shop.isAccepted ? "Live" : "Pending"}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => startEdit(shop)}
                    className="btn btn-secondary"
                    style={{ padding: "7px 14px", fontSize: 13 }}
                  >
                    <Edit3 size={14} /> Edit
                  </button>
                  <a
                    href={`/${shop.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-ghost"
                    style={{ padding: "7px 12px" }}
                    title="View store"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
