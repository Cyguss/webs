"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Search, ExternalLink, Loader2, Trash2, ShieldAlert, ShieldCheck, Store, ChevronDown } from "lucide-react";
import { MAX_SHOPS_PER_USER } from "@/config/site";

interface AdminUsersTableProps {
  users: any[];
  shopsCount: number;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  deletingId: string | null;
  onDeleteUser: (userId: string, nameOrEmail: string) => void;
  isSuperAdmin?: boolean;
  onToggleAdminPermissions?: (userId: string, currentActive: boolean) => void;
}

export function AdminUsersTable({
  users,
  shopsCount,
  searchTerm,
  setSearchTerm,
  deletingId,
  onDeleteUser,
  isSuperAdmin = false,
  onToggleAdminPermissions,
}: AdminUsersTableProps) {
  const [mounted, setMounted] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<{
    userId: string;
    coords: { top: number; left: number; placement: "bottom" | "top" };
  } | null>(null);

  const activeTriggerRef = useRef<HTMLButtonElement | null>(null);
  const dropdownMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const calculateDropdownPosition = (buttonEl: HTMLButtonElement) => {
    const rect = buttonEl.getBoundingClientRect();
    const dropdownWidth = 320;
    const estimatedHeight = 240;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Flip to top if not enough room below and more room above
    const placement: "bottom" | "top" =
      spaceBelow < estimatedHeight && spaceAbove > spaceBelow ? "top" : "bottom";

    const top = placement === "bottom" ? rect.bottom + 6 : rect.top - 6;

    // Clamp left position within window
    let left = rect.left;
    if (left + dropdownWidth > window.innerWidth - 16) {
      left = Math.max(16, window.innerWidth - dropdownWidth - 16);
    }
    if (left < 16) {
      left = 16;
    }

    return { top, left, placement };
  };

  const handleToggleDropdown = (userId: string, buttonEl: HTMLButtonElement) => {
    if (activeDropdown?.userId === userId) {
      setActiveDropdown(null);
      activeTriggerRef.current = null;
      return;
    }
    activeTriggerRef.current = buttonEl;
    const coords = calculateDropdownPosition(buttonEl);
    setActiveDropdown({ userId, coords });
  };

  useEffect(() => {
    if (!activeDropdown || !activeTriggerRef.current) return;

    const handleScrollOrResize = () => {
      if (!activeTriggerRef.current) return;
      const rect = activeTriggerRef.current.getBoundingClientRect();
      if (
        rect.bottom < 0 ||
        rect.top > window.innerHeight ||
        rect.right < 0 ||
        rect.left > window.innerWidth
      ) {
        setActiveDropdown(null);
        return;
      }
      const coords = calculateDropdownPosition(activeTriggerRef.current);
      setActiveDropdown((prev) => (prev ? { ...prev, coords } : null));
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        dropdownMenuRef.current &&
        !dropdownMenuRef.current.contains(target) &&
        activeTriggerRef.current &&
        !activeTriggerRef.current.contains(target)
      ) {
        setActiveDropdown(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveDropdown(null);
      }
    };

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeDropdown]);

  const filteredUsers = users.filter(
    (u) =>
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.discordUsername?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeUser = activeDropdown ? users.find((u) => u.id === activeDropdown.userId) : null;
  const activeUserStores = activeUser
    ? activeUser.shops && activeUser.shops.length > 0
      ? activeUser.shops
      : activeUser.shop
      ? [activeUser.shop]
      : []
    : [];
  const activeStoresCount = activeUserStores.length;

  return (
    <div className="card" style={{ padding: 22 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>Registered Users</h2>
          <p style={{ fontSize: 12, color: "var(--color-muted-foreground)", margin: "3px 0 0" }}>
            All merchant accounts with Discord link status, balance, and store quota (Limit: {MAX_SHOPS_PER_USER} store/user).
          </p>
        </div>
        <div style={{ position: "relative", width: 280 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: 12, color: "var(--color-muted-foreground)" }} />
          <input
            type="text"
            placeholder="Search by email, name..."
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
              <th style={{ padding: "12px 14px", fontWeight: 600 }}>User</th>
              <th style={{ padding: "12px 14px", fontWeight: 600, whiteSpace: "nowrap", minWidth: 160 }}>Role</th>
              <th style={{ padding: "12px 14px", fontWeight: 600, whiteSpace: "nowrap" }}>Discord Link</th>
              <th style={{ padding: "12px 14px", fontWeight: 600, whiteSpace: "nowrap", minWidth: 170 }}>
                Stores ({shopsCount})
              </th>
              <th style={{ padding: "12px 14px", fontWeight: 600, whiteSpace: "nowrap" }}>Total Earned</th>
              <th style={{ padding: "12px 14px", fontWeight: 600, whiteSpace: "nowrap" }}>Available Balance</th>
              <th style={{ padding: "12px 14px", fontWeight: 600, whiteSpace: "nowrap" }}>Joined</th>
              <th style={{ padding: "12px 14px", fontWeight: 600, textAlign: "right", whiteSpace: "nowrap" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => {
              const userStores = u.shops && u.shops.length > 0 ? u.shops : u.shop ? [u.shop] : [];
              const storesCount = userStores.length;
              const isDropdownOpen = activeDropdown?.userId === u.id;

              return (
                <tr key={u.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ fontWeight: 600 }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: "var(--color-muted-foreground)" }}>{u.email}</div>
                  </td>

                  {/* Role Column (Completely immune to overflow & cleanly styled) */}
                  <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                    {u.role === "superadmin" ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 11,
                          fontWeight: 800,
                          padding: "4px 9px",
                          borderRadius: 6,
                          background: "rgba(239, 68, 68, 0.15)",
                          border: "1px solid rgba(239, 68, 68, 0.4)",
                          color: "#f87171",
                          letterSpacing: "0.03em",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444" }} />
                        SUPERADMIN
                      </span>
                    ) : u.role === "admin" ? (
                      u.adminPermissionsActive ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 11,
                            fontWeight: 800,
                            padding: "4px 9px",
                            borderRadius: 6,
                            background: "rgba(16, 185, 129, 0.15)",
                            border: "1px solid rgba(16, 185, 129, 0.35)",
                            color: "#34d399",
                            letterSpacing: "0.03em",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: "#10b981",
                              boxShadow: "0 0 6px rgba(16, 185, 129, 0.8)",
                            }}
                          />
                          ADMIN · ACTIVE
                        </span>
                      ) : (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 11,
                            fontWeight: 800,
                            padding: "4px 9px",
                            borderRadius: 6,
                            background: "rgba(245, 158, 11, 0.15)",
                            border: "1px solid rgba(245, 158, 11, 0.4)",
                            color: "#fbbf24",
                            letterSpacing: "0.03em",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b" }} />
                          ADMIN · SUSPENDED
                        </span>
                      )
                    ) : (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "4px 9px",
                          borderRadius: 6,
                          background: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          color: "var(--color-muted-foreground)",
                          letterSpacing: "0.03em",
                          whiteSpace: "nowrap",
                        }}
                      >
                        USER
                      </span>
                    )}
                  </td>

                  {/* Discord Link */}
                  <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                    {u.discordUsername ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#ffffff" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
                        @{u.discordUsername}
                      </span>
                    ) : (
                      <span style={{ color: "var(--color-muted-foreground)", fontSize: 12 }}>Unlinked</span>
                    )}
                  </td>                  {/* Stores Dropdown & Limit */}
                  <td style={{ padding: "12px 14px" }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleDropdown(u.id, e.currentTarget);
                      }}
                      className="btn btn-secondary"
                      style={{
                        padding: "5px 10px",
                        fontSize: 12,
                        gap: 6,
                        fontWeight: 600,
                        background: isDropdownOpen ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
                        borderColor: isDropdownOpen ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.08)",
                        color: storesCount > 0 ? "#ffffff" : "var(--color-muted-foreground)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <Store size={13} style={{ color: storesCount > 0 ? "#818cf8" : "var(--color-muted-foreground)" }} />
                      <span>
                        Stores ({storesCount} / {MAX_SHOPS_PER_USER})
                      </span>
                      <ChevronDown
                        size={13}
                        style={{
                          transform: isDropdownOpen ? "rotate(180deg)" : "none",
                          transition: "transform 0.15s ease",
                          color: "var(--color-muted-foreground)",
                        }}
                      />
                    </button>
                  </td>

                  <td style={{ padding: "12px 14px", fontWeight: 600, whiteSpace: "nowrap" }}>
                    ${parseFloat(u.totalEarned || "0").toFixed(2)}
                  </td>
                  <td style={{ padding: "12px 14px", color: "var(--color-success)", fontWeight: 600, whiteSpace: "nowrap" }}>
                    ${parseFloat(u.availableBalance || "0").toFixed(2)}
                  </td>
                  <td style={{ padding: "12px 14px", color: "var(--color-muted-foreground)", fontSize: 12, whiteSpace: "nowrap" }}>
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "12px 14px", textAlign: "right", whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", alignItems: "center" }}>
                      {isSuperAdmin && u.role === "admin" && onToggleAdminPermissions && (
                        <button
                          type="button"
                          onClick={() => onToggleAdminPermissions(u.id, u.adminPermissionsActive)}
                          className={u.adminPermissionsActive ? "btn btn-secondary" : "btn btn-primary"}
                          style={{
                            padding: "4px 8px",
                            fontSize: 11,
                            gap: 4,
                            background: u.adminPermissionsActive ? "rgba(245,158,11,0.15)" : "#10b981",
                            color: u.adminPermissionsActive ? "#fbbf24" : "#ffffff",
                            borderColor: u.adminPermissionsActive ? "rgba(245,158,11,0.3)" : "#10b981",
                          }}
                          title={
                            u.adminPermissionsActive
                              ? "Freeze this admin's elevated permissions"
                              : "Restore this admin's permissions"
                          }
                        >
                          {u.adminPermissionsActive ? <ShieldAlert size={12} /> : <ShieldCheck size={12} />}
                          <span>{u.adminPermissionsActive ? "Freeze" : "Restore"}</span>
                        </button>
                      )}

                      {u.role !== "superadmin" ? (
                        <button
                          onClick={() => onDeleteUser(u.id, u.name || u.email)}
                          disabled={deletingId === u.id}
                          className="btn btn-danger"
                          style={{ padding: "4px 8px", fontSize: 11, gap: 4 }}
                          title="Delete User and their Stores"
                        >
                          {deletingId === u.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                          <span>Delete</span>
                        </button>
                      ) : (
                        <span style={{ fontSize: 11, color: "var(--color-muted-foreground)" }}>Protected</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Portal Dropdown for Store List (Rendered to body, immune to table/card overflow clipping) */}
      {mounted && activeDropdown && activeUser && typeof document !== "undefined" && createPortal(
        <div
          ref={dropdownMenuRef}
          style={{
            position: "fixed",
            top: activeDropdown.coords.top,
            left: activeDropdown.coords.left,
            transform: activeDropdown.coords.placement === "top" ? "translateY(-100%)" : "none",
            zIndex: 99999,
            width: 320,
            background: "#0c0d12",
            border: "1px solid rgba(255, 255, 255, 0.16)",
            borderRadius: "var(--radius-md, 10px)",
            boxShadow: "0 22px 50px -10px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255,255,255,0.06)",
            padding: 12,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            pointerEvents: "auto",
            backdropFilter: "blur(16px)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              paddingBottom: 7,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Store size={13} style={{ color: "#818cf8" }} />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "var(--color-muted-foreground)",
                }}
              >
                User Stores
              </span>
            </div>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: "2px 7px",
                borderRadius: 4,
                background:
                  activeStoresCount >= MAX_SHOPS_PER_USER
                    ? "rgba(245,158,11,0.15)"
                    : "rgba(255,255,255,0.06)",
                border: `1px solid ${
                  activeStoresCount >= MAX_SHOPS_PER_USER
                    ? "rgba(245,158,11,0.3)"
                    : "rgba(255,255,255,0.08)"
                }`,
                color:
                  activeStoresCount >= MAX_SHOPS_PER_USER
                    ? "#f59e0b"
                    : "var(--color-muted-foreground)",
              }}
            >
              {activeStoresCount} / {MAX_SHOPS_PER_USER} {activeStoresCount >= MAX_SHOPS_PER_USER ? "(Max)" : "Used"}
            </span>
          </div>

          {activeUserStores.length === 0 ? (
            <div
              style={{
                fontSize: 12,
                color: "var(--color-muted-foreground)",
                padding: "16px 8px",
                textAlign: "center",
                background: "rgba(255,255,255,0.02)",
                borderRadius: 6,
                border: "1px dashed rgba(255,255,255,0.08)",
              }}
            >
              No stores registered yet.
            </div>
          ) : (
            <div
              style={{
                maxHeight: 220,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 6,
                paddingRight: 2,
              }}
            >
              {activeUserStores.map((s: any) => (
                <div
                  key={s.id}
                  style={{
                    padding: "8px 10px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 6,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    transition: "background 0.15s ease",
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 12,
                        color: "#ffffff",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={s.name}
                    >
                      {s.name}
                    </div>
                    <div style={{ fontSize: 10, color: "#818cf8", fontFamily: "monospace", marginTop: 1 }}>
                      /{s.slug}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 800,
                        padding: "2px 6px",
                        borderRadius: 4,
                        background: s.isAccepted ? "rgba(34,197,94,0.15)" : "rgba(245,158,11,0.15)",
                        border: `1px solid ${s.isAccepted ? "rgba(34,197,94,0.3)" : "rgba(245,158,11,0.3)"}`,
                        color: s.isAccepted ? "#22c55e" : "#f59e0b",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {s.isAccepted ? "LIVE" : "PENDING"}
                    </span>
                    <a
                      href={`/${s.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-ghost"
                      style={{
                        padding: 5,
                        height: "auto",
                        color: "var(--color-muted-foreground)",
                        borderRadius: 4,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      title="Open Storefront"
                    >
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeStoresCount >= MAX_SHOPS_PER_USER && (
            <div
              style={{
                fontSize: 10,
                color: "var(--color-muted-foreground)",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                paddingTop: 6,
                textAlign: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
              }}
            >
              <span>Store quota reached ({MAX_SHOPS_PER_USER} / user)</span>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
