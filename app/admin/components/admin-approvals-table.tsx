"use client";

import React, { useState } from "react";
import { CheckCircle2, ExternalLink, Loader2, Copy, Check } from "lucide-react";
import { useToast } from "@/components/toast-context";

interface AdminApprovalsTableProps {
  approvalRequests: any[];
  approvingShopId: string | null;
  onApproveShop: (shopId: string, status: "approved" | "rejected") => void;
  onOpenRejectModal: (shopId: string, shopName: string) => void;
}

export function AdminApprovalsTable({
  approvalRequests,
  approvingShopId,
  onApproveShop,
  onOpenRejectModal,
}: AdminApprovalsTableProps) {
  const toast = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Strictly list ONLY stores that are pending review / to accept
  const pendingRequests = (approvalRequests || []).filter((r: any) => r.status === "pending");

  function copyToClipboard(text: string, label: string) {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    toast.success(`Copied ${label} to clipboard`);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="card" style={{ padding: 22 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>Store Approvals Queue</h2>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 4,
                background: pendingRequests.length > 0 ? "rgba(245,158,11,0.15)" : "rgba(34,197,94,0.15)",
                color: pendingRequests.length > 0 ? "#f59e0b" : "#22c55e",
              }}
            >
              {pendingRequests.length} Pending
            </span>
          </div>
          <p style={{ fontSize: 12, color: "var(--color-muted-foreground)", margin: "3px 0 0" }}>
            Stores awaiting administrator review before going live. Only unapproved submissions are listed here.
          </p>
        </div>
      </div>

      {pendingRequests.length === 0 ? (
        <div style={{ textAlign: "center", padding: 56, color: "var(--color-muted-foreground)" }}>
          <CheckCircle2 size={40} style={{ margin: "0 auto 12px", opacity: 0.4, color: "#10b981", display: "block" }} />
          <div style={{ fontWeight: 700, fontSize: 16, color: "#ffffff" }}>All Caught Up!</div>
          <div style={{ fontSize: 13, marginTop: 4, color: "var(--color-muted-foreground)" }}>
            There are no stores currently waiting for review or approval.
          </div>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", color: "var(--color-muted-foreground)" }}>
                <th style={{ padding: "12px 14px", fontWeight: 600 }}>Store</th>
                <th style={{ padding: "12px 14px", fontWeight: 600 }}>Slug</th>
                <th style={{ padding: "12px 14px", fontWeight: 600 }}>Store ID</th>
                <th style={{ padding: "12px 14px", fontWeight: 600 }}>Merchant</th>
                <th style={{ padding: "12px 14px", fontWeight: 600 }}>Submitted</th>
                <th style={{ padding: "12px 14px", fontWeight: 600, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingRequests.map((r: any) => {
                const isCopied = copiedId === r.shopId;

                return (
                  <tr key={r.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontWeight: 700, color: "#ffffff" }}>{r.shopName || "Unnamed Store"}</div>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: 4,
                          background: "rgba(245,158,11,0.15)",
                          color: "#f59e0b",
                          display: "inline-block",
                          marginTop: 3,
                        }}
                      >
                        NEEDS APPROVAL
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px", fontFamily: "monospace", fontSize: 12, color: "#818cf8" }}>
                      /{r.shopSlug}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontFamily: "monospace", fontSize: 11, color: "var(--color-muted-foreground)" }}>
                          {r.shopId}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(r.shopId, "Store ID")}
                          className="btn btn-ghost"
                          style={{ padding: 4, height: "auto", color: isCopied ? "#10b981" : "var(--color-muted-foreground)" }}
                          title="Copy Store ID"
                        >
                          {isCopied ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontWeight: 600 }}>{r.ownerName || "Merchant"}</div>
                      <div style={{ fontSize: 11, color: "var(--color-muted-foreground)" }}>{r.ownerEmail}</div>
                    </td>
                    <td style={{ padding: "12px 14px", color: "var(--color-muted-foreground)", fontSize: 12 }}>
                      {new Date(r.requestedAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", alignItems: "center" }}>
                        <a
                          href={`/${r.shopSlug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary"
                          style={{ padding: "5px 10px", fontSize: 12, gap: 4 }}
                        >
                          <span>Preview</span>
                          <ExternalLink size={12} />
                        </a>
                        <button
                          type="button"
                          onClick={() => onApproveShop(r.shopId, "approved")}
                          disabled={approvingShopId === r.shopId}
                          className="btn btn-primary"
                          style={{
                            padding: "5px 12px",
                            fontSize: 12,
                            background: "#10b981",
                            borderColor: "#10b981",
                            gap: 4,
                            fontWeight: 700,
                          }}
                        >
                          {approvingShopId === r.shopId ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <CheckCircle2 size={12} />
                          )}
                          <span>Approve</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenRejectModal(r.shopId, r.shopName)}
                          disabled={approvingShopId === r.shopId}
                          className="btn btn-danger"
                          style={{ padding: "5px 12px", fontSize: 12 }}
                        >
                          Reject
                        </button>
                      </div>
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
