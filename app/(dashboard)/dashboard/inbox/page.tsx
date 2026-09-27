"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Inbox,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Bell,
  Trash2,
  CheckCheck,
  Loader2,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { useToast } from "@/components/toast-context";

interface NotificationItem {
  id: string;
  userId: string;
  shopId: string | null;
  type: string;
  title: string;
  message: string;
  reason: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function InboxPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "status">("all");
  const [actionLoading, setActionLoading] = useState(false);
  const toast = useToast();

  async function loadNotifications() {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  async function handleMarkAllRead() {
    try {
      setActionLoading(true);
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        toast.success("Inbox Updated", "All notifications marked as read.");
        window.dispatchEvent(new CustomEvent("notifications-updated"));
      }
    } catch {
      toast.error("Error", "Could not mark notifications as read.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleMarkSingleRead(id: string, currentRead: boolean) {
    if (currentRead) return;
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        window.dispatchEvent(new CustomEvent("notifications-updated"));
      }
    } catch {
      toast.error("Error", "Failed to update notification.");
    }
  }

  async function handleDeleteSingle(id: string) {
    try {
      const res = await fetch(`/api/notifications?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        toast.success("Deleted", "Notification removed.");
        window.dispatchEvent(new CustomEvent("notifications-updated"));
      }
    } catch {
      toast.error("Error", "Failed to delete notification.");
    }
  }

  async function handleClearAll() {
    if (!confirm("Are you sure you want to clear all notifications from your inbox?")) return;
    try {
      setActionLoading(true);
      const res = await fetch("/api/notifications?all=true", {
        method: "DELETE",
      });
      if (res.ok) {
        setNotifications([]);
        toast.success("Inbox Cleared", "All notifications have been removed.");
        window.dispatchEvent(new CustomEvent("notifications-updated"));
      }
    } catch {
      toast.error("Error", "Failed to clear inbox.");
    } finally {
      setActionLoading(false);
    }
  }

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.isRead;
    if (filter === "status") return n.type === "store_approved" || n.type === "store_rejected";
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="page-fly-in" style={{ maxWidth: 960, margin: "0 auto", paddingBottom: 60, width: "100%" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Inbox</h1>
            {unreadCount > 0 && (
              <span
                style={{
                  background: "var(--color-primary)",
                  color: "var(--color-primary-foreground)",
                  fontSize: 11,
                  fontWeight: 800,
                  padding: "2px 8px",
                  borderRadius: 12,
                }}
              >
                {unreadCount} new
              </span>
            )}
          </div>
          <p style={{ margin: "4px 0 0", color: "var(--color-muted-foreground)", fontSize: 14 }}>
            System updates, moderation verdicts, and store activity.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={actionLoading}
              className="btn btn-secondary"
              style={{ fontSize: 12, padding: "7px 12px", gap: 6 }}
            >
              <CheckCheck size={14} />
              <span>Mark all read</span>
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              disabled={actionLoading}
              className="btn btn-ghost"
              style={{ fontSize: 12, padding: "7px 12px", color: "var(--color-danger)", gap: 6 }}
            >
              <Trash2 size={14} />
              <span>Clear all</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs / Filters */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 20,
          borderBottom: "1px solid var(--color-border)",
          paddingBottom: 10,
        }}
      >
        <button
          onClick={() => setFilter("all")}
          className={`btn ${filter === "all" ? "btn-primary" : "btn-ghost"}`}
          style={{ fontSize: 13, padding: "6px 14px", height: "auto" }}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`btn ${filter === "unread" ? "btn-primary" : "btn-ghost"}`}
          style={{ fontSize: 13, padding: "6px 14px", height: "auto" }}
        >
          Unread ({unreadCount})
        </button>
        <button
          onClick={() => setFilter("status")}
          className={`btn ${filter === "status" ? "btn-primary" : "btn-ghost"}`}
          style={{ fontSize: 13, padding: "6px 14px", height: "auto" }}
        >
          Store Verdicts
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="card" style={{ padding: "18px 20px", display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--skeleton-base)", flexShrink: 0 }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div style={{ width: "35%", height: 16, borderRadius: 4, background: "var(--skeleton-base)" }} />
                  <div style={{ width: 90, height: 12, borderRadius: 4, background: "var(--skeleton-base)", opacity: 0.6 }} />
                </div>
                <div style={{ width: "75%", height: 13, borderRadius: 4, background: "var(--skeleton-base)", opacity: 0.8 }} />
              </div>
            </div>
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div
          className="card"
          style={{
            padding: 48,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "var(--color-surface-2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
              color: "var(--color-muted-foreground)",
            }}
          >
            <Inbox size={26} />
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 6px" }}>Your inbox is clean</h3>
          <p style={{ fontSize: 13, color: "var(--color-muted-foreground)", margin: 0, maxWidth: 360 }}>
            {filter === "unread"
              ? "No unread notifications at the moment."
              : "When admin approves or rejects your store submissions, decisions and reasons will appear here."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filteredNotifications.map((notif) => {
            const isRejected = notif.type === "store_rejected";
            const isApproved = notif.type === "store_approved";

            return (
              <div
                key={notif.id}
                className="card"
                onClick={() => handleMarkSingleRead(notif.id, notif.isRead)}
                style={{
                  padding: "18px 20px",
                  borderRadius: "var(--radius-lg, 14px)",
                  background: notif.isRead ? "var(--color-surface)" : "var(--color-surface-2)",
                  border: isRejected
                    ? "1px solid rgba(239, 68, 68, 0.35)"
                    : isApproved
                    ? "1px solid rgba(34, 197, 94, 0.35)"
                    : "1px solid var(--color-border)",
                  boxShadow: notif.isRead ? "none" : "0 4px 18px rgba(0,0,0,0.12)",
                  transition: "all 0.15s ease",
                  position: "relative",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  {/* Status Icon */}
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: isRejected
                        ? "rgba(239, 68, 68, 0.15)"
                        : isApproved
                        ? "rgba(34, 197, 94, 0.15)"
                        : "var(--color-surface-2)",
                      color: isRejected ? "#ef4444" : isApproved ? "#22c55e" : "var(--color-foreground)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    {isRejected ? (
                      <XCircle size={22} />
                    ) : isApproved ? (
                      <CheckCircle2 size={22} />
                    ) : (
                      <Bell size={20} />
                    )}
                  </div>

                  {/* Body */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <h4
                          style={{
                            margin: 0,
                            fontSize: 15,
                            fontWeight: notif.isRead ? 600 : 700,
                            color: "var(--color-foreground)",
                          }}
                        >
                          {notif.title}
                        </h4>
                        {!notif.isRead && (
                          <span
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: "50%",
                              background: "var(--color-foreground)",
                              boxShadow: "0 0 6px var(--color-primary-glow)",
                              display: "inline-block",
                            }}
                          />
                        )}
                        {isRejected && (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "2px 7px",
                              borderRadius: 4,
                              background: "rgba(239, 68, 68, 0.18)",
                              color: "#ef4444",
                              textTransform: "uppercase",
                              letterSpacing: "0.04em",
                            }}
                          >
                            Rejected
                          </span>
                        )}
                        {isApproved && (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "2px 7px",
                              borderRadius: 4,
                              background: "rgba(34, 197, 94, 0.18)",
                              color: "#22c55e",
                              textTransform: "uppercase",
                              letterSpacing: "0.04em",
                            }}
                          >
                            Approved
                          </span>
                        )}
                      </div>

                      <span style={{ fontSize: 12, color: "var(--color-muted-foreground)", flexShrink: 0 }}>
                        {new Date(notif.createdAt).toLocaleDateString()} at{" "}
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <p style={{ margin: "4px 0 0", fontSize: 13.5, color: "var(--color-muted-foreground)", lineHeight: 1.5 }}>
                      {notif.message}
                    </p>

                    {/* Admin Rejection Reason Box */}
                    {isRejected && notif.reason && (
                      <div
                        style={{
                          marginTop: 12,
                          padding: "12px 14px",
                          borderRadius: 8,
                          background: "rgba(239, 68, 68, 0.08)",
                          borderLeft: "3px solid #ef4444",
                        }}
                      >
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>
                          Reason from Moderation Team
                        </div>
                        <div style={{ fontSize: 13, color: "var(--color-foreground)", fontWeight: 500, lineHeight: 1.4 }}>
                          "{notif.reason}"
                        </div>
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, paddingTop: 10, borderTop: "1px solid var(--color-border)" }}>
                      <div style={{ display: "flex", gap: 10 }}>
                        {isRejected && (
                          <Link
                            href="/dashboard/storefront"
                            className="btn btn-secondary"
                            style={{ fontSize: 11, padding: "4px 10px", gap: 5 }}
                          >
                            <span>Edit Store Details</span>
                            <ArrowRight size={11} />
                          </Link>
                        )}
                        {isApproved && notif.shopId && (
                          <Link
                            href="/dashboard/storefront"
                            className="btn btn-secondary"
                            style={{ fontSize: 11, padding: "4px 10px", gap: 5 }}
                          >
                            <span>Open Storefront</span>
                            <ExternalLink size={11} />
                          </Link>
                        )}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSingle(notif.id);
                        }}
                        className="btn btn-ghost"
                        style={{ padding: "4px 8px", color: "var(--color-muted-foreground)", fontSize: 11, gap: 4 }}
                        title="Delete notification"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
