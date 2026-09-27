"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, twoFactor, useSession } from "@/lib/auth-client";
import { Loader2, ShieldCheck, Mail, Smartphone, AlertCircle } from "lucide-react";
import { useToast } from "@/components/toast-context";

function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path fill="#EA4335" d="M12 5c1.56 0 2.97.55 4.09 1.45l3.07-3.07C17.3 1.63 14.85 1 12 1 7.6 1 3.82 3.51 2.01 7.18l3.66 2.84C6.54 7.2 9.04 5 12 5z" />
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.66 2.84c2.14-1.98 3.76-4.91 3.76-8.66z" />
      <path fill="#FBBC05" d="M5.67 14.02a7.1 7.1 0 0 1 0-4.04L2.01 7.18A11.97 11.97 0 0 0 1 12c0 1.92.46 3.74 1.01 4.82l3.66-2.8z" />
      <path fill="#34A853" d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.66-2.84c-1.08.72-2.45 1.16-4.27 1.16-2.96 0-5.46-2.2-6.33-5.02L2.01 16.23C3.82 20.49 7.6 23 12 23z" />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isTwoFactorParam = searchParams.get("twoFactor") === "true";
  const { data: session, isPending: sessionPending } = useSession();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [totpCode, setTotpCode] = useState("");
  const [showTwoFactor, setShowTwoFactor] = useState(isTwoFactorParam);
  const [twoFactorMode, setTwoFactorMode] = useState<"totp" | "email">("totp");
  const [emailSent, setEmailSent] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSendEmailOtp() {
    setSendingEmail(true);
    setError("");
    try {
      const res = await (twoFactor as any).sendOtp();
      if (res?.error) {
        const msg = res.error.message || "Failed to send verification code";
        setError(msg);
        toast.error(msg);
      } else {
        setEmailSent(true);
        toast.success("Verification code sent to your email!");
      }
    } catch (err: any) {
      const msg = err?.message || "Failed to send verification code";
      setError(msg);
      toast.error(msg);
    } finally {
      setSendingEmail(false);
    }
  }

  useEffect(() => {
    if (session && !sessionPending) {
      router.replace("/dashboard");
    }
  }, [session, sessionPending, router]);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      const msg = errorParam.replace(/_/g, " ");
      setError(msg);
      toast.error(`Authentication error: ${msg}`);
    }
  }, [searchParams, toast]);

  // If page is loaded directly with ?twoFactor=true, fetch the user's configured method
  useEffect(() => {
    if (isTwoFactorParam) {
      setShowTwoFactor(true);
      (async () => {
        try {
          const res = await fetch("/api/account/2fa/get-method");
          if (res.ok) {
            const data = await res.json();
            if (data.method === "email") {
              setTwoFactorMode("email");
              handleSendEmailOtp();
            } else {
              setTwoFactorMode("totp");
            }
            if (data.email) {
              setEmail(data.email);
            }
          }
        } catch {
          // fallback to totp
        }
      })();
    }
  }, [isTwoFactorParam]);

  async function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // If input is not an email format (e.g. admin identifier), verify via secure server endpoint
      if (!email.includes("@")) {
        const adminRes = await fetch("/api/admin/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: email.trim(),
            password: password.trim(),
          }),
        });
        const adminData = await adminRes.json();
        if (adminRes.ok && adminData.ticket) {
          toast.success("Administrator credentials verified. Redirecting to Admin Portal...");
          router.push("/admin");
          return;
        } else if (!adminRes.ok) {
          const msg = adminData.error || "Invalid administrator credentials";
          setError(msg);
          toast.error(msg);
          setLoading(false);
          return;
        }
      }

      const res = await signIn.email({
        email: email.trim(),
        password,
        rememberMe,
      });

      // Check if 2FA is required
      const is2FA =
        (res as any)?.data?.twoFactorRedirect ||
        res.error?.message?.toLowerCase().includes("two-factor") ||
        res.error?.status === 403;

      if (is2FA) {
        // Resolve the user's specific configured 2FA method (email vs totp)
        let resolvedMethod: "email" | "totp" = "totp";
        try {
          const methodRes = await fetch(
            `/api/account/2fa/get-method?email=${encodeURIComponent(email.trim())}`
          );
          if (methodRes.ok) {
            const methodData = await methodRes.json();
            if (methodData.method === "email" || methodData.method === "totp") {
              resolvedMethod = methodData.method;
            }
          }
        } catch (mErr) {
          console.error("Failed to detect 2FA method:", mErr);
        }

        setTwoFactorMode(resolvedMethod);
        setShowTwoFactor(true);
        setTotpCode("");
        setError("");
        toast.info("Two-factor authentication required");

        if (resolvedMethod === "email") {
          handleSendEmailOtp();
        }

        setLoading(false);
        return;
      }

      if (res.error) {
        const msg = res.error.message || "Invalid email or password";
        setError(msg);
        toast.error(msg);
        setLoading(false);
        return;
      }

      toast.success("Successfully logged in!");
      router.push("/dashboard");
    } catch (err: any) {
      const msg = err?.message || "An unexpected error occurred";
      setError(msg);
      toast.error(msg);
      setLoading(false);
    }
  }

  async function handleTwoFactorSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let res: any;
      if (twoFactorMode === "email") {
        res = await (twoFactor as any).verifyOtp({
          code: totpCode.trim(),
          trustDevice: true,
        });
      } else {
        // For TOTP / Authenticator App:
        // If code has hyphen or length > 6, attempt backup code first
        if (totpCode.includes("-") || totpCode.length > 6) {
          res = await (twoFactor as any).verifyBackupCode({
            code: totpCode.trim(),
            trustDevice: true,
          });
        } else {
          res = await twoFactor.verifyTotp({
            code: totpCode.trim(),
            trustDevice: true,
          });
          // Fallback: If TOTP verification failed, try as backup code
          if (res?.error) {
            const backupRes = await (twoFactor as any).verifyBackupCode({
              code: totpCode.trim(),
              trustDevice: true,
            });
            if (!backupRes?.error) {
              res = backupRes;
            }
          }
        }
      }

      if (res.error) {
        const msg =
          res.error.message ||
          `Invalid ${twoFactorMode === "email" ? "email" : "authenticator"} verification code`;
        setError(msg);
        toast.error(msg);
        setLoading(false);
        return;
      }

      toast.success("Two-factor authentication verified!");
      router.push("/dashboard");
    } catch (err: any) {
      const msg = err?.message || "Failed to verify 2FA code";
      setError(msg);
      toast.error(msg);
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError("");
    try {
      const res = await signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
      if (res?.error) {
        let msg = res.error.message || "Failed to sign in with Google";
        if (res.error.message?.toLowerCase().includes("not found")) {
          msg = "Google sign-in requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET configured in .env.local.";
        }
        setError(msg);
        toast.error(msg);
      }
    } catch (err: any) {
      const msg = "Google sign-in requires GOOGLE_CLIENT_ID configured in .env.local.";
      setError(msg);
      toast.error(msg);
    }
  }

  return (
    <div className="card animate-fade-in" style={{ width: "100%", maxWidth: 420 }}>
      {showTwoFactor ? (
        <div>
          {/* 2FA Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: "rgba(99, 102, 241, 0.15)",
                border: "1px solid rgba(99, 102, 241, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#818cf8",
                flexShrink: 0,
              }}
            >
              {twoFactorMode === "email" ? <Mail size={22} /> : <Smartphone size={22} />}
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Two-Factor Security</h1>
              <p style={{ color: "var(--color-muted-foreground)", fontSize: 13, margin: "2px 0 0 0" }}>
                {twoFactorMode === "email"
                  ? "Enter the 6-digit code sent to your email"
                  : "Enter your 6-digit authenticator app code"}
              </p>
            </div>
          </div>

          {/* Active 2FA Method Status Indicator */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              background: "rgba(99, 102, 241, 0.08)",
              border: "1px solid rgba(99, 102, 241, 0.2)",
              borderRadius: 8,
              marginTop: 14,
              marginBottom: 16,
              fontSize: 12.5,
              color: "var(--color-foreground)",
            }}
          >
            {twoFactorMode === "email" ? (
              <>
                <Mail size={15} color="#818cf8" style={{ flexShrink: 0 }} />
                <span>
                  Method: <strong>Email OTP</strong>
                  {email ? ` (${email})` : ""}
                </span>
              </>
            ) : (
              <>
                <Smartphone size={15} color="#818cf8" style={{ flexShrink: 0 }} />
                <span>
                  Method: <strong>Authenticator App (TOTP)</strong>
                </span>
              </>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 12px",
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: 8,
                marginBottom: 16,
                color: "#ef4444",
                fontSize: 13,
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleTwoFactorSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label htmlFor="totpCode" style={{ fontSize: 13, fontWeight: 500 }}>
                  {twoFactorMode === "email" ? "Email Verification Code" : "Authenticator Code"}
                </label>
                {twoFactorMode === "email" && (
                  <button
                    type="button"
                    onClick={handleSendEmailOtp}
                    disabled={sendingEmail}
                    style={{
                      fontSize: 12,
                      color: "var(--color-primary-light, #818cf8)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      fontWeight: 600,
                    }}
                  >
                    {sendingEmail ? "Sending..." : "Resend code"}
                  </button>
                )}
              </div>
              <input
                id="totpCode"
                type="text"
                maxLength={12}
                className="input-base"
                placeholder={twoFactorMode === "email" ? "123456" : "123456"}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.trim())}
                autoFocus
                required
                style={{ textAlign: "center", fontSize: 20, letterSpacing: 4, fontWeight: 600 }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: "100%", padding: 12 }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {loading ? "Verifying..." : "Verify & Continue"}
            </button>

            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setShowTwoFactor(false);
                setError("");
                setTotpCode("");
              }}
              style={{ width: "100%", fontSize: 13 }}
            >
              Back to regular login
            </button>
          </form>
        </div>
      ) : (
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Welcome back</h1>
          <p style={{ color: "var(--color-muted-foreground)", marginBottom: 24, fontSize: 14 }}>
            Sign in to manage your storefront
          </p>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="btn btn-secondary"
            style={{
              width: "100%",
              padding: "11px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              marginBottom: 20,
              fontSize: 14,
            }}
          >
            <GoogleIcon size={18} />
            Continue with Google
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              margin: "18px 0",
              color: "var(--color-muted-foreground)",
              fontSize: 12,
            }}
          >
            <div style={{ flex: 1, height: 1, background: "var(--color-border)" }} />
            <span style={{ padding: "0 12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>or</span>
            <div style={{ flex: 1, height: 1, background: "var(--color-border)" }} />
          </div>

          <form onSubmit={handleCredentialsSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label
                htmlFor="email"
                style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "var(--color-foreground-muted)" }}
              >
                Email address
              </label>
              <input
                id="email"
                type="text"
                className="input-base"
                placeholder="seller@example.com lub login"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "var(--color-foreground-muted)" }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                className="input-base"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--color-muted-foreground)", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: "var(--color-primary)", width: 15, height: 15, cursor: "pointer" }}
                />
                Remember me
              </label>
              <Link href="/login" style={{ fontSize: 13, color: "var(--color-primary-hover)", textDecoration: "none" }}>
                Forgot password?
              </Link>
            </div>

            {error && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 12px",
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: 8,
                  color: "#ef4444",
                  fontSize: 13,
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: "100%", padding: 12, marginTop: 4 }}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "var(--color-muted-foreground)" }}>
            Don't have an account?{" "}
            <Link href="/register" style={{ color: "var(--color-primary-hover)", textDecoration: "none", fontWeight: 500 }}>
              Create storefront
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="card" style={{ width: "100%", maxWidth: 420, height: 360 }} />}>
      <LoginForm />
    </Suspense>
  );
}
