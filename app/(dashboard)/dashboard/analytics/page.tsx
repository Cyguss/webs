"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { TrendingUp, ShoppingBag, DollarSign, CreditCard, ShieldCheck, Activity, Users, Sparkles } from "lucide-react";

export default function AnalyticsPage() {
  const searchParams = useSearchParams();
  const shopId = searchParams.get("shopId");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [shopId]);

  async function fetchAnalytics() {
    try {
      setLoading(true);
      const querySuffix = shopId ? `?shopId=${encodeURIComponent(shopId)}` : "";
      const res = await fetch(`/api/analytics${querySuffix}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", width: "100%" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--color-foreground)", letterSpacing: "-0.02em", marginBottom: 4 }}>
          Analytics & Performance
        </h1>
        <p style={{ color: "var(--color-muted-foreground)", fontSize: 14 }}>
          Track storefront revenue, sales velocity, product conversion rates, and payment methods.
        </p>
      </div>

      {loading ? (
        <div className="page-fly-in" style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%" }}>
          {/* Skeleton KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card" style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ width: 100, height: 14, borderRadius: 4, background: "var(--skeleton-base)" }} />
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--skeleton-base)" }} />
                </div>
                <div style={{ width: 130, height: 28, borderRadius: 6, background: "var(--skeleton-base)" }} />
                <div style={{ width: 80, height: 12, borderRadius: 4, background: "var(--skeleton-base)", opacity: 0.6 }} />
              </div>
            ))}
          </div>

          {/* Skeleton Charts Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
            <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ width: 180, height: 18, borderRadius: 6, background: "var(--skeleton-base)" }} />
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ height: 48, borderRadius: 10, background: "var(--skeleton-base)", opacity: 0.8 }} />
              ))}
            </div>
            <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ width: 140, height: 18, borderRadius: 6, background: "var(--skeleton-base)" }} />
              <div style={{ height: 16, borderRadius: 4, background: "var(--skeleton-base)" }} />
              <div style={{ height: 16, borderRadius: 4, background: "var(--skeleton-base)" }} />
              <div style={{ height: 60, borderRadius: 10, background: "var(--skeleton-base)", opacity: 0.6, marginTop: 20 }} />
            </div>
          </div>
        </div>
      ) : (
        <div className="page-fly-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* KPI Stat Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
            {/* Stat 1: Total Revenue */}
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-muted-foreground)" }}>
                  Total Revenue
                </span>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "rgba(34, 197, 94, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <DollarSign size={18} color="#22c55e" />
                </div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--color-foreground)", marginBottom: 4 }}>
                ${data?.totalRevenue || "0.00"}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color:
                    data?.growthDirection === "up"
                      ? "#22c55e"
                      : data?.growthDirection === "down"
                      ? "#ef4444"
                      : "var(--color-muted-foreground)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <TrendingUp size={14} /> {data?.revenueGrowth || "0.0%"} {data?.growthLabel || "vs last month"}
              </div>
            </div>

            {/* Stat 2: Total Sales */}
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-muted-foreground)" }}>
                  Completed Orders
                </span>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "var(--color-surface-2)",
                    border: "1px solid var(--color-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ShoppingBag size={18} color="var(--color-foreground)" />
                </div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--color-foreground)", marginBottom: 4 }}>
                {data?.totalOrders || 0}
              </div>
              <div style={{ fontSize: 12, color: "var(--color-muted-foreground)" }}>
                Delivered instant licenses
              </div>
            </div>

            {/* Stat 3: Avg Order Value */}
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-muted-foreground)" }}>
                  Avg. Order Value
                </span>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "var(--color-surface-2)",
                    border: "1px solid var(--color-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Activity size={18} color="var(--color-foreground)" />
                </div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--color-foreground)", marginBottom: 4 }}>
                ${data?.avgOrderValue || "0.00"}
              </div>
              <div style={{ fontSize: 12, color: "var(--color-muted-foreground)" }}>
                Per checkout session
              </div>
            </div>

            {/* Stat 4: Conversion Rate */}
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-muted-foreground)" }}>
                  Checkout Conversion
                </span>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "rgba(245, 158, 11, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Users size={18} color="#f59e0b" />
                </div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--color-foreground)", marginBottom: 4 }}>
                {data?.conversionRate || "0.0"}%
              </div>
              <div style={{ fontSize: 12, color: "var(--color-muted-foreground)", display: "flex", alignItems: "center", gap: 4 }}>
                Completed checkouts ratio
              </div>
            </div>
          </div>

          {/* Detailed Performance Charts Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
            {/* Top Products Table */}
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-foreground)", marginBottom: 16 }}>
                Top Performing Products
              </h3>
              {data?.productPerformance?.length === 0 ? (
                <div style={{ color: "var(--color-muted-foreground)", fontSize: 14 }}>
                  No product sales data recorded yet.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {data?.productPerformance?.map((p: any, i: number) => (
                    <div
                      key={i}
                      style={{
                        padding: "12px 16px",
                        borderRadius: "var(--radius-md)",
                        background: "var(--color-surface-hover)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-foreground)" }}>
                          {p.title}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--color-muted-foreground)" }}>
                          {p.count} keys sold
                        </div>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-foreground)" }}>
                        ${p.revenue.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Method Distribution */}
            <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-foreground)", marginBottom: 16 }}>
                  Payment Methods
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {/* Stripe */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                      <span style={{ color: "var(--color-foreground)", fontWeight: 500 }}>Stripe / Card</span>
                      <span style={{ color: "var(--color-muted-foreground)" }}>{data?.paymentMethodBreakdown?.stripe || 0} orders</span>
                    </div>
                    <div style={{ height: 8, background: "var(--color-surface-hover)", borderRadius: 4, overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${
                            data?.totalOrders > 0
                              ? ((data?.paymentMethodBreakdown?.stripe / data?.totalOrders) * 100).toFixed(0)
                              : 50
                          }%`,
                          background: "var(--color-foreground)",
                          borderRadius: 4,
                        }}
                      />
                    </div>
                  </div>

                  {/* Crypto */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                      <span style={{ color: "var(--color-foreground)", fontWeight: 500 }}>Cryptocurrency</span>
                      <span style={{ color: "var(--color-muted-foreground)" }}>{data?.paymentMethodBreakdown?.crypto || 0} orders</span>
                    </div>
                    <div style={{ height: 8, background: "var(--color-surface-hover)", borderRadius: 4, overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${
                            data?.totalOrders > 0
                              ? ((data?.paymentMethodBreakdown?.crypto / data?.totalOrders) * 100).toFixed(0)
                              : 50
                          }%`,
                          background: "var(--color-muted-foreground)",
                          borderRadius: 4,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
