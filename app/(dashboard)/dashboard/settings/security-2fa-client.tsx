"use client";

import { useState } from "react";
import { twoFactor } from "@/lib/auth-client";
import {
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Copy,
  Check,
  Loader2,
  Mail,
  Smartphone,
  Info,
  X,
  RefreshCw,
  Lock,
} from "lucide-react";
import { useToast } from "@/components/toast-context";

interface Props {
  initialTwoFactorEnabled: boolean;
  initialTwoFactorMethod?: "email" | "totp";
  initialHasPassword?: boolean;
}

export function Security2FAClient({
  initialTwoFactorEnabled,
  initialTwoFactorMethod = "email",
  initialHasPassword = true,
}: Props) {
  const toast = useToast();
  const [isEnabled, setIsEnabled] = useState(initialTwoFactorEnabled);
  const [hasPassword, setHasPassword] = useState(initialHasPassword);
  const [activeMethod, setActiveMethod] = useState<"email" | "totp">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("vlt_2fa_active_method") as "email" | "totp" | null;
      if (saved) return saved;
    }
    return initialTwoFactorMethod || "email";
  });

  // Setup mode states
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupMethod, setSetupMethod] = useState<"totp" | "email">("totp");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [settingPassword, setSettingPassword] = useState(false);
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [setupVerifyCode, setSetupVerifyCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);

  // Disable mode states
  const [isDisabling, setIsDisabling] = useState(false);
  const [disableCode, setDisableCode] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [sendingDisableOtp, setSendingDisableOtp] = useState(false);
  const [disableOtpSent, setDisableOtpSent] = useState(false);

  // Status & loading
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─────────────────────────────────────────────────────────────
  // SETUP FLOW HANDLERS
  // ─────────────────────────────────────────────────────────────

  async function triggerEnableWithPassword(pwd: string) {
    try {
      const res = await twoFactor.enable({ password: pwd });
      if (res.error) {
        const msg = res.error.message || "Failed to initiate 2FA setup";
        setError(msg);
        toast.error(msg);
        setLoading(false);
        return;
      }

      if (res.data && "totpURI" in res.data) {
        setTotpUri((res.data as any).totpURI);
        if ("backupCodes" in res.data && Array.isArray((res.data as any).backupCodes)) {
          setBackupCodes((res.data as any).backupCodes);
        }
      }

      if (setupMethod === "email") {
        try {
          await (twoFactor as any).sendOtp();
          setEmailOtpSent(true);
          toast.success("Verification code sent to your email!");
        } catch {
          // sendOtp might be handled in background
        }
      }
    } catch (err: any) {
      const msg = err?.message || "An error occurred initiating 2FA";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleSetPasswordAndStartEnable(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSettingPassword(true);
    try {
      const res = await fetch("/api/account/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to set password");
      }

      setHasPassword(true);
      setPassword(newPassword);
      setSettingPassword(false);
      setLoading(true);
      await triggerEnableWithPassword(newPassword);
    } catch (err: any) {
      const msg = err?.message || "Failed to set password";
      setError(msg);
      toast.error(msg);
      setSettingPassword(false);
    }
  }

  async function handleStartEnable(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    await triggerEnableWithPassword(password);
  }

  async function handleConfirmEnable(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let res: any;
      if (setupMethod === "email") {
        res = await (twoFactor as any).verifyOtp({ code: setupVerifyCode.trim() });
      } else {
        res = await twoFactor.verifyTotp({ code: setupVerifyCode.trim() });
      }

      if (res?.error) {
        const msg = res.error.message || "Invalid verification code";
        setError(msg);
        toast.error(msg);
        setLoading(false);
        return;
      }

      // Fully clear setup states and mark enabled
      setIsEnabled(true);
      setActiveMethod(setupMethod);
      setIsSettingUp(false);
      setIsDisabling(false);
      setTotpUri(null);
      setEmailOtpSent(false);
      setPassword("");
      setSetupVerifyCode("");
      setError(null);

      try {
        await fetch("/api/account/2fa/set-method", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ method: setupMethod }),
        });
        localStorage.setItem("vlt_2fa_active_method", setupMethod);
      } catch {}

      toast.success(
        `Two-Factor Authentication via ${setupMethod === "email" ? "Email Code" : "Authenticator App"} is now active!`
      );
    } catch (err: any) {
      const msg = err?.message || "Failed to confirm 2FA";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleCancelSetup() {
    setIsSettingUp(false);
    setTotpUri(null);
    setEmailOtpSent(false);
    setSetupVerifyCode("");
    setPassword("");
    setError(null);
  }

  // ─────────────────────────────────────────────────────────────
  // DISABLE FLOW HANDLERS
  // ─────────────────────────────────────────────────────────────

  async function handleSendDisableOtp() {
    setSendingDisableOtp(true);
    setError(null);
    try {
      const res = await fetch("/api/account/2fa/send-disable-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to send verification code");
      }
      setDisableOtpSent(true);
      toast.success("Verification code sent to your email!");
    } catch (err: any) {
      const msg = err?.message || "Failed to send verification code";
      setError(msg);
      toast.error(msg);
    } finally {
      setSendingDisableOtp(false);
    }
  }

  async function handleConfirmDisable(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!disableCode.trim()) {
      const msg = "Please enter the verification code to disable 2FA.";
      setError(msg);
      toast.error(msg);
      return;
    }

    if (hasPassword && !disablePassword.trim()) {
      const msg = "Please enter your account password to confirm.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/account/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: activeMethod,
          code: disableCode.trim(),
          password: disablePassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to disable 2FA");
      }

      // Completely wipe all setup and disable states so no leftover GUI appears
      try {
        localStorage.removeItem("vlt_2fa_active_method");
      } catch {}
      setIsEnabled(false);
      setIsDisabling(false);
      setIsSettingUp(false);
      setTotpUri(null);
      setEmailOtpSent(false);
      setSetupVerifyCode("");
      setDisableCode("");
      setDisablePassword("");
      setDisableOtpSent(false);
      setPassword("");
      setBackupCodes([]);
      setError(null);
      toast.success("Two-Factor Authentication has been successfully disabled.");
    } catch (err: any) {
      const msg = err?.message || "Failed to disable 2FA";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleCancelDisable() {
    setIsDisabling(false);
    setDisableCode("");
    setDisablePassword("");
    setDisableOtpSent(false);
    setError(null);
  }

  function copyBackupCodes() {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const qrImageUrl = totpUri
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(totpUri)}`
    : null;

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 18, padding: 22 }}>
      {/* Header Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "var(--radius-sm, 10px)",
              background: isEnabled ? "rgba(34, 197, 94, 0.12)" : "rgba(99, 102, 241, 0.12)",
              color: isEnabled ? "#22c55e" : "#818cf8",
              border: isEnabled ? "1px solid rgba(34, 197, 94, 0.25)" : "1px solid rgba(99, 102, 241, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isEnabled ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
          </div>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "var(--color-foreground)" }}>
              Two-Factor Authentication (2FA)
            </h3>
            <p style={{ fontSize: 12.5, color: "var(--color-muted-foreground)", margin: "2px 0 0 0" }}>
              Protect your merchant account with Authenticator App (TOTP) or Email OTP verification
            </p>
          </div>
        </div>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 11,
            fontWeight: 700,
            padding: "4px 10px",
            borderRadius: 6,
            background: isEnabled ? "rgba(34, 197, 94, 0.15)" : "rgba(255, 255, 255, 0.05)",
            border: isEnabled ? "1px solid rgba(34, 197, 94, 0.3)" : "1px solid var(--color-border)",
            color: isEnabled ? "#22c55e" : "var(--color-muted-foreground)",
            letterSpacing: "0.03em",
          }}
        >
          {isEnabled ? "ENABLED" : "DISABLED"}
        </span>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. STATE: DISABLED (Default View) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {!isEnabled && !isSettingUp && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 18px",
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm, 8px)",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-foreground)" }}>
              2FA is currently disabled
            </div>
            <div style={{ fontSize: 12, color: "var(--color-muted-foreground)", marginTop: 2 }}>
              Add a second layer of defense against unauthorized store access and credential theft.
            </div>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setError(null);
              setIsSettingUp(true);
            }}
            style={{ fontSize: 12.5, gap: 8, padding: "8px 16px" }}
          >
            <KeyRound size={15} />
            <span>Configure Two-Factor Authentication</span>
          </button>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. STATE: SETUP IN PROGRESS - STEP 1 (Choose method & password) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {!isEnabled && isSettingUp && !totpUri && !emailOtpSent && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            padding: 16,
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm, 8px)",
          }}
        >
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 8 }}>
              Select 2FA Method:
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, maxWidth: 520 }}>
              <button
                type="button"
                onClick={() => setSetupMethod("totp")}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  border: setupMethod === "totp" ? "2px solid #6366f1" : "1px solid var(--color-border)",
                  background: setupMethod === "totp" ? "rgba(99, 102, 241, 0.12)" : "rgba(255, 255, 255, 0.03)",
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  transition: "all 0.15s ease",
                }}
              >
                <Smartphone size={20} color={setupMethod === "totp" ? "#818cf8" : "var(--color-muted-foreground)"} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-foreground)" }}>
                    Authenticator App
                  </div>
                  <div style={{ fontSize: 11, color: "var(--color-muted-foreground)" }}>Google Auth, Authy</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSetupMethod("email")}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  border: setupMethod === "email" ? "2px solid #6366f1" : "1px solid var(--color-border)",
                  background: setupMethod === "email" ? "rgba(99, 102, 241, 0.12)" : "rgba(255, 255, 255, 0.03)",
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  transition: "all 0.15s ease",
                }}
              >
                <Mail size={20} color={setupMethod === "email" ? "#818cf8" : "var(--color-muted-foreground)"} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-foreground)" }}>Email Code (OTP)</div>
                  <div style={{ fontSize: 11, color: "var(--color-muted-foreground)" }}>Delivered to store email</div>
                </div>
              </button>
            </div>
          </div>

          {!hasPassword ? (
            <form onSubmit={handleSetPasswordAndStartEnable} style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 420 }}>
              <div style={{ padding: "10px 12px", background: "rgba(99, 102, 241, 0.08)", border: "1px solid rgba(99, 102, 241, 0.25)", borderRadius: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: 12.5, color: "#818cf8", marginBottom: 2 }}>
                  <Info size={14} /> Password Setup Required
                </div>
                <p style={{ fontSize: 11.5, color: "var(--color-muted-foreground)", margin: 0 }}>
                  You signed in via OAuth. Set a store password to protect your 2FA configurations.
                </p>
              </div>

              <input
                type="password"
                className="input-base"
                placeholder="Create master password (min. 8 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
              <input
                type="password"
                className="input-base"
                placeholder="Confirm master password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button type="submit" className="btn btn-primary" disabled={settingPassword || loading} style={{ fontSize: 12.5 }}>
                  {settingPassword ? <Loader2 size={14} className="animate-spin" /> : "Set Password & Continue"}
                </button>
                <button type="button" className="btn btn-ghost" onClick={handleCancelSetup} style={{ fontSize: 12.5 }}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleStartEnable} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <label style={{ fontSize: 12.5, color: "var(--color-muted-foreground)" }}>
                Enter your account password to begin {setupMethod === "email" ? "Email Code" : "Authenticator"} configuration:
              </label>
              <div style={{ display: "flex", gap: 10, maxWidth: 420 }}>
                <input
                  type="password"
                  className="input-base"
                  placeholder="Your account password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ flexShrink: 0, fontSize: 12.5 }}>
                  {loading ? <Loader2 size={14} className="animate-spin" /> : "Continue"}
                </button>
                <button type="button" className="btn btn-ghost" onClick={handleCancelSetup} style={{ fontSize: 12.5 }}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. STATE: SETUP IN PROGRESS - STEP 2 (Verify Code & Complete) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {!isEnabled && isSettingUp && (totpUri || emailOtpSent) && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            padding: 18,
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm, 8px)",
          }}
        >
          {setupMethod === "totp" && totpUri && (
            <div style={{ display: "flex", gap: 18, alignItems: "flex-start", flexWrap: "wrap" }}>
              {qrImageUrl && (
                <div style={{ background: "#ffffff", padding: 8, borderRadius: 8, border: "1px solid #ddd", width: "fit-content" }}>
                  <img src={qrImageUrl} alt="TOTP QR Code" width={150} height={150} style={{ display: "block" }} />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 260 }}>
                <p style={{ fontSize: 13.5, fontWeight: 700, margin: "0 0 4px 0", color: "var(--color-foreground)" }}>
                  Scan QR with your Authenticator App
                </p>
                <p style={{ fontSize: 12, color: "var(--color-muted-foreground)", margin: "0 0 10px 0" }}>
                  Scan this code in Google Authenticator, Microsoft Authenticator, or 1Password.
                </p>
                <div style={{ fontSize: 11, color: "var(--color-muted-foreground)", marginBottom: 4 }}>
                  Manual configuration key:
                </div>
                <code
                  style={{
                    fontSize: 11,
                    wordBreak: "break-all",
                    color: "#818cf8",
                    padding: "4px 8px",
                    background: "rgba(99, 102, 241, 0.08)",
                    border: "1px solid rgba(99, 102, 241, 0.2)",
                    borderRadius: 4,
                    display: "block",
                  }}
                >
                  {totpUri}
                </code>
              </div>
            </div>
          )}

          {setupMethod === "email" && (
            <div style={{ padding: "12px 14px", background: "rgba(99, 102, 241, 0.08)", border: "1px solid rgba(99, 102, 241, 0.25)", borderRadius: 6 }}>
              <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 2px 0", color: "var(--color-foreground)" }}>
                Email Verification Code Sent
              </p>
              <p style={{ fontSize: 12, color: "var(--color-muted-foreground)", margin: 0 }}>
                We sent a 6-digit confirmation code to your account email address. Enter it below to activate.
              </p>
            </div>
          )}

          <form onSubmit={handleConfirmEnable} style={{ display: "flex", gap: 10, maxWidth: 400 }}>
            <input
              type="text"
              className="input-base"
              placeholder="Enter 6-digit code"
              value={setupVerifyCode}
              onChange={(e) => setSetupVerifyCode(e.target.value)}
              maxLength={6}
              required
              style={{ fontSize: 16, letterSpacing: 3, textAlign: "center" }}
            />
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flexShrink: 0, fontSize: 12.5 }}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : "Verify & Activate"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={handleCancelSetup} style={{ fontSize: 12.5 }}>
              Cancel
            </button>
          </form>

          {backupCodes.length > 0 && (
            <div style={{ padding: 12, background: "rgba(255, 255, 255, 0.02)", borderRadius: 8, border: "1px solid var(--color-border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 12.5, fontWeight: 700 }}>Emergency Backup Codes</span>
                <button type="button" onClick={copyBackupCodes} className="btn btn-ghost" style={{ padding: "3px 8px", fontSize: 11 }}>
                  {copied ? <Check size={13} color="#22c55e" /> : <Copy size={13} />}
                  <span>{copied ? "Copied" : "Copy all"}</span>
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {backupCodes.map((code, idx) => (
                  <code key={idx} style={{ fontSize: 11.5, color: "var(--color-foreground)" }}>
                    {code}
                  </code>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 4. STATE: ENABLED - DEFAULT VIEW (Protected State) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isEnabled && !isDisabling && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 18px",
            background: "rgba(34, 197, 94, 0.03)",
            border: "1px solid rgba(34, 197, 94, 0.2)",
            borderRadius: "var(--radius-sm, 8px)",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-foreground)" }}>
              Two-Factor Authentication is currently active
            </div>
            <div style={{ fontSize: 12, color: "var(--color-muted-foreground)", marginTop: 2 }}>
              Your store and payouts are secured. Disabling requires 2FA code verification.
            </div>
          </div>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => {
              setError(null);
              setIsDisabling(true);
            }}
            style={{ fontSize: 12.5, gap: 8, padding: "8px 16px" }}
          >
            <ShieldAlert size={15} />
            <span>Disable 2FA</span>
          </button>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 5. STATE: ENABLED - DISABLING PANEL (Requires 2FA Code & Password) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isEnabled && isDisabling && (
        <form
          onSubmit={handleConfirmDisable}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            padding: 18,
            background: "rgba(239, 68, 68, 0.04)",
            border: "1px solid rgba(239, 68, 68, 0.25)",
            borderRadius: "var(--radius-sm, 8px)",
          }}
        >
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 4px 0", color: "var(--color-foreground)" }}>
              Confirm 2FA Deactivation
            </h4>
            <p style={{ fontSize: 12, color: "var(--color-muted-foreground)", margin: 0 }}>
              To protect your store from unauthorized tampering, you must enter a verification code to turn off 2FA.
            </p>
          </div>

          {/* Active Method UI (no method toggle - uses active configured method) */}
          {activeMethod === "email" ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(99, 102, 241, 0.08)", border: "1px solid rgba(99, 102, 241, 0.25)", borderRadius: 8 }}>
                <Mail size={16} color="#818cf8" />
                <span style={{ fontSize: 12.5, color: "var(--color-foreground)" }}>
                  Two-Factor Authentication is active via <strong>Email Code</strong>. Enter the verification code sent to your registered email to turn off 2FA.
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={handleSendDisableOtp}
                  disabled={sendingDisableOtp}
                  className="btn btn-secondary"
                  style={{ fontSize: 12, gap: 6, padding: "7px 14px" }}
                >
                  {sendingDisableOtp ? <Loader2 size={13} className="animate-spin" /> : <Mail size={13} />}
                  <span>{disableOtpSent ? "Resend Code to Email" : "Send Verification Code to Email"}</span>
                </button>
                {disableOtpSent && (
                  <span style={{ fontSize: 11.5, color: "#22c55e", fontWeight: 600 }}>
                    ✓ Code sent! Check your inbox.
                  </span>
                )}
              </div>

              <div style={{ maxWidth: 360 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--color-muted-foreground)", display: "block", marginBottom: 6 }}>
                  Enter 6-digit code received via email:
                </label>
                <input
                  type="text"
                  className="input-base"
                  placeholder="e.g. 123456"
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 8))}
                  required
                  autoFocus
                  style={{ fontSize: 16, letterSpacing: 3, textAlign: "center" }}
                />
              </div>
            </>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(99, 102, 241, 0.08)", border: "1px solid rgba(99, 102, 241, 0.25)", borderRadius: 8 }}>
                <Smartphone size={16} color="#818cf8" />
                <span style={{ fontSize: 12.5, color: "var(--color-foreground)" }}>
                  Two-Factor Authentication is active via <strong>Authenticator App</strong>. Enter your 6-digit TOTP code (or emergency backup code) to turn off 2FA.
                </span>
              </div>

              <div style={{ maxWidth: 360 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--color-muted-foreground)", display: "block", marginBottom: 6 }}>
                  Enter 6-digit code from Authenticator app (or backup code):
                </label>
                <input
                  type="text"
                  className="input-base"
                  placeholder="6-digit code or backup code"
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value)}
                  required
                  autoFocus
                  style={{ fontSize: 16, letterSpacing: 2, textAlign: "center" }}
                />
              </div>
            </>
          )}

          {/* Account Password Input (if user has credential password) */}
          {hasPassword && (
            <div style={{ maxWidth: 360 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--color-muted-foreground)", display: "block", marginBottom: 6 }}>
                Account Master Password:
              </label>
              <input
                type="password"
                className="input-base"
                placeholder="Current store password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                required
              />
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
            <button
              type="submit"
              className="btn btn-danger"
              disabled={loading || (activeMethod === "email" && !disableOtpSent && !disableCode)}
              style={{ fontSize: 12.5, gap: 8, padding: "8px 18px" }}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <ShieldAlert size={14} />}
              <span>Verify & Disable 2FA</span>
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleCancelDisable}
              style={{ fontSize: 12.5 }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
