"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Wrench,
  AlertTriangle,
  RotateCcw,
  CreditCard,
  Coins,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldAlert,
  Wallet,
  Inbox,
  FileText,
  DollarSign,
} from "lucide-react";
import { useToast } from "@/components/toast-context";
import { formatCurrency } from "@/lib/utils";

interface AdminDebugTabProps {
  isSuperAdmin?: boolean;
  ticket?: string | null;
  currentUserPermissions?: any;
}

interface DebugCandidateOrder {
  id: string;
  buyerEmail: string;
  totalAmount: string;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  shopId: string | null;
  shopName: string | null;
  shopSlug: string | null;
  merchantUserId: string | null;
  productTitle: string | null;
}

interface ReversalExecutionReport {
  success: boolean;
  message?: string;
  eventId?: string;
  reversalType?: string;
  order?: {
    id: string;
    buyerEmail: string;
    totalAmount: string;
    previousPaymentStatus: string;
    newPaymentStatus: string;
  };
  merchant?: {
    id?: string;
    name?: string;
    email?: string;
    shopName?: string;
    shopId?: string;
  };
  balances?: {
    previousAvailable: string;
    previousPending: string;
    newAvailable: string;
    newPending: string;
    isDebt: boolean;
    debtAmount: number;
  };
  reversalResult?: any;
}

