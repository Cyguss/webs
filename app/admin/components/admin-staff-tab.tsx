"use client";

import React, { useState } from "react";
import {
  Ban,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  X,
  UserCheck,
  Shield,
  Loader2,
  Check,
} from "lucide-react";
import { useToast } from "@/components/toast-context";
import { AdminPermissions } from "@/lib/admin-gate";

interface AdminStaffTabProps {
  discordAdmins: any[];
  blockAllAdmins: boolean;
  isSuperAdmin?: boolean;
  ticket?: string | null;
  onToggleAdminPermissions?: (userId: string, currentActive: boolean) => void;
  onRefresh?: () => void;
}

const PERMISSION_LABELS: { key: keyof AdminPermissions; label: string; desc: string }[] = [
  {
    key: "canApproveShops",
    label: "Store Approvals",
    desc: "Approve or reject merchant store registration applications.",
  },
  {
    key: "canDeleteShops",
    label: "Store Management & Deletion",
    desc: "Force-delete abusive or non-compliant storefronts and purge listings.",
  },
  {
    key: "canManageUsers",
    label: "User & Role Administration",
    desc: "Modify merchant accounts, permissions, and roles.",
  },
  {
    key: "canManagePayouts",
    label: "Payout Processing",
    desc: "Review and approve seller crypto withdrawal requests.",
  },
  {
    key: "canViewFinancials",
    label: "Financial Analytics",
    desc: "Access platform revenue volume, fees, and seller balances.",
  },
  {
    key: "canManageSettings",
    label: "Platform Configuration",
    desc: "Adjust platform toggles, fees, and global maintenance modes.",
  },
];

