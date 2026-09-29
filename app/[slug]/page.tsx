import { db } from "@/lib/db";
import { shops, products, inventoryKeys, user } from "@/lib/db/schema";
import { eq, and, count, or } from "drizzle-orm";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import Link from "next/link";
import {
  getYouTubeInfo,
  getDiscordInfo as getDiscordServerInfo,
  getTelegramInfo,
  getTrustpilotInfo,
  parseDiscordInput,
} from "@/lib/social";
import {
  Key,
  ShoppingCart,
  ShoppingBag,
  ShieldCheck,
  Zap,
  Lock,
  AlertTriangle,
  ExternalLink,
  Cpu,
  Terminal,
  Activity,
  Radio,
  Share2,
  Mail,
} from "lucide-react";
import { StorefrontProductsCatalog } from "@/components/storefront-products-catalog";
import { StorefrontSidebarRecovery } from "@/components/storefront-sidebar-recovery";
import { StorefrontSupportChannels } from "@/components/storefront-support-channels";
import { StorefrontTosModal } from "@/components/storefront-tos-modal";
import { resolveStorefrontFont } from "@/lib/fonts";
import { GlobalAnnouncementBanner } from "@/components/global-announcement-banner";

function DiscordIcon({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function TelegramIcon({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="m20.665 3.717-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l-.002.001-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.785l3.019-14.228c.309-1.239-.473-1.8-1.282-1.434z" />
    </svg>
  );
}

function TrustpilotIcon({ size = 16, color = "#00b67a" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2l2.87 6.75 7.13.62-5.4 4.7 1.63 7.04L12 17.38l-6.23 3.73 1.63-7.04-5.4-4.7 7.13-.62L12 2z" fill={color} />
      <path d="M14.2 14.1l-2.2 2.4 1.3 5.3 5.4-3.2-4.5-4.5z" fill="#000000" opacity="0.18" />
    </svg>
  );
}

function YoutubeIcon({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

export default async function StorefrontPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const shop = await db.query.shops.findFirst({
    where: or(eq(shops.slug, slug), eq(shops.customDomain, slug)),
  });

  if (!shop || !shop.isActive) {
    notFound();
  }

  // Access control: unaccepted store visible only to owner/admin
  if (!shop.isAccepted) {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    let isOwner = false;
    let isAdmin = false;
    let isSuperAdmin = false;

    if (session?.user?.id) {
      isOwner = session.user.id === shop.userId;
      const dbUser = await db.query.user.findFirst({
        where: eq(user.id, session.user.id),
      });
      if (dbUser) {
        isSuperAdmin = dbUser.role === "superadmin";
        isAdmin = dbUser.role === "admin" && dbUser.adminPermissionsActive !== false;
      }
    }

    if (!isOwner && !isAdmin && !isSuperAdmin) {
      return (
        <div
          style={{
            minHeight: "100vh",
            background: "#030305",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            fontFamily: "var(--font-mono, monospace)",
          }}
        >
          <div
            style={{
              maxWidth: 460,
              width: "100%",
              background: "#08080c",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              borderRadius: 14,
              padding: 36,
              textAlign: "center",
              boxShadow: "0 25px 65px rgba(0,0,0,0.8), 0 0 30px rgba(239, 68, 68, 0.15)",
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                background: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                color: "#ef4444",
              }}
            >
              <Lock size={24} />
            </div>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: "#ffffff", marginBottom: 8, letterSpacing: "0.01em" }}>
              Store Pending Approval
            </h1>
            <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, marginBottom: 24 }}>
              <strong>{shop.name}</strong> is currently pending platform approval.
            </p>
            <Link
              href="/"
              className="krypt-btn-primary"
              style={{
                display: "inline-flex",
                padding: "8px 20px",
                borderRadius: 6,
                textDecoration: "none",
                fontSize: 12,
              }}
            >
              Back to Home
            </Link>
          </div>
        </div>
      );
    }
  }

  // Fetch socials concurrently
  const [discordDetails, youtubeDetails, telegramDetails] = await Promise.all([
    getDiscordServerInfo(shop.discordUrl),
    getYouTubeInfo(shop.youtubeUrl),
    getTelegramInfo(shop.telegramUrl),
  ]);
  const trustpilotDetails = getTrustpilotInfo(shop.trustpilotUrl);

  const shopProducts = await db
    .select()
    .from(products)
    .where(and(eq(products.shopId, shop.id), eq(products.isActive, true as any)));

  const productsWithStock = await Promise.all(
    shopProducts.map(async (p: any) => {
      let stock = 0;
      const variantStocks: Record<string, number> = {};

      if (p.type === "key") {
        const unusedKeys = await db
          .select({
            id: inventoryKeys.id,
            duration: inventoryKeys.duration,
            variantId: inventoryKeys.variantId,
          })
          .from(inventoryKeys)
          .where(and(eq(inventoryKeys.productId, p.id), eq(inventoryKeys.isUsed, false as any)));

        stock = unusedKeys.length;
        for (const k of unusedKeys) {
          if (k.variantId) variantStocks[k.variantId] = (variantStocks[k.variantId] || 0) + 1;
          if (k.duration) variantStocks[k.duration] = (variantStocks[k.duration] || 0) + 1;
        }
      } else {
        stock = p.isUnlimitedStock ? 9999 : p.stockLimit || 0;
      }
      return { ...p, stock, variantStocks };
    })
  );

  // Luminance calculation for intelligent fallback colors
  const bgRaw = (shop.backgroundColor || "").trim();
  const hasCustomBg = Boolean(bgRaw && bgRaw !== "");
  
  let isLightBg = false;
  if (bgRaw.startsWith("#") && bgRaw.length >= 7) {
    const c = bgRaw.replace("#", "");
    const r = parseInt(c.substring(0, 2), 16) || 0;
    const g = parseInt(c.substring(2, 4), 16) || 0;
    const b = parseInt(c.substring(4, 6), 16) || 0;
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    isLightBg = lum > 0.55;
  }

  const storefrontBg = shop.backgroundColor || "var(--color-background)";
  const storefrontAccent = shop.accentColor || "rgb(55, 44, 102)";
  const storefrontSurface = shop.cardColor || (hasCustomBg ? (isLightBg ? "#ffffff" : "#11131a") : "var(--color-surface)");
  const storefrontSurface2 = hasCustomBg ? (isLightBg ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)") : "var(--color-surface-2)";
  const storefrontBorder = shop.borderColor || (hasCustomBg ? (isLightBg ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)") : "var(--color-border)");
  const storefrontTextColor = shop.textColor || (hasCustomBg ? (isLightBg ? "#111827" : "#f1f5f9") : "var(--color-foreground)");
  const storefrontMutedColor = shop.mutedTextColor || (hasCustomBg ? (isLightBg ? "rgba(17,24,39,0.65)" : "rgba(241,245,249,0.6)") : "var(--color-muted-foreground)");

  const { getPlatformConfig } = await import("@/lib/platform-settings");
  const platformConfig = await getPlatformConfig();

  let parsedShopCategories: any[] = [];
  if (shop.categories) {
    try {
      parsedShopCategories = JSON.parse(shop.categories);
    } catch {
      parsedShopCategories = [];
    }
  }

  const fontMeta = resolveStorefrontFont(shop.fontStyle, shop.customFontUrl);

  return (
    <div
      className="page-transition"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: storefrontBg,
        color: storefrontTextColor,
        fontFamily: fontMeta.fontFamily,
        position: "relative",
        "--color-background": storefrontBg,
        "--color-surface": storefrontSurface,
        "--color-surface-2": storefrontSurface2,
        "--color-border": storefrontBorder,
        "--color-foreground": storefrontTextColor,
        "--color-muted-foreground": storefrontMutedColor,
        "--color-primary": storefrontAccent,
        "--color-primary-light": storefrontAccent,
        "--color-primary-glow": `${storefrontAccent}40`,
        "--input-bg": storefrontSurface2,
      } as React.CSSProperties}
    >
      {/* Dynamic Preset or Custom Google Font */}
      {fontMeta.stylesheetUrl && (
        <link rel="stylesheet" href={fontMeta.stylesheetUrl} />
      )}
      {/* ─── Platform Global Announcement Banner ─── */}
      <GlobalAnnouncementBanner
        config={{
          active: platformConfig.announcement_banner_active,
          text: platformConfig.announcement_banner_text,
          type: platformConfig.announcement_banner_type,
          target: platformConfig.announcement_banner_target,
          linkUrl: platformConfig.announcement_banner_link_url,
          linkText: platformConfig.announcement_banner_link_text,
          dismissible: platformConfig.announcement_banner_dismissible,
        }}
        currentLocation="storefront"
      />

      {/* ─── Top Tactical HUD Command Bar ─── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 90,
          background: storefrontSurface,
          backdropFilter: "blur(16px)",
          borderBottom: `1px solid ${storefrontBorder}`,
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
        }}
      >
        <div
          style={{
            maxWidth: 1380,
            margin: "0 auto",
            padding: "10px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          {/* Left: Node Stream telemetry & breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link
              href={`/${shop.slug}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                textDecoration: "none",
                color: storefrontTextColor,
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 6,
                  background: storefrontSurface2,
                  border: `1px solid ${storefrontBorder}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: storefrontAccent,
                  boxShadow: `0 0 10px ${storefrontAccent}40`,
                }}
              >
                {shop.logoUrl ? (
                  <img src={shop.logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 5 }} />
                ) : (
                  <ShoppingBag size={15} color={storefrontAccent} />
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontWeight: 900, fontSize: 13, letterSpacing: "0.04em", color: storefrontTextColor }}>
                  {shop.name}
                </span>
                <span style={{ fontSize: 10, color: storefrontMutedColor }}>
                  powered by krypt.market
                </span>
              </div>
            </Link>
          </div>

          {/* Right: Quick Portal Navigation Links */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Find My Keys button */}
            <Link
              href={`/${shop.slug}/lookup`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                borderRadius: 6,
                background: `linear-gradient(135deg, ${storefrontAccent} 0%, ${storefrontAccent} 100%)`,
                border: `1px solid ${storefrontAccent}88`,
                color: "#ffffff",
                textDecoration: "none",
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.04em",
                boxShadow: `0 0 14px ${storefrontAccent}50`,
                transition: "all 0.15s ease",
              }}
            >
              <Key size={13} />
              <span>Find My Order</span>
            </Link>

            {/* Hub root link */}
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 12px",
                borderRadius: 6,
                background: storefrontSurface2,
                border: `1px solid ${storefrontBorder}`,
                color: storefrontTextColor,
                textDecoration: "none",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              <span>KRYPT.HUB</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Main 2-Column Command Center Grid Layout ─── */}
      <div
        className="storefront-layout-grid"
        style={{
          flex: 1,
          width: "100%",
          maxWidth: 1380,
          margin: "0 auto",
          padding: "24px 20px 60px",
        }}
      >
        {/* ─── LEFT COLUMN: Tactical Merchant Node Panel (Sticky HUD) ─── */}
        <aside
          style={{
            position: "sticky",
            top: 72,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {/* Node Identity Card */}
          <div
            style={{
              background: storefrontSurface,
              border: `1px solid ${storefrontBorder}`,
              borderRadius: 14,
              padding: 20,
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
            }}
          >
            {/* Cyber Corner HUD Notches */}
            <div style={{ position: "absolute", top: 6, left: 6, width: 8, height: 8, borderTop: `2px solid ${storefrontAccent}`, borderLeft: `2px solid ${storefrontAccent}`, opacity: 0.8 }} />
            <div style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, borderTop: `2px solid ${storefrontAccent}`, borderRight: `2px solid ${storefrontAccent}`, opacity: 0.8 }} />
            <div style={{ position: "absolute", bottom: 6, left: 6, width: 8, height: 8, borderBottom: `2px solid ${storefrontAccent}`, borderLeft: `2px solid ${storefrontAccent}`, opacity: 0.8 }} />
            <div style={{ position: "absolute", bottom: 6, right: 6, width: 8, height: 8, borderBottom: `2px solid ${storefrontAccent}`, borderRight: `2px solid ${storefrontAccent}`, opacity: 0.8 }} />

            {/* Merchant Avatar & Main Node Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 10,
                  background: storefrontSurface2,
                  border: `1px solid ${storefrontBorder}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  fontWeight: 900,
                  color: storefrontTextColor,
                  flexShrink: 0,
                  boxShadow: `0 0 16px ${storefrontAccent}40`,
                  overflow: "hidden",
                }}
              >
                {shop.logoUrl ? (
                  <img src={shop.logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  shop.name[0] || "K"
                )}
              </div>

              <div>
                <h1 style={{ fontSize: 17, fontWeight: 900, color: storefrontTextColor, margin: 0, letterSpacing: "0.02em" }}>
                  {shop.name}
                </h1>
              </div>
            </div>

            {/* Merchant Bio / Mission Statement */}
            <p
              style={{
                fontSize: 12,
                color: storefrontMutedColor,
                lineHeight: 1.5,
                margin: "0 0 16px 0",
              }}
            >
              {shop.description || "Automated digital license dispatch node. Instant peer-to-peer delivery."}
            </p>

            {/* Merchant Support Channels (Replaces the 4-Cell Telemetry Matrix) */}
            <StorefrontSupportChannels
              supportEmail={shop.supportEmail}
              discordUrl={shop.discordUrl}
              telegramUrl={shop.telegramUrl}
              contactInfo={shop.contactInfo}
              discordPresenceCount={discordDetails?.presenceCount}
              accentColor={storefrontAccent}
            />
          </div>

          {/* Embedded Instant Key Recovery Widget */}
          <StorefrontSidebarRecovery shopSlug={shop.slug} shopName={shop.name} accentColor={storefrontAccent} />

          {/* Socials & Community Channels */}
          {(shop.discordUrl || shop.telegramUrl || shop.youtubeUrl || shop.trustpilotUrl) && (
            <div
              style={{
                background: storefrontSurface,
                border: `1px solid ${storefrontBorder}`,
                borderRadius: 12,
                padding: 14,
                boxShadow: "0 6px 20px rgba(0, 0, 0, 0.05)",
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 800, color: storefrontMutedColor, marginBottom: 10, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Community & Links
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {shop.discordUrl && (() => {
                  const dcInfo = parseDiscordInput(shop.discordUrl);
                  return (
                    <a
                      href={dcInfo.href || (dcInfo.type === "server" ? `https://${shop.discordUrl.replace(/^https?:\/\//i, "")}` : `https://discord.com/users/${dcInfo.handle.replace(/^@/, "")}`)}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        padding: "8px 12px",
                        borderRadius: 6,
                        background: `${storefrontAccent}18`,
                        border: `1px solid ${storefrontAccent}35`,
                        color: storefrontTextColor,
                        textDecoration: "none",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: 11,
                        fontWeight: 700,
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <DiscordIcon size={14} color={storefrontAccent} />
                        <span>{dcInfo.label}</span>
                      </div>
                      <span style={{ fontSize: 9.5, color: storefrontAccent }}>
                        {dcInfo.type === "server" ? "Join" : (dcInfo.handle || "Contact")}
                      </span>
                    </a>
                  );
                })()}

                {shop.telegramUrl && (
                  <a
                    href={shop.telegramUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: "8px 12px",
                      borderRadius: 6,
                      background: storefrontSurface2,
                      border: `1px solid ${storefrontBorder}`,
                      color: storefrontTextColor,
                      textDecoration: "none",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <TelegramIcon size={14} color={storefrontTextColor} />
                      <span>Telegram</span>
                    </div>
                    <ExternalLink size={11} color={storefrontMutedColor} />
                  </a>
                )}

                {shop.trustpilotUrl && (
                  <a
                    href={shop.trustpilotUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: "8px 12px",
                      borderRadius: 6,
                      background: storefrontSurface2,
                      border: `1px solid ${storefrontBorder}`,
                      color: storefrontTextColor,
                      textDecoration: "none",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <TrustpilotIcon size={14} color="#22c55e" />
                      <span>Trustpilot Reviews</span>
                    </div>
                    <span style={{ fontSize: 9.5, color: "#22c55e" }}>5.0 ★</span>
                  </a>
                )}

                {shop.youtubeUrl && (
                  <a
                    href={shop.youtubeUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: "8px 12px",
                      borderRadius: 6,
                      background: storefrontSurface2,
                      border: `1px solid ${storefrontBorder}`,
                      color: storefrontTextColor,
                      textDecoration: "none",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <YoutubeIcon size={14} color="#ef4444" />
                      <span>YouTube Channel</span>
                    </div>
                    <ExternalLink size={11} color={storefrontMutedColor} />
                  </a>
                )}
              </div>
            </div>
          )}
        </aside>

        {/* ─── RIGHT COLUMN: Products Catalog & Storefront Banner ─── */}
        <main style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Storefront Hero Banner */}
          <div
            style={{
              height: 180,
              borderRadius: 14,
              border: `1px solid ${storefrontBorder}`,
              position: "relative",
              overflow: "hidden",
              background: storefrontSurface,
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
            }}
          >
            {shop.bannerUrl ? (
              <>
                <img
                  src={shop.bannerUrl}
                  alt=""
                  referrerPolicy="no-referrer"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.75) 100%)",
                  }}
                />
              </>
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: `radial-gradient(circle at 80% 20%, ${storefrontAccent}66 0%, ${storefrontSurface} 70%)`,
                }}
              />
            )}

            {/* Scanline Grid Pattern */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: "linear-gradient(rgba(0,0,0,0) 50%, rgba(0,0,0,0.2) 50%)",
                backgroundSize: "100% 4px",
                pointerEvents: "none",
              }}
            />

            {/* Banner Text Overlay */}
            <div
              style={{
                position: "absolute",
                bottom: 16,
                left: 20,
                right: 20,
                zIndex: 2,
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 900, color: "#ffffff", letterSpacing: "0.02em", textShadow: "0 2px 10px rgba(0,0,0,0.7)" }}>
                {shop.name}
              </div>
            </div>
          </div>

          {/* Product Matrix & Control Deck */}
          <StorefrontProductsCatalog
            products={productsWithStock as any}
            shopSlug={shop.slug}
            shopName={shop.name}
            accentColor={storefrontAccent}
            textColor={storefrontTextColor}
            textMuted={storefrontMutedColor}
            cardBg={storefrontSurface}
            cardBorder={storefrontBorder}
            isLight={isLightBg}
            shopCategories={parsedShopCategories}
          />
        </main>
      </div>

      {/* ─── Storefront Footer ─── */}
      <footer
        style={{
          borderTop: `1px solid ${storefrontBorder}`,
          background: storefrontSurface,
          padding: "24px 20px",
          marginTop: "auto",
          width: "100%",
          position: "relative",
          zIndex: 20,
        }}
      >
        <div
          style={{
            maxWidth: 1380,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 14,
            fontSize: 11,
            color: storefrontMutedColor,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: storefrontTextColor, fontWeight: 800 }}>KRYPT.MARKET</span>
            <span>•</span>
            <span>{shop.name}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <StorefrontTosModal
              shopName={shop.name}
              termsOfService={shop.termsOfService}
              supportEmail={shop.supportEmail}
              contactInfo={shop.contactInfo}
              discordUrl={shop.discordUrl}
              telegramUrl={shop.telegramUrl}
              accentColor={storefrontAccent}
            />
            <Link href={`/${shop.slug}/lookup`} style={{ color: storefrontAccent, textDecoration: "none", fontWeight: 700 }}>
              Find My Order
            </Link>
            <Link href="/terms" style={{ color: storefrontMutedColor, textDecoration: "none" }}>
              Platform Terms
            </Link>
            <Link href="/" style={{ color: storefrontMutedColor, textDecoration: "none" }}>
              Create Store
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
