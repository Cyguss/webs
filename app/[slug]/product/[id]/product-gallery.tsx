"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";

interface ProductGalleryProps {
  images: string[];
  title: string;
  accentColor?: string;
  isLight?: boolean;
}

export function ProductGallery({
  images,
  title,
  accentColor = "#6366f1",
  isLight = false,
}: ProductGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const cleanImages = (images || []).filter(
    (img) => typeof img === "string" && img.trim().length > 0
  );

  const total = cleanImages.length;

  function handlePrev() {
    setCurrentIndex((prev) => (prev === 0 ? total - 1 : prev - 1));
  }

  function handleNext() {
    setCurrentIndex((prev) => (prev === total - 1 ? 0 : prev + 1));
  }

  if (total === 0) {
    return (
      <div
        style={{
          height: 240,
          borderRadius: 16,
          background: isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.03)",
          border: `1px solid ${isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)"}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(255,255,255,0.4)",
          gap: 8,
          marginBottom: 20,
        }}
      >
        <ImageIcon size={40} color={accentColor} style={{ opacity: 0.7 }} />
        <span style={{ fontSize: 13, color: isLight ? "#64748b" : "rgba(255,255,255,0.5)" }}>
          No preview images available
        </span>
      </div>
    );
  }

  const activeImage = cleanImages[currentIndex] || cleanImages[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
      {/* Main Image Viewport */}
      <div
        style={{
          position: "relative",
          height: 280,
          borderRadius: 16,
          overflow: "hidden",
          background: isLight ? "#f1f5f9" : "#090a0f",
          border: `1px solid ${isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.12)"}`,
          boxShadow: isLight
            ? "0 0 0 1px rgba(0,0,0,0.06), 0 12px 30px rgba(0,0,0,0.1)"
            : "0 0 0 1px rgba(255,255,255,0.08), 0 12px 30px rgba(0,0,0,0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Upscaled heavily blurred ambient background filling all empty space */}
        <div
          style={{
            position: "absolute",
            inset: -40,
            backgroundImage: `url("${activeImage}")`,
            backgroundPosition: "center",
            backgroundSize: "cover",
            transform: "scale(1.4)",
            filter: "blur(24px) saturate(1.8) brightness(1.05)",
            opacity: isLight ? 0.75 : 0.85,
            pointerEvents: "none",
          }}
        />

        {/* Soft atmospheric radial shading without crushing colors to black */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at center, rgba(0,0,0,0.05) 30%, rgba(0,0,0,0.25) 100%)",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />

        {/* Crisp foreground image */}
        <img
          src={activeImage}
          alt={`${title} - view ${currentIndex + 1}`}
          referrerPolicy="no-referrer"
          style={{
            position: "relative",
            zIndex: 2,
            maxWidth: "92%",
            maxHeight: "92%",
            objectFit: "contain",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 12px 32px rgba(0,0,0,0.65), 0 2px 8px rgba(0,0,0,0.4)",
            transition: "opacity 0.2s ease, transform 0.25s ease",
          }}
        />

        {/* Counter Badge */}
        {total > 1 && (
          <div
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              zIndex: 10,
              padding: "4px 10px",
              borderRadius: 20,
              background: "rgba(0, 0, 0, 0.65)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "#ffffff",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.04em",
            }}
          >
            {currentIndex + 1} / {total}
          </div>
        )}

        {/* Navigation Arrows */}
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous image"
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 10,
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: "rgba(0, 0, 0, 0.65)",
                backdropFilter: "blur(6px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "background 0.15s ease, transform 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = accentColor;
                e.currentTarget.style.transform = "translateY(-50%) scale(1.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(0, 0, 0, 0.65)";
                e.currentTarget.style.transform = "translateY(-50%) scale(1)";
              }}
            >
              <ChevronLeft size={20} />
            </button>

            <button
              type="button"
              onClick={handleNext}
              aria-label="Next image"
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 10,
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: "rgba(0, 0, 0, 0.65)",
                backdropFilter: "blur(6px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "background 0.15s ease, transform 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = accentColor;
                e.currentTarget.style.transform = "translateY(-50%) scale(1.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(0, 0, 0, 0.65)";
                e.currentTarget.style.transform = "translateY(-50%) scale(1)";
              }}
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails Row */}
      {total > 1 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            overflowX: "auto",
            padding: "8px 6px 10px 6px",
            margin: "-8px -6px 0 -6px",
            scrollbarWidth: "thin",
          }}
        >
          {cleanImages.map((imgUrl, idx) => {
            const isSelected = idx === currentIndex;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                style={{
                  position: "relative",
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  padding: 0,
                  border: "none",
                  outline: "none",
                  background: isLight ? "#ffffff" : "#0d0e15",
                  cursor: "pointer",
                  opacity: isSelected ? 1 : 0.6,
                  transform: isSelected ? "scale(1.05)" : "scale(1)",
                  boxShadow: isSelected
                    ? `0 0 0 2px ${accentColor}, 0 4px 14px ${accentColor}40`
                    : `0 0 0 1px ${isLight ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.15)"}`,
                  transition: "all 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
                  flexShrink: 0,
                  zIndex: isSelected ? 2 : 1,
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 10,
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={imgUrl}
                    alt={`Thumbnail ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
