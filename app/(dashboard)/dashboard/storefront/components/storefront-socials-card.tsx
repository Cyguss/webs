"use client";

import React from "react";
import { Link as LinkIcon, Loader2, AlertCircle } from "lucide-react";
import { DiscordIcon, YoutubeIcon, TrustpilotIcon, TelegramIcon } from "./storefront-constants";

interface SocialPreviews {
  youtube?: {
    valid: boolean;
    name?: string;
    handle?: string;
    subscribers?: string;
    avatar?: string;
    bannerUrl?: string | null;
    description?: string;
    error?: string;
  } | null;
  trustpilot?: {
    valid: boolean;
    domain?: string;
    ratingScore?: string;
    ratingLabel?: string;
    stars?: number;
    reviewCount?: string;
    url?: string;
    error?: string;
  } | null;
  telegram?: {
    valid: boolean;
    name?: string;
    username?: string;
    handle?: string;
    members?: string;
    avatar?: string;
    description?: string;
    error?: string;
  } | null;
}

interface DiscordInfo {
  valid: boolean;
  name?: string;
  description?: string | null;
  bannerUrl?: string | null;
  memberCount?: number | null;
  presenceCount?: number | null;
  iconUrl?: string | null;
  error?: string;
}

interface StorefrontSocialsCardProps {
  discordUrl: string;
  setDiscordUrl: (val: string) => void;
  discordChecking: boolean;
  discordInfo: DiscordInfo | null;
  onVerifyDiscord: (url: string, showToast?: boolean) => void;
  youtubeUrl: string;
  setYoutubeUrl: (val: string) => void;
  trustpilotUrl: string;
  setTrustpilotUrl: (val: string) => void;
  telegramUrl: string;
  setTelegramUrl: (val: string) => void;
  socialPreviews: SocialPreviews;
  onFetchSocialPreview: (
    platform: "youtube" | "trustpilot" | "telegram",
    url: string,
    showToast?: boolean
  ) => void;
}