export function AdminDebugTab({
  isSuperAdmin = false,
  ticket = null,
  currentUserPermissions,
}: AdminDebugTabProps) {
  const toast = useToast();

  const [orders, setOrders] = useState<DebugCandidateOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderSearch, setOrderSearch] = useState("");

  // Form state
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [reversalType, setReversalType] = useState<"dispute" | "refund" | "chargeback" | "reversal" | "dispute_won">("dispute");
  const [customAmount, setCustomAmount] = useState<string>("");
  const [reason, setReason] = useState<string>("Buyer opened dispute: Unauthorized transaction / charge not recognized");
  const [executing, setExecuting] = useState(false);

  // Execution result
  const [report, setReport] = useState<ReversalExecutionReport | null>(null);

  async function loadCandidateOrders() {
    setLoadingOrders(true);
    try {
      const headersInit: Record<string, string> = {};
      if (ticket) headersInit["x-admin-ticket"] = ticket;

      const res = await fetch("/api/admin/debug/reverse-payment", {
        headers: headersInit,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to load debug orders");
      }

      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err: any) {
      toast.error("Failed to load orders", err.message || "Network error");
    } finally {
      setLoadingOrders(false);
    }
  }

  useEffect(() => {
    loadCandidateOrders();
  }, [ticket, isSuperAdmin]);

  function handleTypeChange(type: "dispute" | "refund" | "chargeback" | "reversal" | "dispute_won") {
    setReversalType(type);
    if (type === "dispute") {
      setReason("Buyer opened dispute: Unauthorized transaction / charge not recognized");
    } else if (type === "dispute_won") {
      setReason("Dispute resolved in merchant favor: Proof of delivery provided");
    } else if (type === "refund") {
      setReason("Merchant / Customer agreed refund");
    } else if (type === "chargeback") {
      setReason("Card issuer chargeback received");
    } else {
      setReason("Provider-initiated payment reversal");
    }
  }

  function handleSelectOrder(o: DebugCandidateOrder) {
    setSelectedOrderId(o.id);
    setCustomAmount(parseFloat(o.totalAmount).toFixed(2));
    if (reversalType === "dispute") {
      setReason(`Buyer dispute on Order #${o.id.slice(0, 8)}: Unauthorized transaction`);
    } else if (reversalType === "dispute_won") {
      setReason(`Dispute won for Order #${o.id.slice(0, 8)}: Evidence accepted`);
    } else {
      setReason(`Debug simulated ${reversalType} for Order #${o.id.slice(0, 8)}`);
    }
    setReport(null);
  }

  async function handleExecuteReversal(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOrderId.trim()) {
      toast.error("Order ID Required", "Please select or input an order ID to process.");
      return;
    }

    const orderObj = orders.find((o) => o.id === selectedOrderId.trim());
    const isDispute = reversalType === "dispute";
    const isDisputeWon = reversalType === "dispute_won";
    const confirmPrompt = isDispute
      ? `Simulate BUYER DISPUTE on Order #${selectedOrderId.slice(0, 8)}?\n\nThis will mark the order as DISPUTED, hold the dispute amount in reserve, and dispatch a high-priority dispute notice to the merchant's inbox.`
      : isDisputeWon
      ? `Simulate DISPUTE WON on Order #${selectedOrderId.slice(0, 8)}?\n\nThis will mark the order as COMPLETED, release the held reserve balance back to payoutable funds, and notify the merchant.`
      : `Simulate ${reversalType.toUpperCase()} on Order #${selectedOrderId.slice(0, 8)}?\n\nThis will debit the merchant's balance and dispatch a notification to the merchant's inbox.`;
    if (!confirm(confirmPrompt)) return;

    setExecuting(true);
    setReport(null);

    try {
      const headersInit: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (ticket) headersInit["x-admin-ticket"] = ticket;

      const res = await fetch("/api/admin/debug/reverse-payment", {
        method: "POST",
        headers: headersInit,
        body: JSON.stringify({
          orderId: selectedOrderId.trim(),
          reversalType,
          amount: customAmount ? parseFloat(customAmount) : undefined,
          reason: reason.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Simulation failed");
      }

      setReport(data);
      toast.success(
        isDispute ? "Dispute Registered!" : "Reversal Processed!",
        isDispute
          ? `Order #${selectedOrderId.slice(0, 8)} marked as disputed & merchant alerted.`
          : `Merchant debited & notification sent for Order #${selectedOrderId.slice(0, 8)}.`
      );
      // Refresh list to update status
      loadCandidateOrders();
    } catch (err: any) {
      toast.error("Operation Failed", err.message || "Could not execute simulation");
    } finally {
      setExecuting(false);
    }
  }

  const filteredOrders = orders.filter((o) => {
    const q = orderSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      o.id.toLowerCase().includes(q) ||
      o.buyerEmail.toLowerCase().includes(q) ||
      (o.shopName && o.shopName.toLowerCase().includes(q)) ||
      (o.productTitle && o.productTitle.toLowerCase().includes(q))
    );
  });

  const selectedOrderObj = orders.find((o) => o.id === selectedOrderId.trim());

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Banner / Header */}
      <div
        className="card"
        style={{
          padding: "20px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
          background:
            "linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%)",
          border: "1px solid rgba(239, 68, 68, 0.25)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ef4444",
            }}
          >
            <Wrench size={22} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "var(--color-foreground)" }}>
                Debug & Diagnostic Cockpit
              </h2>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  padding: "2px 7px",
                  borderRadius: 4,
                  background: isSuperAdmin ? "rgba(239, 68, 68, 0.2)" : "rgba(139, 92, 246, 0.2)",
                  color: isSuperAdmin ? "#ef4444" : "#a78bfa",
                  border: isSuperAdmin
                    ? "1px solid rgba(239, 68, 68, 0.4)"
                    : "1px solid rgba(139, 92, 246, 0.4)",
                  letterSpacing: "0.05em",
                }}
              >
                {isSuperAdmin ? "Super-Admin Access" : "Staff Privileged"}
              </span>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--color-muted-foreground)" }}>
              Test provider reversal workflows, simulate refunds & chargebacks, inspect ledger debits, and verify merchant inbox notifications.
            </p>
          </div>
        </div>

        <button
          onClick={loadCandidateOrders}
          disabled={loadingOrders}
          className="btn btn-secondary"
          style={{ fontSize: 12, padding: "6px 12px", gap: 6 }}
        >
          <RefreshCw size={13} className={loadingOrders ? "animate-spin" : ""} />
          <span>Refresh Orders</span>
        </button>
      </div>

      {/* Main Grid: Orders Picker & Reversal Action Form */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 24, alignItems: "start" }}>
        {/* Left Column: Recent Orders Candidate Picker */}
        <div className="card" style={{ padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "var(--color-foreground)" }}>
                1. Select Target Order
              </h3>
              <p style={{ fontSize: 12, color: "var(--color-muted-foreground)", margin: "2px 0 0" }}>
                Choose an order to test provider reversal and merchant balance deduction
              </p>
            </div>
            <span style={{ fontSize: 11, color: "var(--color-muted-foreground)", fontFamily: "monospace" }}>
              {filteredOrders.length} orders
            </span>
          </div>

          {/* Search Box */}
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
              placeholder="Search by order ID, buyer email, product, or store..."
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              className="input"
              style={{ paddingLeft: 32, fontSize: 12.5 }}
            />
          </div>

          {/* Orders Scrollable List */}
          <div
            style={{
              maxHeight: 460,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              paddingRight: 4,
            }}
          >
            {loadingOrders ? (
              <div style={{ padding: 40, textAlign: "center", color: "var(--color-muted-foreground)" }}>
                <Loader2 size={24} className="animate-spin" style={{ margin: "0 auto 8px" }} />
                <span>Loading recent orders...</span>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div style={{ padding: 30, textAlign: "center", color: "var(--color-muted-foreground)", fontSize: 13 }}>
                No matching orders found.
              </div>
            ) : (
              filteredOrders.map((ord) => {
                const isSelected = selectedOrderId === ord.id;
                const isDisputed = ord.paymentStatus === "disputed";
                const isRefunded = ord.paymentStatus === "refunded";
                const isReversed = ord.paymentStatus === "reversed";
                return (
                  <div
                    key={ord.id}
                    onClick={() => handleSelectOrder(ord)}
                    style={{
                      padding: "12px 14px",
                      borderRadius: "var(--radius-md)",
                      border: isSelected
                        ? isDisputed || reversalType === "dispute"
                          ? "1.5px solid #f43f5e"
                          : "1.5px solid #ef4444"
                        : "1px solid var(--color-border)",
                      background: isSelected
                        ? isDisputed || reversalType === "dispute"
                          ? "rgba(244, 63, 94, 0.08)"
                          : "rgba(239, 68, 68, 0.08)"
                        : "var(--color-surface-2)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 12, color: "var(--color-foreground)" }}>
                          #{ord.id.slice(0, 10)}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "1px 6px",
                            borderRadius: 4,
                            background:
                              ord.paymentStatus === "completed"
                                ? "rgba(34, 197, 94, 0.15)"
                                : isDisputed
                                ? "rgba(244, 63, 94, 0.15)"
                                : isRefunded || isReversed
                                ? "rgba(239, 68, 68, 0.15)"
                                : "rgba(245, 158, 11, 0.15)",
                            color:
                              ord.paymentStatus === "completed"
                                ? "#22c55e"
                                : isDisputed
                                ? "#f43f5e"
                                : isRefunded || isReversed
                                ? "#ef4444"
                                : "#f59e0b",
                            border: isDisputed
                              ? "1px solid rgba(244, 63, 94, 0.35)"
                              : isRefunded || isReversed
                              ? "1px solid rgba(239, 68, 68, 0.3)"
                              : undefined,
                            textTransform: "uppercase",
                          }}
                        >
                          {ord.paymentStatus}
                        </span>
                        <span style={{ fontSize: 11, color: "var(--color-muted-foreground)" }}>
                          {ord.paymentMethod === "stripe" ? "Stripe" : "Crypto"}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--color-muted-foreground)", marginTop: 3 }}>
                        {ord.buyerEmail} • {ord.productTitle || "Product"}
                      </div>
                      <div style={{ fontSize: 11, color: "#818cf8", marginTop: 2 }}>
                        Store: {ord.shopName || "Unnamed Store"}
                      </div>
                    </div>

                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 14, color: "var(--color-foreground)" }}>
                        ${parseFloat(ord.totalAmount).toFixed(2)}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--color-muted-foreground)" }}>
                        {new Date(ord.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Reversal / Dispute Execution Form */}
        <div className="card" style={{ padding: 22, display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "var(--color-foreground)" }}>
              2. Configure & Trigger Operation
            </h3>
            <p style={{ fontSize: 12, color: "var(--color-muted-foreground)", margin: "2px 0 0" }}>
              Simulates a provider webhook event (Stripe or NOWPayments) to test ledger balance deduction and inbox dispatch.
            </p>
          </div>

          <form onSubmit={handleExecuteReversal} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Order ID Input */}
            <div>
              <label className="label" style={{ fontSize: 12 }}>
                Target Order ID *
              </label>
              <input
                type="text"
                placeholder="Select from left or paste order UUID..."
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                required
                className="input"
                style={{ fontFamily: "monospace", fontSize: 13 }}
              />
              {selectedOrderObj && (
                <div style={{ fontSize: 11, color: "#818cf8", marginTop: 4 }}>
                  Selected: {selectedOrderObj.buyerEmail} — ${parseFloat(selectedOrderObj.totalAmount).toFixed(2)} ({selectedOrderObj.shopName})
                </div>
              )}
            </div>

            {/* Reversal / Dispute Type Selector */}
            <div>
              <label className="label" style={{ fontSize: 12 }}>
                Operation Type
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
                {[
                  {
                    id: "dispute",
                    label: "Dispute",
                    desc: "Buyer Dispute (Held/Reserve)",
                    color: "#f43f5e",
                    bg: "rgba(244, 63, 94, 0.12)",
                    icon: ShieldAlert,
                  },
                  {
                    id: "chargeback",
                    label: "Chargeback",
                    desc: "Bank Forced Reversal",
                    color: "#ef4444",
                    bg: "rgba(239, 68, 68, 0.12)",
                    icon: AlertCircle,
                  },
                  {
                    id: "dispute_won",
                    label: "Dispute Won",
                    desc: "Release Reserve Funds",
                    color: "#22c55e",
                    bg: "rgba(34, 197, 94, 0.12)",
                    icon: CheckCircle2,
                  },
                  {
                    id: "refund",
                    label: "Refund",
                    desc: "Provider Refund",
                    color: "#3b82f6",
                    bg: "rgba(59, 130, 246, 0.12)",
                    icon: RotateCcw,
                  },
                  {
                    id: "reversal",
                    label: "Reversal",
                    desc: "Provider Reversal",
                    color: "#f59e0b",
                    bg: "rgba(245, 158, 11, 0.12)",
                    icon: RefreshCw,
                  },
                ].map((item) => {
                  const isActive = reversalType === item.id;
                  const IconComponent = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleTypeChange(item.id as any)}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: isActive
                          ? `1.5px solid ${item.color}`
                          : "1px solid var(--color-border)",
                        background: isActive ? item.bg : "var(--color-surface-2)",
                        color: isActive ? item.color : "var(--color-foreground)",
                        textAlign: "left",
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 700,
                        transition: "all 0.15s ease",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                      }}
                    >
                      <IconComponent size={16} style={{ marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 800 }}>{item.label}</div>
                        <div style={{ fontSize: 10.5, color: "var(--color-muted-foreground)", fontWeight: 400, marginTop: 1 }}>
                          {item.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <label className="label" style={{ fontSize: 12 }}>
                {reversalType === "dispute" ? "Dispute Amount ($)" : "Reversal Amount ($)"}
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Full amount or partial..."
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="input"
                style={{ fontSize: 13 }}
              />
              <span style={{ fontSize: 11, color: "var(--color-muted-foreground)", marginTop: 2, display: "block" }}>
                Leave as is to process full order amount. Merchant balance will be debited or held.
              </span>
            </div>

            {/* Reason Input */}
            <div>
              <label className="label" style={{ fontSize: 12 }}>
                {reversalType === "dispute" ? "Buyer Dispute Claim / Reason" : "Audit Reason"}
              </label>
              <input
                type="text"
                placeholder="e.g. Fraudulent charge, buyer claim..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="input"
                style={{ fontSize: 13 }}
              />

              {/* Quick dispute reasons presets */}
              {reversalType === "dispute" && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 11, color: "var(--color-muted-foreground)", marginBottom: 6 }}>
                    Quick-select Dispute Reasons:
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {[
                      "Fraudulent / Unauthorized payment",
                      "License key not received / delivery failed",
                      "Product defective / key already redeemed",
                      "Duplicate billing / incorrect charge",
                      "Buyer unrecognized transaction",
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setReason(preset)}
                        style={{
                          fontSize: 11,
                          padding: "3px 8px",
                          borderRadius: 4,
                          background: reason === preset ? "rgba(244, 63, 94, 0.2)" : "var(--color-surface-2)",
                          border: reason === preset ? "1px solid #f43f5e" : "1px solid var(--color-border)",
                          color: reason === preset ? "#f43f5e" : "var(--color-muted-foreground)",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Warning Box */}
            <div
              style={{
                padding: "10px 12px",
                borderRadius: 6,
                background: reversalType === "dispute" ? "rgba(244, 63, 94, 0.1)" : "rgba(245, 158, 11, 0.1)",
                border: reversalType === "dispute" ? "1px solid rgba(244, 63, 94, 0.3)" : "1px solid rgba(245, 158, 11, 0.3)",
                fontSize: 12,
                color: reversalType === "dispute" ? "#f43f5e" : "#f59e0b",
                display: "flex",
                gap: 8,
                alignItems: "flex-start",
              }}
            >
              {reversalType === "dispute" ? (
                <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              ) : (
                <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              )}
              <div>
                {reversalType === "dispute" ? (
                  <>
                    Simulating a <strong>Buyer Dispute</strong> will update the order status to <strong>DISPUTED</strong>, deduct/hold the funds from <strong>sellerBalances</strong>, record a <strong>dispute</strong> ledger entry, and send a high-priority dispute notice to the <strong>Merchant Inbox</strong>.
                  </>
                ) : (
                  <>
                    Executing this test will modify the merchant's <strong>sellerBalances</strong> record, write an auditable <strong>{reversalType}</strong> entry in <strong>balanceTransactions</strong>, and dispatch an alert to the <strong>Merchant Inbox</strong>.
                  </>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={executing || !selectedOrderId.trim()}
              className="btn btn-primary"
              style={{
                padding: "12px",
                fontSize: 14,
                fontWeight: 700,
                background:
                  reversalType === "dispute"
                    ? "linear-gradient(135deg, #f43f5e 0%, #be123c 100%)"
                    : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                borderColor: reversalType === "dispute" ? "#f43f5e" : "#ef4444",
                boxShadow:
                  reversalType === "dispute"
                    ? "0 0 16px rgba(244, 63, 94, 0.35)"
                    : "0 0 16px rgba(239, 68, 68, 0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {executing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{reversalType === "dispute" ? "Simulating Dispute..." : "Processing Payment Reversal..."}</span>
                </>
              ) : (
                <>
                  {reversalType === "dispute" ? <ShieldAlert size={16} /> : <RotateCcw size={16} />}
                  <span>
                    {reversalType === "dispute"
                      ? "Simulate Buyer Dispute (DISPUTE)"
                      : `Simulate ${reversalType.toUpperCase()} Reversal`}
                  </span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Reversal Execution Report Card */}
      {report && (
        <div
          className="card"
          style={{
            padding: 24,
            border: "1px solid rgba(34, 197, 94, 0.4)",
            background: "linear-gradient(180deg, rgba(34, 197, 94, 0.06) 0%, rgba(15, 23, 42, 0.4) 100%)",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background:
                    report.reversalType === "dispute"
                      ? "rgba(244, 63, 94, 0.2)"
                      : "rgba(34, 197, 94, 0.2)",
                  color: report.reversalType === "dispute" ? "#f43f5e" : "#22c55e",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {report.reversalType === "dispute" ? (
                  <ShieldAlert size={20} />
                ) : (
                  <CheckCircle2 size={20} />
                )}
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "var(--color-foreground)" }}>
                  {report.reversalType === "dispute"
                    ? "Buyer Dispute Simulation Completed"
                    : "Reversal Simulation Completed Successfully"}
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--color-muted-foreground)" }}>
                  Event ID: <span style={{ fontFamily: "monospace", color: "#818cf8" }}>{report.eventId}</span>
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              {report.merchant?.shopId && (
                <Link
                  href={`/dashboard/inbox?shopId=${encodeURIComponent(report.merchant.shopId)}`}
                  target="_blank"
                  className="btn btn-secondary"
                  style={{ fontSize: 12, padding: "6px 12px", gap: 6 }}
                >
                  <Inbox size={14} />
                  <span>View Merchant Inbox</span>
                  <ExternalLink size={12} />
                </Link>
              )}
            </div>
          </div>

          {/* Metrics comparison grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            {/* Merchant Info */}
            <div
              style={{
                padding: 14,
                borderRadius: 8,
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-muted-foreground)", textTransform: "uppercase" }}>
                Debited Merchant
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-foreground)", marginTop: 4 }}>
                {report.merchant?.name || "Merchant"}
              </div>
              <div style={{ fontSize: 12, color: "var(--color-muted-foreground)" }}>
                {report.merchant?.email}
              </div>
              <div style={{ fontSize: 11, color: "#818cf8", marginTop: 2 }}>
                Store: {report.merchant?.shopName}
              </div>
            </div>

            {/* Order Status Transition */}
            <div
              style={{
                padding: 14,
                borderRadius: 8,
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-muted-foreground)", textTransform: "uppercase" }}>
                Order Status
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "var(--color-muted-foreground)", textDecoration: "line-through", fontSize: 12 }}>
                  {report.order?.previousPaymentStatus}
                </span>
                <ArrowRight size={13} />
                <span style={{ color: report.order?.newPaymentStatus === "disputed" ? "#f43f5e" : "#ef4444" }}>
                  {report.order?.newPaymentStatus?.toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize: 11, color: "var(--color-muted-foreground)", marginTop: 2 }}>
                Order #{report.order?.id?.slice(0, 8)} updated
              </div>
            </div>

            {/* Available Balance Change */}
            <div
              style={{
                padding: 14,
                borderRadius: 8,
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-muted-foreground)", textTransform: "uppercase" }}>
                Available Balance
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--color-foreground)", marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "var(--color-muted-foreground)", textDecoration: "line-through", fontSize: 13 }}>
                  ${parseFloat(report.balances?.previousAvailable || "0").toFixed(2)}
                </span>
                <ArrowRight size={13} />
                <span style={{ color: Number(report.balances?.newAvailable) < 0 ? "#ef4444" : "#22c55e" }}>
                  ${parseFloat(report.balances?.newAvailable || "0").toFixed(2)}
                </span>
              </div>
              <div style={{ fontSize: 11, color: "var(--color-muted-foreground)", marginTop: 2 }}>
                Ledger type: <code style={{ color: "#f59e0b" }}>{report.reversalType || "refund"}</code>
              </div>
            </div>

            {/* Pending Balance Change */}
            <div
              style={{
                padding: 14,
                borderRadius: 8,
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-muted-foreground)", textTransform: "uppercase" }}>
                Pending / Escrow
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--color-foreground)", marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "var(--color-muted-foreground)", textDecoration: "line-through", fontSize: 13 }}>
                  ${parseFloat(report.balances?.previousPending || "0").toFixed(2)}
                </span>
                <ArrowRight size={13} />
                <span>
                  ${parseFloat(report.balances?.newPending || "0").toFixed(2)}
                </span>
              </div>
              <div style={{ fontSize: 11, color: "var(--color-muted-foreground)", marginTop: 2 }}>
                Escrow hold reduced if unreleased
              </div>
            </div>

            {/* Debt Status */}
            <div
              style={{
                padding: 14,
                borderRadius: 8,
                background: report.balances?.isDebt ? "rgba(239, 68, 68, 0.12)" : "var(--color-surface-2)",
                border: report.balances?.isDebt ? "1px solid rgba(239, 68, 68, 0.4)" : "1px solid var(--color-border)",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: report.balances?.isDebt ? "#ef4444" : "var(--color-muted-foreground)", textTransform: "uppercase" }}>
                Merchant Debt Status
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: report.balances?.isDebt ? "#ef4444" : "#22c55e", marginTop: 4 }}>
                {report.balances?.isDebt ? `DEBT ACTIVE: $${report.balances.debtAmount?.toFixed(2)}` : "No Debt (Balance ≥ $0)"}
              </div>
              <div style={{ fontSize: 11, color: "var(--color-muted-foreground)", marginTop: 2 }}>
                {report.balances?.isDebt ? "Payouts blocked until balance recouped" : "Withdrawals remain unlocked"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
