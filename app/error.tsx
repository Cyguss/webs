"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Vaultly Application Error:", error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a0c",
        color: "#f3f4f6",
        padding: "24px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 480,
          width: "100%",
          background: "rgba(18, 18, 24, 0.8)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: 20,
          padding: "36px 32px",
          textAlign: "center",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(16px)",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: "rgba(239, 68, 68, 0.12)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            color: "#ef4444",
          }}
        >
          <AlertTriangle size={28} />
        </div>

        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            marginBottom: 8,
            color: "#ffffff",
            letterSpacing: "-0.02em",
          }}
        >
          Something went wrong
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "#9ca3af",
            lineHeight: 1.6,
            marginBottom: 24,
          }}
        >
          An unexpected error occurred while rendering this page. Our telemetry has logged the incident.
        </p>

        {process.env.NODE_ENV !== "production" && error.message && (
          <div
            style={{
              textAlign: "left",
              padding: "12px 16px",
              background: "rgba(0, 0, 0, 0.4)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              borderRadius: 10,
              fontSize: 12,
              fontFamily: "monospace",
              color: "#f87171",
              marginBottom: 24,
              overflowX: "auto",
              wordBreak: "break-all",
            }}
          >
            {error.message}
            {error.digest && <div style={{ color: "#6b7280", marginTop: 6 }}>Digest: {error.digest}</div>}
          </div>
        )}

        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button
            onClick={() => reset()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              borderRadius: 10,
              background: "#4f46e5",
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              transition: "background 0.15s ease",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#4338ca")}
            onMouseOut={(e) => (e.currentTarget.style.background = "#4f46e5")}
          >
            <RefreshCw size={16} />
            Try Again
          </button>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              borderRadius: 10,
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#d1d5db",
              fontSize: 14,
              fontWeight: 500,
              textDecoration: "none",
              transition: "background 0.15s ease",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)")}
            onMouseOut={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)")}
          >
            <Home size={16} />
            Vaultly Home
          </Link>
        </div>
      </div>
    </div>
  );
}
