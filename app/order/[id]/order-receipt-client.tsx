"use client";

import { useState } from "react";
import { Copy, Check, Key } from "lucide-react";

export default function OrderReceiptClient({ deliveryValue, orderId }: { deliveryValue: string; orderId?: string }) {
  const keys = deliveryValue
    ? deliveryValue
        .split("\n")
        .map((k) => k.trim())
        .filter(Boolean)
    : [];

  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

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

  if (keys.length === 0) {
    return (
      <div style={{ padding: 16, borderRadius: 12, background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.7)", fontSize: 14 }}>
        {deliveryValue || "Order fulfillment details pending."}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header bar with count and Copy All button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Key size={16} color="#818cf8" />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {keys.length > 1 ? `${keys.length} License Keys Delivered` : "License Key / Digital Product Code"}
          </span>
        </div>

        {keys.length > 1 && (
          <button
            onClick={handleCopyAll}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              background: copiedAll ? "#10b981" : "rgba(99, 102, 241, 0.2)",
              border: "1px solid rgba(99, 102, 241, 0.4)",
              color: copiedAll ? "#fff" : "#a5b4fc",
              fontWeight: 600,
              fontSize: 12,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.2s ease",
            }}
          >
            {copiedAll ? <><Check size={14} /> All Copied!</> : <><Copy size={14} /> Copy All ({keys.length}) Keys</>}
          </button>
        )}
      </div>

      {/* Keys List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {keys.map((keyVal, idx) => {
          const isCopied = copiedIndex === idx;
          return (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                borderRadius: 12,
                background: "rgba(0,0,0,0.55)",
                border: "1px solid rgba(99, 102, 241, 0.28)",
                boxShadow: "inset 0 1px 3px rgba(0,0,0,0.5)",
              }}
            >
              {keys.length > 1 && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.45)",
                    background: "rgba(255,255,255,0.06)",
                    padding: "3px 8px",
                    borderRadius: 6,
                    fontFamily: "monospace",
                  }}
                >
                  #{idx + 1}
                </span>
              )}

              <code
                style={{
                  flex: 1,
                  fontFamily: "monospace",
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#38bdf8",
                  letterSpacing: "0.04em",
                  wordBreak: "break-all",
                  userSelect: "all",
                }}
              >
                {keyVal}
              </code>

              <button
                onClick={() => handleCopySingle(keyVal, idx)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  background: isCopied ? "#10b981" : "#6366f1",
                  color: "#fff",
                  border: "none",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 0.15s ease",
                  flexShrink: 0,
                }}
              >
                {isCopied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
