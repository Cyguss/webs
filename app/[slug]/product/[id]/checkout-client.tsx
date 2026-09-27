"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Coins, Zap, ShieldCheck, Loader2, CheckCircle2, ArrowRight, Tag, Check, Plus, Minus, AlertTriangle, AlertCircle } from "lucide-react";
import { useToast } from "@/components/toast-context";
import { isDisposableEmail } from "@/lib/anti-fraud/disposable-email";

export default function ProductCheckoutClient({ product, shop, stock, accentColor }: any) {
  const router = useRouter();
  const toast = useToast();
  const [quantity, setQuantity] = useState(1);
  const [stockNotice, setStockNotice] = useState<string | null>(null);
  const [buyerEmail, setBuyerEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "crypto">("stripe");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleQuantityChange(val: number) {
    setStockNotice(null);
    setError(null);
    if (isNaN(val) || val < 1) {
      setQuantity(1);
      return;
    }
    if (!product.isUnlimitedStock && val > stock) {
      setQuantity(stock);
      setStockNotice(`Max available stock is ${stock}`);
      return;
    }
    setQuantity(val);
  }

  function handleIncrement() {
    if (!product.isUnlimitedStock && quantity >= stock) {
      setStockNotice(`Cannot add more. Only ${stock} item(s) available in vault.`);
      setTimeout(() => setStockNotice(null), 4000);
      return;
    }
    setQuantity((prev) => prev + 1);
    setStockNotice(null);
  }

  function handleDecrement() {
    if (quantity <= 1) return;
    setQuantity((prev) => prev - 1);
    setStockNotice(null);
  }

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);


  const unitPrice = parseFloat(product.price);
  const rawTotal = unitPrice * quantity;

  // Calculate discount
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountPercent) {
      discountAmount = (rawTotal * appliedCoupon.discountPercent) / 100;
    } else if (appliedCoupon.discountAmount) {
      discountAmount = Math.min(rawTotal, appliedCoupon.discountAmount);
    }
  }

  const finalTotal = Math.max(0, rawTotal - discountAmount);

  async function handleApplyCoupon(e: React.FormEvent) {
    e.preventDefault();
    setCouponError(null);

    if (!couponCode.trim()) return;

    setCouponLoading(true);

    try {
      const res = await fetch(`/api/coupons?code=${encodeURIComponent(couponCode.trim())}&shopId=${shop.id}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Invalid coupon code");

      setAppliedCoupon(data);
      setCouponError(null);
      toast.success("Coupon Applied", `Promo code ${data.code} applied successfully!`);
    } catch (err: any) {
      setCouponError(err.message);
      setAppliedCoupon(null);
      toast.error("Coupon Error", err.message || "Invalid coupon code");
    } finally {
      setCouponLoading(false);
    }
  }

  async function handleCheckout(isMockPay = false) {
    setError(null);

    if (!buyerEmail.trim() || !buyerEmail.includes("@")) {
      const msg = "Please enter a valid email address to receive your order receipt.";
      setError(msg);
      toast.error("Invalid Email", msg);
      return;
    }

    if (isDisposableEmail(buyerEmail)) {
      const msg = "Temporary and disposable email domains are not permitted. Please provide a permanent email address (e.g. Gmail, Outlook, iCloud).";
      setError(msg);
      toast.error("Disposable Email Blocked", msg);
      return;
    }

    if (stock <= 0) {
      const msg = "This product is currently out of stock.";
      setError(msg);
      toast.error("Out of Stock", msg);
      return;
    }

    if (!product.isUnlimitedStock && quantity > stock) {
      const msg = `Cannot purchase ${quantity} items. Only ${stock} available in stock.`;
      setError(msg);
      setStockNotice(msg);
      toast.error("Insufficient Stock", msg);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          buyerEmail: buyerEmail.trim(),
          paymentMethod,
          quantity,
          couponId: appliedCoupon ? appliedCoupon.couponId : null,
          mockPay: isMockPay,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Checkout failed");
      }

      if (data.checkoutUrl) {
        toast.info("Connecting to Payment Gateway", "Redirecting to secure checkout...");
        window.location.href = data.checkoutUrl;
        return;
      }

      if (data.redirectUrl) {
        toast.success("Payment Successful!", "Redirecting to your delivery receipt...");
        router.push(data.redirectUrl);
        return;
      }

      router.push(`/order/${data.orderId}?pending=1`);
    } catch (err: any) {
      setError(err.message);
      toast.error("Checkout Failed", err.message || "Could not process transaction");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Price Summary Box */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>Total Price</span>
          <div style={{ textAlign: "right" }}>
            {appliedCoupon && (
              <span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", textDecoration: "line-through", marginRight: 8 }}>
                ${rawTotal.toFixed(2)}
              </span>
            )}
            <span style={{ fontSize: 28, fontWeight: 800, color: "#fff" }}>${finalTotal.toFixed(2)} USD</span>
          </div>
        </div>

        {appliedCoupon && (
          <div style={{ fontSize: 12, color: "#34d399", display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
            <Tag size={12} /> Promo code {appliedCoupon.code} applied (-${discountAmount.toFixed(2)})
          </div>
        )}
      </div>

      {/* Standard Checkout Form */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Email input */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>Your Email Address *</label>
            <input
              type="email"
              placeholder="buyer@example.com"
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#fff",
                fontSize: 14,
                outline: "none",
              }}
              required
            />
          </div>

          {/* Promo code input */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>Have a Promo Code?</label>
            <form onSubmit={handleApplyCoupon} style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                placeholder="e.g. VIP20"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "#fff",
                  fontSize: 13,
                  fontFamily: "monospace",
                  textTransform: "uppercase",
                  outline: "none",
                }}
              />
              <button
                type="submit"
                disabled={couponLoading || !couponCode.trim()}
                style={{
                  padding: "10px 16px",
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.1)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.15)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {couponLoading ? <Loader2 size={14} className="spin" /> : "Apply"}
              </button>
            </form>

            {couponError && <span style={{ fontSize: 11, color: "#f87171" }}>{couponError}</span>}
          </div>

          {/* Quantity Selector with Steppers and Stock Protection */}
          {!product.isUnlimitedStock && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>Quantity</label>
                <span style={{ fontSize: 11, color: stock > 0 ? "rgba(255,255,255,0.5)" : "#ef4444" }}>
                  {stock > 0 ? `Max in stock: ${stock}` : "Out of stock"}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 10,
                    overflow: "hidden",
                  }}
                >
                  <button
                    type="button"
                    onClick={handleDecrement}
                    disabled={quantity <= 1 || stock <= 0}
                    style={{
                      width: 36,
                      height: 38,
                      border: "none",
                      background: "transparent",
                      color: quantity <= 1 || stock <= 0 ? "rgba(255,255,255,0.2)" : "#fff",
                      cursor: quantity <= 1 || stock <= 0 ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    title="Decrease quantity"
                  >
                    <Minus size={14} />
                  </button>

                  <input
                    type="number"
                    min="1"
                    max={stock}
                    value={quantity}
                    onChange={(e) => handleQuantityChange(parseInt(e.target.value))}
                    disabled={stock <= 0}
                    style={{
                      width: 50,
                      height: 38,
                      padding: 0,
                      background: "transparent",
                      border: "none",
                      color: "#fff",
                      fontSize: 14,
                      fontWeight: 700,
                      textAlign: "center",
                      outline: "none",
                    }}
                  />

                  <button
                    type="button"
                    onClick={handleIncrement}
                    disabled={quantity >= stock || stock <= 0}
                    style={{
                      width: 36,
                      height: 38,
                      border: "none",
                      background: "transparent",
                      color: quantity >= stock || stock <= 0 ? "rgba(255,255,255,0.2)" : "#fff",
                      cursor: quantity >= stock || stock <= 0 ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    title="Increase quantity"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {stockNotice && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    color: "#f59e0b",
                    background: "rgba(245, 158, 11, 0.12)",
                    padding: "7px 10px",
                    borderRadius: 8,
                    border: "1px solid rgba(245, 158, 11, 0.25)",
                  }}
                >
                  <AlertTriangle size={13} style={{ flexShrink: 0 }} />
                  <span>{stockNotice}</span>
                </div>
              )}
            </div>
          )}

          {/* Payment Method Tabs */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>Payment Method</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <button
                type="button"
                onClick={() => setPaymentMethod("stripe")}
                style={{
                  height: 42,
                  boxSizing: "border-box",
                  padding: "0 8px",
                  borderRadius: 10,
                  border: paymentMethod === "stripe" ? `1px solid ${accentColor}` : "1px solid rgba(255,255,255,0.1)",
                  boxShadow: paymentMethod === "stripe" ? `0 0 0 1px ${accentColor}` : "none",
                  background: paymentMethod === "stripe" ? `${accentColor}22` : "rgba(255,255,255,0.04)",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  cursor: "pointer",
                  transition: "background 0.15s ease, border-color 0.15s ease",
                }}
              >
                <CreditCard size={15} color="#818cf8" style={{ flexShrink: 0 }} /> Stripe / Card
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("crypto")}
                style={{
                  height: 42,
                  boxSizing: "border-box",
                  padding: "0 8px",
                  borderRadius: 10,
                  border: paymentMethod === "crypto" ? `1px solid ${accentColor}` : "1px solid rgba(255,255,255,0.1)",
                  boxShadow: paymentMethod === "crypto" ? `0 0 0 1px ${accentColor}` : "none",
                  background: paymentMethod === "crypto" ? `${accentColor}22` : "rgba(255,255,255,0.04)",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  cursor: "pointer",
                  transition: "background 0.15s ease, border-color 0.15s ease",
                }}
              >
                <Coins size={15} color="#f59e0b" style={{ flexShrink: 0 }} /> Crypto
              </button>
            </div>
          </div>

          {/* Pay Action Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
            <button
              onClick={() => handleCheckout(false)}
              disabled={loading || stock <= 0}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: 12,
                background: stock <= 0 ? "rgba(255,255,255,0.08)" : accentColor,
                color: stock <= 0 ? "rgba(255,255,255,0.4)" : "#fff",
                fontWeight: 700,
                fontSize: 16,
                border: "none",
                cursor: stock <= 0 ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: stock <= 0 ? "none" : `0 4px 20px ${accentColor}66`,
              }}
            >
              {loading ? (
                <Loader2 size={18} className="spin" />
              ) : stock <= 0 ? (
                "Out of Stock"
              ) : (
                <>Pay ${finalTotal.toFixed(2)} Now <ArrowRight size={18} /></>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }
