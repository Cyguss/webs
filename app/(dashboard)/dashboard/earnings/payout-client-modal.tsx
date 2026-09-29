"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, Coins, CreditCard, ArrowRight, Loader2, CheckCircle, X, AlertCircle } from "lucide-react";
import { useToast } from "@/components/toast-context";

export default function PayoutClientModal({
  availableBalance,
  reserveBalance = 0,
  payoutableBalance,
}: {
  availableBalance: number;
  reserveBalance?: number;
  payoutableBalance?: number;
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const effectivePayoutable = payoutableBalance !== undefined 
    ? payoutableBalance 
    : Math.max(0, availableBalance - (reserveBalance || 0));

  const [method, setMethod] = useState<"crypto">("crypto");
  const [amount, setAmount] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [cryptoCurrency, setCryptoCurrency] = useState("LTC");

  const requestedNum = parseFloat(amount) || 0;
  const feeNum = 0;
  const netNum = requestedNum;

  async function handlePayoutSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (requestedNum < 10) {
      const msg = "Minimum payout request amount is $10.00.";
      setError(msg);
      toast.error("Minimum Withdrawal", msg);
      return;
    }

    if (requestedNum > effectivePayoutable) {
      const msg = reserveBalance > 0
        ? `Cannot withdraw $${requestedNum.toFixed(2)}. $${reserveBalance.toFixed(2)} is reserved for open disputes. Max payoutable: $${effectivePayoutable.toFixed(2)}.`
        : `Requested amount exceeds available balance ($${effectivePayoutable.toFixed(2)}).`;
      setError(msg);
      toast.error("Insufficient Payoutable Balance", msg);
      return;
    }

    if (!destinationAddress.trim()) {
      const msg = "Please enter your cryptocurrency payout wallet address.";
      setError(msg);
      toast.error("Missing Destination", msg);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: requestedNum,
          method,
          destinationAddress: destinationAddress.trim(),
          cryptoCurrency: method === "crypto" ? cryptoCurrency : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit payout request");
      }

      setSuccess("Payout request submitted successfully!");
      toast.success("Payout Request Submitted", "Your withdrawal has been queued for processing.");
      setTimeout(() => {
        setOpen(false);
        setSuccess(null);
        setAmount("");
        setDestinationAddress("");
        router.refresh();
      }, 2000);
    } catch (err: any) {
      setError(err.message);
      toast.error("Payout Request Failed", err.message || "Could not submit payout request");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn btn-primary"
        disabled={effectivePayoutable < 10}
        style={{ gap: 8 }}
      >
        <Wallet size={16} /> Request Payout
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(4px)",
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
              boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
              position: "relative",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "var(--color-foreground)" }}>
                Request Payout
              </h3>
              <button
                onClick={() => setOpen(false)}
                style={{ background: "none", border: "none", color: "var(--color-muted-foreground)", padding: 4, cursor: "pointer", display: "flex", alignItems: "center" }}
              >
                <X size={18} />
              </button>
            </div>


            {success ? (
              <div
                style={{
                  padding: 30,
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <CheckCircle size={48} color="#10b981" />
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--color-foreground)" }}>
                  Payout Request Received!
                </div>
                <p style={{ fontSize: 14, color: "var(--color-muted-foreground)", margin: 0 }}>
                  Your funds are now queued for processing.
                </p>
              </div>
            ) : (
              <form onSubmit={handlePayoutSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {/* Method selector */}
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface-2)",
                    color: "var(--color-foreground)",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Coins size={18} color="#f59e0b" /> Direct Crypto Withdrawal
                  </div>
                  <span className="badge badge-success" style={{ fontSize: 11 }}>Instant Batching</span>
                </div>

                {/* Dispute Reserve Warning if present */}
                {reserveBalance > 0 && (
                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: "var(--radius-md)",
                      background: "rgba(245, 158, 11, 0.08)",
                      border: "1px solid rgba(245, 158, 11, 0.3)",
                      color: "#f59e0b",
                      fontSize: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <div>
                      <strong>${reserveBalance.toFixed(2)} Held in Reserve:</strong> Open customer dispute. Max currently payoutable: <strong>${effectivePayoutable.toFixed(2)}</strong>.
                    </div>
                  </div>
                )}

                {/* Amount input */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <label className="label">Amount ($ USD)</label>
                    <span
                      style={{ color: "#818cf8", cursor: "pointer", fontWeight: 600 }}
                      onClick={() => setAmount(effectivePayoutable.toFixed(2))}
                    >
                      Max: ${effectivePayoutable.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="10"
                    max={effectivePayoutable}
                    className="input"
                    placeholder="100.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label className="label">Select Currency</label>
                  <select
                    className="input"
                    value={cryptoCurrency}
                    onChange={(e) => setCryptoCurrency(e.target.value)}
                  >
                    <option value="LTC">Litecoin (LTC) — Lowest fee</option>
                    <option value="BTC">Bitcoin (BTC)</option>
                    <option value="USDT">USDT (TRC-20)</option>
                    <option value="XMR">Monero (XMR)</option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label className="label">Destination {cryptoCurrency} Wallet Address *</label>
                  <input
                    type="text"
                    className="input"
                    placeholder={`Enter your ${cryptoCurrency} receiving address...`}
                    value={destinationAddress}
                    onChange={(e) => setDestinationAddress(e.target.value)}
                    required
                  />
                </div>

                {/* Fee calculation breakdown */}
                {requestedNum >= 10 && (
                  <div
                    style={{
                      padding: 14,
                      borderRadius: "var(--radius-md)",
                      background: "var(--color-background)",
                      fontSize: 13,
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-muted-foreground)" }}>
                      <span>Requested Payout:</span>
                      <span>${requestedNum.toFixed(2)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-muted-foreground)" }}>
                      <span>Withdrawal Fee:</span>
                      <span style={{ color: "var(--color-success)", fontWeight: 600 }}>$0.00 (Platform fee covered on sales)</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, color: "var(--color-success)", borderTop: "1px solid var(--color-border)", paddingTop: 6 }}>
                      <span>Net Amount Sent to You:</span>
                      <span>${netNum > 0 ? netNum.toFixed(2) : "0.00"}</span>
                    </div>
                  </div>
                )}

                {/* Modal Buttons */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: 140 }}>
                    {loading ? (
                      <>
                        <Loader2 size={16} className="spin" /> Submitting...
                      </>
                    ) : (
                      <>
                        Confirm Request <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
