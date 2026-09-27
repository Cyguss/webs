"use client";

import React from "react";
import { ArrowLeft, ExternalLink, Save, Loader2 } from "lucide-react";

interface StorefrontHeaderProps {
  isDirty: boolean;
  loading: boolean;
  shopSlug: string;
  onExit: () => void;
  onSave: () => void;
}

export function StorefrontHeader({
  isDirty,
  loading,
  shopSlug,
  onExit,
  onSave,
}: StorefrontHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 28,
        flexWrap: "wrap",
        gap: 16,
      }}
    >
      <div>
        <button
          type="button"
          onClick={onExit}
          className="btn btn-ghost"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 8px",
            fontSize: 13,
            marginBottom: 8,
            color: "var(--color-muted-foreground)",
          }}
        >
          <ArrowLeft size={15} /> Back to Dashboard
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: "var(--color-foreground)",
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            Storefront Branding & Socials
          </h1>
          {isDirty && (
            <span className="badge badge-warning" style={{ fontSize: 11 }}>
              Unsaved Changes
            </span>
          )}
        </div>
        <p
          style={{
            color: "var(--color-muted-foreground)",
            fontSize: 14,
            marginTop: 4,
          }}
        >
          Customize your storefront appearance, custom font URL, Discord server preview, YouTube, Trustpilot, and Telegram.
        </p>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button
          type="button"
          onClick={onExit}
          className="btn btn-ghost"
          style={{ fontSize: 13 }}
        >
          Exit
        </button>
        <a
          href={`/${shopSlug}`}
          target="_blank"
          rel="noreferrer"
          className="btn btn-secondary"
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <ExternalLink size={16} /> View Public Shop
        </a>
        <button
          onClick={onSave}
          className="btn btn-primary"
          disabled={loading}
          style={{ minWidth: 140 }}
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              <Save size={16} /> Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}
