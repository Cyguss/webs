import { db } from "@/lib/db";
import { shops } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { OrderLookupForm } from "@/components/order-lookup-form";
import { ArrowLeft, Key, Terminal } from "lucide-react";
import { resolveStorefrontFont } from "@/lib/fonts";
import { GlobalAnnouncementBanner } from "@/components/global-announcement-banner";
import { getPlatformConfig } from "@/lib/platform-settings";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const shop = await db.query.shops.findFirst({
    where: eq(shops.slug, slug),
  });

  if (!shop) return { title: "Store Not Found" };

  return {
    title: `Find My Order | ${shop.name} // KRYPT`,
    description: `Lookup and retrieve your purchased keys from ${shop.name}.`,
  };
}

export default async function StorefrontOrderLookupPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const shop = await db.query.shops.findFirst({
    where: eq(shops.slug, slug),
  });

  if (!shop) {
    notFound();
  }

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

  const fontMeta = resolveStorefrontFont(shop.fontStyle, shop.customFontUrl);
  const platformConfig = await getPlatformConfig();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: storefrontBg,
        color: storefrontTextColor,
        fontFamily: fontMeta.fontFamily,
        display: "flex",
        flexDirection: "column",
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

      {/* Global Platform Announcement Banner */}
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

      {/* Tactical Background Grid */}
      <div
        className="krypt-grid-bg"
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.25,
          pointerEvents: "none",
        }}
      />

      {/* Header */}
      <header
        style={{
          borderBottom: `1px solid ${storefrontBorder}`,
          padding: "14px 24px",
          background: storefrontSurface,
          backdropFilter: "blur(12px)",
          position: "relative",
          zIndex: 10,
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link
            href={`/${shop.slug}`}
            style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: storefrontTextColor, fontWeight: 800, fontSize: 16, fontFamily: "var(--font-mono, monospace)" }}
          >
            {shop.logoUrl ? (
              <img
                src={shop.logoUrl}
                alt={shop.name}
                style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: `linear-gradient(135deg, ${storefrontAccent} 0%, ${storefrontAccent} 100%)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  fontWeight: 900,
                  border: `1px solid ${storefrontAccent}88`,
                }}
              >
                {shop.name[0] || "S"}
              </div>
            )}
            <span>{shop.name}</span>
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link
              href={`/${shop.slug}`}
              style={{
                fontSize: 12,
                fontFamily: "var(--font-mono, monospace)",
                color: storefrontMutedColor,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 6,
                background: storefrontSurface2,
                border: `1px solid ${storefrontBorder}`,
              }}
            >
              <ArrowLeft size={13} />
              <span>Back to Store</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px", position: "relative", zIndex: 10 }}>
        <OrderLookupForm
          shopSlug={shop.slug}
          shopName={shop.name}
          accentColor={storefrontAccent}
        />
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: `1px solid ${storefrontBorder}`,
          background: storefrontSurface,
          padding: "20px 24px",
          marginTop: "auto",
          width: "100%",
          position: "relative",
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            fontSize: 11,
            color: storefrontMutedColor,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: storefrontTextColor, fontWeight: 800 }}>KRYPT.MARKET</span>
            <span>•</span>
            <span>{shop.name}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Link href={`/${slug}`} style={{ color: storefrontAccent, textDecoration: "none", fontWeight: 700 }}>
              Back to Store
            </Link>
            <Link href="/terms" style={{ color: storefrontMutedColor, textDecoration: "none" }}>
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

