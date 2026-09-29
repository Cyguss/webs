"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, ShieldAlert } from "lucide-react";
import { useToast } from "@/components/toast-context";

import { AdminLoginGate } from "./components/admin-login-gate";
import { AdminHeader } from "./components/admin-header";
import { AdminLockdownBanner } from "./components/admin-lockdown-banner";
import { AdminTabsNav, AdminTab } from "./components/admin-tabs-nav";
import { AdminOverviewStats } from "./components/admin-overview-stats";
import { AdminUsersTable } from "./components/admin-users-table";
import { AdminShopsTable } from "./components/admin-shops-table";
import { AdminApprovalsTable } from "./components/admin-approvals-table";
import { AdminOrdersTable } from "./components/admin-orders-table";
import { AdminPayoutsTable } from "./components/admin-payouts-table";
import { AdminStaffTab } from "./components/admin-staff-tab";
import { AdminBotConfigTab } from "./components/admin-bot-config-tab";
import { AdminPlatformSettingsTab } from "./components/admin-platform-settings-tab";
import { AdminDebugTab } from "./components/admin-debug-tab";
import { AdminPanicModal, AdminMasterModal, AdminRejectModal, AdminKillSwitchModal } from "./components/admin-modals";

interface AdminPortalProps {
  initialIsAdmin?: boolean;
  initialIsSuperAdmin?: boolean;
  initialRole?: string;
  userName?: string | null;
}

