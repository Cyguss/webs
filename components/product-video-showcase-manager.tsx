"use client";

import React, { useState } from "react";
import { Video, Plus, X, ArrowUp, ArrowDown, Play, AlertCircle, CheckCircle2 } from "lucide-react";
import { parseVideoShowcase, VideoEmbedInfo } from "@/lib/media";

interface ProductVideoShowcaseManagerProps {
  videos: string[];
  onChange: (videos: string[]) => void;
  maxVideos?: number;
}

export function ProductVideoShowcaseManager({
  videos = [],
  onChange,
  maxVideos = 5,
}: ProductVideoShowcaseManagerProps) {
  const [inputUrl, setInputUrl] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function handleAddVideo() {
    setErrorMsg(null);
    if (!inputUrl.trim()) return;

    if (videos.length >= maxVideos) {
      setErrorMsg(`Maximum of ${maxVideos} showcase videos reached.`);
      return;
    }

    const clean = inputUrl.trim();
    const parsed = parseVideoShowcase(clean);
    if (!parsed.embedUrl) {
      setErrorMsg("Unsupported video URL. Please provide a valid YouTube (watch, shorts, youtu.be) or Streamable link.");
      return;
    }

    if (videos.includes(clean)) {
      setErrorMsg("This video URL is already added.");
      return;
    }

    onChange([...videos, clean]);
    setInputUrl("");
  }

  function handleRemoveVideo(idx: number) {
    const updated = videos.filter((_, i) => i !== idx);
    onChange(updated);
  }

  function handleMove(idx: number, dir: "up" | "down") {
    const newIdx = dir === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= videos.length) return;
    const updated = [...videos];
    const temp = updated[idx];
    updated[idx] = updated[newIdx];
    updated[newIdx] = temp;
    onChange(updated);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 14, borderTop: "1px solid var(--color-border)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <label className="label" style={{ margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
          <Video size={14} style={{ color: "var(--color-primary-light)" }} />
          Product Showcase Videos (YouTube & Streamable)
        </label>
        <span style={{ fontSize: 11, color: "var(--color-muted-foreground)" }}>
          {videos.length} / {maxVideos} videos
        </span>
      </div>

      <p style={{ fontSize: 12, color: "var(--color-muted-foreground)", margin: 0, lineHeight: 1.4 }}>
        Add up to 5 gameplay trailers, feature showcases, or setup tutorials. Customers can flip through videos on your storefront product page.
      </p>

      {/* Input row */}
      {videos.length < maxVideos && (
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            className="input"
            placeholder="e.g. https://www.youtube.com/watch?v=... or https://youtu.be/... or https://streamable.com/..."
            value={inputUrl}
            onChange={(e) => {
              setInputUrl(e.target.value);
              setErrorMsg(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddVideo();
              }
            }}
          />
          <button
            type="button"
            onClick={handleAddVideo}
            disabled={!inputUrl.trim()}
            className="krypt-btn-primary"
            style={{
              padding: "0 14px",
              height: 40,
              fontSize: 12,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexShrink: 0,
              cursor: inputUrl.trim() ? "pointer" : "not-allowed",
              opacity: inputUrl.trim() ? 1 : 0.6,
            }}
          >
            <Plus size={14} />
            <span>Add Video</span>
          </button>
        </div>
      )}

      {errorMsg && (
        <div style={{ fontSize: 11, color: "#ef4444", display: "flex", alignItems: "center", gap: 6 }}>
          <AlertCircle size={13} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* List of Added Videos */}
      {videos.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
          {videos.map((vidUrl, idx) => {
            const parsed = parseVideoShowcase(vidUrl);
            return (
              <div
                key={idx}
                style={{
                  background: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 10,
                  padding: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 240 }}>
                  {/* Clean Video Thumbnail Preview */}
                  <div
                    style={{
                      width: 90,
                      height: 52,
                      borderRadius: 6,
                      background: "#090a10",
                      position: "relative",
                      overflow: "hidden",
                      flexShrink: 0,
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    {parsed.thumbnailUrl ? (
                      <>
                        <img
                          src={parsed.thumbnailUrl}
                          alt="Video thumbnail"
                          referrerPolicy="no-referrer"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            background: "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 100%)",
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <div
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: "50%",
                              background: parsed.type === "youtube" ? "#ef4444" : "rgba(55, 44, 102, 0.85)",
                              border: "1px solid rgba(255, 255, 255, 0.4)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#ffffff",
                              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.5)",
                            }}
                          >
                            <Play size={10} fill="#ffffff" style={{ marginLeft: 1 }} />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          background:
                            parsed.type === "streamable"
                              ? "linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, #0d1117 100%)"
                              : "linear-gradient(135deg, rgba(55, 44, 102, 0.4) 0%, #090a10 100%)",
                          gap: 4,
                        }}
                      >
                        <Play size={14} color="var(--color-primary-light)" fill="var(--color-primary-light)" />
                        <span style={{ fontSize: 8, fontWeight: 800, color: "var(--color-muted-foreground)", textTransform: "uppercase" }}>
                          {parsed.type || "VIDEO"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 2, overflow: "hidden" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span
                        style={{
                          fontSize: 9,
                          padding: "2px 6px",
                          borderRadius: 4,
                          fontWeight: 800,
                          fontFamily: "var(--font-mono, monospace)",
                          background: idx === 0 ? "rgba(55, 44, 102, 0.45)" : "var(--btn-ghost-bg)",
                          color: idx === 0 ? "var(--color-primary-light)" : "var(--color-muted-foreground)",
                          border: idx === 0 ? "1px solid rgba(139, 92, 246, 0.45)" : "1px solid var(--color-border)",
                        }}
                      >
                        {idx === 0 ? "PRIMARY VIDEO" : `VIDEO #${idx + 1}`}
                      </span>

                      {parsed.type && (
                        <span
                          style={{
                            fontSize: 9,
                            padding: "1px 5px",
                            borderRadius: 3,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            background: "rgba(255,255,255,0.06)",
                            color: "var(--color-muted-foreground)",
                          }}
                        >
                          {parsed.type}
                        </span>
                      )}
                    </div>

                    <span
                      style={{
                        fontSize: 11,
                        fontFamily: "var(--font-mono, monospace)",
                        color: "var(--color-foreground)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: 340,
                      }}
                      title={vidUrl}
                    >
                      {vidUrl}
                    </span>
                  </div>
                </div>

                {/* Actions: Reorder & Remove */}
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <button
                    type="button"
                    onClick={() => handleMove(idx, "up")}
                    disabled={idx === 0}
                    style={{
                      background: "none",
                      border: "1px solid var(--color-border)",
                      borderRadius: 6,
                      padding: 6,
                      color: idx === 0 ? "var(--color-muted-foreground)" : "var(--color-foreground)",
                      opacity: idx === 0 ? 0.3 : 1,
                      cursor: idx === 0 ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                    }}
                    title="Move up"
                  >
                    <ArrowUp size={13} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMove(idx, "down")}
                    disabled={idx === videos.length - 1}
                    style={{
                      background: "none",
                      border: "1px solid var(--color-border)",
                      borderRadius: 6,
                      padding: 6,
                      color: idx === videos.length - 1 ? "var(--color-muted-foreground)" : "var(--color-foreground)",
                      opacity: idx === videos.length - 1 ? 0.3 : 1,
                      cursor: idx === videos.length - 1 ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                    }}
                    title="Move down"
                  >
                    <ArrowDown size={13} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemoveVideo(idx)}
                    style={{
                      background: "rgba(239, 68, 68, 0.1)",
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                      borderRadius: 6,
                      padding: 6,
                      color: "#ef4444",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      marginLeft: 4,
                    }}
                    title="Remove video"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
