"use client";

import React from "react";

interface AdminPayoutsTableProps {
  payouts: any[];
}

export function AdminPayoutsTable({ payouts }: AdminPayoutsTableProps) {
  return (
    <div className="card" style={{ padding: 22 }}>
      <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 14 }}>Seller Payout Requests</h2>
      {payouts.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--color-muted-foreground)" }}>
          No payout requests in queue.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", color: "var(--color-muted-foreground)" }}>
                <th style={{ padding: "10px 14px", fontWeight: 600 }}>Amount</th>
                <th style={{ padding: "10px 14px", fontWeight: 600 }}>Method</th>
                <th style={{ padding: "10px 14px", fontWeight: 600 }}>Destination Address</th>
                <th style={{ padding: "10px 14px", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "10px 14px", fontWeight: 600 }}>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p: any) => (
                <tr key={p.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "12px 14px", fontWeight: 700 }}>
                    ${parseFloat(p.amountRequested || "0").toFixed(2)}
                  </td>
                  <td style={{ padding: "12px 14px", textTransform: "uppercase", fontSize: 11 }}>{p.method}</td>
                  <td style={{ padding: "12px 14px", fontFamily: "monospace", fontSize: 11 }}>
                    {p.destinationAddress}
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: 4,
                        background:
                          p.status === "completed"
                            ? "rgba(34,197,94,0.15)"
                            : "rgba(245,158,11,0.15)",
                        color: p.status === "completed" ? "#22c55e" : "#f59e0b",
                      }}
                    >
                      {p.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: "12px 14px", color: "var(--color-muted-foreground)", fontSize: 12 }}>
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
