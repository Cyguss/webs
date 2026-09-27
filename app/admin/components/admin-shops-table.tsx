"use client";

import React from "react";
import { Search, ExternalLink, Loader2, CheckCircle2, Trash2 } from "lucide-react";

interface AdminShopsTableProps {
  shops: any[];
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  approvingShopId: string | null;
  deletingId: string | null;
  onApproveShop: (shopId: string, status: "approved" | "rejected") => void;
  onOpenRejectModal: (shopId: string, shopName: string) => void;
  onDeleteShop: (shopId: string, name: string) => void;
}

export function AdminShopsTable({
  shops,
  searchTerm,
  setSearchTerm,
  approvingShopId,
  deletingId,
  onApproveShop,
  onOpenRejectModal,
  onDeleteShop,
}: AdminShopsTableProps) {
  const filteredShops = shops.filter(
    (s) =>
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.slug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.ownerEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="card" style={{ padding: 22 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>Platform Stores</h2>
          <p style={{ fontSize: 12, color: "var(--color-muted-foreground)", margin: "3px 0 0" }}>
            All merchant digital storefronts deployed on Vaultly.
          </p>
        </div>
        <div style={{ position: "relative", width: 280 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: 12, color: "var(--color-muted-foreground)" }} />
          <input
            type="text"
            placeholder="Search stores..."
            className="input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: 36, height: 38, fontSize: 13 }}
          />
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-border)", color: "var(--color-muted-foreground)" }}>
              <th style={{ padding: "10px 14px", fontWeight: 600 }}>Store & Slug</th>
              <th style={{ padding: "10px 14px", fontWeight: 600 }}>Owner</th>
              <th style={{ padding: "10px 14px", fontWeight: 600 }}>Products</th>
              <th style={{ padding: "10px 14px", fontWeight: 600 }}>Status</th>
              <th style={{ padding: "10px 14px", fontWeight: 600 }}>Created</th>
              <th style={{ padding: "10px 14px", fontWeight: 600, textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredShops.map((s) => (
              <tr key={s.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <td style={{ padding: "12px 14px" }}>
                  <div style={{ fontWeight: 600 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: "var(--color-muted-foreground)" }}>/{s.slug}</div>
                </td>
                <td style={{ padding: "12px 14px" }}>
                  <div>{s.ownerName}</div>
                  <div style={{ fontSize: 11, color: "var(--color-muted-foreground)" }}>{s.ownerEmail}</div>
                </td>
                <td style={{ padding: "12px 14px", fontWeight: 600 }}>{s.productsCount} products</td>
                <td style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: 4,
                        background: s.isActive ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                        color: s.isActive ? "#22c55e" : "#ef4444",
                        display: "inline-block",
                      }}
                    >
                      {s.isActive ? "ACTIVE" : "DISABLED"}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: 4,
                        background: s.isAccepted ? "rgba(99,102,241,0.15)" : "rgba(245,158,11,0.15)",
                        color: s.isAccepted ? "#818cf8" : "#f59e0b",
                        display: "inline-block",
                      }}
                    >
                      {s.isAccepted ? "APPROVED" : "PENDING"}
                    </span>
                  </div>
                </td>
                <td style={{ padding: "12px 14px", color: "var(--color-muted-foreground)", fontSize: 12 }}>
                  {new Date(s.createdAt).toLocaleDateString()}
                </td>
                <td style={{ padding: "12px 14px", textAlign: "right" }}>
                  <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", alignItems: "center" }}>
                    <a
                      href={`/${s.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary"
                      style={{ padding: "4px 8px", fontSize: 11, gap: 4 }}
                      title="Preview storefront"
                    >
                      <ExternalLink size={11} />
                      <span>Preview</span>
                    </a>
                    {!s.isAccepted ? (
                      <>
                        <button
                          onClick={() => onApproveShop(s.id, "approved")}
                          disabled={approvingShopId === s.id}
                          className="btn btn-primary"
                          style={{ padding: "4px 10px", fontSize: 11, background: "#10b981", borderColor: "#10b981", gap: 4 }}
                        >
                          {approvingShopId === s.id ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => onOpenRejectModal(s.id, s.name)}
                          disabled={approvingShopId === s.id}
                          className="btn btn-danger"
                          style={{ padding: "4px 8px", fontSize: 11 }}
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => onOpenRejectModal(s.id, s.name)}
                        disabled={approvingShopId === s.id}
                        className="btn btn-ghost"
                        style={{ padding: "4px 8px", fontSize: 11, color: "var(--color-danger)" }}
                        title="Reject / Revoke Store"
                      >
                        Reject
                      </button>
                    )}
                    <a
                      href={`/${s.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary"
                      style={{ padding: "4px 10px", fontSize: 11 }}
                    >
                      Visit <ExternalLink size={11} />
                    </a>
                    <button
                      onClick={() => onDeleteShop(s.id, s.name)}
                      disabled={deletingId === s.id}
                      className="btn btn-danger"
                      style={{ padding: "4px 8px", fontSize: 11 }}
                      title="Delete Store"
                    >
                      {deletingId === s.id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
