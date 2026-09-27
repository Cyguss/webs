"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-context";
import { StorefrontHeader } from "./components/storefront-header";
import { StorefrontIdentityCard } from "./components/storefront-identity-card";
import { StorefrontThemeCard } from "./components/storefront-theme-card";
import { StorefrontSocialsCard } from "./components/storefront-socials-card";
import { StorefrontDomainCard } from "./components/storefront-domain-card";
import { StorefrontPreview } from "./components/storefront-preview";
import { StorefrontExitDialog } from "./components/storefront-exit-dialog";
import { FONT_OPTIONS } from "./components/storefront-constants";

export default function StorefrontEditorClient({ shop }: { shop: any }) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [previewSize, setPreviewSize] = useState<"desktop" | "laptop" | "mobile">("desktop");

  const [name, setName] = useState(shop.name || "");
  const [description, setDescription] = useState(shop.description || "");
  const [logoUrl, setLogoUrl] = useState(shop.logoUrl || "");
  const [bannerUrl, setBannerUrl] = useState(shop.bannerUrl || "");
  const [backgroundColor, setBackgroundColor] = useState(shop.backgroundColor || "#0f0f0f");
  const [accentColor, setAccentColor] = useState(shop.accentColor || "#6366f1");
  const [textColor, setTextColor] = useState(shop.textColor || "");
  const [mutedTextColor, setMutedTextColor] = useState(shop.mutedTextColor || "");
  const [cardColor, setCardColor] = useState(shop.cardColor || "");
  const [borderColor, setBorderColor] = useState(shop.borderColor || "");
  const [fontStyle, setFontStyle] = useState(shop.fontStyle || "inter");
  const [customFontUrl, setCustomFontUrl] = useState(shop.customFontUrl || "");
  const [discordUrl, setDiscordUrl] = useState(shop.discordUrl || "");
  const [youtubeUrl, setYoutubeUrl] = useState(shop.youtubeUrl || "");
  const [trustpilotUrl, setTrustpilotUrl] = useState(shop.trustpilotUrl || "");
  const [telegramUrl, setTelegramUrl] = useState(shop.telegramUrl || "");
  const [customDomain, setCustomDomain] = useState(shop.customDomain || "");
  const [metaTitle, setMetaTitle] = useState(shop.metaTitle || "");
  const [metaDescription, setMetaDescription] = useState(shop.metaDescription || "");
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState(shop.discordWebhookUrl || "");

  // Discord verification state
  const [discordChecking, setDiscordChecking] = useState(false);
  const [discordInfo, setDiscordInfo] = useState<{
    valid: boolean;
    name?: string;
    description?: string | null;
    bannerUrl?: string | null;
    memberCount?: number | null;
    presenceCount?: number | null;
    iconUrl?: string | null;
    error?: string;
  } | null>(null);

  // Social previews state
  const [socialPreviews, setSocialPreviews] = useState<{
    youtube?: { valid: boolean; name?: string; handle?: string; subscribers?: string; avatar?: string; bannerUrl?: string | null; description?: string; error?: string } | null;
    trustpilot?: { valid: boolean; domain?: string; ratingScore?: string; ratingLabel?: string; stars?: number; reviewCount?: string; url?: string; error?: string } | null;
    telegram?: { valid: boolean; name?: string; username?: string; handle?: string; members?: string; avatar?: string; description?: string; error?: string } | null;
  }>({});

  // Webhook verification state
  const [webhookChecking, setWebhookChecking] = useState(false);

  // Unsaved changes & exit confirmation state
  const [confirmExitOpen, setConfirmExitOpen] = useState(false);
  const [pendingExitUrl, setPendingExitUrl] = useState<string | null>(null);

  const isDirty =
    name !== (shop.name || "") ||
    description !== (shop.description || "") ||
    logoUrl !== (shop.logoUrl || "") ||
    bannerUrl !== (shop.bannerUrl || "") ||
    backgroundColor !== (shop.backgroundColor || "#0f0f0f") ||
    accentColor !== (shop.accentColor || "#6366f1") ||
    textColor !== (shop.textColor || "") ||
    mutedTextColor !== (shop.mutedTextColor || "") ||
    cardColor !== (shop.cardColor || "") ||
    borderColor !== (shop.borderColor || "") ||
    fontStyle !== (shop.fontStyle || "inter") ||
    customFontUrl !== (shop.customFontUrl || "") ||
    discordUrl !== (shop.discordUrl || "") ||
    youtubeUrl !== (shop.youtubeUrl || "") ||
    trustpilotUrl !== (shop.trustpilotUrl || "") ||
    telegramUrl !== (shop.telegramUrl || "") ||
    customDomain !== (shop.customDomain || "") ||
    metaTitle !== (shop.metaTitle || "") ||
    metaDescription !== (shop.metaDescription || "") ||
    discordWebhookUrl !== (shop.discordWebhookUrl || "");

  // Auto-verify social links on mount if already configured
  useEffect(() => {
    if (discordUrl) verifyDiscordInvite(discordUrl, false);
    if (youtubeUrl) fetchSocialPreview("youtube", youtubeUrl, false);
    if (trustpilotUrl) fetchSocialPreview("trustpilot", trustpilotUrl, false);
    if (telegramUrl) fetchSocialPreview("telegram", telegramUrl, false);
  }, []);

  async function verifyDiscordInvite(url: string, showToast = true) {
    if (!url.trim()) {
      setDiscordInfo(null);
      return;
    }
    setDiscordChecking(true);
    try {
      const res = await fetch("/api/discord/invite-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteUrl: url.trim() }),
      });
      const data = await res.json();
      if (data.valid) {
        setDiscordInfo(data);
        if (showToast) {
          toast.success(
            "Discord Connected",
            `Server: ${data.name} (${data.memberCount?.toLocaleString() ?? 0} members)`
          );
        }
      } else {
        setDiscordInfo({ valid: false, error: data.error });
        if (showToast) {
          toast.error("Discord Error", data.error || "Could not fetch Discord server info");
        }
      }
    } catch {
      setDiscordInfo({ valid: false, error: "Failed to connect to Discord" });
      if (showToast) {
        toast.error("Discord Error", "Failed to reach Discord verification endpoint");
      }
    } finally {
      setDiscordChecking(false);
    }
  }

  async function fetchSocialPreview(
    platform: "youtube" | "trustpilot" | "telegram",
    url: string,
    showToast = true
  ) {
    if (!url.trim()) {
      setSocialPreviews((prev) => ({ ...prev, [platform]: null }));
      return;
    }
    const label =
      platform === "youtube" ? "YouTube" : platform === "telegram" ? "Telegram" : "Trustpilot";
    try {
      const res = await fetch("/api/social/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, url: url.trim() }),
      });
      const data = await res.json();
      if (data.valid) {
        setSocialPreviews((prev) => ({ ...prev, [platform]: data }));
        if (showToast) {
          toast.success(
            `${label} Connected`,
            data.name || data.handle || data.domain || `${label} profile verified`
          );
        }
      } else {
        setSocialPreviews((prev) => ({ ...prev, [platform]: { valid: false, error: data.error } }));
        if (showToast) {
          toast.error(`${label} Error`, data.error || `Could not verify ${label} link`);
        }
      }
    } catch {
      setSocialPreviews((prev) => ({
        ...prev,
        [platform]: { valid: false, error: `Failed to connect to ${label}` },
      }));
      if (showToast) {
        toast.error(`${label} Error`, `Failed to reach ${label} preview endpoint`);
      }
    }
  }

  async function handleSave(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/storefront", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          logoUrl,
          bannerUrl,
          backgroundColor,
          accentColor,
          fontStyle,
          customFontUrl,
          discordUrl,
          youtubeUrl,
          trustpilotUrl,
          telegramUrl,
          customDomain,
          metaTitle,
          metaDescription,
          discordWebhookUrl,
          textColor,
          mutedTextColor,
          cardColor,
          borderColor,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save storefront settings");
      toast.success("Settings Saved", "Storefront updated successfully.");
      router.refresh();
      return true;
    } catch (err: any) {
      toast.error("Save Failed", err.message || "Failed to save storefront settings");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function verifyWebhook() {
    if (!discordWebhookUrl.trim()) {
      toast.error("Webhook Missing", "Please enter a Discord webhook URL first.");
      return;
    }
    setWebhookChecking(true);
    try {
      const res = await fetch("/api/discord/check-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl: discordWebhookUrl }),
      });
      const data = await res.json();
      if (data.valid) {
        toast.success("Webhook Valid", `Connected to Discord webhook (${data.name || "Active"})`);
      } else {
        toast.error("Invalid Webhook", data.error || "Discord rejected this webhook URL.");
      }
    } catch (err: any) {
      toast.error("Verification Failed", err.message || "Failed to verify webhook URL.");
    } finally {
      setWebhookChecking(false);
    }
  }

  async function testWebhook() {
    if (!discordWebhookUrl.trim()) {
      toast.error("Webhook Missing", "Please enter a Discord webhook URL first.");
      return;
    }
    try {
      const res = await fetch(discordWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [
            {
              title: "Vaultly Webhook Test",
              description: `Webhook connected successfully for **${name}**`,
              color: 0x6366f1,
            },
          ],
        }),
      });
      if (res.ok) {
        toast.success("Webhook Delivered", "Test message sent to your Discord channel.");
      } else {
        toast.error("Delivery Failed", `Discord returned status ${res.status}`);
      }
    } catch {
      toast.error("Delivery Failed", "Could not reach Discord webhook URL.");
    }
  }

  // Custom font extraction for mock preview
  let customFontFamily = null;
  if (customFontUrl) {
    const famMatch = customFontUrl.match(/family=([a-zA-Z0-9+]+)/i);
    if (famMatch) {
      customFontFamily = `'${decodeURIComponent(famMatch[1].replace(/\+/g, " "))}', sans-serif`;
    }
  }
  const previewFont =
    customFontFamily ||
    (FONT_OPTIONS.find((f) => f.value === fontStyle)?.label === "Inter"
      ? "Inter, sans-serif"
      : `${FONT_OPTIONS.find((f) => f.value === fontStyle)?.label}, Inter, sans-serif`);

  const handleExit = () => {
    if (isDirty) {
      setPendingExitUrl("/dashboard");
      setConfirmExitOpen(true);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="page-fly-in" style={{ maxWidth: 1400, margin: "0 auto", width: "100%" }}>
      <StorefrontHeader
        isDirty={isDirty}
        loading={loading}
        shopSlug={shop.slug}
        onExit={handleExit}
        onSave={() => handleSave()}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
        {/* Left Column: Modular Editor Cards */}
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <StorefrontIdentityCard
            name={name}
            setName={setName}
            description={description}
            setDescription={setDescription}
            logoUrl={logoUrl}
            setLogoUrl={setLogoUrl}
            bannerUrl={bannerUrl}
            setBannerUrl={setBannerUrl}
          />

          <StorefrontThemeCard
            backgroundColor={backgroundColor}
            setBackgroundColor={setBackgroundColor}
            accentColor={accentColor}
            setAccentColor={setAccentColor}
            textColor={textColor}
            setTextColor={setTextColor}
            mutedTextColor={mutedTextColor}
            setMutedTextColor={setMutedTextColor}
            cardColor={cardColor}
            setCardColor={setCardColor}
            borderColor={borderColor}
            setBorderColor={setBorderColor}
            fontStyle={fontStyle}
            setFontStyle={setFontStyle}
            customFontUrl={customFontUrl}
            setCustomFontUrl={setCustomFontUrl}
          />

          <StorefrontSocialsCard
            discordUrl={discordUrl}
            setDiscordUrl={setDiscordUrl}
            discordChecking={discordChecking}
            discordInfo={discordInfo}
            onVerifyDiscord={verifyDiscordInvite}
            youtubeUrl={youtubeUrl}
            setYoutubeUrl={setYoutubeUrl}
            trustpilotUrl={trustpilotUrl}
            setTrustpilotUrl={setTrustpilotUrl}
            telegramUrl={telegramUrl}
            setTelegramUrl={setTelegramUrl}
            socialPreviews={socialPreviews}
            onFetchSocialPreview={fetchSocialPreview}
          />

          <StorefrontDomainCard
            name={name}
            shopSlug={shop.slug}
            customDomain={customDomain}
            setCustomDomain={setCustomDomain}
            metaTitle={metaTitle}
            setMetaTitle={setMetaTitle}
            metaDescription={metaDescription}
            setMetaDescription={setMetaDescription}
            discordWebhookUrl={discordWebhookUrl}
            setDiscordWebhookUrl={setDiscordWebhookUrl}
            webhookChecking={webhookChecking}
            onVerifyWebhook={verifyWebhook}
            onTestWebhook={testWebhook}
          />
        </form>

        {/* Right Column: Live Storefront Preview */}
        <StorefrontPreview
          previewSize={previewSize}
          setPreviewSize={setPreviewSize}
          backgroundColor={backgroundColor}
          accentColor={accentColor}
          textColor={textColor}
          mutedTextColor={mutedTextColor}
          cardColor={cardColor}
          borderColor={borderColor}
          previewFont={previewFont}
          customFontUrl={customFontUrl}
          bannerUrl={bannerUrl}
          logoUrl={logoUrl}
          name={name}
          description={description}
          trustpilotUrl={trustpilotUrl}
          discordUrl={discordUrl}
          youtubeUrl={youtubeUrl}
          telegramUrl={telegramUrl}
          discordInfo={discordInfo}
          socialPreviews={socialPreviews}
        />
      </div>

      <StorefrontExitDialog
        isOpen={confirmExitOpen}
        loading={loading}
        onSaveAndClose={async () => {
          const success = await handleSave();
          if (success) {
            setConfirmExitOpen(false);
            router.push(pendingExitUrl || "/dashboard");
          }
        }}
        onContinueEditing={() => setConfirmExitOpen(false)}
        onDiscardAndExit={() => {
          setConfirmExitOpen(false);
          router.push(pendingExitUrl || "/dashboard");
        }}
      />
    </div>
  );
}
