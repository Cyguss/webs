"use client";

import React from "react";
import { Monitor, Laptop, Smartphone } from "lucide-react";
import { DiscordIcon, YoutubeIcon, TelegramIcon } from "./storefront-constants";

interface StorefrontPreviewProps {
  previewSize: "desktop" | "laptop" | "mobile";
  setPreviewSize: (val: "desktop" | "laptop" | "mobile") => void;
  backgroundColor: string;
  accentColor: string;
  textColor: string;
  mutedTextColor: string;
  cardColor: string;
  borderColor: string;
  previewFont: string;
  customFontUrl: string;
  bannerUrl: string;
  logoUrl: string;
  name: string;
  description: string;
  trustpilotUrl: string;
  discordUrl: string;
  youtubeUrl: string;
  telegramUrl: string;
  discordInfo: any;
  socialPreviews: any;
}

export function StorefrontPreview({
  previewSize,
  setPreviewSize,
  backgroundColor,
  accentColor,
  textColor,
  cardColor,
  borderColor,
  previewFont,
  customFontUrl,
  bannerUrl,
  logoUrl,
  name,
  description,
  trustpilotUrl,
  discordUrl,
  youtubeUrl,
  telegramUrl,
  discordInfo,
  socialPreviews,
}: StorefrontPreviewProps) {
  // Luminance calculation
  const c = backgroundColor.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16) || 0;
  const g = parseInt(c.substring(2, 4), 16) || 0;
  const b = parseInt(c.substring(4, 6), 16) || 0;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const previewText = lum > 0.55 ? "#111827" : "#ffffff";
  const previewMuted = lum > 0.55 ? "rgba(17,24,39,0.6)" : "rgba(255,255,255,0.65)";

  return (
    <div style={{ position: "sticky", top: 32, height: "fit-content" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "var(--color-muted-foreground)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Live Preview
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          {[
            { key: "desktop", label: "Desktop", Icon: Monitor },
            { key: "laptop", label: "Laptop", Icon: Laptop },
            { key: "mobile", label: "Mobile", Icon: Smartphone },
          ].map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setPreviewSize(key as any)}
              className="btn btn-ghost"
              style={{
                padding: "5px 10px",
                borderRadius: 8,
                background: previewSize === key ? "var(--color-primary-subtle)" : "var(--btn-ghost-bg)",
                color: previewSize === key ? "var(--color-primary-light)" : "var(--color-muted-foreground)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Icon size={14} />
              <span style={{ fontSize: 11, fontWeight: 600 }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          borderRadius: 20,
          border: "1px solid var(--color-border)",
          background: "rgba(0, 0, 0, 0.35)",
          padding: "20px 16px",
          display: "flex",
          justifyContent: "center",
          overflowX: "hidden",
          boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
          minHeight: 560,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: previewSize === "desktop" ? "100%" : previewSize === "laptop" ? 680 : 380,
            borderRadius: previewSize === "mobile" ? 28 : previewSize === "laptop" ? 20 : 16,
            border:
              previewSize === "mobile"
                ? "8px solid #1a1c26"
                : previewSize === "laptop"
                ? "4px solid #1a1c26"
                : "1px solid var(--color-border)",
            boxShadow: previewSize === "desktop" ? "0 4px 20px rgba(0,0,0,0.25)" : "0 20px 50px rgba(0,0,0,0.55)",
            overflow: "hidden",
            background: backgroundColor,
            color: textColor || previewText,
            minHeight: 520,
            transition:
              "max-width 0.35s cubic-bezier(0.4, 0, 0.2, 1), border-radius 0.3s ease, border-width 0.3s ease, box-shadow 0.3s ease",
            fontFamily: previewFont,
            position: "relative",
          }}
        >
          {/* Dynamically link custom font if specified */}
          {customFontUrl && <link rel="stylesheet" href={customFontUrl} />}

          {/* Hero Banner with no-referrer images */}
          <div
            style={{
              height: 120,
              position: "relative",
              overflow: "hidden",
              background: lum > 0.55 ? "#f3f4f6" : "#090a0f",
            }}
          >
            {bannerUrl ? (
              <>
                <div
                  style={{
                    position: "absolute",
                    inset: -20,
                    transform: "scale(1.3)",
                    filter: "blur(24px) saturate(1.4) brightness(0.7)",
                    opacity: lum > 0.55 ? 0.85 : 0.95,
                    overflow: "hidden",
                    pointerEvents: "none",
                  }}
                >
                  <img
                    src={bannerUrl}
                    alt=""
                    referrerPolicy="no-referrer"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 100%)",
                    pointerEvents: "none",
                    zIndex: 1,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 2,
                  }}
                >
                  <img
                    src={bannerUrl}
                    alt=""
                    referrerPolicy="no-referrer"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                      filter: "drop-shadow(0 6px 20px rgba(0,0,0,0.7))",
                    }}
                  />
                </div>
              </>
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: `linear-gradient(135deg, ${accentColor}cc, #000)`,
                }}
              />
            )}
          </div>

          {/* Store Header inside Mock */}
          <div style={{ padding: "0 20px 20px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
              <div
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: 16,
                  border: `3px solid ${backgroundColor}`,
                  background: accentColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  fontWeight: 800,
                  color: "#fff",
                  marginTop: -34,
                  position: "relative",
                  zIndex: 10,
                  flexShrink: 0,
                  overflow: "hidden",
                }}
              >
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt=""
                    referrerPolicy="no-referrer"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  name[0] || "S"
                )}
              </div>
              <div style={{ paddingTop: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: textColor || previewText }}>
                    {name || "Store Name"}
                  </h2>
                  {trustpilotUrl && (
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        background: lum > 0.55 ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.05)",
                        padding: "2px 6px",
                        borderRadius: 6,
                        border: `1px solid ${lum > 0.55 ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.1)"}`,
                      }}
                    >
                      <div style={{ display: "inline-flex", gap: 1 }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <span
                            key={s}
                            style={{
                              width: 10,
                              height: 10,
                              background: "#00b67a",
                              borderRadius: 2,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#fff",
                              fontSize: 6,
                            }}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 800, color: "#34d399" }}>4.8</span>
                      <span
                        style={{
                          fontSize: 8,
                          padding: "1px 5px",
                          borderRadius: 4,
                          background: "rgba(0,182,122,0.16)",
                          border: "1px solid rgba(0,182,122,0.35)",
                          color: "#34d399",
                          fontWeight: 700,
                        }}
                      >
                        Reviews
                      </span>
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 11, color: previewMuted, marginTop: 2 }}>
                  {description || "Store tagline..."}
                </div>
              </div>
            </div>

            {/* Social Previews Grid in Mock */}
            {(discordUrl || youtubeUrl || telegramUrl) && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                {/* Discord Mock */}
                {discordUrl && (
                  <div
                    style={{
                      borderRadius: 10,
                      border: "1px solid rgba(88, 101, 242, 0.3)",
                      background: "rgba(88, 101, 242, 0.08)",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <div style={{ height: 40, position: "relative", overflow: "hidden", background: "#161822" }}>
                      {discordInfo?.bannerUrl ? (
                        <div
                          style={{
                            position: "absolute",
                            inset: -2,
                            backgroundImage: `url(${discordInfo.bannerUrl})`,
                            backgroundPosition: "center",
                            backgroundSize: "cover",
                            filter: "blur(2px)",
                            opacity: 0.88,
                            transform: "scale(1.04)",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            background: "linear-gradient(135deg, #5865F2, #1e1f22)",
                          }}
                        />
                      )}
                      <div style={{ position: "absolute", right: 4, top: 2, opacity: 0.3, pointerEvents: "none" }}>
                        <DiscordIcon size={32} color="#5865F2" />
                      </div>
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background:
                            "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(22,24,34,0.7) 100%)",
                        }}
                      />
                    </div>
                    <div style={{ padding: "8px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 6,
                        }}
                      >
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 8,
                            background: "#5865F2",
                            border: `1.5px solid rgba(255,255,255,0.2)`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                            flexShrink: 0,
                          }}
                        >
                          {discordInfo?.iconUrl ? (
                            <img
                              src={discordInfo.iconUrl}
                              alt=""
                              referrerPolicy="no-referrer"
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            <DiscordIcon size={13} color="#fff" />
                          )}
                        </div>
                        <span
                          style={{
                            background: "#5865F2",
                            color: "#fff",
                            padding: "2px 6px",
                            borderRadius: 4,
                            fontSize: 8,
                            fontWeight: 700,
                          }}
                        >
                          Join
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: previewText,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {discordInfo?.name || "Discord Server"}
                      </div>
                      <div style={{ fontSize: 9, color: previewMuted, marginTop: 2 }}>
                        {discordInfo?.presenceCount != null
                          ? `${discordInfo.presenceCount.toLocaleString()} Online`
                          : discordInfo?.memberCount != null
                          ? `${discordInfo.memberCount.toLocaleString()} Members`
                          : "Community"}
                      </div>
                    </div>
                  </div>
                )}

                {/* YouTube Preview in Mock */}
                {youtubeUrl && (
                  <div
                    style={{
                      borderRadius: 10,
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                      background: "rgba(239, 68, 68, 0.08)",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <div style={{ height: 40, background: "#170406", position: "relative", overflow: "hidden" }}>
                      {socialPreviews.youtube?.bannerUrl ? (
                        <div
                          style={{
                            position: "absolute",
                            inset: -2,
                            backgroundImage: `url(${socialPreviews.youtube.bannerUrl})`,
                            backgroundPosition: "center",
                            backgroundSize: "cover",
                            filter: "blur(2px)",
                            opacity: 0.88,
                            transform: "scale(1.04)",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            background: "linear-gradient(135deg, #cc0000, #400000)",
                          }}
                        />
                      )}
                      <div style={{ position: "absolute", right: 4, top: 2, opacity: 0.3, pointerEvents: "none" }}>
                        <YoutubeIcon size={32} color="#ef4444" />
                      </div>
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background:
                            "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(23,4,6,0.7) 100%)",
                        }}
                      />
                    </div>
                    <div style={{ padding: "8px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 6,
                        }}
                      >
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: "50%",
                            background: "#cc0000",
                            border: `1.5px solid rgba(255,255,255,0.2)`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                            flexShrink: 0,
                          }}
                        >
                          {socialPreviews.youtube?.avatar ? (
                            <img
                              src={socialPreviews.youtube.avatar}
                              alt=""
                              referrerPolicy="no-referrer"
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            <YoutubeIcon size={13} color="#fff" />
                          )}
                        </div>
                        <span
                          style={{
                            background: "#cc0000",
                            color: "#fff",
                            padding: "2px 6px",
                            borderRadius: 4,
                            fontSize: 8,
                            fontWeight: 700,
                          }}
                        >
                          View
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: previewText,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {socialPreviews.youtube?.name || "YouTube"}
                      </div>
                      <div style={{ fontSize: 9, color: "#f87171", marginTop: 2 }}>
                        {socialPreviews.youtube?.subscribers || "Subscribers"}
                      </div>
                    </div>
                  </div>
                )}

                {/* Telegram Preview in Mock */}
                {telegramUrl && (
                  <div
                    style={{
                      borderRadius: 10,
                      border: "1px solid rgba(34, 158, 217, 0.3)",
                      background: "rgba(34, 158, 217, 0.08)",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <div
                      style={{
                        height: 40,
                        background: "linear-gradient(135deg, #229ED9, #091a26)",
                        position: "relative",
                      }}
                    >
                      <div style={{ position: "absolute", right: 4, top: 2, opacity: 0.3 }}>
                        <TelegramIcon size={32} color="#229ED9" />
                      </div>
                    </div>
                    <div style={{ padding: "8px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 6,
                        }}
                      >
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: "50%",
                            background: "#229ED9",
                            border: `1.5px solid rgba(255,255,255,0.2)`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                            flexShrink: 0,
                          }}
                        >
                          {socialPreviews.telegram?.avatar ? (
                            <img
                              src={socialPreviews.telegram.avatar}
                              alt=""
                              referrerPolicy="no-referrer"
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            <TelegramIcon size={13} color="#fff" />
                          )}
                        </div>
                        <span
                          style={{
                            background: "#229ED9",
                            color: "#fff",
                            padding: "2px 6px",
                            borderRadius: 4,
                            fontSize: 8,
                            fontWeight: 700,
                          }}
                        >
                          Join
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: previewText,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {socialPreviews.telegram?.name || "Telegram"}
                      </div>
                      <div style={{ fontSize: 9, color: "#38bdf8", marginTop: 2 }}>
                        {socialPreviews.telegram?.members || "Channel"}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sample product cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
              {[1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    background: cardColor || (lum > 0.55 ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.05)"),
                    border: `1px solid ${
                      borderColor || (lum > 0.55 ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.1)")
                    }`,
                    borderRadius: 10,
                    padding: 12,
                  }}
                >
                  <div
                    style={{
                      height: 50,
                      borderRadius: 6,
                      background: lum > 0.55 ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.08)",
                      marginBottom: 8,
                    }}
                  />
                  <div style={{ fontWeight: 600, fontSize: 12, color: textColor || previewText }}>
                    Sample Product #{i}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                    <span style={{ fontWeight: 800, color: accentColor, fontSize: 13 }}>$14.99</span>
                    <span
                      style={{
                        background: accentColor,
                        color: "#fff",
                        padding: "3px 8px",
                        borderRadius: 5,
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    >
                      Buy
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
