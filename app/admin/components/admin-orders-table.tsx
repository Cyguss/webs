"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/components/toast-context";

interface AdminOrdersTableProps {
  orders: any[];
}

export function AdminOrdersTable({ orders }: AdminOrdersTableProps) {
  const toast = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function copyOrderId(id: string) {
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success("Order ID copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="card" style={{ padding: 22 }}>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>Global Orders Ledger</h2>
        <p style={{ fontSize: 12, color: "var(--color-muted-foreground)", margin: "3px 0 0" }}>
          Every completed customer checkout across all merchant storefronts.
        </p>
      </div>

      {orders.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, color: "var(--color-muted-foreground)" }}>
          No orders processed yet.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", color: "var(--color-muted-foreground)" }}>
                <th style={{ padding: "12px 14px", fontWeight: 600, whiteSpace: "nowrap" }}>Order ID</th>
                <th style={{ padding: "12px 14px", fontWeight: 600, whiteSpace: "nowrap" }}>Buyer</th>
                <th style={{ padding: "12px 14px", fontWeight: 600, whiteSpace: "nowrap" }}>Amount</th>
                <th style={{ padding: "12px 14px", fontWeight: 600, whiteSpace: "nowrap" }}>Method</th>
                <th style={{ padding: "12px 14px", fontWeight: 600, whiteSpace: "nowrap" }}>Status</th>
                <th style={{ padding: "12px 14px", fontWeight: 600, whiteSpace: "nowrap" }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((ord: any) => {
                const isCopied = copiedId === ord.id;

                return (
                  <tr key={ord.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: 12,
                            fontWeight: 600,
                            padding: "3px 8px",
                            borderRadius: 6,
                            background: "rgba(255, 255, 255, 0.05)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            color: "#f3f4f6",
                            userSelect: "all",
                          }}
                          title={ord.id}
                        >
                          {ord.id}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyOrderId(ord.id)}
                          className="btn btn-ghost"
                          style={{
                            padding: "4px 8px",
                            height: "auto",
                            fontSize: 11,
                            gap: 4,
                            color: isCopied ? "#10b981" : "var(--color-muted-foreground)",
                            background: isCopied ? "rgba(16, 185, 129, 0.1)" : "transparent",
                          }}
                          title="Copy full Order ID"
                        >
                          {isCopied ? <Check size={12} /> : <Copy size={12} />}
                          <span>{isCopied ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>{ord.buyerEmail}</td>
                    <td style={{ padding: "12px 14px", fontWeight: 700, whiteSpace: "nowrap" }}>
                      ${parseFloat(ord.totalAmount || "0").toFixed(2)}
                    </td>
                    <td style={{ padding: "12px 14px", textTransform: "uppercase", fontSize: 11, whiteSpace: "nowrap" }}>
                      {ord.paymentMethod}
                    </td>
                    <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: 4,
                          background:
                            ord.paymentStatus === "completed"
                              ? "rgba(34,197,94,0.15)"
                              : "rgba(245,158,11,0.15)",
                          color: ord.paymentStatus === "completed" ? "#22c55e" : "#f59e0b",
                        }}
                      >
                        {ord.paymentStatus.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px", color: "var(--color-muted-foreground)", fontSize: 12, whiteSpace: "nowrap" }}>
                      {new Date(ord.createdAt).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
