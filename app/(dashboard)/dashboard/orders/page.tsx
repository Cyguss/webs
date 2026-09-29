import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { shops, orders, products, orderDeliveries } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { ShoppingCart, CheckCircle, Clock, XCircle, Key, CreditCard, Coins } from "lucide-react";

import { getActiveMerchantShop } from "@/lib/tenant";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ shopId?: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/login");
  }

  const { shopId } = await searchParams;
  const userShop = await getActiveMerchantShop(session.user.id, shopId);

  if (!userShop) {
    redirect("/dashboard");
  }

  const shopOrders = await db
    .select({
      order: orders,
      productTitle: products.title,
      productType: products.type,
      delivery: orderDeliveries,
    })
    .from(orders)
    .leftJoin(products, eq(orders.productId, products.id))
    .leftJoin(orderDeliveries, eq(orders.id, orderDeliveries.orderId))
    .where(eq(orders.shopId, userShop.id))
    .orderBy(desc(orders.createdAt));

  const totalCount = shopOrders.length;
  const completedCount = shopOrders.filter((o: any) => o.order.paymentStatus === "completed").length;
  const disputedCount = shopOrders.filter((o: any) => o.order.paymentStatus === "disputed").length;
  const refundedCount = shopOrders.filter((o: any) => o.order.paymentStatus === "refunded" || o.order.paymentStatus === "chargeback").length;

  return (
    <div className="page-fly-in" style={{ maxWidth: 1240, margin: "0 auto", width: "100%" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--color-foreground)", letterSpacing: "-0.02em" }}>
          Orders & Transactions
        </h1>
        <p style={{ color: "var(--color-muted-foreground)", fontSize: 14, marginTop: 4 }}>
          Track customer purchases, fulfillment status, and payment details.
        </p>
      </div>

      {/* Summary Metrics */}
      {shopOrders.length > 0 && (
        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          <div className="card" style={{ padding: "12px 18px", flex: "1 1 180px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 12, color: "var(--color-muted-foreground)", fontWeight: 600 }}>Total Orders</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "var(--color-foreground)", marginTop: 2 }}>{totalCount}</div>
            </div>
            <ShoppingCart size={20} color="var(--color-primary-light)" />
          </div>

          <div className="card" style={{ padding: "12px 18px", flex: "1 1 180px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 12, color: "var(--color-muted-foreground)", fontWeight: 600 }}>Completed</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "var(--color-success)", marginTop: 2 }}>{completedCount}</div>
            </div>
            <CheckCircle size={20} color="var(--color-success)" />
          </div>

          {disputedCount > 0 && (
            <div className="card" style={{ padding: "12px 18px", flex: "1 1 180px", display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid rgba(244, 63, 94, 0.3)", background: "rgba(244, 63, 94, 0.05)" }}>
              <div>
                <div style={{ fontSize: 12, color: "#f43f5e", fontWeight: 700 }}>In Dispute</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#f43f5e", marginTop: 2 }}>{disputedCount}</div>
              </div>
              <Clock size={20} color="#f43f5e" />
            </div>
          )}

          {refundedCount > 0 && (
            <div className="card" style={{ padding: "12px 18px", flex: "1 1 180px", display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid rgba(168, 85, 247, 0.3)", background: "rgba(168, 85, 247, 0.05)" }}>
              <div>
                <div style={{ fontSize: 12, color: "#a855f7", fontWeight: 700 }}>Refunds & Chargebacks</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#a855f7", marginTop: 2 }}>{refundedCount}</div>
              </div>
              <XCircle size={20} color="#a855f7" />
            </div>
          )}
        </div>
      )}

      {shopOrders.length === 0 ? (
        <div
          className="card"
          style={{
            padding: 48,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "var(--color-primary-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-primary-light)",
            }}
          >
            <ShoppingCart size={28} />
          </div>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "var(--color-foreground)" }}>
              No orders yet
            </h3>
            <p style={{ fontSize: 14, color: "var(--color-muted-foreground)", marginTop: 6, maxWidth: 400 }}>
              When buyers purchase products from your storefront, their orders will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Order ID / Buyer</th>
                <th>Product</th>
                <th>Amount</th>
                <th>Payment Method</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {shopOrders.map(({ order, productTitle, productType, delivery }: any) => {
                const isReversed = order.paymentStatus === "refunded" || order.paymentStatus === "chargeback";
                const isDisputed = order.paymentStatus === "disputed";

                return (
                  <tr key={order.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--color-foreground)" }}>{order.buyerEmail}</div>
                      <div style={{ fontSize: 12, color: "var(--color-muted-foreground)", fontFamily: "monospace" }}>
                        #{order.id.slice(0, 8)}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, color: "var(--color-foreground)", display: "flex", alignItems: "center", gap: 8 }}>
                        {order.quantity > 1 && (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              background: "var(--badge-neutral-bg)",
                              color: "var(--badge-neutral-text)",
                              border: "1px solid var(--badge-neutral-border)",
                              padding: "2px 7px",
                              borderRadius: 6,
                            }}
                          >
                            {order.quantity}x
                          </span>
                        )}
                        <span>{productTitle || "Deleted Product"}</span>
                      </div>
                      {delivery && (
                        <div style={{ fontSize: 12, color: "var(--color-primary-light)", display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                          <Key size={12} /> {order.quantity > 1 ? `${order.quantity} Keys Delivered` : "Key Delivered"}
                        </div>
                      )}
                    </td>

                    <td style={{ fontWeight: 700, color: "var(--color-foreground)" }}>
                      {isReversed ? (
                        <>
                          <div style={{ textDecoration: "line-through", color: "var(--color-muted-foreground)", fontSize: 13 }}>
                            ${parseFloat(order.totalAmount).toFixed(2)}
                          </div>
                          <div style={{ fontSize: 11, color: "#f43f5e", fontWeight: 700 }}>
                            Reversed
                          </div>
                        </>
                      ) : (
                        <>
                          <div>${parseFloat(order.totalAmount).toFixed(2)}</div>
                          {isDisputed && (
                            <div style={{ fontSize: 11, color: "#f59e0b", fontWeight: 600 }}>
                              (In Dispute)
                            </div>
                          )}
                          {order.quantity > 1 && (
                            <div style={{ fontSize: 11, color: "var(--color-muted-foreground)", fontWeight: 500 }}>
                              ${parseFloat(order.unitPrice).toFixed(2)} each
                            </div>
                          )}
                        </>
                      )}
                    </td>

                    <td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                        {order.paymentMethod === "stripe" ? (
                          <>
                            <CreditCard size={15} color="var(--color-primary)" /> Card (Stripe)
                          </>
                        ) : (
                          <>
                            <Coins size={15} color="var(--color-warning)" /> Crypto
                          </>
                        )}
                      </span>
                    </td>

                    <td>
                      {order.paymentStatus === "completed" ? (
                        <span className="badge badge-success">
                          <span className="badge-dot" /> Paid
                        </span>
                      ) : order.paymentStatus === "pending" ? (
                        <span className="badge badge-warning">
                          <span className="badge-dot" /> Pending
                        </span>
                      ) : order.paymentStatus === "disputed" ? (
                        <span
                          className="badge"
                          style={{
                            background: "rgba(244, 63, 94, 0.15)",
                            color: "#f43f5e",
                            border: "1px solid rgba(244, 63, 94, 0.3)",
                          }}
                          title="Customer opened a dispute with Stripe"
                        >
                          <span className="badge-dot" style={{ background: "#f43f5e" }} /> Disputed
                        </span>
                      ) : order.paymentStatus === "refunded" ? (
                        <span
                          className="badge"
                          style={{
                            background: "rgba(168, 85, 247, 0.15)",
                            color: "#a855f7",
                            border: "1px solid rgba(168, 85, 247, 0.3)",
                          }}
                          title="Payment refunded"
                        >
                          <span className="badge-dot" style={{ background: "#a855f7" }} /> Refunded
                        </span>
                      ) : order.paymentStatus === "chargeback" ? (
                        <span
                          className="badge"
                          style={{
                            background: "rgba(239, 68, 68, 0.15)",
                            color: "#ef4444",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                          }}
                          title="Chargeback finalized"
                        >
                          <span className="badge-dot" style={{ background: "#ef4444" }} /> Chargeback
                        </span>
                      ) : (
                        <span className="badge badge-danger">
                          <span className="badge-dot" /> {order.paymentStatus}
                        </span>
                      )}
                    </td>

                    <td style={{ color: "var(--color-muted-foreground)", fontSize: 13 }}>
                      {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
