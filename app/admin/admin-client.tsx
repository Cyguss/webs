"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2 } from "lucide-react";

export default function AdminClientActions({ payoutId }: { payoutId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleAction(action: "approve" | "reject") {
    if (!confirm(`Are you sure you want to ${action} payout #${payoutId.slice(0, 8)}?`)) return;

    setLoading(true);

    try {
      const res = await fetch("/api/admin/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutId, action }),
      });

      if (!res.ok) throw new Error("Failed to process payout");

      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", gap: 6 }}>
      <button
        onClick={() => handleAction("approve")}
        disabled={loading}
        className="btn btn-primary"
        style={{ padding: "4px 10px", fontSize: 12, background: "#10b981" }}
      >
        {loading ? <Loader2 size={12} className="spin" /> : <><Check size={12} /> Approve</>}
      </button>

      <button
        onClick={() => handleAction("reject")}
        disabled={loading}
        className="btn btn-secondary"
        style={{ padding: "4px 10px", fontSize: 12, color: "#f87171" }}
      >
        <X size={12} /> Reject
      </button>
    </div>
  );
}
