"use client";

import React from "react";
import { Ban, CheckCircle2, ShieldAlert, ShieldCheck } from "lucide-react";

interface AdminStaffTabProps {
  discordAdmins: any[];
  blockAllAdmins: boolean;
  isSuperAdmin?: boolean;
  onToggleAdminPermissions?: (userId: string, currentActive: boolean) => void;
}

export function AdminStaffTab({
  discordAdmins,
  blockAllAdmins,
  isSuperAdmin = false,
  onToggleAdminPermissions,
}: AdminStaffTabProps) {
  return (
    <div className="card" style={{ padding: 22 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>
            Discord Staff Team ({discordAdmins.length})
          </h3>
          <p style={{ fontSize: 12, color: "var(--color-muted-foreground)", margin: "3px 0 0" }}>
            Users with linked Discord accounts holding the Administrator role on your Discord server.
          </p>
        </div>

        {blockAllAdmins ? (
          <div
            style={{
              padding: "5px 10px",
              borderRadius: 4,
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
            <Ban size={13} />
            <span>SUSPENDED VIA KILL-SWITCH</span>
          </div>
        ) : (
          <div
            style={{
              padding: "5px 10px",
              borderRadius: 4,
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
            <CheckCircle2 size={13} />
            <span>PERMISSIONS ACTIVE</span>
          </div>
        )}
      </div>

      {discordAdmins.length === 0 ? (
        <div style={{ padding: 36, textAlign: "center", color: "var(--color-muted-foreground)" }}>
          No active Discord staff members found.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
          {discordAdmins.map((adminUser: any) => (
            <div
              key={adminUser.id}
              style={{
                padding: 16,
                borderRadius: "var(--radius-md)",
                background: "rgba(255, 255, 255, 0.02)",
                border: blockAllAdmins ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid var(--color-border)",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "var(--radius-sm)",
                    background: "#161720",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: 700,
                    fontSize: 14,
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
                        ? "BLOCKED (GLOBAL LOCK)"
                        : adminUser.adminPermissionsActive
                        ? "ACTIVE"
                        : "PERMISSIONS FROZEN"}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--color-muted-foreground)" }}>{adminUser.email}</div>
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
                  <span style={{ color: "var(--color-muted-foreground)" }}>Discord Tag:</span>
                  <span style={{ fontWeight: 600, color: "#ffffff" }}>
                    @{adminUser.discordUsername || "Unknown"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-muted-foreground)" }}>Discord ID:</span>
                  <span style={{ fontFamily: "monospace" }}>{adminUser.discordId || "None"}</span>
                </div>
              </div>

              {isSuperAdmin && onToggleAdminPermissions && (
                <div style={{ marginTop: 4, display: "flex", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={() => onToggleAdminPermissions(adminUser.id, adminUser.adminPermissionsActive)}
                    className={adminUser.adminPermissionsActive ? "btn btn-secondary" : "btn btn-primary"}
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      padding: "6px 12px",
                      fontSize: 12,
                      gap: 6,
                      background: adminUser.adminPermissionsActive ? "rgba(245,158,11,0.15)" : "#10b981",
                      color: adminUser.adminPermissionsActive ? "#fbbf24" : "#ffffff",
                      borderColor: adminUser.adminPermissionsActive ? "rgba(245,158,11,0.3)" : "#10b981",
                    }}
                  >
                    {adminUser.adminPermissionsActive ? <ShieldAlert size={13} /> : <ShieldCheck size={13} />}
                    <span>{adminUser.adminPermissionsActive ? "Freeze Admin Permissions" : "Restore Admin Permissions"}</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
