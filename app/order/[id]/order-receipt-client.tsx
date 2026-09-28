"use client";

import { useState } from "react";
import { Copy, Check, Key, Clock, ShieldCheck, Terminal, Eye, EyeOff, Hash, Cpu } from "lucide-react";
import {
  getKeyDurationDisplay,
  formatExpirationRemaining,
  isKeyExpired,
} from "@/lib/key-duration";

interface OrderReceiptClientProps {
  deliveryValue: string;
  orderId?: string;
  duration?: string | null;
  durationDays?: number | null;
  customDurationLabel?: string | null;
  expiresAt?: string | null;
}

export default function OrderReceiptClient({
  deliveryValue,
  orderId,
  duration,
  durationDays,
  customDurationLabel,
  expiresAt,
}: OrderReceiptClientProps) {
  const keys = deliveryValue
    ? deliveryValue
        .split("\n")
        .map((k) => k.trim())
        .filter(Boolean)
    : [];

  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [maskedKeys, setMaskedKeys] = useState<Record<number, boolean>>({});

  const durationMeta = getKeyDurationDisplay(duration, durationDays, customDurationLabel);
  const expired = isKeyExpired(expiresAt);

  function handleCopyAll() {
    navigator.clipboard.writeText(keys.join("\n"));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  }

  function handleCopySingle(keyVal: string, idx: number) {
    navigator.clipboard.writeText(keyVal);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  function toggleMask(idx: number) {
    setMaskedKeys((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  }

  function maskKeyString(k: string): string {
    if (k.length <= 8) return "••••••••";
    const head = k.slice(0, 4);
    const tail = k.slice(-4);
    return `${head}-${"•".repeat(Math.max(8, k.length - 8))}-${tail}`;
  }

  if (keys.length === 0) {
    return (
      <div
        style={{
          padding: 16,
          borderRadius: 8,
          background: "rgba(3, 4, 7, 0.9)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          color: "rgba(255, 255, 255, 0.6)",
          fontSize: 12,
          fontFamily: "var(--font-mono, monospace)",
        }}
      >
        {deliveryValue || "[PENDING_DISPATCH // DAEMON_PROCESSING]"}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Key Validity & License Period Banner */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
          padding: "12px 16px",
          borderRadius: 8,
          background: "rgba(55, 44, 102, 0.25)",
          border: "1px solid rgba(139, 92, 246, 0.4)",
          boxShadow: "0 0 16px rgba(55, 44, 102, 0.35)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 6,
              background: "rgba(55, 44, 102, 0.4)",
              border: "1px solid rgba(139, 92, 246, 0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#c4b5fd",
            }}
          >
            <Clock size={15} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontFamily: "var(--font-mono, monospace)", color: "rgba(255, 255, 255, 0.5)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              LICENSE_VALIDITY // PROTOCOL_TERM
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, fontFamily: "var(--font-mono, monospace)", color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
              <span>{durationMeta.label.toUpperCase()}</span>
              <span
                style={{
                  fontSize: 9,
                  padding: "1px 5px",
                  borderRadius: 3,
                  background: "rgba(55, 44, 102, 0.45)",
                  color: "#c4b5fd",
                  border: "1px solid rgba(139, 92, 246, 0.4)",
                }}
              >
                {durationMeta.shortLabel}
              </span>
            </div>
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, fontFamily: "var(--font-mono, monospace)", color: "rgba(255, 255, 255, 0.5)" }}>
            {durationMeta.isLifetime ? "STATUS" : "REMAINING"}
          </div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              fontFamily: "var(--font-mono, monospace)",
              color: expired ? "#ef4444" : "#ffffff",
            }}
          >
            {durationMeta.isLifetime
              ? "[PERMANENT_UNLOCKED]"
              : expiresAt
              ? `[${formatExpirationRemaining(expiresAt).toUpperCase()}]`
              : `[${durationMeta.days}D FROM DISPATCH]`}
          </div>
        </div>
      </div>

      {/* Header bar with count and Copy All button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Terminal size={14} color="#c4b5fd" />
          <span style={{ fontSize: 11, fontFamily: "var(--font-mono, monospace)", fontWeight: 700, color: "#c4b5fd", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {keys.length > 1 ? `[${keys.length} DECRYPTED KEYS DELIVERED]` : "[DECRYPTED LICENSE KEY]"}
          </span>
        </div>

        {keys.length > 1 && (
          <button
            onClick={handleCopyAll}
            className="krypt-btn-primary"
            style={{
              padding: "5px 12px",
              borderRadius: 6,
              fontSize: 11,
              fontFamily: "var(--font-mono, monospace)",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {copiedAll ? <><Check size={12} /> [HASH_VERIFIED // ALL_COPIED]</> : <><Copy size={12} /> [COPY_ALL_{keys.length}_KEYS]</>}
          </button>
        )}
      </div>

      {/* Keys List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {keys.map((keyVal, idx) => {
          const isCopied = copiedIndex === idx;
          const isMasked = maskedKeys[idx] ?? false;
          return (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                borderRadius: 8,
                background: "rgba(3, 3, 5, 0.95)",
                border: "1px solid rgba(55, 44, 102, 0.45)",
                boxShadow: "0 0 12px rgba(0, 0, 0, 0.5)",
              }}
            >
              {keys.length > 1 && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: "rgba(255,255,255,0.4)",
                    background: "rgba(255,255,255,0.06)",
                    padding: "2px 6px",
                    borderRadius: 4,
                    fontFamily: "var(--font-mono, monospace)",
                  }}
                >
                  #{String(idx + 1).padStart(2, "0")}
                </span>
              )}

              <code
                style={{
                  flex: 1,
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: 13,
                  fontWeight: 700,
                  color: isMasked ? "rgba(255,255,255,0.4)" : "#ffffff",
                  letterSpacing: "0.06em",
                  wordBreak: "break-all",
                  userSelect: "all",
                  textShadow: isMasked ? "none" : "0 0 10px rgba(139, 92, 246, 0.35)",
                }}
              >
                {isMasked ? maskKeyString(keyVal) : keyVal}
              </code>

              {/* Mask / Unmask Toggle */}
              <button
                type="button"
                onClick={() => toggleMask(idx)}
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(255, 255, 255, 0.4)",
                  cursor: "pointer",
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                }}
                title={isMasked ? "Reveal Key" : "Mask Key"}
              >
                {isMasked ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>

              {/* Copy Single Key */}
              <button
                onClick={() => handleCopySingle(keyVal, idx)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  background: isCopied ? "rgba(55, 44, 102, 0.8)" : "rgba(55, 44, 102, 0.4)",
                  border: isCopied ? "1px solid #8b5cf6" : "1px solid rgba(139, 92, 246, 0.4)",
                  color: isCopied ? "#ffffff" : "#c4b5fd",
                  fontWeight: 700,
                  fontSize: 11,
                  fontFamily: "var(--font-mono, monospace)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  flexShrink: 0,
                  boxShadow: isCopied ? "0 0 12px rgba(139, 92, 246, 0.35)" : "none",
                }}
              >
                {isCopied ? <><Check size={12} /> [COPIED]</> : <><Copy size={12} /> [COPY]</>}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

