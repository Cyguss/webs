"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/toast-context";

interface DeleteProductButtonProps {
  productId: string;
  productTitle: string;
  shopId?: string;
  variant?: "icon" | "button";
  onSuccess?: () => void;
}

export function DeleteProductButton({
  productId,
  productTitle,
  shopId,
  variant = "icon",
  onSuccess,
}: DeleteProductButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

  async function handleDelete() {
    setLoading(true);
    try {
      const query = shopId
        ? `?id=${encodeURIComponent(productId)}&shopId=${encodeURIComponent(shopId)}`
        : `?id=${encodeURIComponent(productId)}`;

      const res = await fetch(`/api/products${query}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete product");
      }

      toast.success("Product Deleted", `"${productTitle}" was permanently removed.`);
      setOpen(false);

      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } catch (err: any) {
      toast.error("Delete Failed", err.message || "Could not delete product");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn btn-ghost"
          style={{
            padding: "6px 10px",
            color: "var(--color-muted-foreground)",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-muted-foreground)")}
          title="Delete product"
        >
          <Trash2 size={14} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn btn-ghost"
          style={{
            padding: "6px 12px",
            color: "#ef4444",
            background: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.25)",
            fontSize: 13,
            gap: 6,
          }}
          title="Delete product"
        >
          <Trash2 size={14} />
          <span>Delete Product</span>
        </button>
      )}

      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !loading) setOpen(false);
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: 440,
              width: "100%",
              padding: 24,
              border: "1px solid rgba(239, 68, 68, 0.35)",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "rgba(239, 68, 68, 0.15)",
                  color: "#ef4444",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--color-foreground)" }}>
                  Delete Product
                </h3>
                <p style={{ fontSize: 12.5, color: "var(--color-muted-foreground)", margin: "2px 0 0" }}>
                  This action is permanent and cannot be undone.
                </p>
              </div>
            </div>

            <p style={{ fontSize: 13.5, color: "var(--color-foreground)", lineHeight: 1.5, margin: 0 }}>
              Are you sure you want to delete <strong>&quot;{productTitle}&quot;</strong>? All associated unsold license keys, active orders history, and storefront catalog entries will be permanently removed.
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="btn btn-secondary"
                style={{ padding: "8px 16px", fontSize: 13 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="btn btn-danger"
                style={{
                  padding: "8px 18px",
                  fontSize: 13,
                  fontWeight: 700,
                  background: "#ef4444",
                  borderColor: "#ef4444",
                  color: "#fff",
                  gap: 6,
                }}
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                <span>{loading ? "Deleting..." : "Delete Product"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
