"use client";

import React from "react";
import { AlertTriangle, Ban, Lock, Loader2, XCircle } from "lucide-react";

interface AdminPanicModalProps {
  isOpen: boolean;
  panicLoading: boolean;
  onClose: () => void;
  onConfirmPanic: () => void;
}

export function AdminPanicModal({
  isOpen,
  panicLoading,
  onClose,
  onConfirmPanic,
}: AdminPanicModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(8px)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        className="card modal-fly-in"
        style={{
          maxWidth: 480,
          width: "100%",
          padding: 30,
          border: "1px solid rgba(239, 68, 68, 0.5)",
          background: "var(--color-surface)",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.95)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "var(--radius-sm)",
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              color: "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: "#f87171" }}>
              Trigger Emergency Panic Switch?
            </h3>
            <span style={{ fontSize: 12, color: "var(--color-muted-foreground)" }}>
              Personal Staff Self-Lockout
            </span>
          </div>
        </div>

        <p style={{ fontSize: 13, color: "var(--color-foreground)", lineHeight: 1.5, marginBottom: 14 }}>
          Do you suspect your account, authentication tokens, or workstation have been compromised? Activating the Panic Switch will <strong>immediately deactivate your administrative permissions</strong> and terminate your current session.
        </p>

        <div
          style={{
            padding: "12px 14px",
            borderRadius: "var(--radius-sm)",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#fca5a5",
            fontSize: 12,
            lineHeight: 1.5,
            marginBottom: 20,
          }}
        >
          <strong>SECURITY NOTICE:</strong> Your admin permissions will be frozen immediately while your account is locked. <strong>Only the Super-Admin can reactivate your administrative access.</strong>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            style={{ flex: 1, height: 42, fontSize: 13 }}
            disabled={panicLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirmPanic}
            disabled={panicLoading}
            className="btn btn-danger"
            style={{ flex: 1.5, height: 42, fontSize: 13, fontWeight: 700 }}
          >
            {panicLoading ? <Loader2 size={16} className="animate-spin" /> : <Ban size={16} />}
            <span>{panicLoading ? "Locking..." : "Confirm Panic Lockout"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

interface AdminKillSwitchModalProps {
  isOpen: boolean;
  isCurrentlyLocked: boolean;
  loading: boolean;
  onClose: () => void;
  onConfirmToggle: () => void;
}

export function AdminKillSwitchModal({
  isOpen,
  isCurrentlyLocked,
  loading,
  onClose,
  onConfirmToggle,
}: AdminKillSwitchModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(8px)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        className="card modal-fly-in"
        style={{
          maxWidth: 500,
          width: "100%",
          padding: 30,
          border: isCurrentlyLocked ? "1px solid rgba(16, 185, 129, 0.5)" : "1px solid rgba(239, 68, 68, 0.5)",
          background: "var(--color-surface)",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.95)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "var(--radius-sm)",
              background: isCurrentlyLocked ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
              border: isCurrentlyLocked ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid rgba(239, 68, 68, 0.4)",
              color: isCurrentlyLocked ? "#34d399" : "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: isCurrentlyLocked ? "#34d399" : "#f87171" }}>
              {isCurrentlyLocked ? "Lift Platform Admin Lockdown?" : "Engage Platform-Wide Admin Kill Switch?"}
            </h3>
            <span style={{ fontSize: 12, color: "var(--color-muted-foreground)" }}>
              Super-Admin Master Control
            </span>
          </div>
        </div>

        <p style={{ fontSize: 13, color: "var(--color-foreground)", lineHeight: 1.5, marginBottom: 14 }}>
          {isCurrentlyLocked
            ? "Lifting the lockdown will restore access to the admin panel and administrative tools for all active ordinary administrators."
            : "Engaging the Kill Switch will immediately suspend administrative access for ALL ordinary administrators across the entire platform. Only Super-Admin access will remain operational."}
        </p>

        <div
          style={{
            padding: "12px 14px",
            borderRadius: "var(--radius-sm)",
            background: isCurrentlyLocked ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
            border: isCurrentlyLocked ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
            color: isCurrentlyLocked ? "#a7f3d0" : "#fca5a5",
            fontSize: 12,
            lineHeight: 1.5,
            marginBottom: 20,
          }}
        >
          {isCurrentlyLocked
            ? "Ordinary administrators whose individual permissions are active will be able to resume administrative operations immediately."
            : "All ordinary admin sessions will receive an emergency lockdown block notice upon any request."}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            style={{ flex: 1, height: 42, fontSize: 13 }}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirmToggle}
            disabled={loading}
            className={isCurrentlyLocked ? "btn btn-primary" : "btn btn-danger"}
            style={{ flex: 1.5, height: 42, fontSize: 13, fontWeight: 700 }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Ban size={16} />}
            <span>{loading ? "Processing..." : isCurrentlyLocked ? "Lift Lockdown" : "Engage Kill Switch"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

interface AdminMasterModalProps {
  isOpen: boolean;
  usernameInput: string;
  setUsernameInput: (val: string) => void;
  passwordInput: string;
  setPasswordInput: (val: string) => void;
  loginLoading: boolean;
  onClose: () => void;
  onUnlock: (e: React.FormEvent) => void;
}

export function AdminMasterModal({
  isOpen,
  usernameInput,
  setUsernameInput,
  passwordInput,
  setPasswordInput,
  loginLoading,
  onClose,
  onUnlock,
}: AdminMasterModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(8px)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: 420,
          width: "100%",
          padding: 30,
          border: "1px solid var(--color-border)",
          background: "var(--color-surface)",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.5)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: "var(--radius-sm)",
              background: "var(--color-surface-2, rgba(125,125,125,0.1))",
              border: "1px solid var(--color-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
              color: "var(--color-foreground)",
            }}
          >
            <Lock size={20} />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Super-Admin Master Authorization</h2>
          <p style={{ fontSize: 12, color: "var(--color-muted-foreground)", marginTop: 4, lineHeight: 1.4 }}>
            Enter master credentials to unlock platform Kill-Switch control.
          </p>
        </div>

        <form onSubmit={onUnlock} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, marginBottom: 5, color: "var(--color-muted-foreground)" }}>
              Super-Admin Identifier
            </label>
            <input
              type="text"
              className="input"
              placeholder="Enter identifier"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              required
              style={{ height: 40, fontSize: 13 }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, marginBottom: 5, color: "var(--color-muted-foreground)" }}>
              Master Passphrase
            </label>
            <input
              type="password"
              className="input"
              placeholder="Enter master passphrase"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              autoFocus
              required
              style={{ height: 40, fontSize: 13 }}
            />
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ flex: 1, height: 42, fontSize: 13 }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loginLoading || !usernameInput.trim() || !passwordInput.trim()}
              className="btn btn-primary"
              style={{ flex: 1.5, height: 42, fontSize: 13, fontWeight: 700 }}
            >
              {loginLoading ? <Loader2 size={15} className="animate-spin" /> : "Unlock Super-Admin"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface AdminRejectModalProps {
  isOpen: boolean;
  targetShop: { id: string; name: string } | null;
  rejectReason: string;
  setRejectReason: (val: string) => void;
  rejectSubmitting: boolean;
  onClose: () => void;
  onConfirmReject: () => void;
}

export function AdminRejectModal({
  isOpen,
  targetShop,
  rejectReason,
  setRejectReason,
  rejectSubmitting,
  onClose,
  onConfirmReject,
}: AdminRejectModalProps) {
  if (!isOpen || !targetShop) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: 480,
          width: "100%",
          padding: 24,
          boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
          border: "1px solid rgba(239, 68, 68, 0.4)",
          borderRadius: "var(--radius-lg, 16px)",
          background: "var(--color-surface)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: "rgba(239, 68, 68, 0.15)",
              color: "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <XCircle size={22} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "var(--color-foreground)" }}>
              Reject Store Submission
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--color-muted-foreground)" }}>
              Store: <strong style={{ color: "var(--color-foreground)" }}>{targetShop.name}</strong>
            </p>
          </div>
        </div>

        <p style={{ fontSize: 13, color: "var(--color-muted-foreground)", lineHeight: 1.5, marginBottom: 14 }}>
          Please provide the reason why this store is being rejected. This explanation will be sent directly to the merchant&apos;s <strong>Inbox</strong> so they can address the issues and resubmit.
        </p>

        {/* Quick Suggestions */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--color-muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
            Quick Suggestions
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {[
              "Missing logo, banner or store branding",
              "Invalid or misleading product descriptions",
              "Suspicious activity or prohibited digital goods",
              "Violates KRYPT Merchant Terms of Service",
            ].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setRejectReason(preset)}
                className="btn btn-secondary"
                style={{ fontSize: 11, padding: "4px 9px", borderRadius: 6 }}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Reason Textarea */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-foreground)", marginBottom: 6 }}>
            Rejection Reason (Sent to merchant inbox)
          </label>
          <textarea
            className="input"
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Please add an authentic store banner and fill in detailed product descriptions before resubmitting for approval."
            style={{ width: "100%", padding: "10px 12px", fontSize: 13, resize: "vertical", height: 95 }}
            autoFocus
          />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            disabled={rejectSubmitting}
            style={{ fontSize: 13 }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirmReject}
            disabled={rejectSubmitting}
            className="btn btn-danger"
            style={{ fontSize: 13, fontWeight: 700, gap: 6 }}
          >
            {rejectSubmitting ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
            <span>Confirm Rejection & Send to Inbox</span>
          </button>
        </div>
      </div>
    </div>
  );
}
