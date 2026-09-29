"use client";

import React, { useState } from "react";
import { Video, Play, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { VideoEmbedInfo } from "@/lib/media";

interface ProductVideoShowcaseProps {
  videos: VideoEmbedInfo[];
  productTitle?: string;
}

export function ProductVideoShowcase({
  videos,
  productTitle = "Product",
}: ProductVideoShowcaseProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!videos || videos.length === 0) return null;

  const current = videos[activeIndex] || videos[0];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 14,
        padding: 16,
        boxShadow: "var(--card-shadow)",
      }}
    >
      {/* Header bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "rgba(55, 44, 102, 0.25)",
              border: "1px solid rgba(139, 92, 246, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-primary-light)",
            }}
          >
            <Video size={16} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--color-foreground)" }}>
              Video Showcase
            </div>
            <div style={{ fontSize: 10, color: "var(--color-muted-foreground)" }}>
              {videos.length > 1
                ? `${videos.length} videos available • Currently playing #${activeIndex + 1}`
                : "Official feature demo & gameplay preview"}
            </div>
          </div>
        </div>

        {/* Video Provider Badge */}
        {current.type && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                fontSize: 10,
                padding: "3px 8px",
                borderRadius: 6,
                fontWeight: 800,
                background:
                  current.type === "youtube"
                    ? "rgba(239, 68, 68, 0.15)"
                    : current.type === "streamable"
                    ? "rgba(59, 130, 246, 0.15)"
                    : "rgba(55, 44, 102, 0.25)",
                color:
                  current.type === "youtube"
                    ? "#ef4444"
                    : current.type === "streamable"
                    ? "#60a5fa"
                    : "var(--color-primary-light)",
                border: "1px solid currentColor",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              {current.type}
            </span>
          </div>
        )}
      </div>

      {/* 16:9 Video Frame */}
      <div
        style={{
          position: "relative",
          width: "100%",
          paddingBottom: "56.25%",
          height: 0,
          borderRadius: 10,
          overflow: "hidden",
          background: "#000000",
          border: "1px solid var(--color-border)",
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.6)",
        }}
      >
        {current.type === "direct" ? (
          <video
            src={current.embedUrl!}
            controls
            playsInline
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
        ) : (
          <iframe
            key={current.embedUrl}
            src={current.embedUrl!}
            title={`${productTitle} Video Showcase #${activeIndex + 1}`}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              border: "none",
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        )}
      </div>

      {/* Multi-Video Selector Tabs (if > 1 video) */}
      {videos.length > 1 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
          {videos.map((vid, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveIndex(idx)}
                style={{
                  flex: 1,
                  minWidth: 120,
                  padding: "6px 10px",
                  borderRadius: 8,
                  background: isActive ? "rgba(55, 44, 102, 0.4)" : "var(--color-surface-2)",
                  border: isActive
                    ? "1px solid var(--color-primary-light)"
                    : "1px solid var(--color-border)",
                  color: isActive ? "var(--color-foreground)" : "var(--color-muted-foreground)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 11,
                  fontWeight: 700,
                  transition: "all 0.15s ease",
                  boxShadow: isActive ? "0 0 14px rgba(139, 92, 246, 0.35)" : "none",
                }}
              >
                {vid.thumbnailUrl ? (
                  <div
                    style={{
                      width: 28,
                      height: 18,
                      borderRadius: 3,
                      overflow: "hidden",
                      position: "relative",
                      flexShrink: 0,
                      border: "1px solid var(--color-border)",
                      background: "#000",
                    }}
                  >
                    <img
                      src={vid.thumbnailUrl}
                      alt=""
                      referrerPolicy="no-referrer"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                ) : (
                  <Play size={11} color={isActive ? "var(--color-primary-light)" : "currentColor"} />
                )}
                <span>Video #{idx + 1}</span>
                {vid.type && (
                  <span style={{ fontSize: 9, opacity: 0.75, textTransform: "uppercase", marginLeft: "auto" }}>
                    {vid.type}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
