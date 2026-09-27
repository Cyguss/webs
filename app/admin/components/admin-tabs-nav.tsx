"use client";

import React from "react";
import { RefreshCw, Search, Loader2 } from "lucide-react";

export type AdminTab =
  | "overview"
  | "users"
  | "shops"
  | "approvals"
  | "orders"
  | "payouts"
  | "staff"
  | "bot-config";

interface AdminTabsNavProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  isSuperAdmin: boolean;
  usersCount: number;
  shopsCount: number;
  pendingApprovalsCount: number;
  ordersCount: number;
  payoutsCount: number;
  staffCount: number;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  dataLoading: boolean;
  onRefresh: () => void;
}

export function AdminTabsNav({
  activeTab,
  setActiveTab,
  isSuperAdmin,
  usersCount,
  shopsCount,
  pendingApprovalsCount,
  ordersCount,
  payoutsCount,
  staffCount,
  searchTerm,
  setSearchTerm,
  dataLoading,
  onRefresh,
}: AdminTabsNavProps) {
  const tabs = [
    { id: "overview", label: "Overview", count: null },
    { id: "users", label: "Users", count: usersCount },
    { id: "shops", label: "Stores", count: shopsCount },
    { id: "approvals", label: "Approvals", count: pendingApprovalsCount, highlight: true },
    { id: "orders", label: "Orders", count: ordersCount },
    { id: "payouts", label: "Payouts", count: payoutsCount },
    { id: "staff", label: "Staff", count: staffCount },
    ...(isSuperAdmin ? [{ id: "bot-config", label: "Bot Config", count: null }] : []),
  ];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 26,
        borderBottom: "1px solid var(--color-border)",
        paddingBottom: 10,
        gap: 16,
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as AdminTab)}
            style={{
              padding: "8px 14px",
              borderRadius: "var(--radius-md)",
              border: "none",
              background: activeTab === tab.id ? "#ffffff" : "transparent",
              color: activeTab === tab.id ? "#000000" : "var(--color-muted-foreground)",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              transition: "all 0.12s ease",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>{tab.label}</span>
            {tab.count !== null && (
              <span
                style={{
                  fontSize: 11,
                  padding: "1px 6px",
                  borderRadius: 4,
                  background:
                    tab.highlight && tab.count > 0
                      ? activeTab === tab.id
                        ? "rgba(245,158,11,0.3)"
                        : "rgba(245,158,11,0.15)"
                      : activeTab === tab.id
                      ? "rgba(0,0,0,0.15)"
                      : "rgba(255,255,255,0.06)",
                  color:
                    tab.highlight && tab.count > 0
                      ? "#f59e0b"
                      : activeTab === tab.id
                      ? "#000000"
                      : "var(--color-muted-foreground)",
                  fontWeight: 700,
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {["users", "shops", "orders"].includes(activeTab) && (
          <div style={{ position: "relative" }}>
            <Search
              size={14}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--color-muted-foreground)",
              }}
            />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
              style={{
                paddingLeft: 30,
                height: 34,
                fontSize: 12,
                width: 200,
              }}
            />
          </div>
        )}

        <button
          onClick={onRefresh}
          className="btn btn-ghost"
          style={{ padding: "6px 12px", fontSize: 12, gap: 6 }}
          disabled={dataLoading}
        >
          {dataLoading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          <span>Refresh</span>
        </button>
      </div>
    </div>
  );
}
