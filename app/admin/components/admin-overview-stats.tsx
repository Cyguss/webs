"use client";

import React from "react";
import { Users, Store, Package, DollarSign, Clock, LayoutDashboard } from "lucide-react";
import { AdminTab } from "./admin-tabs-nav";

interface AdminOverviewStatsProps {
  stats: any;
  usersList: any[];
  shopsList: any[];
  onNavigateTab: (tab: AdminTab) => void;
  onLaunchDashboard?: (shopId: string, shopName: string) => void;
}

export function AdminOverviewStats({
  stats,
  usersList,
  shopsList,
  onNavigateTab,
  onLaunchDashboard,
}: AdminOverviewStatsProps) {
  return (
    <div>
      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 16,
          marginBottom: 28,
        }}
      >
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-muted-foreground)", textTransform: "uppercase" }}>
              Total Users
            </span>
            <Users size={16} color="var(--color-muted-foreground)" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{stats.totalUsers || 0}</div>
          <span style={{ fontSize: 12, color: "var(--color-muted-foreground)", marginTop: 4, display: "block" }}>
            Registered merchant accounts
          </span>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-muted-foreground)", textTransform: "uppercase" }}>
              Active Stores
            </span>
            <Store size={16} color="var(--color-muted-foreground)" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{stats.totalShops || 0}</div>
          <span style={{ fontSize: 12, color: "var(--color-muted-foreground)", marginTop: 4, display: "block" }}>
            Live storefronts
          </span>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-muted-foreground)", textTransform: "uppercase" }}>
              Catalog Inventory
            </span>
            <Package size={16} color="var(--color-muted-foreground)" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{stats.totalProducts || 0}</div>
          <span style={{ fontSize: 12, color: "var(--color-muted-foreground)", marginTop: 4, display: "block" }}>
            Active digital products
          </span>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-muted-foreground)", textTransform: "uppercase" }}>
              Total Volume (GMV)
            </span>
            <DollarSign size={16} color="var(--color-muted-foreground)" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>${stats.totalGrossRevenue || "0.00"}</div>
          <span style={{ fontSize: 12, color: "var(--color-muted-foreground)", marginTop: 4, display: "block" }}>
            Gross transaction volume
          </span>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-muted-foreground)", textTransform: "uppercase" }}>
              Pending Payouts
            </span>
            <Clock size={16} color="var(--color-muted-foreground)" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{stats.pendingPayoutsCount || 0}</div>
          <span style={{ fontSize: 12, color: "var(--color-muted-foreground)", marginTop: 4, display: "block" }}>
            Awaiting review
          </span>
        </div>
      </div>

      {/* Overview Tables */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Recent Users */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700 }}>Recently Registered Users</h3>
            <button
              onClick={() => onNavigateTab("users")}
              className="btn btn-ghost"
              style={{ padding: "4px 8px", fontSize: 12 }}
            >
              View all &rarr;
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {usersList.slice(0, 5).map((u) => (
              <div
                key={u.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{u.name}</div>
                  <div style={{ fontSize: 11, color: "var(--color-muted-foreground)" }}>{u.email}</div>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: 4,
                    background: u.role === "admin" ? "rgba(239,68,68,0.15)" : "var(--badge-neutral-bg, var(--color-surface))",
                    color: u.role === "admin" ? "#f87171" : "var(--color-muted-foreground)",
                  }}
                >
                  {u.role.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Stores */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700 }}>Recently Created Stores</h3>
            <button
              onClick={() => onNavigateTab("shops")}
              className="btn btn-ghost"
              style={{ padding: "4px 8px", fontSize: 12 }}
            >
              View all &rarr;
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {shopsList.length === 0 ? (
              <div style={{ color: "var(--color-muted-foreground)", fontSize: 13, textAlign: "center", padding: 20 }}>
                No stores created yet.
              </div>
            ) : (
              shopsList.slice(0, 5).map((s) => (
                <div
                  key={s.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--color-surface-2)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div>
                    <a
                      href={`/${s.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: 11, color: "var(--color-primary-light, #818cf8)", textDecoration: "none" }}
                    >
                      /{s.slug} &rarr;
                    </a>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ textAlign: "right", fontSize: 11, color: "var(--color-muted-foreground)" }}>
                      Owner: {s.ownerName}
                    </div>
                    {onLaunchDashboard && (
                      <button
                        type="button"
                        onClick={() => onLaunchDashboard(s.id, s.name)}
                        className="btn btn-secondary"
                        style={{
                          padding: "3px 7px",
                          fontSize: 10.5,
                          gap: 4,
                          height: 24,
                          fontWeight: 700,
                          background: "rgba(99, 102, 241, 0.15)",
                          color: "var(--color-primary-light, #818cf8)",
                          borderColor: "rgba(99, 102, 241, 0.3)",
                        }}
                        title="Open Merchant Dashboard"
                      >
                        <LayoutDashboard size={11} />
                        <span>Dashboard</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
