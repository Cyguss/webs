"use client";

import React, { useState } from "react";
import {
  Wallet,
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  Check,
  Search,
  ExternalLink,
  AlertTriangle,
  Loader2,
  Coins,
  ShieldCheck,
  MessageSquare,
  HelpCircle,
} from "lucide-react";
import { useToast } from "@/components/toast-context";

export interface PayoutItem {
  id: string;
  userId: string;
  amountRequested: string;
  feeAmount: string;
  amountSent?: string | null;
  method: string;
  destinationAddress: string;
  cryptoCurrency?: string | null;
  status: "pending" | "completed" | "rejected" | "failed";
  adminNote?: string | null;
  processedAt?: string | null;
  createdAt: string;
  merchantName?: string;
  merchantEmail?: string;
  merchantDiscord?: string | null;
  shopName?: string | null;
  shopSlug?: string | null;
}

interface AdminPayoutsTableProps {
  payouts: PayoutItem[];
  ticket?: string | null;
  onRefresh?: () => void;
  isSuperAdmin?: boolean;
  canManagePayouts?: boolean;
}

export function AdminPayoutsTable({
  payouts,
  ticket,
  onRefresh,
  isSuperAdmin = true,
  canManagePayouts = true,
}: AdminPayoutsTableProps) {
  const toast = useToast();
  const [filter, setFilter] = useState<"pending" | "completed" | "rejected" | "all">("pending");
  const [search, setSearch] = useState("");
  const [currencyFilter, setCurrencyFilter] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals state
  const [acceptModalPayout, setAcceptModalPayout] = useState<PayoutItem | null>(null);
  const [rejectModalPayout, setRejectModalPayout] = useState<PayoutItem | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to Clipboard", text);
    setTimeout(() => {
      setCopiedId((current) => (current === id ? null : current));
    }, 2000);
  };

  // Submit action (Approve or Reject)
  const handleProcessPayout = async (action: "approve" | "reject") => {
    const targetPayout = action === "approve" ? acceptModalPayout : rejectModalPayout;
    if (!targetPayout) return;

    if (action === "reject" && !adminNoteInput.trim()) {
      toast.error("Rejection Reason Required", "Please provide a reason for rejecting this payout request.");
      return;
    }

    try {
      setActionLoading(true);
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (ticket) {
        headers["x-admin-ticket"] = ticket;
      }

      const res = await fetch("/api/admin/payouts", {
        method: "POST",
        headers,
        body: JSON.stringify({
          payoutId: targetPayout.id,
          action,
          adminNote: adminNoteInput.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process payout request.");
      }

      if (action === "approve") {
        toast.success(
          "Payout Approved & Finalized",
          `Payout of $${parseFloat(targetPayout.amountRequested).toFixed(2)} marked as completed. Merchant notified.`
        );
      } else {
        toast.success(
          "Payout Rejected & Refunded",
          `$${parseFloat(targetPayout.amountRequested).toFixed(2)} refunded back to merchant balance. Merchant notified.`
        );
      }

      setAcceptModalPayout(null);
      setRejectModalPayout(null);
      setAdminNoteInput("");
      if (onRefresh) {
        onRefresh();
      }
    } catch (err: any) {
      toast.error("Action Failed", err.message || "Failed to process payout.");
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered list
  const filteredPayouts = payouts.filter((p) => {
    // Status filter
    if (filter === "pending" && p.status !== "pending") return false;
    if (filter === "completed" && p.status !== "completed") return false;
    if (filter === "rejected" && p.status !== "rejected" && p.status !== "failed") return false;

    // Currency filter
    if (currencyFilter !== "all") {
      const cur = (p.cryptoCurrency || p.method || "").toUpperCase();
      if (cur !== currencyFilter.toUpperCase()) return false;
    }

    // Search filter
    if (search.trim()) {
      const s = search.toLowerCase();
      const matchMerchant = (p.merchantName || "").toLowerCase().includes(s);
      const matchEmail = (p.merchantEmail || "").toLowerCase().includes(s);
      const matchShop = (p.shopName || "").toLowerCase().includes(s);
      const matchAddress = (p.destinationAddress || "").toLowerCase().includes(s);
      const matchId = (p.id || "").toLowerCase().includes(s);
      if (!matchMerchant && !matchEmail && !matchShop && !matchAddress && !matchId) {
        return false;
      }
    }

    return true;
  });

  const pendingCount = payouts.filter((p) => p.status === "pending").length;
  const completedCount = payouts.filter((p) => p.status === "completed").length;
  const rejectedCount = payouts.filter((p) => p.status === "rejected" || p.status === "failed").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Top Banner / Card */}
      <div
        className="card"
        style={{
          padding: "24px 28px",
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)",
          border: "1px solid rgba(99, 102, 241, 0.25)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: "rgba(99, 102, 241, 0.18)",
                border: "1px solid rgba(99, 102, 241, 0.4)",
                color: "#818cf8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Wallet size={24} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Manual Payout Processing</h2>
                {pendingCount > 0 ? (
                  <span
                    style={{
                      background: "rgba(245, 158, 11, 0.2)",
                      border: "1px solid rgba(245, 158, 11, 0.5)",
                      color: "#fbbf24",
                      fontSize: 11,
                      fontWeight: 800,
                      padding: "2px 9px",
                      borderRadius: 12,
                      letterSpacing: "0.02em",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />
                    {pendingCount} Pending Request{pendingCount === 1 ? "" : "s"}
                  </span>
                ) : (
                  <span
                    style={{
                      background: "rgba(34, 197, 94, 0.15)",
                      border: "1px solid rgba(34, 197, 94, 0.3)",
                      color: "#22c55e",
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 12,
                    }}
                  >
                    Queue Clear
                  </span>
                )}
              </div>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--color-muted-foreground)", maxWidth: 640 }}>
                All payouts are executed <strong>manually outside the website</strong> (via your crypto wallet or exchange).
                Copy the destination address, dispatch the transfer, and click <strong>Accept</strong> to finalize the request
                and notify the merchant in their inbox.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <a
              href="https://discord.gg/krypt"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{ fontSize: 12, padding: "7px 12px", gap: 6, color: "#818cf8" }}
            >
              <MessageSquare size={14} />
              <span>Discord Support Channel</span>
            </a>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div
        className="card"
        style={{
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 14,
        }}
      >
        {/* Status Filter Tabs */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={() => setFilter("pending")}
            className={`btn ${filter === "pending" ? "btn-primary" : "btn-ghost"}`}
            style={{ fontSize: 12, padding: "6px 14px", height: "auto", position: "relative" }}
          >
            <Clock size={14} />
            <span>Pending Review</span>
            {pendingCount > 0 && (
              <span
                style={{
                  background: filter === "pending" ? "#ffffff" : "#f59e0b",
                  color: filter === "pending" ? "#0f172a" : "#ffffff",
                  fontSize: 10,
                  fontWeight: 800,
                  padding: "1px 6px",
                  borderRadius: 10,
                  marginLeft: 4,
                }}
              >
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setFilter("completed")}
            className={`btn ${filter === "completed" ? "btn-primary" : "btn-ghost"}`}
            style={{ fontSize: 12, padding: "6px 14px", height: "auto" }}
          >
            <CheckCircle2 size={14} />
            <span>Completed ({completedCount})</span>
          </button>

          <button
            onClick={() => setFilter("rejected")}
            className={`btn ${filter === "rejected" ? "btn-primary" : "btn-ghost"}`}
            style={{ fontSize: 12, padding: "6px 14px", height: "auto" }}
          >
            <XCircle size={14} />
            <span>Rejected ({rejectedCount})</span>
          </button>

          <button
            onClick={() => setFilter("all")}
            className={`btn ${filter === "all" ? "btn-primary" : "btn-ghost"}`}
            style={{ fontSize: 12, padding: "6px 14px", height: "auto" }}
          >
            <span>All ({payouts.length})</span>
          </button>
        </div>

        {/* Search & Currency Filter */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", flex: 1, justifyContent: "flex-end", maxWidth: 540 }}>
          <div style={{ position: "relative", minWidth: 220, flex: 1 }}>
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
              className="input"
              placeholder="Search merchant, email, address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ fontSize: 12, paddingLeft: 32, height: 34, width: "100%" }}
            />
          </div>

          <select
            className="input"
            value={currencyFilter}
            onChange={(e) => setCurrencyFilter(e.target.value)}
            style={{ fontSize: 12, height: 34, width: 110, padding: "0 8px" }}
          >
            <option value="all">All Coins</option>
            <option value="LTC">LTC</option>
            <option value="BTC">BTC</option>
            <option value="USDT">USDT</option>
            <option value="XMR">XMR</option>
          </select>
        </div>
      </div>

      {/* Main Payouts Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {filteredPayouts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--color-muted-foreground)" }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: "var(--color-surface-2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 14px",
                color: "var(--color-muted-foreground)",
              }}
            >
              <Wallet size={24} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 6px", color: "var(--color-foreground)" }}>
              No Payout Requests Found
            </h3>
            <p style={{ fontSize: 13, margin: 0 }}>
              {filter === "pending"
                ? "There are currently no merchant payouts awaiting manual approval."
                : "No payout requests match the selected filters."}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid var(--color-border)",
                    background: "var(--color-surface-2)",
                    color: "var(--color-muted-foreground)",
                    fontSize: 11.5,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  <th style={{ padding: "12px 18px", fontWeight: 700 }}>Merchant</th>
                  <th style={{ padding: "12px 18px", fontWeight: 700 }}>Amount Requested</th>
                  <th style={{ padding: "12px 18px", fontWeight: 700 }}>Asset / Method</th>
                  <th style={{ padding: "12px 18px", fontWeight: 700 }}>Destination Address</th>
                  <th style={{ padding: "12px 18px", fontWeight: 700 }}>Status</th>
                  <th style={{ padding: "12px 18px", fontWeight: 700 }}>Date Submitted</th>
                  <th style={{ padding: "12px 18px", fontWeight: 700, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayouts.map((p) => {
                  const isPending = p.status === "pending";
                  const isCompleted = p.status === "completed";
                  const isRejected = p.status === "rejected" || p.status === "failed";
                  const requestedNum = parseFloat(p.amountRequested || "0");
                  const coin = (p.cryptoCurrency || p.method || "CRYPTO").toUpperCase();

                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: "1px solid var(--color-border)",
                        background: isPending ? "rgba(245, 158, 11, 0.03)" : "transparent",
                        transition: "background 0.15s ease",
                      }}
                    >
                      {/* Merchant Column */}
                      <td style={{ padding: "14px 18px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          <span style={{ fontWeight: 700, color: "var(--color-foreground)" }}>
                            {p.merchantName || "Unknown Merchant"}
                          </span>
                          <span style={{ fontSize: 11.5, color: "var(--color-muted-foreground)" }}>
                            {p.merchantEmail || p.userId.slice(0, 12)}
                          </span>
                          {p.shopName && (
                            <span
                              style={{
                                fontSize: 10.5,
                                color: "#818cf8",
                                background: "rgba(99, 102, 241, 0.12)",
                                padding: "1px 6px",
                                borderRadius: 4,
                                width: "fit-content",
                                marginTop: 2,
                              }}
                            >
                              Shop: {p.shopName}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Amount Column */}
                      <td style={{ padding: "14px 18px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <span style={{ fontSize: 16, fontWeight: 800, color: "var(--color-foreground)" }}>
                            ${requestedNum.toFixed(2)}
                          </span>
                          <span style={{ fontSize: 11, color: "var(--color-muted-foreground)" }}>
                            Zero fee withdrawal
                          </span>
                        </div>
                      </td>

                      {/* Asset / Method */}
                      <td style={{ padding: "14px 18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Coins size={15} color="#f59e0b" />
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              background: "var(--color-surface-2)",
                              padding: "3px 8px",
                              borderRadius: 6,
                              border: "1px solid var(--color-border)",
                            }}
                          >
                            {coin}
                          </span>
                        </div>
                      </td>

                      {/* Destination Address + 1-Click Copy */}
                      <td style={{ padding: "14px 18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, maxWidth: 280 }}>
                          <span
                            title={p.destinationAddress}
                            style={{
                              fontFamily: "monospace",
                              fontSize: 11.5,
                              color: "var(--color-foreground)",
                              background: "var(--color-surface-2)",
                              padding: "4px 8px",
                              borderRadius: 4,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              border: "1px solid var(--color-border)",
                            }}
                          >
                            {p.destinationAddress}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(p.destinationAddress, `addr-${p.id}`)}
                            className="btn btn-ghost"
                            style={{
                              padding: "4px 6px",
                              height: 28,
                              color: copiedId === `addr-${p.id}` ? "#22c55e" : "var(--color-muted-foreground)",
                              flexShrink: 0,
                            }}
                            title="Copy Wallet Address to Clipboard"
                          >
                            {copiedId === `addr-${p.id}` ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: "14px 18px" }}>
                        {isPending && (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              padding: "3px 8px",
                              borderRadius: 6,
                              background: "rgba(245, 158, 11, 0.18)",
                              color: "#f59e0b",
                              border: "1px solid rgba(245, 158, 11, 0.4)",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                            }}
                          >
                            <Clock size={12} />
                            PENDING
                          </span>
                        )}
                        {isCompleted && (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              padding: "3px 8px",
                              borderRadius: 6,
                              background: "rgba(34, 197, 94, 0.18)",
                              color: "#22c55e",
                              border: "1px solid rgba(34, 197, 94, 0.4)",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                            }}
                          >
                            <CheckCircle2 size={12} />
                            COMPLETED
                          </span>
                        )}
                        {isRejected && (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              padding: "3px 8px",
                              borderRadius: 6,
                              background: "rgba(239, 68, 68, 0.18)",
                              color: "#ef4444",
                              border: "1px solid rgba(239, 68, 68, 0.4)",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                            }}
                          >
                            <XCircle size={12} />
                            REJECTED
                          </span>
                        )}
                      </td>

                      {/* Submitted Date */}
                      <td style={{ padding: "14px 18px", fontSize: 12, color: "var(--color-muted-foreground)" }}>
                        <div>{new Date(p.createdAt).toLocaleDateString()}</div>
                        <div style={{ fontSize: 11, opacity: 0.8 }}>
                          {new Date(p.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "14px 18px", textAlign: "right" }}>
                        {isPending ? (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                            <button
                              type="button"
                              onClick={() => {
                                setAcceptModalPayout(p);
                                setAdminNoteInput("");
                              }}
                              disabled={!canManagePayouts}
                              className="btn btn-primary"
                              style={{
                                fontSize: 12,
                                padding: "6px 12px",
                                height: 32,
                                background: "#16a34a",
                                borderColor: "#16a34a",
                                color: "#ffffff",
                                gap: 5,
                              }}
                              title={canManagePayouts ? "Accept and finalize payout" : "No permission"}
                            >
                              <CheckCircle2 size={14} />
                              <span>Accept</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setRejectModalPayout(p);
                                setAdminNoteInput("");
                              }}
                              disabled={!canManagePayouts}
                              className="btn btn-ghost"
                              style={{
                                fontSize: 12,
                                padding: "6px 12px",
                                height: 32,
                                color: "#ef4444",
                                border: "1px solid rgba(239, 68, 68, 0.3)",
                                background: "rgba(239, 68, 68, 0.08)",
                                gap: 5,
                              }}
                              title={canManagePayouts ? "Reject and refund to balance" : "No permission"}
                            >
                              <XCircle size={14} />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                            {p.adminNote && (
                              <span
                                title={p.adminNote}
                                style={{
                                  fontSize: 11,
                                  color: "var(--color-muted-foreground)",
                                  maxWidth: 180,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {p.adminNote}
                              </span>
                            )}
                            {p.processedAt && (
                              <span style={{ fontSize: 10.5, color: "var(--color-muted-foreground)", opacity: 0.7 }}>
                                Processed {new Date(p.processedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── MODAL: Accept Payout ─── */}
      {acceptModalPayout && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(5px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            className="card modal-fly-in"
            style={{
              width: "100%",
              maxWidth: 520,
              background: "var(--color-surface)",
              boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
              border: "1px solid rgba(34, 197, 94, 0.4)",
              position: "relative",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: "50%",
                  background: "rgba(34, 197, 94, 0.15)",
                  color: "#22c55e",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Accept Payout Request</h3>
                <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "var(--color-muted-foreground)" }}>
                  Mark manual payout as completed & dispatch Inbox confirmation.
                </p>
              </div>
            </div>

            {/* Payout Details Card */}
            <div
              style={{
                padding: "14px 16px",
                borderRadius: "var(--radius-md)",
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "var(--color-muted-foreground)" }}>Merchant:</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>
                  {acceptModalPayout.merchantName} ({acceptModalPayout.merchantEmail})
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "var(--color-muted-foreground)" }}>Amount to Send:</span>
                <span style={{ fontSize: 18, fontWeight: 900, color: "#22c55e" }}>
                  ${parseFloat(acceptModalPayout.amountRequested).toFixed(2)} USD
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "var(--color-muted-foreground)" }}>Asset / Network:</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>
                  {(acceptModalPayout.cryptoCurrency || acceptModalPayout.method).toUpperCase()}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "var(--color-muted-foreground)" }}>Destination Wallet Address:</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(acceptModalPayout.destinationAddress, "modal-accept-addr")}
                    className="btn btn-ghost"
                    style={{ fontSize: 11, padding: "2px 8px", height: "auto", color: "#818cf8", gap: 4 }}
                  >
                    {copiedId === "modal-accept-addr" ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedId === "modal-accept-addr" ? "Copied" : "Copy Address"}</span>
                  </button>
                </div>
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: 12,
                    background: "var(--color-background)",
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: "1px solid var(--color-border)",
                    wordBreak: "break-all",
                    userSelect: "all",
                  }}
                >
                  {acceptModalPayout.destinationAddress}
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                background: "rgba(99, 102, 241, 0.08)",
                border: "1px solid rgba(99, 102, 241, 0.25)",
                fontSize: 12,
                color: "var(--color-foreground)",
                marginBottom: 16,
                lineHeight: 1.5,
              }}
            >
              <strong>Important:</strong> Disburse this payment manually outside KRYPT (e.g. via Binance, Exodus, or hardware wallet).
              Once sent, confirm below. Money is officially deducted from merchant balance and an Inbox notification with Discord contact link is sent automatically.
            </div>

            {/* Optional Memo / TXID */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
              <label className="label" style={{ fontSize: 12.5 }}>
                Transaction Hash / Admin Memo (Optional)
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g. TXID: 0x93bf... or Sent via Binance"
                value={adminNoteInput}
                onChange={(e) => setAdminNoteInput(e.target.value)}
              />
            </div>

            {/* Modal Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setAcceptModalPayout(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleProcessPayout("approve")}
                disabled={actionLoading}
                style={{ background: "#16a34a", borderColor: "#16a34a", minWidth: 150, gap: 6 }}
              >
                {actionLoading ? (
                  <>
                    <Loader2 size={15} className="spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={15} />
                    <span>Confirm & Accept</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Reject Payout ─── */}
      {rejectModalPayout && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(5px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            className="card modal-fly-in"
            style={{
              width: "100%",
              maxWidth: 500,
              background: "var(--color-surface)",
              boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              position: "relative",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: "50%",
                  background: "rgba(239, 68, 68, 0.15)",
                  color: "#ef4444",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <XCircle size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "#f87171" }}>
                  Reject Payout Request
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "var(--color-muted-foreground)" }}>
                  Refund funds back to merchant available balance.
                </p>
              </div>
            </div>

            {/* Payout Summary */}
            <div
              style={{
                padding: "12px 14px",
                borderRadius: "var(--radius-md)",
                background: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              <div>
                Merchant: <strong>{rejectModalPayout.merchantName}</strong> ({rejectModalPayout.merchantEmail})
              </div>
              <div style={{ marginTop: 4 }}>
                Amount to Refund: <strong>${parseFloat(rejectModalPayout.amountRequested).toFixed(2)} USD</strong>
              </div>
            </div>

            {/* Rejection Reason Input */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
              <label className="label" style={{ fontSize: 12.5, color: "var(--color-foreground)" }}>
                Rejection Reason (Required — shown in merchant inbox) *
              </label>
              <textarea
                className="input"
                rows={3}
                placeholder="e.g. Invalid Litecoin address provided. Please check address format and submit a new request."
                value={adminNoteInput}
                onChange={(e) => setAdminNoteInput(e.target.value)}
                style={{ resize: "vertical" }}
              />
            </div>

            {/* Note */}
            <p style={{ fontSize: 12, color: "var(--color-muted-foreground)", margin: "0 0 20px" }}>
              Upon confirming rejection, the held funds ($
              {parseFloat(rejectModalPayout.amountRequested).toFixed(2)}) will immediately return to the merchant's
              available balance. An Inbox notification will be delivered with Discord support contact details.
            </p>

            {/* Modal Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setRejectModalPayout(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleProcessPayout("reject")}
                disabled={actionLoading || !adminNoteInput.trim()}
                style={{ background: "#dc2626", borderColor: "#dc2626", minWidth: 150, gap: 6 }}
              >
                {actionLoading ? (
                  <>
                    <Loader2 size={15} className="spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <XCircle size={15} />
                    <span>Confirm Rejection</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