export function StorefrontSocialsCard({
  discordUrl,
  setDiscordUrl,
  discordChecking,
  discordInfo,
  onVerifyDiscord,
  youtubeUrl,
  setYoutubeUrl,
  trustpilotUrl,
  setTrustpilotUrl,
  telegramUrl,
  setTelegramUrl,
  socialPreviews,
  onFetchSocialPreview,
}: StorefrontSocialsCardProps) {
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
        <LinkIcon size={16} color="var(--color-primary-light)" /> Community & Review Links
      </h3>

      {/* Discord Section */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <label
            className="label"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              margin: 0,
              color: "#818cf8",
              fontWeight: 700,
            }}
          >
            <DiscordIcon size={16} color="#5865F2" /> Discord Server Invite
          </label>
          {discordChecking && (
            <span
              style={{
                fontSize: 11,
                color: "var(--color-muted-foreground)",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Loader2 size={12} className="animate-spin" /> Verifying invite...
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            className="input"
            style={{ flex: 1 }}
            placeholder="https://discord.gg/yourserver or invite code"
            value={discordUrl}
            onChange={(e) => setDiscordUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onVerifyDiscord(discordUrl, true);
              }
            }}
            onBlur={() => {
              if (discordUrl.trim()) {
                onVerifyDiscord(discordUrl, true);
              }
            }}
          />
          <button
            type="button"
            onClick={() => onVerifyDiscord(discordUrl, true)}
            disabled={discordChecking || !discordUrl.trim()}
            className="btn btn-secondary"
            style={{
              height: 42,
              padding: "0 14px",
              fontSize: 13,
              fontWeight: 600,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {discordChecking ? <Loader2 size={14} className="animate-spin" /> : "Verify"}
          </button>
        </div>

        {/* Discord Live Preview Card in Editor */}
        {discordInfo && discordInfo.valid && (
          <div
            style={{
              marginTop: 8,
              borderRadius: 12,
              border: "1px solid rgba(88, 101, 242, 0.35)",
              background: "rgba(88, 101, 242, 0.05)",
              overflow: "hidden",
            }}
          >
            <div>
              <div
                style={{
                  height: 76,
                  position: "relative",
                  overflow: "hidden",
                  background: "#161822",
                }}
              >
                {discordInfo.bannerUrl ? (
                  <div
                    style={{
                      position: "absolute",
                      inset: -12,
                      backgroundImage: `url(${discordInfo.bannerUrl})`,
                      backgroundPosition: "center",
                      backgroundSize: "cover",
                      filter: "blur(6px)",
                      opacity: 0.75,
                      transform: "scale(1.15)",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      background: "linear-gradient(135deg, #5865F2 0%, #1e1f22 100%)",
                    }}
                  />
                )}
                <div style={{ position: "absolute", right: 8, top: 4, opacity: 0.28, pointerEvents: "none" }}>
                  <DiscordIcon size={56} color="#5865F2" />
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
              <div
                style={{
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {discordInfo.iconUrl ? (
                    <img
                      src={discordInfo.iconUrl}
                      alt=""
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        border: "2px solid rgba(88, 101, 242, 0.4)",
                        objectFit: "cover",
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: "#5865F2",
                        border: "2px solid rgba(88, 101, 242, 0.4)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        flexShrink: 0,
                      }}
                    >
                      <DiscordIcon size={22} color="#fff" />
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-foreground)" }}>
                      {discordInfo.name || "Discord Community"}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--color-muted-foreground)",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginTop: 3,
                      }}
                    >
                      {typeof discordInfo.presenceCount === "number" && (
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#23a55a" }} />
                          <strong style={{ color: "var(--color-foreground)" }}>
                            {discordInfo.presenceCount.toLocaleString()}
                          </strong>{" "}
                          Online
                        </span>
                      )}
                      {typeof discordInfo.memberCount === "number" && (
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#949ba4" }} />
                          <strong style={{ color: "var(--color-foreground)" }}>
                            {discordInfo.memberCount.toLocaleString()}
                          </strong>{" "}
                          Members
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* YouTube Section */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label
          className="label"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            margin: 0,
            color: "#f87171",
            fontWeight: 700,
          }}
        >
          <YoutubeIcon size={16} color="#ef4444" /> YouTube Channel URL
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="url"
            className="input"
            style={{ flex: 1 }}
            placeholder="https://youtube.com/@yourchannel or @handle"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onFetchSocialPreview("youtube", youtubeUrl, true);
              }
            }}
            onBlur={() => {
              if (youtubeUrl.trim()) onFetchSocialPreview("youtube", youtubeUrl, true);
            }}
          />
          <button
            type="button"
            onClick={() => onFetchSocialPreview("youtube", youtubeUrl, true)}
            disabled={!youtubeUrl.trim()}
            className="btn btn-secondary"
            style={{
              height: 42,
              padding: "0 14px",
              fontSize: 13,
              fontWeight: 600,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            Verify
          </button>
        </div>
        {socialPreviews.youtube && socialPreviews.youtube.valid && (
          <div
            style={{
              marginTop: 6,
              borderRadius: 12,
              border: "1px solid rgba(239, 68, 68, 0.3)",
              background: "rgba(239, 68, 68, 0.05)",
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {socialPreviews.youtube.avatar ? (
                <img
                  src={socialPreviews.youtube.avatar}
                  alt=""
                  referrerPolicy="no-referrer"
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    border: "2px solid #ef4444",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    background: "#cc0000",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                  }}
                >
                  <YoutubeIcon size={20} color="#fff" />
                </div>
              )}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-foreground)" }}>
                  {socialPreviews.youtube.name || "YouTube Channel"}
                </div>
                <div style={{ fontSize: 11, color: "#f87171", fontWeight: 600 }}>
                  {socialPreviews.youtube.handle}
                </div>
              </div>
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: 8,
                background: "#cc0000",
                color: "#fff",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <YoutubeIcon size={14} color="#fff" />
              <span>{socialPreviews.youtube.subscribers || "YouTube Channel"}</span>
            </span>
          </div>
        )}
      </div>

      {/* Trustpilot Section */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label
          className="label"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            margin: 0,
            color: "#34d399",
            fontWeight: 700,
          }}
        >
          <TrustpilotIcon size={16} /> Trustpilot Profile / Reviews URL
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="url"
            className="input"
            style={{ flex: 1 }}
            placeholder="https://www.trustpilot.com/review/yourdomain.com"
            value={trustpilotUrl}
            onChange={(e) => setTrustpilotUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onFetchSocialPreview("trustpilot", trustpilotUrl, true);
              }
            }}
            onBlur={() => {
              if (trustpilotUrl.trim()) onFetchSocialPreview("trustpilot", trustpilotUrl, true);
            }}
          />
          <button
            type="button"
            onClick={() => onFetchSocialPreview("trustpilot", trustpilotUrl, true)}
            disabled={!trustpilotUrl.trim()}
            className="btn btn-secondary"
            style={{
              height: 42,
              padding: "0 14px",
              fontSize: 13,
              fontWeight: 600,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            Verify
          </button>
        </div>
        {socialPreviews.trustpilot && socialPreviews.trustpilot.valid && (
          <div
            style={{
              marginTop: 6,
              borderRadius: 12,
              border: "1px solid rgba(0, 182, 122, 0.3)",
              background: "rgba(0, 182, 122, 0.05)",
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <a
                href={socialPreviews.trustpilot.url}
                target="_blank"
                rel="noreferrer"
                title="Open Trustpilot page"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: "#00b67a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  textDecoration: "none",
                  cursor: "pointer",
                }}
              >
                <TrustpilotIcon size={22} color="#ffffff" />
              </a>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-foreground)" }}>
                  {socialPreviews.trustpilot.domain}
                </div>
                <div style={{ display: "flex", gap: 2, marginTop: 2 }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span
                      key={s}
                      style={{
                        width: 14,
                        height: 14,
                        background: "#00b67a",
                        borderRadius: 2,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: 9,
                      }}
                    >
                      ★
                    </span>
                  ))}
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#34d399", marginLeft: 4 }}>
                    4.8 / 5.0
                  </span>
                </div>
              </div>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: 6,
                background: "rgba(0, 182, 122, 0.2)",
                color: "#34d399",
              }}
            >
              {socialPreviews.trustpilot.reviewCount || "142 Reviews"}
            </span>
          </div>
        )}
      </div>

      {/* Telegram Section */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label
          className="label"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            margin: 0,
            color: "#38bdf8",
            fontWeight: 700,
          }}
        >
          <TelegramIcon size={16} color="#229ED9" /> Telegram Channel URL
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="url"
            className="input"
            style={{ flex: 1 }}
            placeholder="https://t.me/yourchannel or @channel"
            value={telegramUrl}
            onChange={(e) => setTelegramUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onFetchSocialPreview("telegram", telegramUrl, true);
              }
            }}
            onBlur={() => {
              if (telegramUrl.trim()) onFetchSocialPreview("telegram", telegramUrl, true);
            }}
          />
          <button
            type="button"
            onClick={() => onFetchSocialPreview("telegram", telegramUrl, true)}
            disabled={!telegramUrl.trim()}
            className="btn btn-secondary"
            style={{
              height: 42,
              padding: "0 14px",
              fontSize: 13,
              fontWeight: 600,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            Verify
          </button>
        </div>
        {socialPreviews.telegram && socialPreviews.telegram.valid && (
          <div
            style={{
              marginTop: 6,
              borderRadius: 12,
              border: "1px solid rgba(34, 158, 217, 0.3)",
              background: "rgba(34, 158, 217, 0.05)",
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {socialPreviews.telegram.avatar ? (
                <img
                  src={socialPreviews.telegram.avatar}
                  alt=""
                  referrerPolicy="no-referrer"
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    border: "2px solid #229ED9",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    background: "#229ED9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                  }}
                >
                  <TelegramIcon size={20} color="#fff" />
                </div>
              )}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-foreground)" }}>
                  {socialPreviews.telegram.name || `@${socialPreviews.telegram.username}`}
                </div>
                <div style={{ fontSize: 11, color: "#38bdf8", fontWeight: 600 }}>
                  @{socialPreviews.telegram.username}
                </div>
              </div>
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: 8,
                background: "#229ED9",
                color: "#fff",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <TelegramIcon size={14} color="#fff" />
              <span>{socialPreviews.telegram.members || "Telegram Community"}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
