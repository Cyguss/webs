"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Coins,
  Copy,
  Check,
  Loader2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Clock,
  ExternalLink,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/toast-context";

interface Props {
  order: any;
  product: any;
  shop: any;
  accessToken: string;
}

const CRYPTO_OPTIONS = [
  { id: "USDT", name: "Tether (USDT)", network: "TRC-20", rateMultiplier: 1, address: "TXq98y2nU19283741829374918237912TRC20" },
  { id: "LTC", name: "Litecoin (LTC)", network: "Litecoin", rateMultiplier: 1 / 85, address: "ltc1qtestsandboxaddress1234567890" },
  { id: "BTC", name: "Bitcoin (BTC)", network: "Bitcoin", rateMultiplier: 1 / 65000, address: "bc1qtestsandboxbitcoinaddress123456" },
  { id: "SOL", name: "Solana (SOL)", network: "Solana", rateMultiplier: 1 / 140, address: "SoL1111111111111111111111111111111111111111" },
];

export default function CryptoSandboxClient({
  order,
  product,
  shop,
  accessToken,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [selectedCrypto, setSelectedCrypto] = useState(CRYPTO_OPTIONS[0]);
  const [copied, setCopied] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [simStatus, setSimStatus] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(3599); // 1 hour countdown

  const totalNum = parseFloat(order.totalAmount);
  const cryptoAmount = (totalNum * selectedCrypto.rateMultiplier).toFixed(
    selectedCrypto.id === "BTC" ? 6 : selectedCrypto.id === "LTC" ? 4 : selectedCrypto.id === "SOL" ? 3 : 2
  );

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Poll for order completion every 3s
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/checkout/verify?orderId=${order.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.paymentStatus === "completed") {
            clearInterval(pollInterval);
            toast.success("Payment Confirmed", "Blockchain payment verified! Redirecting to receipt...");
            router.push(`/order/${order.id}?token=${accessToken}&crypto=1`);
          }
        }
      } catch {}
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [order.id, accessToken, router, toast]);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedCrypto.address);
    setCopied(true);
    toast.success("Address Copied", "Deposit address copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSimulatePayment = async () => {
    setSimulating(true);
    setSimStatus("Broadcasting simulated transaction to blockchain network...");

    try {
      await new Promise((r) => setTimeout(r, 1000));
      setSimStatus("Verifying NOWPayments HMAC-SHA512 signature & processing webhook...");

      const res = await fetch("/api/webhooks/crypto/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Simulation failed");
      }

      setSimStatus("Payment confirmed! Fulfilling digital license keys...");
      await new Promise((r) => setTimeout(r, 1200));

      toast.success("Order Fulfilled", "Test crypto payment succeeded! Delivering your order...");
      router.push(`/order/${order.id}?token=${accessToken}&crypto=1`);
    } catch (err: any) {
      toast.error("Simulation Error", err.message || "Failed to trigger webhook");
      setSimulating(false);
      setSimStatus(null);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#08090c",
        color: "#f3f4f6",
        fontFamily: "Inter, sans-serif",
        padding: "50px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          maxWidth: 580,
          width: "100%",
          background: "#0f1118",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: 20,
          padding: 32,
          boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 20 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <div style={{ background: "#6366f1", borderRadius: 8, padding: "4px 8px", fontSize: 11, fontWeight: 800, color: "#fff", letterSpacing: "0.05em" }}>
                NOWPAYMENTS
              </div>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Sandbox Simulator</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: 0 }}>
              Crypto Payment Invoice
            </h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>
              Order #{order.id.slice(0, 10)} • {shop?.name}
            </p>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>Time Remaining</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#f59e0b", fontWeight: 700, fontSize: 15, fontFamily: "monospace" }}>
              <Clock size={14} /> {formatTimer(timeLeft)}
            </div>
          </div>
        </div>

        {/* Currency Selector */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: 8, display: "block" }}>
            Select Cryptocurrency:
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {CRYPTO_OPTIONS.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCrypto(c)}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: selectedCrypto.id === c.id ? "1px solid #6366f1" : "1px solid rgba(255,255,255,0.1)",
                  background: selectedCrypto.id === c.id ? "rgba(99, 102, 241, 0.15)" : "rgba(255,255,255,0.03)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: selectedCrypto.id === c.id ? 700 : 500,
                  transition: "all 0.15s ease",
                }}
              >
                <span>{c.name}</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{c.network}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Invoice Summary Box */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 14,
            padding: 20,
            marginBottom: 24,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Amount to Send</span>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", fontFamily: "monospace" }}>
                {cryptoAmount} {selectedCrypto.id}
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                ≈ ${totalNum.toFixed(2)} USD ({product?.title})
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Deposit Address ({selectedCrypto.network})</span>
              <button
                onClick={handleCopy}
                style={{
                  background: "transparent",
                  border: "none",
                  color: copied ? "#34d399" : "#818cf8",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: 0,
                }}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy Address"}
              </button>
            </div>

            <div
              style={{
                background: "rgba(0,0,0,0.4)",
                padding: "10px 14px",
                borderRadius: 8,
                fontSize: 13,
                fontFamily: "monospace",
                color: "#e2e8f0",
                wordBreak: "break-all",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {selectedCrypto.address}
            </div>
          </div>
        </div>

        {/* Live Network Status Listener */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "rgba(99, 102, 241, 0.08)",
            border: "1px solid rgba(99, 102, 241, 0.2)",
            borderRadius: 12,
            padding: "12px 16px",
            marginBottom: 24,
            fontSize: 13,
            color: "#c7d2fe",
          }}
        >
          <Loader2 size={16} className="spin" style={{ color: "#818cf8", flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 600 }}>Awaiting network transaction (0/1 confirmations)...</div>
            <div style={{ fontSize: 11, color: "rgba(199, 210, 254, 0.6)" }}>
              Payment status updates automatically as soon as verified on the blockchain.
            </div>
          </div>
        </div>

        {/* Sandbox Test Trigger Box */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.03) 100%)",
            border: "1px dashed rgba(245, 158, 11, 0.35)",
            borderRadius: 14,
            padding: 18,
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 7, color: "#f59e0b", fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
            <Zap size={15} /> Developer Sandbox Trigger
          </div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", margin: "0 0 14px", lineHeight: 1.5 }}>
            Simulate a real blockchain payment. This sends a cryptographically signed NOWPayments IPN webhook to KRYPT MARKET, validates the secret key, and automatically triggers atomic order fulfillment.
          </p>

          <button
            onClick={handleSimulatePayment}
            disabled={simulating}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 10,
              background: "#f59e0b",
              color: "#000",
              fontWeight: 700,
              fontSize: 14,
              border: "none",
              cursor: simulating ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: "0 4px 14px rgba(245, 158, 11, 0.3)",
            }}
          >
            {simulating ? (
              <>
                <Loader2 size={16} className="spin" />
                <span>{simStatus || "Simulating payment..."}</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} /> Simulate NOWPayments Payment (Trigger Webhook)
              </>
            )}
          </button>
        </div>

        {/* Back Link */}
        <div style={{ textAlign: "center" }}>
          {shop && (
            <Link
              href={`/${shop.slug}/product/${product.id}?canceled=1`}
              style={{
                color: "rgba(255,255,255,0.5)",
                fontSize: 13,
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              Cancel and return to product page
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
