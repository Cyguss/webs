"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  TrendingUp,
  ShoppingCart,
  Wallet,
  Package,
  ArrowUpRight,
  Key,
  Plus,
  Tag,
  Palette,
  CheckCircle2,
  ExternalLink,
  CreditCard,
  Coins,
  Clock,
  AlertTriangle,
  Save,
  Loader2,
  Copy,
  Check,
  Store,
  Globe,
  Sparkles,
  Shield,
} from "lucide-react";
import { useToast } from "@/components/toast-context";

interface DashboardData {
  shop: any;
  stats: any;
  recentOrders: any[];
  totalOrdersCount: number;
  balanceData: any;
  totalKeysAvailable: number;
  approvalStatus: string | null;
}

function DashboardOverviewInner() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const shopId = searchParams.get("shopId");
  const querySuffix = shopId ? `?shopId=${encodeURIComponent(shopId)}` : "";

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Approval request state
  const [requestingApproval, setRequestingApproval] = useState(false);

  // Storefront editable form state
  const [storeName, setStoreName] = useState("");
  const [storeSlug, setStoreSlug] = useState("");
  const [storeDesc, setStoreDesc] = useState("");
  const [savingDetails, setSavingDetails] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showPendingTooltip, setShowPendingTooltip] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const querySuffix = shopId ? `?shopId=${encodeURIComponent(shopId)}` : "";
      const ordersSuffix = shopId ? `?limit=8&shopId=${encodeURIComponent(shopId)}` : "?limit=8";
      const analyticsSuffix = shopId ? `?type=keys&shopId=${encodeURIComponent(shopId)}` : "?type=keys";

      const [storeRes, ordersRes, balanceRes] = await Promise.all([
        fetch(`/api/storefront${querySuffix}`),
        fetch(`/api/orders${ordersSuffix}`),
        fetch(`/api/earnings/balance${querySuffix}`),
      ]);

      const storeData = await storeRes.json();
      const ordersData = ordersRes.ok ? await ordersRes.json() : { orders: [] };
      const balanceData = balanceRes.ok ? await balanceRes.json() : {};

      if (storeData.shop) {
        setStoreName(storeData.shop.name || "");
        setStoreSlug(storeData.shop.slug || "");
        setStoreDesc(storeData.shop.description || "");
      }

      // Count keys in stock via analytics
      let keysCount = 0;
      try {
        const analyticsRes = await fetch(`/api/analytics${analyticsSuffix}`);
        if (analyticsRes.ok) {
          const analyticsData = await analyticsRes.json();
          keysCount = analyticsData.keysInStock || 0;
        }
      } catch {}

      setData({
        shop: storeData.shop,
        stats: storeData,
        recentOrders: ordersData.orders || [],
        totalOrdersCount: ordersData.totalCount ?? (ordersData.orders?.length || 0),
        balanceData: balanceData,
        totalKeysAvailable: keysCount,
        approvalStatus: storeData.approvalStatus || null,
      } as any);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleRequestApproval() {
    if (!data?.shop) return;
    setRequestingApproval(true);
    try {
      const res = await fetch("/api/shops/request-approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId: data.shop.id }),
      });
      const result = await res.json();
      if (!res.ok) {
        if (result.rateLimited) {
          toast.error(`Rate limit active. Please wait ${result.hoursLeft}h before sending another review request.`);
        } else {
          toast.error(result.error || "Failed to send approval request");
        }
      } else {
        toast.success("Request submitted! An administrator will review your store soon.");
        loadData();
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setRequestingApproval(false);
    }
  }

  async function handleSaveStoreDetails(e: React.FormEvent) {
    e.preventDefault();
    if (!data?.shop) return;

    if (!storeName.trim() || storeName.trim().length < 2) {
      toast.error("Store name must be at least 2 characters.");
      return;
    }

    if (!storeSlug.trim() || storeSlug.trim().length < 3) {
      toast.error("Store URL slug must be at least 3 characters.");
      return;
    }

    setSavingDetails(true);

    try {
      const res = await fetch("/api/storefront", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId: data.shop.id,
          name: storeName.trim(),
          slug: storeSlug.trim().toLowerCase(),
          description: storeDesc.trim(),
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "Failed to update storefront details");
      } else {
        toast.success("Storefront details updated successfully!");
        setData((prev) =>
          prev
            ? {
                ...prev,
                shop: {
                  ...prev.shop,
                  name: result.name || storeName.trim(),
                  slug: result.slug || storeSlug.trim().toLowerCase(),
                  description: storeDesc.trim(),
                },
              }
            : prev
        );
      }
    } catch {
      toast.error("Network error saving storefront details.");
    } finally {
      setSavingDetails(false);
    }
  }

  function handleCopyStoreLink() {
    if (!data?.shop) return;
    const url = `${window.location.origin}/${data.shop.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast.success("Store URL copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  }

  if (loading) {
    return (
      <div className="page-fly-in" style={{ maxWidth: 1240, margin: "0 auto", display: "flex", flexDirection: "column", gap: 26, width: "100%" }}>
        {/* Skeleton Store Details Card */}
        <div className="card" style={{ padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: "var(--skeleton-base)" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ width: 180, height: 18, borderRadius: 6, background: "var(--skeleton-base)" }} />
                <div style={{ width: 260, height: 12, borderRadius: 4, background: "var(--skeleton-base)", opacity: 0.6 }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ width: 90, height: 34, borderRadius: 8, background: "var(--skeleton-base)" }} />
              <div style={{ width: 110, height: 34, borderRadius: 8, background: "var(--skeleton-base)" }} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ height: 42, borderRadius: 8, background: "var(--skeleton-base)" }} />
            <div style={{ height: 42, borderRadius: 8, background: "var(--skeleton-base)" }} />
          </div>
        </div>

        {/* Skeleton Metrics Grid */}
        <div className="stat-grid-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card" style={{ padding: 22, height: 130, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ width: 110, height: 14, borderRadius: 4, background: "var(--skeleton-base)" }} />
                <div style={{ width: 34, height: 34, borderRadius: 8, background: "var(--skeleton-base)" }} />
              </div>
              <div style={{ width: 140, height: 28, borderRadius: 6, background: "var(--skeleton-base)" }} />
              <div style={{ width: 90, height: 12, borderRadius: 4, background: "var(--skeleton-base)", opacity: 0.6 }} />
            </div>
          ))}
        </div>

        {/* Skeleton Table Container */}
        <div className="table-container" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ width: 140, height: 18, borderRadius: 6, background: "var(--skeleton-base)" }} />
            <div style={{ width: 70, height: 28, borderRadius: 6, background: "var(--skeleton-base)" }} />
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr", gap: 16, alignItems: "center", padding: "12px 0", borderTop: "1px solid var(--color-border)" }}>
              <div style={{ width: "70%", height: 14, borderRadius: 4, background: "var(--skeleton-base)" }} />
              <div style={{ width: "60%", height: 14, borderRadius: 4, background: "var(--skeleton-base)" }} />
              <div style={{ width: "50%", height: 14, borderRadius: 4, background: "var(--skeleton-base)" }} />
              <div style={{ width: "40%", height: 14, borderRadius: 4, background: "var(--skeleton-base)" }} />
              <div style={{ width: "50%", height: 14, borderRadius: 4, background: "var(--skeleton-base)" }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const shop = data?.shop;
  const availableBalance = parseFloat(data?.balanceData?.availableBalance ?? "0");
  const pendingBalance = parseFloat(data?.balanceData?.pendingBalance ?? "0");
  const totalEarned = parseFloat(data?.balanceData?.totalEarned ?? "0");
  const feePercent = (data as any)?.platformFeePercent ?? 5.0;
  const netEarnings = totalEarned * (1 - feePercent / 100);
  const totalOrdersCount = (data as any)?.totalOrdersCount ?? data?.recentOrders?.length ?? 0;
  const recentOrders = data?.recentOrders || [];
  const approvalStatus = data?.approvalStatus;

  return (
    <div className="page-fly-in" style={{ maxWidth: 1240, margin: "0 auto", display: "flex", flexDirection: "column", gap: 26, width: "100%" }}>

      {/* ─── APPROVAL NOTICE BAR ───────────────────────────────────────────── */}
      {shop && !shop.isAccepted && (
        <div
          className="card"
          style={{
            padding: "20px 24px",
            borderColor:
              approvalStatus === "pending"
                ? "rgba(245, 158, 11, 0.4)"
                : approvalStatus === "rejected"
                ? "rgba(239, 68, 68, 0.4)"
                : "var(--color-border)",
            background:
              approvalStatus === "pending"
                ? "rgba(245, 158, 11, 0.06)"
                : approvalStatus === "rejected"
                ? "rgba(239, 68, 68, 0.06)"
                : "var(--color-surface-2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
            borderRadius: 14,
            boxShadow: "var(--card-shadow, 0 4px 20px rgba(0,0,0,0.2))",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background:
                  approvalStatus === "pending"
                    ? "rgba(245,158,11,0.18)"
                    : approvalStatus === "rejected"
                    ? "rgba(239,68,68,0.18)"
                    : "var(--color-surface)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color:
                  approvalStatus === "pending"
                    ? "#f59e0b"
                    : approvalStatus === "rejected"
                    ? "#ef4444"
                    : "var(--color-foreground)",
                flexShrink: 0,
              }}
            >
              {approvalStatus === "pending" ? <Clock size={22} /> : <AlertTriangle size={22} />}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: "var(--color-foreground)", display: "flex", alignItems: "center", gap: 8 }}>
                <span>
                  {approvalStatus === "pending"
                    ? "Store Approval Review in Progress"
                    : approvalStatus === "rejected"
                    ? "Store Review Rejected"
                    : "Store Private — Awaiting Approval"}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    padding: "2px 7px",
                    borderRadius: 4,
                    background:
                      approvalStatus === "pending"
                        ? "rgba(245,158,11,0.2)"
                        : approvalStatus === "rejected"
                        ? "rgba(239,68,68,0.2)"
                        : "rgba(99,102,241,0.2)",
                    color:
                      approvalStatus === "pending"
                        ? "#f59e0b"
                        : approvalStatus === "rejected"
                        ? "#ef4444"
                        : "#818cf8",
                    textTransform: "uppercase",
                  }}
                >
                  {approvalStatus === "pending" ? "PENDING REVIEW" : approvalStatus === "rejected" ? "REJECTED" : "UNLISTED"}
                </span>
              </div>
              <div style={{ fontSize: 13, color: "var(--color-muted-foreground)", marginTop: 4 }}>
                {approvalStatus === "pending"
                  ? "Your request was submitted to administration. An administrator will handle and review your store soon."
                  : approvalStatus === "rejected"
                  ? "Store rejected by admin. Review your products or open a support ticket on Discord."
                  : "Your storefront is restricted to you and platform administrators. Request review to go live publicly."}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Link
              href={`/${shop.slug}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
              style={{ padding: "9px 16px", fontSize: 13, gap: 6 }}
            >
              <ExternalLink size={14} /> Preview Store
            </Link>

            {(!approvalStatus || approvalStatus === "rejected") && (
              <button
                onClick={handleRequestApproval}
                disabled={requestingApproval}
                className="btn btn-primary"
                style={{ padding: "9px 20px", fontSize: 13, flexShrink: 0, gap: 6 }}
              >
                {requestingApproval ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                <span>{approvalStatus === "rejected" ? "Resubmit Request" : "Request Approval"}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── STORE DETAILS & SELLFRONT EDITOR ─────────────────────────────── */}
      <div
        className="card"
        style={{
          padding: "26px 28px",
          background: "var(--card-bg)",
          border: "1px solid var(--color-border)",
          borderRadius: 16,
          boxShadow: "var(--card-shadow, 0 10px 30px rgba(0,0,0,0.15))",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-foreground)",
              }}
            >
              <Store size={20} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "var(--color-foreground)", letterSpacing: "-0.01em" }}>
                  Storefront & Sellfront Details
                </h2>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    padding: "2px 7px",
                    borderRadius: 4,
                    background: shop?.isAccepted ? "rgba(34,197,94,0.15)" : "rgba(245,158,11,0.15)",
                    color: shop?.isAccepted ? "#22c55e" : "#f59e0b",
                    border: `1px solid ${shop?.isAccepted ? "rgba(34,197,94,0.3)" : "rgba(245,158,11,0.3)"}`,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: shop?.isAccepted ? "#22c55e" : "#f59e0b" }} />
                  {shop?.isAccepted ? "LIVE" : "PENDING APPROVAL"}
                </span>
              </div>
              <p style={{ fontSize: 12, color: "var(--color-muted-foreground)", margin: "3px 0 0" }}>
                Configure your unique store identity, sellfront URL, and seller bio.
              </p>
            </div>
          </div>

          {/* Action links */}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              type="button"
              onClick={handleCopyStoreLink}
              className="btn btn-secondary"
              style={{ padding: "8px 14px", fontSize: 12, gap: 6 }}
              title="Copy store URL"
            >
              {copiedLink ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
              <span>{copiedLink ? "Copied!" : "Copy Link"}</span>
            </button>

            {shop && (
              <a
                href={`/${shop.slug}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary"
                style={{ padding: "8px 14px", fontSize: 12, gap: 6 }}
              >
                <ExternalLink size={14} />
                <span>Visit Storefront</span>
              </a>
            )}

            <Link
              href="/dashboard/storefront"
              className="btn btn-ghost"
              style={{ padding: "8px 14px", fontSize: 12, gap: 6 }}
            >
              <Palette size={14} />
              <span>Theme & Branding</span>
            </Link>
          </div>
        </div>

        {/* Editable form */}
        <form onSubmit={handleSaveStoreDetails}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 16 }}>
            <div>
              <label className="label" style={{ marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
                <span>Store Display Name</span>
                <span style={{ fontSize: 11, color: "var(--color-muted-foreground)" }}>Unique verified name</span>
              </label>
              <input
                type="text"
                className="input"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="e.g. CyberVault Keys"
                required
                style={{ fontSize: 14 }}
              />
            </div>

            <div>
              <label className="label" style={{ marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
                <span>Sellfront URL Slug</span>
                <span style={{ fontSize: 11, color: "var(--color-muted-foreground)", fontFamily: "var(--font-mono)" }}>krypt.market/[slug]</span>
              </label>
              <div style={{ display: "flex", alignItems: "center" }}>
                <span
                  style={{
                    padding: "0 12px",
                    height: 42,
                    display: "flex",
                    alignItems: "center",
                    background: "var(--color-surface-2)",
                    border: "1px solid var(--color-border)",
                    borderRight: "none",
                    borderRadius: "var(--radius-sm) 0 0 var(--radius-sm)",
                    color: "var(--color-muted-foreground)",
                    fontSize: 13,
                    fontFamily: "monospace",
                  }}
                >
                  /
                </span>
                <input
                  type="text"
                  className="input"
                  value={storeSlug}
                  onChange={(e) => setStoreSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder="my-store-name"
                  required
                  style={{
                    borderRadius: "0 var(--radius-sm) var(--radius-sm) 0",
                    fontFamily: "monospace",
                    fontSize: 13,
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label className="label" style={{ marginBottom: 6 }}>
              Storefront Description & Buyer Welcome
            </label>
            <textarea
              className="input"
              value={storeDesc}
              onChange={(e) => setStoreDesc(e.target.value)}
              placeholder="Describe your product lineup, delivery speed, and customer guarantee..."
              rows={2}
              style={{ fontSize: 13, resize: "vertical" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              disabled={savingDetails}
              className="btn btn-primary"
              style={{ padding: "10px 22px", fontSize: 13, fontWeight: 700, gap: 8 }}
            >
              {savingDetails ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              <span>Save Store Details</span>
            </button>
          </div>
        </form>
      </div>

      {/* ─── METRICS & REVENUE GRID ────────────────────────────────────────── */}
      <div className="stat-grid-3">
        <div className="card card-hover" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 22 }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-muted-foreground)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Available Balance
              </span>
              <div style={{ width: 34, height: 34, borderRadius: "var(--radius-sm)", background: "var(--color-surface-2)", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-foreground)" }}>
                <Wallet size={17} />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 30, fontWeight: 900, color: "var(--color-foreground)", letterSpacing: "-0.02em" }}>
                ${availableBalance.toFixed(2)}
              </span>

              {pendingBalance > 0 && (
                <div
                  style={{
                    position: "relative",
                    display: "inline-flex",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                  onMouseEnter={() => setShowPendingTooltip(true)}
                  onMouseLeave={() => setShowPendingTooltip(false)}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#f59e0b",
                      background: "rgba(245, 158, 11, 0.12)",
                      border: "1px solid rgba(245, 158, 11, 0.3)",
                      padding: "2px 8px",
                      borderRadius: 6,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      letterSpacing: "0.01em",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Clock size={12} color="#f59e0b" />
                    (+${pendingBalance.toFixed(2)} pending)
                  </span>

                  {showPendingTooltip && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: "calc(100% + 8px)",
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "var(--color-surface)",
                        border: "1px solid rgba(245, 158, 11, 0.4)",
                        borderRadius: 10,
                        padding: "10px 14px",
                        width: 250,
                        boxShadow: "var(--card-shadow, 0 10px 30px rgba(0,0,0,0.5))",
                        zIndex: 100,
                        pointerEvents: "none",
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#f59e0b", marginBottom: 3, display: "flex", alignItems: "center", gap: 5 }}>
                        <Clock size={12} /> Pending Clearance
                      </div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", lineHeight: 1.4 }}>
                        ${pendingBalance.toFixed(2)} from recent sales is in the clearance window before becoming available for instant withdrawal.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--color-muted-foreground)" }}>
              {pendingBalance > 0 ? "Pending funds clear automatically" : "Ready for payout"}
            </span>
            <Link href={`/dashboard/earnings${querySuffix}`} style={{ fontSize: 12, color: "var(--color-accent)", fontWeight: 600, textDecoration: "none" }}>
              Withdraw &rarr;
            </Link>
          </div>
        </div>

        <div className="card card-hover" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 22 }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-muted-foreground)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Net Seller Earnings
              </span>
              <div style={{ width: 34, height: 34, borderRadius: "var(--radius-sm)", background: "var(--color-surface-2)", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-foreground)" }}>
                <TrendingUp size={17} />
              </div>
            </div>
            <div style={{ fontSize: 30, fontWeight: 900, color: "var(--color-foreground)", letterSpacing: "-0.02em" }}>
              ${netEarnings.toFixed(2)}
            </div>
          </div>
          <div style={{ marginTop: 14, fontSize: 12, color: totalEarned > 0 ? "var(--color-success)" : "var(--color-muted-foreground)", display: "flex", alignItems: "center", gap: 5 }}>
            <CheckCircle2 size={13} /> {totalEarned > 0 ? `Gross sales: $${totalEarned.toFixed(2)} • ${feePercent}% fee deducted` : `Flat ${feePercent}% platform fee on sales • No monthly fees`}
          </div>
        </div>

        <div className="card card-hover" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 22 }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-muted-foreground)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Total Orders
              </span>
              <div style={{ width: 34, height: 34, borderRadius: "var(--radius-sm)", background: "var(--color-surface-2)", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-foreground)" }}>
                <ShoppingCart size={17} />
              </div>
            </div>
            <div style={{ fontSize: 30, fontWeight: 900, color: "var(--color-foreground)", letterSpacing: "-0.02em" }}>
              {totalOrdersCount}
            </div>
          </div>
          <div style={{ marginTop: 14, fontSize: 12, color: "var(--color-muted-foreground)" }}>
            Completed checkouts fulfilled
          </div>
        </div>
      </div>

      {/* ─── QUICK SHORTCUTS ──────────────────────────────────────────────── */}
      <div className="stat-grid-3">
        <Link href={`/dashboard/products/new${querySuffix}`} className="card card-hover" style={{ padding: 18, display: "flex", alignItems: "center", gap: 14, textDecoration: "none" }}>
          <div style={{ width: 40, height: 40, borderRadius: "var(--radius-sm)", background: "var(--color-surface-2)", border: "1px solid var(--color-border)", color: "var(--color-foreground)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Plus size={20} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-foreground)" }}>Add Key Product</div>
            <div style={{ fontSize: 12, color: "var(--color-muted-foreground)", marginTop: 2 }}>Upload product with license keys</div>
          </div>
        </Link>

        <Link href={`/dashboard/coupons${querySuffix}`} className="card card-hover" style={{ padding: 18, display: "flex", alignItems: "center", gap: 14, textDecoration: "none" }}>
          <div style={{ width: 40, height: 40, borderRadius: "var(--radius-sm)", background: "var(--color-surface-2)", border: "1px solid var(--color-border)", color: "var(--color-foreground)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Tag size={20} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-foreground)" }}>Create Promo Coupon</div>
            <div style={{ fontSize: 12, color: "var(--color-muted-foreground)", marginTop: 2 }}>Set discounts and promo codes</div>
          </div>
        </Link>

        <Link href={`/dashboard/earnings${querySuffix}`} className="card card-hover" style={{ padding: 18, display: "flex", alignItems: "center", gap: 14, textDecoration: "none" }}>
          <div style={{ width: 40, height: 40, borderRadius: "var(--radius-sm)", background: "var(--color-surface-2)", border: "1px solid var(--color-border)", color: "var(--color-foreground)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Wallet size={20} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-foreground)" }}>Request Payout</div>
            <div style={{ fontSize: 12, color: "var(--color-muted-foreground)", marginTop: 2 }}>Withdraw funds to crypto wallet</div>
          </div>
        </Link>

        <Link href={`/dashboard/storefront${querySuffix}`} className="card card-hover" style={{ padding: 18, display: "flex", alignItems: "center", gap: 14, textDecoration: "none" }}>
          <div style={{ width: 40, height: 40, borderRadius: "var(--radius-sm)", background: "var(--color-surface-2)", border: "1px solid var(--color-border)", color: "var(--color-foreground)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Palette size={20} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-foreground)" }}>Storefront Branding</div>
            <div style={{ fontSize: 12, color: "var(--color-muted-foreground)", marginTop: 2 }}>Logos, banners, custom colors</div>
          </div>
        </Link>
      </div>

      {/* ─── RECENT ORDERS ────────────────────────────────────────────────── */}
      <div className="table-container">
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--color-foreground)", margin: 0 }}>Recent Orders</h2>
            <p style={{ fontSize: 12, color: "var(--color-muted-foreground)", margin: "2px 0 0" }}>Latest customer purchases</p>
          </div>
          <Link href={`/dashboard/orders${querySuffix}`} className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: 12, gap: 6 }}>
            <span>View All</span>
            <ArrowUpRight size={13} />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "var(--color-muted-foreground)" }}>
            <Package size={36} style={{ margin: "0 auto 10px", opacity: 0.3, display: "block" }} />
            <div style={{ fontWeight: 600, fontSize: 15, color: "var(--color-foreground)" }}>No orders yet</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>
              {shop ? `Share /${shop.slug} to start selling digital keys` : "Create your store to start selling"}
            </div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Buyer</th>
                <th>Product & Qty</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order: any) => (
                <tr key={order.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: "var(--color-foreground)" }}>{order.buyerEmail}</div>
                    <div style={{ fontSize: 11, color: "var(--color-muted-foreground)", fontFamily: "monospace" }}>
                      #{order.id?.slice(0, 12)}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: "var(--color-foreground)", display: "flex", alignItems: "center", gap: 6 }}>
                      {order.quantity > 1 && (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            background: "var(--badge-neutral-bg)",
                            color: "var(--badge-neutral-text)",
                            border: "1px solid var(--badge-neutral-border)",
                            padding: "1px 6px",
                            borderRadius: 6,
                          }}
                        >
                          {order.quantity}x
                        </span>
                      )}
                      <span>{order.productTitle || "Digital Key"}</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 700, color: "var(--color-foreground)" }}>
                    ${parseFloat(order.totalAmount).toFixed(2)}
                  </td>
                  <td>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                      {order.paymentMethod === "stripe" ? (
                        <><CreditCard size={14} color="var(--color-muted-foreground)" /> Card</>
                      ) : (
                        <><Coins size={14} color="var(--color-muted-foreground)" /> Crypto</>
                      )}
                    </span>
                  </td>
                  <td>
                    {order.paymentStatus === "completed" ? (
                      <span className="badge badge-success"><span className="badge-dot" /> Delivered</span>
                    ) : (
                      <span className="badge badge-warning"><span className="badge-dot" /> {order.paymentStatus}</span>
                    )}
                  </td>
                  <td style={{ color: "var(--color-muted-foreground)", fontSize: 12 }}>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default function DashboardOverviewClient() {
  return (
    <Suspense fallback={null}>
      <DashboardOverviewInner />
    </Suspense>
  );
}
