"use client";

import React from "react";
import { AlertTriangle, Loader2, Save } from "lucide-react";

interface StorefrontExitDialogProps {
  isOpen: boolean;
  loading: boolean;
  onSaveAndClose: () => void;
  onContinueEditing: () => void;
  onDiscardAndExit: () => void;
}

export function StorefrontExitDialog({
  isOpen,
  loading,
  onSaveAndClose,
  onContinueEditing,
  onDiscardAndExit,
}: StorefrontExitDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999,
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        className="card modal-fly-in"
        style={{
          maxWidth: 460,
          width: "100%",
          padding: 26,
          boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg, 16px)",
          background: "var(--color-surface)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "rgba(245, 158, 11, 0.15)",
              color: "#f59e0b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={22} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "var(--color-foreground)" }}>
              Unsaved Storefront Changes
            </h3>
            <p style={{ margin: "3px 0 0", fontSize: 13, color: "var(--color-muted-foreground)" }}>
              Are you sure you want to exit without saving?
            </p>
          </div>
        </div>

        <p
          style={{
            fontSize: 13,
            color: "var(--color-muted-foreground)",
            lineHeight: 1.5,
            marginBottom: 20,
          }}
        >
          You have modified your storefront settings. If you leave now without saving, any unsaved customizations will be lost.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            type="button"
            className="btn btn-primary"
            disabled={loading}
            onClick={onSaveAndClose}
            style={{
              justifyContent: "center",
              gap: 8,
              padding: "10px 18px",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save and Close
          </button>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onContinueEditing}
              style={{ justifyContent: "center", fontSize: 13 }}
            >
              Continue Editing
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onDiscardAndExit}
              style={{
                justifyContent: "center",
                color: "var(--color-danger)",
                fontSize: 13,
              }}
            >
              Discard & Exit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