export function AdminStaffTab({
  discordAdmins,
  blockAllAdmins,
  isSuperAdmin = false,
  ticket = null,
  onToggleAdminPermissions,
  onRefresh,
}: AdminStaffTabProps) {
  const toast = useToast();
  const [selectedAdmin, setSelectedAdmin] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);

  // Form state for permissions modal
  const [editRole, setEditRole] = useState("admin");
  const [editActive, setEditActive] = useState(true);
  const [editPermissions, setEditPermissions] = useState<AdminPermissions>({
    canApproveShops: true,
    canDeleteShops: false,
    canManageUsers: false,
    canManagePayouts: true,
    canViewFinancials: true,
    canManageSettings: false,
  });

  function openPermissionsEditor(admin: any) {
    setSelectedAdmin(admin);
    setEditRole(admin.role || "admin");
    setEditActive(admin.adminPermissionsActive !== false);
    setEditPermissions({
      canApproveShops: admin.adminPermissions?.canApproveShops ?? true,
      canDeleteShops: admin.adminPermissions?.canDeleteShops ?? false,
      canManageUsers: admin.adminPermissions?.canManageUsers ?? false,
      canManagePayouts: admin.adminPermissions?.canManagePayouts ?? true,
      canViewFinancials: admin.adminPermissions?.canViewFinancials ?? true,
      canManageSettings: admin.adminPermissions?.canManageSettings ?? false,
    });
    setModalOpen(true);
  }

  async function handleSavePermissions(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAdmin) return;

    setSavingPermissions(true);
    try {
      const headersInit: Record<string, string> = { "Content-Type": "application/json" };
      if (ticket) headersInit["x-admin-ticket"] = ticket;

      const res = await fetch(`/api/admin/users/${selectedAdmin.id}/permissions`, {
        method: "POST",
        headers: headersInit,
        body: JSON.stringify({
          role: editRole,
          adminPermissionsActive: editActive,
          permissions: editPermissions,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to update administrator permissions");
      } else {
        toast.success(data.message || "Permissions updated successfully");
        setModalOpen(false);
        onRefresh?.();
      }
    } catch (err: any) {
      toast.error(err?.message || "Network error updating permissions");
    } finally {
      setSavingPermissions(false);
    }
  }

  function togglePerm(key: keyof AdminPermissions) {
    setEditPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  return (
    <div className="card" style={{ padding: 22 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <Shield size={18} style={{ color: "#818cf8" }} />
            <span>Staff Administration & Permissions ({discordAdmins.length})</span>
          </h3>
          <p style={{ fontSize: 12, color: "var(--color-muted-foreground)", margin: "3px 0 0" }}>
            Manage Discord staff roles and assign granular capability privileges per administrator.
          </p>
        </div>

        {blockAllAdmins ? (
          <div
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              color: "#f87171",
              fontSize: 11,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Ban size={14} />
            <span>ALL STAFF SUSPENDED (EMERGENCY KILL-SWITCH)</span>
          </div>
        ) : (
          <div
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              background: "rgba(34, 197, 94, 0.15)",
              border: "1px solid rgba(34, 197, 94, 0.4)",
              color: "#22c55e",
              fontSize: 11,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <CheckCircle2 size={14} />
            <span>STAFF ROLES OPERATIONAL</span>
          </div>
        )}
      </div>

      {discordAdmins.length === 0 ? (
        <div style={{ padding: 36, textAlign: "center", color: "var(--color-muted-foreground)" }}>
          No active Discord staff members found. Link a Discord administrator account to populate staff.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 16 }}>
          {discordAdmins.map((adminUser: any) => {
            const perms: AdminPermissions = adminUser.adminPermissions || {
              canApproveShops: true,
              canDeleteShops: false,
              canManageUsers: false,
              canManagePayouts: true,
              canViewFinancials: true,
              canManageSettings: false,
            };

            return (
              <div
                key={adminUser.id}
                style={{
                  padding: 18,
                  borderRadius: "var(--radius-md)",
                  background: "rgba(255, 255, 255, 0.02)",
                  border: blockAllAdmins
                    ? "1px solid rgba(239, 68, 68, 0.3)"
                    : !adminUser.adminPermissionsActive
                    ? "1px solid rgba(245, 158, 11, 0.3)"
                    : "1px solid var(--color-border)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "var(--radius-sm)",
                        background: "#161720",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: 700,
                        fontSize: 15,
                      }}
                    >
                      {adminUser.discordUsername?.[0]?.toUpperCase() || adminUser.name?.[0]?.toUpperCase() || "A"}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                        <span>{adminUser.name || "Administrator"}</span>
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            padding: "2px 6px",
                            borderRadius: 3,
                            background: blockAllAdmins
                              ? "rgba(239, 68, 68, 0.2)"
                              : adminUser.adminPermissionsActive
                              ? "rgba(16, 185, 129, 0.2)"
                              : "rgba(245, 158, 11, 0.2)",
                            color: blockAllAdmins
                              ? "#f87171"
                              : adminUser.adminPermissionsActive
                              ? "#34d399"
                              : "#fbbf24",
                          }}
                        >
                          {blockAllAdmins
                            ? "BLOCKED"
                            : adminUser.adminPermissionsActive
                            ? "ACTIVE"
                            : "FROZEN"}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: "var(--color-muted-foreground)" }}>{adminUser.email}</div>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    padding: "8px 10px",
                    borderRadius: "var(--radius-sm)",
                    background: "rgba(0, 0, 0, 0.3)",
                    border: "1px solid rgba(255, 255, 255, 0.04)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    fontSize: 11,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--color-muted-foreground)" }}>Discord Handle:</span>
                    <span style={{ fontWeight: 600, color: "#ffffff" }}>
                      @{adminUser.discordUsername || "Unknown"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--color-muted-foreground)" }}>Discord ID:</span>
                    <span style={{ fontFamily: "monospace" }}>{adminUser.discordId || "None"}</span>
                  </div>
                </div>

                {/* Permissions Pills */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-muted-foreground)", marginBottom: 6 }}>
                    Granted Privileges:
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {PERMISSION_LABELS.map((p) => {
                      const enabled = perms[p.key];
                      return (
                        <span
                          key={p.key}
                          style={{
                            fontSize: 10,
                            padding: "2px 7px",
                            borderRadius: 4,
                            background: enabled ? "rgba(99, 102, 241, 0.15)" : "rgba(255, 255, 255, 0.03)",
                            border: enabled ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid var(--color-border)",
                            color: enabled ? "#a5b4fc" : "var(--color-muted-foreground)",
                            opacity: enabled ? 1 : 0.45,
                            textDecoration: enabled ? "none" : "line-through",
                          }}
                        >
                          {p.label}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {isSuperAdmin && (
                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    <button
                      type="button"
                      onClick={() => openPermissionsEditor(adminUser)}
                      className="btn btn-secondary"
                      style={{
                        flex: 1,
                        justifyContent: "center",
                        padding: "7px 10px",
                        fontSize: 12,
                        gap: 6,
                      }}
                    >
                      <Sliders size={13} />
                      <span>Edit Perms</span>
                    </button>

                    {onToggleAdminPermissions && (
                      <button
                        type="button"
                        onClick={() => onToggleAdminPermissions(adminUser.id, adminUser.adminPermissionsActive)}
                        className="btn"
                        style={{
                          padding: "7px 12px",
                          fontSize: 12,
                          gap: 6,
                          background: adminUser.adminPermissionsActive ? "rgba(245,158,11,0.15)" : "rgba(16,185,129,0.15)",
                          color: adminUser.adminPermissionsActive ? "#fbbf24" : "#34d399",
                          border: adminUser.adminPermissionsActive ? "1px solid rgba(245,158,11,0.3)" : "1px solid rgba(16,185,129,0.3)",
                        }}
                      >
                        {adminUser.adminPermissionsActive ? <ShieldAlert size={13} /> : <ShieldCheck size={13} />}
                        <span>{adminUser.adminPermissionsActive ? "Freeze" : "Restore"}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Permissions Editor Modal */}
      {modalOpen && selectedAdmin && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: 540,
              width: "100%",
              padding: 26,
              background: "#0d0e14",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>
                  Configure Administrator Privileges
                </h3>
                <p style={{ fontSize: 12, color: "var(--color-muted-foreground)", margin: "3px 0 0" }}>
                  Editing permissions for <strong>{selectedAdmin.name || selectedAdmin.email}</strong> (@{selectedAdmin.discordUsername})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="btn btn-ghost"
                style={{ padding: 6, borderRadius: "50%" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePermissions} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Account Status Switch */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  background: editActive ? "rgba(16,185,129,0.06)" : "rgba(245,158,11,0.06)",
                  borderRadius: "var(--radius-sm)",
                  border: editActive ? "1px solid rgba(16,185,129,0.2)" : "1px solid rgba(245,158,11,0.2)",
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Administrative Status</div>
                  <div style={{ fontSize: 11, color: "var(--color-muted-foreground)" }}>
                    {editActive ? "Admin has full access according to granted permissions." : "Admin access is frozen."}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditActive(!editActive)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    background: editActive ? "#10b981" : "#f59e0b",
                    color: "white",
                  }}
                >
                  {editActive ? "ACTIVE" : "FROZEN"}
                </button>
              </div>

              {/* Granular Permissions Checkboxes */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: "var(--color-foreground)" }}>
                  Capability Permissions
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {PERMISSION_LABELS.map((p) => {
                    const isChecked = editPermissions[p.key];
                    return (
                      <div
                        key={p.key}
                        onClick={() => togglePerm(p.key)}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 12,
                          padding: "10px 12px",
                          borderRadius: "var(--radius-sm)",
                          background: isChecked ? "rgba(99, 102, 241, 0.08)" : "rgba(255, 255, 255, 0.02)",
                          border: isChecked ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid var(--color-border)",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <div
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: 4,
                            background: isChecked ? "#6366f1" : "rgba(255,255,255,0.05)",
                            border: isChecked ? "none" : "1px solid rgba(255,255,255,0.2)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            marginTop: 1,
                            flexShrink: 0,
                          }}
                        >
                          {isChecked && <Check size={13} strokeWidth={3} />}
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: isChecked ? "#ffffff" : "var(--color-muted-foreground)" }}>
                            {p.label}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--color-muted-foreground)" }}>
                            {p.desc}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn btn-ghost"
                  style={{ fontSize: 13 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPermissions}
                  className="btn btn-primary"
                  style={{ fontSize: 13, fontWeight: 700, gap: 6 }}
                >
                  {savingPermissions ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  <span>{savingPermissions ? "Applying..." : "Save Administrator Permissions"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
