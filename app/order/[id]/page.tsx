import { db } from "@/lib/db";
import { orders, products, shops, orderDeliveries } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import OrderReceiptClient from "./order-receipt-client";
import { CheckCircle2, Key, Package, ShieldCheck, Lock, Mail, ArrowRight, Terminal, Cpu } from "lucide-react";
import { verifyOrderAccessToken } from "@/lib/order-auth";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";

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
      <div
        className="page-transition"
        style={{
          minHeight: "100vh",
          background: "#030305",
          color: "#fff",
          fontFamily: "Inter, sans-serif",
          padding: "80px 24px",
          position: "relative",
        }}
      >
        <div
          className="krypt-grid-bg"
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.25,
            pointerEvents: "none",
          }}
        />

        <div style={{ maxWidth: 520, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 10 }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 14,
              background: "rgba(255, 42, 75, 0.12)",
              border: "1px solid rgba(255, 42, 75, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ff2a4b",
              margin: "0 auto 20px",
              boxShadow: "0 0 20px rgba(255, 42, 75, 0.2)",
            }}
          >
            <Lock size={28} />
          </div>

          <div style={{ fontSize: 10, fontFamily: "var(--font-mono, monospace)", color: "#ff2a4b", letterSpacing: "0.04em", marginBottom: 6, textTransform: "uppercase" }}>
            Secure Order Verification
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.01em", marginBottom: 10, color: "#fff" }}>
            Order Receipt Protected
          </h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, lineHeight: 1.6, marginBottom: 26 }}>
            For privacy and security, direct license access is protected. Check the receipt link sent to your email address or lookup your order below.
          </p>

          <div
            style={{
              background: "rgba(8, 8, 12, 0.95)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: 12,
              padding: 20,
              textAlign: "left",
              marginBottom: 24,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "rgba(255,255,255,0.8)", fontSize: 13, marginBottom: 6 }}>
              <Mail size={16} color="#c4b5fd" />
              <span>Receipt sent to customer email on file</span>
            </div>
            <div style={{ fontSize: 11, fontFamily: "var(--font-mono, monospace)", color: "rgba(255,255,255,0.45)" }}>
              Order ID: <strong style={{ color: "#ffffff" }}>#{order.id.slice(0, 12)}</strong>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
            <Link
              href={shop ? `/${shop.slug}/lookup` : "/lookup"}
              className="krypt-btn-primary"
              style={{
                width: "100%",
                maxWidth: 320,
                padding: "11px",
                fontSize: 12,
                fontFamily: "var(--font-mono, monospace)",
                fontWeight: 800,
                display: "inline-flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
                borderRadius: 8,
                textDecoration: "none",
              }}
            >
              <Mail size={14} />
              <span>Find My Order & Keys</span>
            </Link>

            {shop && (
              <Link
                href={`/${shop.slug}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  color: "#c4b5fd",
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: 12,
                  fontFamily: "var(--font-mono, monospace)",
                  marginTop: 6,
                }}
              >
                ← Return to {shop.name} Storefront
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="page-transition"
      style={{
        minHeight: "100vh",
        background: "var(--color-background)",
        color: "var(--color-foreground)",
        fontFamily: "Inter, sans-serif",
        padding: "40px 24px 60px",
        position: "relative",
      }}
    >
      {/* Background Grid */}
      <div
        className="krypt-grid-bg"
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.25,
          pointerEvents: "none",
        }}
      />

      {/* Top Bar Controls */}
      <div style={{ maxWidth: 640, margin: "0 auto 20px", display: "flex", justifyContent: "flex-end", position: "relative", zIndex: 10 }}>
        <ThemeToggle />
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", position: "relative", zIndex: 10 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "rgba(55, 44, 102, 0.4)",
              border: "1px solid rgba(139, 92, 246, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#c4b5fd",
              margin: "0 auto 14px",
              boxShadow: "0 0 24px rgba(55, 44, 102, 0.5)",
            }}
          >
            <CheckCircle2 size={30} />
          </div>

          <div style={{ fontSize: 10, fontFamily: "var(--font-mono, monospace)", color: "#a78bfa", letterSpacing: "0.04em", marginBottom: 4, textTransform: "uppercase" }}>
            Payment Confirmed • Delivery Ready
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: "-0.01em", color: "#fff" }}>
            Payment Successful & Keys Delivered
          </h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginTop: 4 }}>
            Order receipt from <strong style={{ color: "#ffffff" }}>{shop?.name}</strong>
          </p>
        </div>

        {/* Order Delivery Box */}
        <div
          style={{
            background: "rgba(8, 8, 12, 0.95)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: 16,
            padding: 24,
            backdropFilter: "blur(16px)",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.9)",
            marginBottom: 24,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Top LED Accent */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              background: "linear-gradient(90deg, transparent 0%, rgb(55, 44, 102) 25%, #8b5cf6 50%, rgb(55, 44, 102) 75%, transparent 100%)",
            }}
          />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 14, marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: "rgba(55, 44, 102, 0.35)",
                  border: "1px solid rgba(139, 92, 246, 0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#c4b5fd",
                }}
              >
                {product?.type === "key" ? <Key size={18} /> : <Package size={18} />}
              </div>
              <div>
                <div style={{ fontSize: 10, fontFamily: "var(--font-mono, monospace)", color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>
                  Purchased Item
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>{product?.title}</div>
              </div>
            </div>
            {order.quantity > 1 && (
              <span
                style={{
                  background: "rgba(55, 44, 102, 0.4)",
                  border: "1px solid rgba(139, 92, 246, 0.4)",
                  color: "#c4b5fd",
                  padding: "3px 8px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontFamily: "var(--font-mono, monospace)",
                  fontWeight: 800,
                }}
              >
                Qty: {order.quantity}
              </span>
            )}
          </div>

          {/* Key Value Display */}
          {delivery && delivery.deliveryValue ? (
            <OrderReceiptClient
              deliveryValue={delivery.deliveryValue}
              orderId={order.id}
              duration={order.keyDuration || product?.duration}
              durationDays={order.keyDurationDays ?? product?.durationDays}
              customDurationLabel={product?.customDurationLabel}
              expiresAt={order.keyExpiresAt ? order.keyExpiresAt.toISOString() : null}
            />
          ) : (
            <div style={{ padding: 14, borderRadius: 8, background: "rgba(3, 3, 5, 0.9)", color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: "var(--font-mono, monospace)" }}>
              Processing order. Details dispatched to <strong>{order.buyerEmail}</strong>.
            </div>
          )}

          {/* Receipt Info */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.08)", fontSize: 12, fontFamily: "var(--font-mono, monospace)" }}>
            <div>
              <span style={{ color: "rgba(255,255,255,0.4)", display: "block", fontSize: 10 }}>ORDER ID</span>
              <span style={{ color: "#ffffff", fontWeight: 700 }}>#{order.id.slice(0, 14)}</span>
            </div>

            <div>
              <span style={{ color: "rgba(255,255,255,0.4)", display: "block", fontSize: 10 }}>CUSTOMER EMAIL</span>
              <span style={{ color: "#fff" }}>{order.buyerEmail}</span>
            </div>

            <div>
              <span style={{ color: "rgba(255,255,255,0.4)", display: "block", fontSize: 10 }}>TOTAL PAID ({order.quantity} ITEM{order.quantity > 1 ? "S" : ""})</span>
              <span style={{ fontWeight: 800, color: "#ffffff", fontSize: 14 }}>${parseFloat(order.totalAmount).toFixed(2)} USD</span>
            </div>

            <div>
              <span style={{ color: "rgba(255,255,255,0.4)", display: "block", fontSize: 10 }}>PAYMENT METHOD</span>
              <span style={{ textTransform: "uppercase", color: "#c4b5fd", fontWeight: 700 }}>{order.paymentMethod}</span>
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
                gap: 6,
                color: "#c4b5fd",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: 13,
                fontFamily: "var(--font-mono, monospace)",
              }}
            >
              ← Return to {shop.name} Storefront
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

