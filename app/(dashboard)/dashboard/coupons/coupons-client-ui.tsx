"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tag, Plus, Trash2, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/toast-context";

export default function CouponsClientUI({ initialCoupons, shopId }: { initialCoupons: any[]; shopId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "amount">("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [maxUses, setMaxUses] = useState("");

  async function handleCreateCoupon(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!code.trim() || !discountValue || parseFloat(discountValue) <= 0) {
      toast.error("Invalid Input", "Please fill in a valid coupon code and discount value.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          discountPercent: discountType === "percent" ? parseInt(discountValue) : null,
          discountAmount: discountType === "amount" ? parseFloat(discountValue) : null,
          maxUses: maxUses ? parseInt(maxUses) : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create coupon");

      toast.success("Coupon Created", `Promo code ${code.toUpperCase()} is now live.`);
      setCode("");
      setDiscountValue("");
      setMaxUses("");
      router.refresh();
    } catch (err: any) {
      toast.error("Creation Failed", err.message || "Could not create coupon");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/coupons?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete coupon");
      toast.success("Coupon Deleted", "The promo code has been removed.");
      router.refresh();
    } catch (err: any) {
      toast.error("Delete Failed", err.message || "Failed to delete coupon");
    }
  }

  return (
    <div className="page-fly-in" style={{ maxWidth: 1240, margin: "0 auto", width: "100%" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--color-foreground)", letterSpacing: "-0.02em" }}>
          Discount Coupons & Promo Codes
        </h1>
        <p style={{ color: "var(--color-muted-foreground)", fontSize: 14, marginTop: 4 }}>
          Create promotional discount codes for your customers to use during checkout.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 32 }}>
        {/* Create Coupon Form */}
        <div className="card" style={{ height: "fit-content" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Tag size={18} color="var(--color-foreground)" />
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--color-foreground)" }}>
              Create New Promo Code
            </h3>
          </div>

          <form onSubmit={handleCreateCoupon} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label className="label">Coupon Code *</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. VIP20 or SUMMER10"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                style={{ textTransform: "uppercase", fontFamily: "monospace", letterSpacing: "0.05em" }}
                required
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label className="label">Discount Type</label>
                <select
                  className="input"
                  value={discountType}
                  onChange={(e: any) => setDiscountType(e.target.value)}
                >
                  <option value="percent">Percentage (%)</option>
                  <option value="amount">Fixed Amount ($)</option>
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label className="label">Value *</label>
                <input
                  type="number"
                  step="any"
                  className="input"
                  placeholder={discountType === "percent" ? "20" : "5.00"}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label className="label">Max Usage Limit (Optional)</label>
              <input
                type="number"
                className="input"
                placeholder="e.g. 100 (Leave blank for unlimited)"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <><Sparkles size={16} /> Create Code</>}
            </button>
          </form>
        </div>

        {/* Coupons List */}
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: "var(--color-foreground)" }}>
            Active Promo Codes ({initialCoupons.length})
          </h3>

          {initialCoupons.length === 0 ? (
            <div className="card" style={{ padding: 32, textAlign: "center", color: "var(--color-muted-foreground)", fontSize: 14 }}>
              No promo codes created yet. Create one on the left to offer special discounts to your buyers!
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 14 }}>
                <thead>
                  <tr style={{ background: "var(--color-surface-hover)", borderBottom: "1px solid var(--color-border)" }}>
                    <th style={{ padding: "12px 18px", fontWeight: 600, color: "var(--color-muted-foreground)" }}>Code</th>
                    <th style={{ padding: "12px 18px", fontWeight: 600, color: "var(--color-muted-foreground)" }}>Discount</th>
                    <th style={{ padding: "12px 18px", fontWeight: 600, color: "var(--color-muted-foreground)" }}>Used</th>
                    <th style={{ padding: "12px 18px", fontWeight: 600, color: "var(--color-muted-foreground)" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {initialCoupons.map((c) => (
                    <tr key={c.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <td style={{ padding: "14px 18px" }}>
                        <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--badge-neutral-text)", background: "var(--badge-neutral-bg)", border: "1px solid var(--badge-neutral-border)", padding: "4px 8px", borderRadius: 6 }}>
                          {c.code}
                        </span>
                      </td>

                      <td style={{ padding: "14px 18px", fontWeight: 700, color: "#10b981" }}>
                        {c.discountPercent ? `${c.discountPercent}% OFF` : `$${parseFloat(c.discountAmount).toFixed(2)} OFF`}
                      </td>

                      <td style={{ padding: "14px 18px", color: "var(--color-muted-foreground)", fontSize: 13 }}>
                        {c.usedCount} {c.maxUses ? `/ ${c.maxUses}` : "uses"}
                      </td>

                      <td style={{ padding: "14px 18px" }}>
                        <button
                          onClick={() => handleDelete(c.id)}
                          style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", padding: 4 }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
