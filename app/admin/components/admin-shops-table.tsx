"use client";

import React, { useState } from "react";
import { Search, ExternalLink, Loader2, CheckCircle2, Trash2, Filter, LayoutDashboard } from "lucide-react";

interface AdminShopsTableProps {
  shops: any[];
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  approvingShopId: string | null;
  deletingId: string | null;
  launchingShopId?: string | null;
  onApproveShop: (shopId: string, status: "approved" | "rejected") => void;
  onOpenRejectModal: (shopId: string, shopName: string) => void;
  onDeleteShop: (shopId: string, name: string) => void;
  onLaunchDashboard?: (shopId: string, shopName: string) => void;
}

export function AdminShopsTable({
  shops,
  searchTerm,
  setSearchTerm,
  approvingShopId,
  deletingId,
  launchingShopId,
  onApproveShop,
  onOpenRejectModal,
  onDeleteShop,
  onLaunchDashboard,
}: AdminShopsTableProps) {
  const [statusFilter, setStatusFilter] = useState<"all" | "approved" | "pending" | "unlisted" | "disabled">("all");

  const counts = {
    all: shops.length,
    approved: shops.filter((s) => s.isAccepted && s.isActive).length,
    pending: shops.filter((s) => !s.isAccepted && s.approvalStatus === "pending").length,
    unlisted: shops.filter((s) => !s.isAccepted && s.approvalStatus !== "pending" && s.approvalStatus !== "rejected").length,
    disabled: shops.filter((s) => !s.isActive).length,
  };

  const filteredShops = shops.filter((s) => {
    const matchesSearch =
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.slug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.ownerEmail?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === "all") return true;
    if (statusFilter === "approved") return s.isAccepted && s.isActive;
    if (statusFilter === "pending") return !s.isAccepted && s.approvalStatus === "pending";
    if (statusFilter === "unlisted") return !s.isAccepted && s.approvalStatus !== "pending" && s.approvalStatus !== "rejected";
    if (statusFilter === "disabled") return !s.isActive;

    return true;
  });

  return (
    <div className="card" style={{ padding: 22 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 14 }}>
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>Platform Stores</h2>
          <p style={{ fontSize: 12, color: "var(--color-muted-foreground)", margin: "3px 0 0" }}>
            All merchant digital storefronts deployed on KRYPT MARKET ({filteredShops.length} shown).
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

      {/* Quick Status Filters */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { id: "all", label: "All Stores", count: counts.all, color: "#818cf8" },
          { id: "approved", label: "Live / Approved", count: counts.approved, color: "#22c55e" },
          { id: "pending", label: "Pending Review", count: counts.pending, color: "#f59e0b" },
          { id: "unlisted", label: "Draft / Private", count: counts.unlisted, color: "#a78bfa" },
          { id: "disabled", label: "Disabled", count: counts.disabled, color: "#ef4444" },
        ].map((filterItem) => {
          const isSelected = statusFilter === filterItem.id;
          return (
            <button
              key={filterItem.id}
              type="button"
              onClick={() => setStatusFilter(filterItem.id as any)}
              style={{
                padding: "5px 10px",
                borderRadius: "var(--radius-sm)",
                border: isSelected ? `1px solid ${filterItem.color}` : "1px solid var(--color-border)",
                background: isSelected ? `${filterItem.color}20` : "var(--color-surface-2)",
                color: isSelected ? filterItem.color : "var(--color-muted-foreground)",
                fontSize: 11.5,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.12s ease",
              }}
            >
              <span>{filterItem.label}</span>
              <span
                style={{
                  padding: "1px 5px",
                  borderRadius: 4,
                  fontSize: 10,
                  background: isSelected ? filterItem.color : "var(--color-surface)",
                  color: isSelected ? "#ffffff" : "var(--color-muted-foreground)",
                  fontWeight: 800,
                }}
              >
                {filterItem.count}
              </span>
            </button>
          );
        })}
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
            {filteredShops.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "32px 14px", textAlign: "center", color: "var(--color-muted-foreground)" }}>
                  No stores match the selected filter.
                </td>
              </tr>
            ) : (
              filteredShops.map((s) => (
                <tr key={s.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
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
                          background: s.isAccepted
                            ? "rgba(34,197,94,0.15)"
                            : s.approvalStatus === "pending"
                            ? "rgba(245,158,11,0.15)"
                            : s.approvalStatus === "rejected"
                            ? "rgba(239,68,68,0.15)"
                            : "rgba(99,102,241,0.15)",
                          color: s.isAccepted
                            ? "#22c55e"
                            : s.approvalStatus === "pending"
                            ? "#f59e0b"
                            : s.approvalStatus === "rejected"
                            ? "#ef4444"
                            : "#818cf8",
                          display: "inline-block",
                        }}
                      >
                        {s.isAccepted
                          ? "APPROVED"
                          : s.approvalStatus === "pending"
                          ? "PENDING REVIEW"
                          : s.approvalStatus === "rejected"
                          ? "REJECTED"
                          : "UNLISTED"}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 14px", color: "var(--color-muted-foreground)", fontSize: 12 }}>
                    {new Date(s.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "12px 14px", textAlign: "right" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", alignItems: "center" }}>
                      {onLaunchDashboard && (
                        <button
                          type="button"
                          onClick={() => onLaunchDashboard(s.id, s.name)}
                          disabled={launchingShopId === s.id}
                          className="btn btn-primary"
                          style={{
                            padding: "4px 9px",
                            fontSize: 11,
                            gap: 4,
                            fontWeight: 700,
                            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                            border: "none",
                            boxShadow: "0 0 10px rgba(99, 102, 241, 0.25)",
                          }}
                          title="Launch & manage this store's merchant dashboard"
                        >
                          {launchingShopId === s.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <LayoutDashboard size={12} />
                          )}
                          <span>Dashboard</span>
                        </button>
                      )}

                      <a
                        href={`/${s.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary"
                        style={{ padding: "4px 8px", fontSize: 11, gap: 4 }}
                        title="Preview storefront"
                      >
                        <ExternalLink size={12} />
                        <span>Visit</span>
                      </a>

                      {!s.isAccepted && (
                        <>
                          <button
                            onClick={() => onApproveShop(s.id, "approved")}
                            disabled={approvingShopId === s.id}
                            className="btn btn-success"
                            style={{ padding: "4px 8px", fontSize: 11, gap: 4 }}
                          >
                            {approvingShopId === s.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <CheckCircle2 size={12} />
                            )}
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
                      )}

                      <button
                        onClick={() => onDeleteShop(s.id, s.name)}
                        disabled={deletingId === s.id}
                        className="btn btn-ghost"
                        style={{ padding: "4px 8px", fontSize: 11, color: "#ef4444" }}
                        title="Delete store"
                      >
                        {deletingId === s.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
