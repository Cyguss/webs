"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, Loader2 } from "lucide-react";
import { useToast } from "@/components/toast-context";

export default function SettleButtonClient({ pendingAmount }: { pendingAmount: number }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

  if (pendingAmount <= 0) return null;

  async function handleSettle() {
    setLoading(true);
    try {
      const res = await fetch("/api/earnings/balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear_pending" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Clearance Failed", data.error || "Failed to clear pending funds");
      } else {
        toast.success("Funds Cleared!", data.message || "Pending funds moved to available balance.");
        router.refresh();
      }
    } catch {
      toast.error("Network Error", "Could not complete clearance");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleSettle}
      disabled={loading}
      className="btn btn-secondary"
      style={{
        fontSize: 12,
        padding: "6px 12px",
        gap: 6,
        background: "rgba(245, 158, 11, 0.12)",
        borderColor: "rgba(245, 158, 11, 0.3)",
        color: "#fbbf24",
      }}
      title="Development Helper: Settle pending funds into available balance immediately for withdrawal testing"
    >
      {loading ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
      <span>Settle Pending to Available (Dev Sandbox)</span>
    </button>
  );
}
