"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Coins, Zap, ShieldCheck, Loader2, Tag, Plus, Minus, Clock, Layers, Cpu, CheckCircle } from "lucide-react";
import { useToast } from "@/components/toast-context";
import { isDisposableEmail } from "@/lib/anti-fraud/disposable-email";
import { getKeyDurationDisplay, KeyDurationType } from "@/lib/key-duration";

export default function ProductCheckoutClient({
  product,
  shop,
  stock,
  variantStocks = {},
  accentColor = "rgb(55, 44, 102)",
}: any) {
  const router = useRouter();
  const toast = useToast();

  // Parse product variants if configured
  const parsedVariants: any[] = useMemo(() => {
    if (!product?.variants) return [];
    try {
      const arr = JSON.parse(product.variants);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }, [product]);

  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    parsedVariants.length > 0 ? parsedVariants[0].id : ""
  );

  const selectedVariant = useMemo(() => {
    if (parsedVariants.length === 0) return null;
    return parsedVariants.find((v) => v.id === selectedVariantId) || parsedVariants[0];
  }, [parsedVariants, selectedVariantId]);

  // Current active stock for selected duration variant
  const currentActiveStock = useMemo(() => {
    if (product.isUnlimitedStock) return 9999;
    if (selectedVariant) {
      if (variantStocks[selectedVariant.id] !== undefined) return variantStocks[selectedVariant.id];
      if (variantStocks[selectedVariant.duration] !== undefined) return variantStocks[selectedVariant.duration];
    }
    return stock;
  }, [product.isUnlimitedStock, selectedVariant, variantStocks, stock]);

  const [quantity, setQuantity] = useState(1);
  const [stockNotice, setStockNotice] = useState<string | null>(null);
  const [buyerEmail, setBuyerEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "crypto">("stripe");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Unit price is variant price if variants exist, else base product price
  const unitPrice = selectedVariant ? parseFloat(selectedVariant.price) : parseFloat(product.price);
  const rawTotal = unitPrice * quantity;

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  function handleQuantityChange(val: number) {
    setStockNotice(null);
    setError(null);
    if (isNaN(val) || val < 1) {
      setQuantity(1);
      return;
    }
    if (!product.isUnlimitedStock && val > currentActiveStock) {
      setQuantity(Math.max(1, currentActiveStock));
      setStockNotice(`Maximum ${currentActiveStock} items available in stock.`);
      return;
    }
    setQuantity(val);
  }

  function handleIncrement() {
    if (!product.isUnlimitedStock && quantity >= currentActiveStock) {
      setStockNotice(`Only ${currentActiveStock} items available in stock.`);
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
      toast.success("Coupon Applied", `Discount code ${data.code} applied successfully.`);
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
      const msg = "Please enter a valid email address.";
      setError(msg);
      toast.error("Invalid Email", msg);
      return;
    }

    if (isDisposableEmail(buyerEmail)) {
      const msg = "Temporary/disposable email addresses are not permitted. Please use a regular email.";
      setError(msg);
      toast.error("Disposable Email Blocked", msg);
      return;
    }

    if (!product.isUnlimitedStock && currentActiveStock <= 0) {
      const msg = selectedVariant
        ? `The "${selectedVariant.label || selectedVariant.duration}" plan is currently out of stock.`
        : "This product is currently out of stock.";
      setError(msg);
      toast.error("Out of Stock", msg);
      return;
    }

    if (!product.isUnlimitedStock && quantity > currentActiveStock) {
      const msg = `Only ${currentActiveStock} items available in stock.`;
      setError(msg);
      setStockNotice(msg);
      toast.error("Stock Exceeded", msg);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          variantId: selectedVariant?.id || null,
          duration: selectedVariant?.duration || product.duration,
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
        toast.info("Redirecting", "Opening secure checkout...");
        window.location.href = data.checkoutUrl;
        return;
      }

      if (data.redirectUrl) {
        toast.success("Payment Completed", "Your order has been confirmed!");
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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 18,
        background: "linear-gradient(180deg, #090812 0%, #05040a 100%)",
        border: "1px solid rgba(55, 44, 102, 0.45)",
        borderRadius: 16,
        padding: 24,
        backdropFilter: "blur(14px)",
        boxShadow: "0 12px 40px rgba(0, 0, 0, 0.8)",
      }}
    >
      {/* Price Summary Box (HUD Style) */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          paddingBottom: 16,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 10, fontFamily: "var(--font-mono, monospace)", color: "rgba(255, 255, 255, 0.4)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Total Price
            </span>
            <span style={{ fontSize: 11, fontFamily: "var(--font-mono, monospace)", color: "#c4b5fd" }}>
              {product.type === "key" ? "Digital Key" : "Instant Delivery"} • Qty: {quantity}
            </span>
          </div>

          <div style={{ textAlign: "right" }}>
            {appliedCoupon && (
              <span style={{ fontSize: 13, fontFamily: "var(--font-mono, monospace)", color: "rgba(255, 255, 255, 0.4)", textDecoration: "line-through", marginRight: 8 }}>
                ${rawTotal.toFixed(2)}
              </span>
            )}
            <span
              style={{
                fontSize: 26,
                fontWeight: 800,
                fontFamily: "var(--font-mono, monospace)",
                color: "#ffffff",
                letterSpacing: "-0.02em",
                textShadow: "0 0 16px rgba(139, 92, 246, 0.35)",
              }}
            >
              ${finalTotal.toFixed(2)} <span style={{ fontSize: 13, color: "#c4b5fd" }}>USD</span>
            </span>
          </div>
        </div>

        {appliedCoupon && (
          <div style={{ fontSize: 11, fontFamily: "var(--font-mono, monospace)", color: "#c4b5fd", display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
            <Tag size={11} /> Coupon: {appliedCoupon.code} (-${discountAmount.toFixed(2)})
          </div>
        )}
      </div>

      {/* Multi-Duration Hardware-Chip Variant Selector */}
      {parsedVariants.length > 0 && (
        <div className="animate-slide-up" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label style={{ fontSize: 11, fontFamily: "var(--font-mono, monospace)", fontWeight: 700, color: "#c4b5fd", textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 6 }}>
              <Clock size={13} /> Select Plan / Duration:
            </label>
            {selectedVariant && (
              <span style={{ fontSize: 10, fontFamily: "var(--font-mono, monospace)", color: currentActiveStock > 0 ? "#c4b5fd" : "#ef4444", fontWeight: 700 }}>
                {product.isUnlimitedStock ? "Instant Delivery" : currentActiveStock > 0 ? `${currentActiveStock} in stock` : "Out of stock"}
              </span>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: parsedVariants.length > 2 ? "repeat(2, 1fr)" : "repeat(auto-fit, minmax(130px, 1fr))", gap: 8 }}>
            {parsedVariants.map((v) => {
              const isSelected = selectedVariantId === v.id;
              const dMeta = getKeyDurationDisplay(v.duration, v.durationDays, v.customDurationLabel);
              const vStock = product.isUnlimitedStock
                ? 9999
                : (variantStocks[v.id] !== undefined
                    ? variantStocks[v.id]
                    : variantStocks[v.duration] !== undefined
                    ? variantStocks[v.duration]
                    : stock);
              const isVariantOutOfStock = !product.isUnlimitedStock && vStock <= 0;

              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={isVariantOutOfStock}
                  onClick={() => {
                    setSelectedVariantId(v.id);
                    setError(null);
                    setStockNotice(null);
                  }}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: isSelected
                      ? "1px solid #8b5cf6"
                      : "1px solid rgba(255, 255, 255, 0.08)",
                    background: isSelected
                      ? "rgb(55, 44, 102)"
                      : "rgba(255, 255, 255, 0.02)",
                    color: isSelected ? "#ffffff" : "rgba(255, 255, 255, 0.7)",
                    cursor: isVariantOutOfStock ? "not-allowed" : "pointer",
                    textAlign: "left",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    position: "relative",
                    overflow: "hidden",
                    transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
                    boxShadow: isSelected ? "0 0 16px rgba(139, 92, 246, 0.35)" : "none",
                    opacity: isVariantOutOfStock ? 0.4 : 1,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 800, fontFamily: "var(--font-mono, monospace)", color: isSelected ? "#ffffff" : "rgba(255,255,255,0.9)" }}>
                      {v.label || dMeta.shortLabel}
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        fontFamily: "var(--font-mono, monospace)",
                        fontWeight: 800,
                        padding: "1px 5px",
                        borderRadius: 3,
                        background: isSelected ? "rgba(255, 255, 255, 0.18)" : "rgba(55, 44, 102, 0.4)",
                        color: isSelected ? "#ffffff" : "#c4b5fd",
                        border: isSelected ? "1px solid rgba(255, 255, 255, 0.3)" : "1px solid rgba(139, 92, 246, 0.4)",
                      }}
                    >
                      {dMeta.shortLabel}
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 2 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, fontFamily: "var(--font-mono, monospace)", color: "#ffffff" }}>
                      ${parseFloat(v.price).toFixed(2)}
                    </div>
                    <span style={{ fontSize: 9, fontFamily: "var(--font-mono, monospace)", color: isVariantOutOfStock ? "#ef4444" : "rgba(255,255,255,0.45)" }}>
                      {isVariantOutOfStock ? "DEPLETED" : product.isUnlimitedStock ? "INSTANT" : `${vStock} left`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Checkout Inputs */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Email input */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ fontSize: 11, fontFamily: "var(--font-mono, monospace)", fontWeight: 700, color: "rgba(255, 255, 255, 0.7)", letterSpacing: "0.02em" }}>
            Email Address *
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            value={buyerEmail}
            onChange={(e) => setBuyerEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 8,
              background: "rgba(3, 3, 5, 0.9)",
              border: "1px solid rgba(139, 92, 246, 0.25)",
              color: "#ffffff",
              fontSize: 13,
              fontFamily: "var(--font-mono, monospace)",
              outline: "none",
              transition: "all 0.15s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#8b5cf6";
              e.currentTarget.style.boxShadow = "0 0 12px rgba(139, 92, 246, 0.25)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.25)";
              e.currentTarget.style.boxShadow = "none";
            }}
            required
          />
        </div>

        {/* Promo code input */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ fontSize: 11, fontFamily: "var(--font-mono, monospace)", fontWeight: 700, color: "rgba(255, 255, 255, 0.7)", letterSpacing: "0.02em" }}>
            Discount Code
          </label>
          <form onSubmit={handleApplyCoupon} style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              placeholder="e.g. SAVE10"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              style={{
                flex: 1,
                padding: "9px 12px",
                borderRadius: 8,
                background: "rgba(3, 3, 5, 0.9)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#fff",
                fontSize: 12,
                fontFamily: "var(--font-mono, monospace)",
                textTransform: "uppercase",
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={couponLoading || !couponCode.trim()}
              style={{
                padding: "9px 16px",
                borderRadius: 8,
                background: "rgba(55, 44, 102, 0.4)",
                color: "#c4b5fd",
                border: "1px solid rgba(139, 92, 246, 0.4)",
                fontSize: 12,
                fontFamily: "var(--font-mono, monospace)",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {couponLoading ? <Loader2 size={13} className="animate-spin" /> : "Apply"}
            </button>
          </form>

          {couponError && <span className="animate-pop" style={{ fontSize: 11, fontFamily: "var(--font-mono, monospace)", color: "#ef4444" }}>{couponError}</span>}
        </div>

        {/* Quantity Selector with Steppers */}
        {!product.isUnlimitedStock && (
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ fontSize: 11, fontFamily: "var(--font-mono, monospace)", fontWeight: 700, color: "rgba(255, 255, 255, 0.7)" }}>
                Quantity
              </label>
              <span style={{ fontSize: 10, fontFamily: "var(--font-mono, monospace)", color: stock > 0 ? "rgba(255,255,255,0.4)" : "#ef4444" }}>
                {stock > 0 ? `${stock} available` : "Out of stock"}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  background: "rgba(3, 3, 5, 0.9)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              >
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={quantity <= 1 || stock <= 0}
                  style={{
                    width: 34,
                    height: 34,
                    border: "none",
                    background: "transparent",
                    color: quantity <= 1 || stock <= 0 ? "rgba(255,255,255,0.2)" : "#fff",
                    cursor: quantity <= 1 || stock <= 0 ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Minus size={13} />
                </button>

                <input
                  type="number"
                  min="1"
                  max={stock || 1}
                  value={quantity}
                  onChange={(e) => handleQuantityChange(parseInt(e.target.value, 10))}
                  style={{
                    width: 44,
                    height: 34,
                    border: "none",
                    background: "transparent",
                    color: "#ffffff",
                    textAlign: "center",
                    fontSize: 13,
                    fontFamily: "var(--font-mono, monospace)",
                    fontWeight: 800,
                    outline: "none",
                  }}
                />

                <button
                  type="button"
                  onClick={handleIncrement}
                  disabled={quantity >= stock || stock <= 0}
                  style={{
                    width: 34,
                    height: 34,
                    border: "none",
                    background: "transparent",
                    color: quantity >= stock || stock <= 0 ? "rgba(255,255,255,0.2)" : "#fff",
                    cursor: quantity >= stock || stock <= 0 ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Plus size={13} />
                </button>
              </div>

              {stockNotice && <span className="animate-pop" style={{ fontSize: 11, fontFamily: "var(--font-mono, monospace)", color: "#ef4444" }}>{stockNotice}</span>}
            </div>
          </div>
        )}

        {/* Payment Method Selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 11, fontFamily: "var(--font-mono, monospace)", fontWeight: 700, color: "rgba(255, 255, 255, 0.7)" }}>
            Payment Method
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <button
              type="button"
              onClick={() => setPaymentMethod("stripe")}
              style={{
                padding: "10px",
                borderRadius: 8,
                border: paymentMethod === "stripe" ? "1px solid #8b5cf6" : "1px solid rgba(255,255,255,0.08)",
                background: paymentMethod === "stripe" ? "rgb(55, 44, 102)" : "rgba(255,255,255,0.02)",
                color: paymentMethod === "stripe" ? "#ffffff" : "rgba(255,255,255,0.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                fontFamily: "var(--font-mono, monospace)",
                fontWeight: 700,
                fontSize: 11,
                cursor: "pointer",
                boxShadow: paymentMethod === "stripe" ? "0 0 14px rgba(139, 92, 246, 0.35)" : "none",
              }}
            >
              <CreditCard size={14} /> Card (Stripe)
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod("crypto")}
              style={{
                padding: "10px",
                borderRadius: 8,
                border: paymentMethod === "crypto" ? "1px solid #8b5cf6" : "1px solid rgba(255,255,255,0.08)",
                background: paymentMethod === "crypto" ? "rgb(55, 44, 102)" : "rgba(255,255,255,0.02)",
                color: paymentMethod === "crypto" ? "#ffffff" : "rgba(255,255,255,0.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                fontFamily: "var(--font-mono, monospace)",
                fontWeight: 700,
                fontSize: 11,
                cursor: "pointer",
                boxShadow: paymentMethod === "crypto" ? "0 0 14px rgba(139, 92, 246, 0.35)" : "none",
              }}
            >
              <Coins size={14} /> Crypto
            </button>
          </div>
        </div>

        {error && (
          <div className="animate-pop" style={{ padding: "8px 12px", borderRadius: 6, background: "rgba(239, 68, 68, 0.15)", border: "1px solid #ef4444", color: "#ef4444", fontSize: 12, fontFamily: "var(--font-mono, monospace)" }}>
            {error}
          </div>
        )}

        {/* Action Button */}
        <button
          type="button"
          onClick={() => handleCheckout(false)}
          disabled={loading || stock <= 0}
          className="krypt-btn-primary"
          style={{
            width: "100%",
            padding: "13px",
            borderRadius: 8,
            fontSize: 13,
            fontFamily: "var(--font-mono, monospace)",
            fontWeight: 800,
            cursor: loading || stock <= 0 ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            opacity: stock <= 0 ? 0.45 : 1,
            marginTop: 4,
          }}
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              <Zap size={15} />
              <span>
                {stock <= 0
                  ? "Out of Stock"
                  : `Pay $${finalTotal.toFixed(2)} USD`}
              </span>
            </>
          )}
        </button>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 10, fontFamily: "var(--font-mono, monospace)", color: "rgba(255,255,255,0.4)" }}>
          <ShieldCheck size={13} color="#c4b5fd" />
          <span>Encrypted & Automated Checkout</span>
        </div>
      </div>
    </div>
  );
}

