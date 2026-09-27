"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, LayoutDashboard } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard View Error:", error);
  }, [error]);

  return (
    <div
      style={{
        padding: "48px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
      }}
    >
      <div
        style={{
          maxWidth: 460,
          width: "100%",
          background: "rgba(22, 22, 30, 0.7)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: 16,
          padding: "32px 24px",
          textAlign: "center",
          backdropFilter: "blur(12px)",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: "rgba(245, 158, 11, 0.12)",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            color: "#f59e0b",
          }}
        >
          <AlertCircle size={24} />
        </div>

        <h2
          style={{
            fontSize: 20,
            fontWeight: 700,
            marginBottom: 8,
            color: "#ffffff",
          }}
        >
          Dashboard Module Error
        </h2>
        <p
          style={{
            fontSize: 14,
            color: "#9ca3af",
            lineHeight: 1.5,
            marginBottom: 20,
          }}
        >
          We had trouble loading this section of your merchant dashboard. Your data is safe.
        </p>

        {process.env.NODE_ENV !== "production" && error.message && (
          <div
            style={{
              textAlign: "left",
              padding: "10px 14px",
              background: "rgba(0, 0, 0, 0.5)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              borderRadius: 8,
              fontSize: 12,
              fontFamily: "monospace",
              color: "#fbbf24",
              marginBottom: 20,
              overflowX: "auto",
            }}
          >
            {error.message}
          </div>
        )}

        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button
            onClick={() => reset()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "9px 18px",
              borderRadius: 8,
              background: "#4f46e5",
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            <RefreshCw size={15} />
            Reload Section
          </button>
          <Link
            href="/dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "9px 18px",
              borderRadius: 8,
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#d1d5db",
              fontSize: 13,
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            <LayoutDashboard size={15} />
            Dashboard Overview
          </Link>
        </div>
      </div>
    </div>
  );
}