export default function AdminPortal({
  initialIsAdmin = false,
  initialIsSuperAdmin = false,
  initialRole = "user",
  userName,
}: AdminPortalProps) {
  const toast = useToast();

  const [ticket, setTicket] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(initialIsAdmin);

  // Login gate form state
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Lockdown & Mode state
  const [isLockdownBlocked, setIsLockdownBlocked] = useState(false);
  const [lockdownMessage, setLockdownMessage] = useState("");
  const [lockdownLoading, setLockdownLoading] = useState(false);
  const [showMasterModal, setShowMasterModal] = useState(false);
  const [showPanicModal, setShowPanicModal] = useState(false);
  const [showKillSwitchModal, setShowKillSwitchModal] = useState(false);

  // Admin data state
  const [dataLoading, setDataLoading] = useState(true);
  const [adminData, setAdminData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [searchTerm, setSearchTerm] = useState("");

  // Bot config state
  const [botConfig, setBotConfig] = useState<Record<string, string>>({});
  const [botConfigSaving, setBotConfigSaving] = useState(false);

  // Action loading state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [approvingShopId, setApprovingShopId] = useState<string | null>(null);
  const [launchingShopId, setLaunchingShopId] = useState<string | null>(null);

  // Rejection modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTargetShop, setRejectTargetShop] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  // Super-Admin zero-persistence: WIPE any stored tickets from cookies/session/local storage on mount
  useEffect(() => {
    try {
      sessionStorage.removeItem("vlt_super_admin_ticket");
      localStorage.removeItem("vlt_super_admin_ticket");
      document.cookie = "vlt_super_admin_ticket=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    } catch {}

    // On page load or refresh, superadmin ticket is NEVER loaded from storage!
    // Start with ticket = null; user is logged out of superadmin upon any refresh.
    setTicket(null);
    fetchAdminData(null);
  }, []);

  // Wipe in-memory ticket on page refresh / navigation
  useEffect(() => {
    const handleBeforeUnload = () => {
      setTicket(null);
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handleBeforeUnload);
    };
  }, []);

  // Continuous live session check: validates administrator session every 15s
  useEffect(() => {
    if (!isUnlocked && !ticket) return;

    const intervalId = setInterval(async () => {
      try {
        const headersInit: Record<string, string> = {};
        if (ticket) headersInit["x-admin-ticket"] = ticket;

        const res = await fetch("/api/admin/overview", {
          headers: headersInit,
          cache: "no-store",
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          console.warn("[Admin Heartbeat] Session revoked or expired:", data.error);
          setTicket(null);
          setIsUnlocked(false);
          toast.error(data.error || "Administrator session expired or revoked. Please re-authenticate.");
          return;
        }

        const data = await res.json();
        if (ticket && !data.isSuperAdmin) {
          setTicket(null);
          setIsUnlocked(false);
          toast.error("Super-Admin elevation expired. Please authenticate again.");
        }
      } catch {
        // Network heartbeat retry on next tick
      }
    }, 15000);

    return () => clearInterval(intervalId);
  }, [ticket, isUnlocked, toast]);

  useEffect(() => {
    if (activeTab === "bot-config") {
      loadBotConfig();
    }
  }, [activeTab]);

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();

    if (!usernameInput.trim() || !passwordInput.trim()) {
      toast.error("Please enter both Super-Admin identifier and passphrase.");
      return;
    }

    setLoginLoading(true);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: usernameInput.trim(),
          password: passwordInput.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Authentication denied.");
        setLoginLoading(false);
        return;
      }

      // DO NOT write to sessionStorage or cookies! Keep strictly in volatile in-memory React state
      setTicket(data.ticket);
      setIsUnlocked(true);
      setShowMasterModal(false);
      setPasswordInput("");
      toast.success("Super-Admin credentials verified.");
      fetchAdminData(data.ticket);
    } catch (err: any) {
      toast.error(err?.message || "Network error during authentication.");
      setLoginLoading(false);
    }
  }

  async function handleToggleLockdown() {
    if (!ticket) return;
    const nextState = !adminData?.blockAllAdmins;
    const confirmMsg = nextState
      ? "Engage emergency lockdown? All ordinary Discord administrators will be immediately locked out."
      : "Lift platform lockdown and restore access for ordinary Discord administrators?";
    if (!confirm(confirmMsg)) return;

    setLockdownLoading(true);
    try {
      const res = await fetch("/api/admin/lockdown", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-ticket": ticket,
        },
        body: JSON.stringify({ blockAllAdmins: nextState }),
      });
      const data = await res.json();
      if (data.success) {
        setAdminData((prev: any) => ({
          ...prev,
          blockAllAdmins: data.blockAllAdmins,
        }));
        if (data.blockAllAdmins) {
          toast.warning("Platform lockdown ENGAGED. Ordinary admins blocked.");
        } else {
          toast.success("Platform lockdown LIFTED. Ordinary admins restored.");
        }
      } else {
        toast.error(data.error || "Failed to update lockdown status");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to toggle lockdown");
    } finally {
      setLockdownLoading(false);
    }
  }

  async function handleOrdinaryAdminPanicLock() {
    setLockdownLoading(true);
    try {
      const res = await fetch("/api/admin/panic", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowPanicModal(false);
        toast.warning("Emergency Panic Switch activated. Your administrative access has been deactivated.");
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1500);
      } else {
        toast.error(data.error || "Failed to engage panic lockout.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Network error engaging panic switch");
    } finally {
      setLockdownLoading(false);
    }
  }

  async function handleToggleAdminPermissions(userId: string, currentActive: boolean) {
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle-permissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(ticket ? { "x-admin-ticket": ticket } : {}),
        },
        body: JSON.stringify({ active: !currentActive }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to toggle admin permissions.");
        return;
      }
      toast.success(data.message);
      setAdminData((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          users: (prev.users || []).map((u: any) =>
            u.id === userId ? { ...u, adminPermissionsActive: !currentActive } : u
          ),
        };
      });
    } catch (err: any) {
      toast.error(err?.message || "Error toggling admin permissions");
    }
  }

  async function fetchAdminData(authTicket: string | null) {
    setDataLoading(true);
    try {
      const headersInit: Record<string, string> = {};
      if (authTicket) {
        headersInit["x-admin-ticket"] = authTicket;
      }

      const res = await fetch("/api/admin/overview", {
        headers: headersInit,
      });

      if (res.status === 403) {
        const data = await res.json();
        if (data.isRevoked) {
          setIsUnlocked(false);
          toast.error(data.error || "Your Discord Administrator role was revoked. Access denied.");
          return;
        }
        setIsLockdownBlocked(true);
        setLockdownMessage(data.error || "Platform access has been locked down.");
        setIsUnlocked(true);
        return;
      }

      if (res.status === 401) {
        if (authTicket) {
          handleLock();
        }
        setIsUnlocked(false);
        return;
      }

      const data = await res.json();
      if (data.success) {
        setAdminData(data);
        setIsUnlocked(true);
        setIsLockdownBlocked(false);
      }
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setDataLoading(false);
      setLoginLoading(false);
    }
  }

  function handleLock() {
    sessionStorage.removeItem("vlt_super_admin_ticket");
    setTicket(null);
    setIsUnlocked(false);
    setAdminData(null);
    setUsernameInput("");
    setPasswordInput("");
    toast.info("Admin session terminated.");
  }

  async function handleDeleteUser(userId: string, targetName: string) {
    if (!confirm(`Are you sure you want to delete user "${targetName}"? This will delete all their stores and data permanently.`)) {
      return;
    }
    setDeletingId(userId);
    try {
      const headersInit: Record<string, string> = {};
      if (ticket) headersInit["x-admin-ticket"] = ticket;
      const res = await fetch(`/api/admin/users/${userId}/delete`, {
        method: "DELETE",
        headers: headersInit,
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to delete user");
      } else {
        toast.success(`User "${targetName}" deleted.`);
        fetchAdminData(ticket);
      }
    } catch {
      toast.error("Network error deleting user");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDeleteShop(shopId: string, shopName: string) {
    if (!confirm(`Are you sure you want to delete store "${shopName}"? All products and keys will be permanently deleted.`)) {
      return;
    }
    setDeletingId(shopId);
    try {
      const headersInit: Record<string, string> = {};
      if (ticket) headersInit["x-admin-ticket"] = ticket;
      const res = await fetch(`/api/admin/shops/${shopId}/delete`, {
        method: "DELETE",
        headers: headersInit,
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to delete store");
      } else {
        toast.success(`Store "${shopName}" deleted.`);
        fetchAdminData(ticket);
      }
    } catch {
      toast.error("Network error deleting store");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleApproveShop(shopId: string, decision: "approved" | "rejected", note?: string) {
    setApprovingShopId(shopId);
    try {
      const headersInit: Record<string, string> = { "Content-Type": "application/json" };
      if (ticket) headersInit["x-admin-ticket"] = ticket;
      const res = await fetch(`/api/admin/shops/${shopId}/approve`, {
        method: "POST",
        headers: headersInit,
        body: JSON.stringify({ decision, note }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to update store status");
      } else {
        toast.success(`Store has been ${decision.toUpperCase()}! Discord webhook logged.`);
        fetchAdminData(ticket);
      }
    } catch {
      toast.error("Network error processing approval");
    } finally {
      setApprovingShopId(null);
    }
  }

  function openRejectModal(shopId: string, shopName: string) {
    setRejectTargetShop({ id: shopId, name: shopName });
    setRejectReason("");
    setRejectModalOpen(true);
  }

  async function handleConfirmReject() {
    if (!rejectTargetShop) return;
    setRejectSubmitting(true);
    try {
      await handleApproveShop(rejectTargetShop.id, "rejected", rejectReason.trim() || undefined);
      setRejectModalOpen(false);
      setRejectTargetShop(null);
      setRejectReason("");
    } finally {
      setRejectSubmitting(false);
    }
  }

  function handleLaunchDashboard(shopId: string, shopName: string) {
    toast.success(`Opening preview dashboard for "${shopName}"...`);
    window.location.href = `/dashboard?shopId=${encodeURIComponent(shopId)}`;
  }

  async function loadBotConfig() {
    try {
      const headersInit: Record<string, string> = {};
      if (ticket) headersInit["x-admin-ticket"] = ticket;
      const res = await fetch("/api/admin/bot-config", { headers: headersInit });
      const data = await res.json();
      if (data.success && data.config) {
        setBotConfig(data.config);
      }
    } catch (err) {
      console.error("Failed to load bot config:", err);
    }
  }

  async function handleSaveBotConfig(e: React.FormEvent) {
    e.preventDefault();
    setBotConfigSaving(true);
    try {
      const headersInit: Record<string, string> = { "Content-Type": "application/json" };
      if (ticket) headersInit["x-admin-ticket"] = ticket;
      const res = await fetch("/api/admin/bot-config", {
        method: "POST",
        headers: headersInit,
        body: JSON.stringify(botConfig),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to save bot configuration");
      } else {
        toast.success("Bot & Discord configuration saved successfully!");
      }
    } catch {
      toast.error("Network error saving configuration");
    } finally {
      setBotConfigSaving(false);
    }
  }

  // ─── Render: Lockdown Screen ──────────────────────────────────────────────
  if (isLockdownBlocked) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--color-background)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div
          className="card"
          style={{
            maxWidth: 500,
            width: "100%",
            padding: 36,
            textAlign: "center",
            border: "1px solid rgba(239, 68, 68, 0.4)",
            background: "var(--color-surface)",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "var(--radius-md)",
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 18px",
            }}
          >
            <ShieldAlert size={28} />
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, color: "#f87171", letterSpacing: "-0.02em" }}>
            Platform Lockdown Active
          </h2>
          <p style={{ fontSize: 13, color: "var(--color-muted-foreground)", lineHeight: 1.6, marginBottom: 24 }}>
            {lockdownMessage ||
              "An emergency lockdown has been initiated. All ordinary administrative privileges are suspended platform-wide. Only the Super-Admin with master credentials can lift this state."}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              onClick={() => {
                setIsLockdownBlocked(false);
                setIsUnlocked(false);
              }}
              className="btn btn-primary"
              style={{
                width: "100%",
                padding: "12px",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              Authenticate with Master Super-Admin Key
            </button>

            <Link href="/dashboard" className="btn btn-ghost" style={{ width: "100%", fontSize: 13 }}>
              Return to Merchant Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render: Loading State ────────────────────────────────────────────────
  if (dataLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--color-background)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
        }}
      >
        <Loader2 size={36} className="animate-spin" style={{ color: "#818cf8" }} />
        <div style={{ fontSize: 13, color: "var(--color-muted-foreground)", fontWeight: 600 }}>
          {initialIsAdmin ? "Initializing Admin Master Control..." : "Verifying Administrator Access..."}
        </div>
      </div>
    );
  }

  // ─── Render: Locked Gate Screen ───────────────────────────────────────────
  if (!isUnlocked) {
    return (
      <AdminLoginGate
        usernameInput={usernameInput}
        setUsernameInput={setUsernameInput}
        passwordInput={passwordInput}
        setPasswordInput={setPasswordInput}
        loginLoading={loginLoading}
        onUnlock={handleUnlock}
      />
    );
  }

  // ─── Render: Full Admin Dashboard ─────────────────────────────────────────
  const stats = adminData?.stats || {};
  const usersList: any[] = adminData?.users || [];
  const shopsList: any[] = adminData?.shops || [];
  const ordersList: any[] = adminData?.orders || [];
  const payoutsList: any[] = adminData?.payouts || [];
  const discordAdmins = usersList.filter((u) => u.role === "admin");
  const pendingApprovalsCount = (adminData?.approvalRequests || []).filter((r: any) => r.status === "pending").length;
  const pendingPayoutsCount = (adminData?.payouts || []).filter((p: any) => p.status === "pending").length;

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background)", color: "var(--color-foreground)" }}>
      <AdminHeader
        adminData={adminData}
        onShowMasterModal={() => setShowMasterModal(true)}
        onShowPanicModal={() => setShowPanicModal(true)}
        onShowKillSwitchModal={() => setShowKillSwitchModal(true)}
        onLockSession={handleLock}
      />

      <main style={{ maxWidth: 1320, margin: "0 auto", padding: "32px 28px" }}>
        <AdminLockdownBanner
          isSuperAdmin={Boolean(adminData?.isSuperAdmin)}
          blockAllAdmins={Boolean(adminData?.blockAllAdmins)}
          discordUsername={adminData?.discordUsername}
          lockdownLoading={lockdownLoading}
          onToggleLockdown={handleToggleLockdown}
          onShowPanicModal={() => setShowPanicModal(true)}
        />

        <AdminTabsNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isSuperAdmin={Boolean(adminData?.isSuperAdmin || initialIsSuperAdmin)}
          canAccessDebug={Boolean(adminData?.currentUserPermissions?.canAccessDebug)}
          usersCount={usersList.length}
          shopsCount={shopsList.length}
          pendingApprovalsCount={pendingApprovalsCount}
          ordersCount={ordersList.length}
          payoutsCount={pendingPayoutsCount > 0 ? pendingPayoutsCount : payoutsList.length}
          staffCount={discordAdmins.length}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          dataLoading={dataLoading}
          onRefresh={() => fetchAdminData(ticket)}
        />

        {activeTab === "overview" && (
          <AdminOverviewStats
            stats={stats}
            usersList={usersList}
            shopsList={shopsList}
            onNavigateTab={setActiveTab}
            onLaunchDashboard={handleLaunchDashboard}
          />
        )}

        {activeTab === "users" && (
          <AdminUsersTable
            users={usersList}
            shopsCount={shopsList.length}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            deletingId={deletingId}
            onDeleteUser={handleDeleteUser}
            isSuperAdmin={Boolean(adminData?.isSuperAdmin)}
            onToggleAdminPermissions={handleToggleAdminPermissions}
            onLaunchDashboard={handleLaunchDashboard}
          />
        )}

        {activeTab === "shops" && (
          <AdminShopsTable
            shops={shopsList}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            approvingShopId={approvingShopId}
            deletingId={deletingId}
            launchingShopId={launchingShopId}
            onApproveShop={handleApproveShop}
            onOpenRejectModal={openRejectModal}
            onDeleteShop={handleDeleteShop}
            onLaunchDashboard={handleLaunchDashboard}
          />
        )}

        {activeTab === "approvals" && (
          <AdminApprovalsTable
            approvalRequests={adminData?.approvalRequests || []}
            approvingShopId={approvingShopId}
            launchingShopId={launchingShopId}
            onApproveShop={handleApproveShop}
            onOpenRejectModal={openRejectModal}
            onLaunchDashboard={handleLaunchDashboard}
          />
        )}

        {activeTab === "orders" && <AdminOrdersTable orders={ordersList} />}

        {activeTab === "payouts" && (
          <AdminPayoutsTable
            payouts={payoutsList}
            ticket={ticket}
            onRefresh={() => fetchAdminData(ticket)}
            isSuperAdmin={Boolean(adminData?.isSuperAdmin || initialIsSuperAdmin)}
            canManagePayouts={adminData?.currentUserPermissions?.canManagePayouts ?? true}
          />
        )}

        {activeTab === "staff" && (
          <AdminStaffTab
            discordAdmins={discordAdmins}
            blockAllAdmins={Boolean(adminData?.blockAllAdmins)}
            isSuperAdmin={Boolean(adminData?.isSuperAdmin)}
            ticket={ticket}
            onToggleAdminPermissions={handleToggleAdminPermissions}
            onRefresh={() => fetchAdminData(ticket)}
          />
        )}

        {activeTab === "settings" && (
          <AdminPlatformSettingsTab
            isSuperAdmin={Boolean(adminData?.isSuperAdmin || initialIsSuperAdmin)}
            ticket={ticket}
            onShowMasterModal={() => setShowMasterModal(true)}
          />
        )}

        {activeTab === "bot-config" && (
          <AdminBotConfigTab
            isSuperAdmin={Boolean(adminData?.isSuperAdmin || initialIsSuperAdmin)}
            botConfig={botConfig}
            setBotConfig={setBotConfig}
            botConfigSaving={botConfigSaving}
            onSaveBotConfig={handleSaveBotConfig}
            onShowMasterModal={() => setShowMasterModal(true)}
          />
        )}

        {activeTab === "debug" && (
          <AdminDebugTab
            isSuperAdmin={Boolean(adminData?.isSuperAdmin || initialIsSuperAdmin)}
            ticket={ticket}
            currentUserPermissions={adminData?.currentUserPermissions}
          />
        )}

        <AdminPanicModal
          isOpen={showPanicModal}
          panicLoading={lockdownLoading}
          onClose={() => setShowPanicModal(false)}
          onConfirmPanic={handleOrdinaryAdminPanicLock}
        />

        <AdminKillSwitchModal
          isOpen={showKillSwitchModal}
          isCurrentlyLocked={Boolean(adminData?.blockAllAdmins)}
          loading={lockdownLoading}
          onClose={() => setShowKillSwitchModal(false)}
          onConfirmToggle={async () => {
            await handleToggleLockdown();
            setShowKillSwitchModal(false);
          }}
        />

        <AdminMasterModal
          isOpen={showMasterModal}
          usernameInput={usernameInput}
          setUsernameInput={setUsernameInput}
          passwordInput={passwordInput}
          setPasswordInput={setPasswordInput}
          loginLoading={loginLoading}
          onClose={() => {
            setShowMasterModal(false);
            setPasswordInput("");
          }}
          onUnlock={handleUnlock}
        />

        <AdminRejectModal
          isOpen={rejectModalOpen}
          targetShop={rejectTargetShop}
          rejectReason={rejectReason}
          setRejectReason={setRejectReason}
          rejectSubmitting={rejectSubmitting}
          onClose={() => {
            setRejectModalOpen(false);
            setRejectTargetShop(null);
            setRejectReason("");
          }}
          onConfirmReject={handleConfirmReject}
        />
      </main>
    </div>
  );
}
