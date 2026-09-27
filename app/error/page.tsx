"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Home, ShieldAlert } from "lucide-react";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const rawError = searchParams.get("error") || "unknown_error";
  const errorDescription = searchParams.get("error_description");

  const friendlyMessages: Record<string, { title: string; desc: string }> = {
    account_not_linked: {
      title: "Account Not Linked",
      desc: "This Discord account was not yet connected to your profile, or email verification is required. You can connect it safely from your Account Settings.",
    },
    email_does_not_match: {
      title: "Email Mismatch",
      desc: "The email address associated with your Discord account does not match your registered store email.",
    },
    state_not_found: {
      title: "Session Expired",
      desc: "The authentication session timed out or expired. Please try connecting your account again.",
    },
    access_denied: {
      title: "Access Denied",
      desc: "The authentication request was cancelled or declined on the provider.",
    },
    unable_to_link_account: {
      title: "Unable to Link Account",
      desc: "We were unable to link this social account. Please ensure you are logged into the correct Discord profile.",
    },
  };

  const errorInfo = friendlyMessages[rawError] || {
    title: "Authentication Issue",
    desc: errorDescription || rawError.replace(/_/g, " "),
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-background, #0b0c10)",
        color: "var(--color-foreground, #f3f4f6)",
        padding: 24,
      }}
    >
      <div
        className="card animate-fade-in"
        style={{
          maxWidth: 460,
          width: "100%",
          padding: "36px 28px",
          textAlign: "center",
          border: "1px solid var(--color-border)",
          background: "var(--color-surface)",
          borderRadius: "var(--radius-lg, 16px)",
          boxShadow: "0 20px 40px -15px rgba(0,0,0,0.5)",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: "rgba(239, 68, 68, 0.12)",
            border: "1px solid rgba(239, 68, 68, 0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            color: "#f87171",
          }}
        >
          <ShieldAlert size={28} />
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 10px", letterSpacing: "-0.01em" }}>
          {errorInfo.title}
        </h1>

        <p
          style={{
            fontSize: 13.5,
            color: "var(--color-muted-foreground)",
            lineHeight: 1.6,
            margin: "0 0 28px",
          }}
        >
          {errorInfo.desc}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Link
            href="/dashboard/settings"
            className="btn btn-primary"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "10px 16px",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            <ArrowLeft size={16} />
            <span>Return to Account Settings</span>
          </Link>

          <Link
            href="/login"
            className="btn btn-secondary"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "10px 16px",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            <Home size={15} />
            <span>Go to Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "var(--color-muted-foreground)", fontSize: 13 }}>Loading...</span>
        </div>
      }
    >
      <AuthErrorContent />
    </Suspense>
  );
}
