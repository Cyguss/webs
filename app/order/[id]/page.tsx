import { db } from "@/lib/db";
import { orders, products, shops, orderDeliveries } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import OrderReceiptClient from "./order-receipt-client";
import { CheckCircle2, Key, Package, ShieldCheck, Lock, Mail, ArrowRight } from "lucide-react";
import { verifyOrderAccessToken } from "@/lib/order-auth";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export default async function OrderReceiptPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ session_id?: string; pending?: string; token?: string }>;
}) {
  const { id } = await params;
  const sParams = searchParams ? await searchParams : {};
  const sessionId = sParams.session_id;
  const token = sParams.token;

  let sessionAutoVerified = false;

  // Auto-verify Stripe Session on page load if coming from Stripe Checkout
  if (sessionId) {
    try {
      const { stripe } = await import("@/lib/stripe");
      const { fulfillOrder } = await import("@/lib/order-fulfillment");
      const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
      if (stripeSession.metadata?.orderId === id && stripeSession.payment_status === "paid") {
        await fulfillOrder(id);
        sessionAutoVerified = true;
      }
    } catch (verifyErr) {
      console.warn("[OrderReceiptPage] Stripe session auto-verification:", verifyErr);
    }
  }

  const orderData = await db
    .select({
      order: orders,
      product: products,
      shop: shops,
      delivery: orderDeliveries,
    })
    .from(orders)
    .leftJoin(products, eq(orders.productId, products.id))
    .leftJoin(shops, eq(orders.shopId, shops.id))
    .leftJoin(orderDeliveries, eq(orders.id, orderDeliveries.orderId))
    .where(eq(orders.id, id));

  if (!orderData || orderData.length === 0) {
    notFound();
  }

  const { order, product, shop, delivery } = orderData[0];

  // Authorization Check:
  // 1. Valid HMAC token matching orderId and buyerEmail
  const hasValidToken = verifyOrderAccessToken(order.id, order.buyerEmail, token);

  // 2. Stripe direct session verification
  const isDirectStripe = sessionAutoVerified;

  // 3. Merchant owner or SuperAdmin session
  let isMerchantOrAdmin = false;
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (session?.user?.id) {
      if (shop && session.user.id === shop.userId) {
        isMerchantOrAdmin = true;
      } else if ((session.user as any).role === "admin" || (session.user as any).role === "superadmin") {
        isMerchantOrAdmin = true;
      }
    }
  } catch {}

  const isAuthorized = hasValidToken || isDirectStripe || isMerchantOrAdmin;

  // If unauthorized, render high-end privacy gate protecting keys
  if (!isAuthorized) {
    return (
      <div className="page-transition" style={{ minHeight: "100vh", background: "#08090c", color: "#fff", fontFamily: "Inter, sans-serif", padding: "80px 24px" }}>
        <div style={{ maxWidth: 520, margin: "0 auto", textAlign: "center" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "rgba(99, 102, 241, 0.12)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#818cf8",
              margin: "0 auto 20px",
            }}
          >
            <Lock size={30} />
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 10 }}>
            Order Receipt Protected
          </h1>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
            For your security and privacy, digital license keys and sensitive order details are locked. Please open the secure delivery link sent directly to your purchase email address.
          </p>

          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16,
              padding: 24,
              textAlign: "left",
              marginBottom: 24,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "rgba(255,255,255,0.8)", fontSize: 14, marginBottom: 8 }}>
              <Mail size={18} color="#818cf8" />
              <span>Sent to buyer email address on record</span>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
              Order Reference: <strong style={{ color: "#fff", fontFamily: "monospace" }}>#{order.id.slice(0, 10)}</strong>
            </div>
          </div>

          {shop && (
            <Link
              href={`/${shop.slug}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                color: "#818cf8",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              Return to {shop.name} Storefront →
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page-transition" style={{ minHeight: "100vh", background: "#0a0a0c", color: "#fff", fontFamily: "Inter, sans-serif", padding: "60px 24px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "rgba(16, 185, 129, 0.15)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#34d399",
              margin: "0 auto 16px",
            }}
          >
            <CheckCircle2 size={36} />
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
            Payment Successful!
          </h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, marginTop: 6 }}>
            Thank you for your purchase from <strong style={{ color: "#fff" }}>{shop?.name}</strong>
          </p>
        </div>

        {/* Order Delivery Box */}
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20,
            padding: 28,
            boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 16, marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {product?.type === "key" ? <Key size={22} color="#818cf8" /> : <Package size={22} color="#818cf8" />}
              <div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>Your Product Delivery</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{product?.title}</div>
              </div>
            </div>
            {order.quantity > 1 && (
              <span
                style={{
                  background: "rgba(99, 102, 241, 0.15)",
                  border: "1px solid rgba(99, 102, 241, 0.3)",
                  color: "#a5b4fc",
                  padding: "4px 10px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                Qty: {order.quantity}
              </span>
            )}
          </div>

          {/* Key Value Display */}
          {delivery && delivery.deliveryValue ? (
            <OrderReceiptClient deliveryValue={delivery.deliveryValue} orderId={order.id} />
          ) : (
            <div style={{ padding: 16, borderRadius: 12, background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.7)", fontSize: 14 }}>
              Order is being processed. Key will be sent to <strong>{order.buyerEmail}</strong> shortly.
            </div>
          )}

          {/* Receipt Info */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.08)", fontSize: 13 }}>
            <div>
              <span style={{ color: "rgba(255,255,255,0.5)", display: "block" }}>Order Reference</span>
              <span style={{ fontFamily: "monospace", color: "#fff" }}>#{order.id.slice(0, 12)}</span>
            </div>

            <div>
              <span style={{ color: "rgba(255,255,255,0.5)", display: "block" }}>Buyer Email</span>
              <span style={{ color: "#fff" }}>{order.buyerEmail}</span>
            </div>

            <div>
              <span style={{ color: "rgba(255,255,255,0.5)", display: "block" }}>Total Paid ({order.quantity} item{order.quantity > 1 ? "s" : ""})</span>
              <span style={{ fontWeight: 700, color: "#10b981", fontSize: 15 }}>${parseFloat(order.totalAmount).toFixed(2)} USD</span>
            </div>

            <div>
              <span style={{ color: "rgba(255,255,255,0.5)", display: "block" }}>Payment Method</span>
              <span style={{ textTransform: "uppercase", color: "#fff", fontWeight: 600 }}>{order.paymentMethod}</span>
            </div>
          </div>
        </div>

        {/* Back to store */}
        <div style={{ textAlign: "center" }}>
          {shop && (
            <Link
              href={`/${shop.slug}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                color: "#818cf8",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              Return to {shop.name} Storefront →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
