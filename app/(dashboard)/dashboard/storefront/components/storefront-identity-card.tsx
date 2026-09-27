"use client";

import React from "react";
import { Image as ImageIcon } from "lucide-react";
import { useToast } from "@/components/toast-context";

interface StorefrontIdentityCardProps {
  name: string;
  setName: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  logoUrl: string;
  setLogoUrl: (val: string) => void;
  bannerUrl: string;
  setBannerUrl: (val: string) => void;
}

export function StorefrontIdentityCard({
  name,
  setName,
  description,
  setDescription,
  logoUrl,
  setLogoUrl,
  bannerUrl,
  setBannerUrl,
}: StorefrontIdentityCardProps) {
  const toast = useToast();

  function handleLogoChange(val: string) {
    setLogoUrl(val);
    if (val.trim()) {
      const testImg = new Image();
      testImg.referrerPolicy = "no-referrer";
      testImg.onerror = () => {
        toast.error("Invalid Logo Image", "Could not load image from this URL. Verify that the link is accessible.");
      };
      testImg.src = val.trim();
    }
  }

  function handleBannerChange(val: string) {
    setBannerUrl(val);
    if (val.trim()) {
      const testImg = new Image();
      testImg.referrerPolicy = "no-referrer";
      testImg.onerror = () => {
        toast.error("Invalid Banner Image", "Could not load banner from this URL. Verify that the link is accessible.");
      };
      testImg.src = val.trim();
    }
  }

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h3
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: "var(--color-foreground)",
          margin: 0,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <ImageIcon size={16} color="var(--color-primary-light)" /> Shop Identity & Images
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label className="label">Store Name</label>
        <input
          type="text"
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label className="label">Tagline / Description</label>
        <textarea
          className="input"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Best instant digital key store..."
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <label className="label">Logo Image URL</label>
          <span style={{ fontSize: 11, color: "var(--color-muted-foreground)" }}>
            Supports YouTube, Discord, WebP, PNG
          </span>
        </div>
        <input
          type="url"
          className="input"
          placeholder="https://yt3.googleusercontent.com/... or https://example.com/logo.png"
          value={logoUrl}
          onChange={(e) => handleLogoChange(e.target.value)}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <label className="label">Hero Banner Image URL</label>
          <span style={{ fontSize: 11, color: "var(--color-muted-foreground)" }}>
            Wide horizontal banner
          </span>
        </div>
        <input
          type="url"
          className="input"
          placeholder="https://example.com/banner.jpg"
          value={bannerUrl}
          onChange={(e) => handleBannerChange(e.target.value)}
        />
      </div>
    </div>
  );
}
