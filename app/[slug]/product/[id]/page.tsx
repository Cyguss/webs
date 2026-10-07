import { db } from "@/lib/db";
import { products, shops, inventoryKeys, reviews, user } from "@/lib/db/schema";
import { eq, and, count, desc, or } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import ProductCheckoutClient from "./checkout-client";
import { ProductGallery } from "./product-gallery";
import { ArrowLeft, Key, Package, ShieldCheck, Zap, Star, MessageSquare, Lock, Clock, Terminal, Cpu, CheckCircle2, Video } from "lucide-react";
import { parseVideoShowcaseList } from "@/lib/media";
import { StorefrontTosModal } from "@/components/storefront-tos-modal";
import { resolveStorefrontFont } from "@/lib/fonts";
import { ProductVideoShowcase } from "@/components/product-video-showcase";
import { GlobalAnnouncementBanner } from "@/components/global-announcement-banner";
import { getPlatformConfig } from "@/lib/platform-settings";

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;

  const shop = await db.query.shops.findFirst({
    where: or(eq(shops.slug, slug), eq(shops.customDomain, slug)),
  });

  if (!shop || !shop.isActive) {
    notFound();
  }

  // Access guard: unaccepted store products accessible only to owner/admin
  if (!shop.isAccepted) {
    const { headers } = await import("next/headers");
    const { auth } = await import("@/lib/auth");
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
        <div style={{ minHeight: "100vh", background: "#030407", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "var(--font-mono, monospace)" }}>
          <div style={{ maxWidth: 440, width: "100%", background: "#080a0f", border: "1px solid rgba(255,42,75,0.4)", borderRadius: 14, padding: 36, textAlign: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: 12, background: "rgba(255,42,75,0.12)", border: "1px solid rgba(255,42,75,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", color: "#ff2a4b" }}>
              <Lock size={24} />
            </div>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: "#ffffff", marginBottom: 8 }}>Store Pending Approval</h1>
            <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, marginBottom: 24 }}>
              <strong>{shop.name}</strong> is currently pending platform approval.
            </p>
            <Link href="/" className="krypt-btn-primary" style={{ display: "inline-flex", padding: "8px 20px", borderRadius: 6, textDecoration: "none", fontSize: 12 }}>
              Back to Home
            </Link>
          </div>
        </div>
      );
    }
  }

  const product = await db.query.products.findFirst({
    where: and(eq(products.id, id), eq(products.shopId, shop.id)),
  });

  if (!product || !product.isActive) {
    notFound();
  }

  let stock = 0;
  const allUnusedKeys = await db
    .select({
      id: inventoryKeys.id,
      duration: inventoryKeys.duration,
      variantId: inventoryKeys.variantId,
    })
    .from(inventoryKeys)
    .where(and(eq(inventoryKeys.productId, product.id), eq(inventoryKeys.isUsed, false)));

  stock = allUnusedKeys.length;

  const variantStocks: Record<string, number> = {};
  for (const k of allUnusedKeys) {
    if (k.variantId) {
      variantStocks[k.variantId] = (variantStocks[k.variantId] || 0) + 1;
    }
    if (k.duration) {
      variantStocks[k.duration] = (variantStocks[k.duration] || 0) + 1;
    }
  }

  // Fetch product reviews
  const productReviews = await db
    .select()
    .from(reviews)
    .where(eq(reviews.productId, product.id))
    .orderBy(desc(reviews.createdAt));

  const reviewCount = productReviews.length;
  const avgRating = reviewCount > 0 ? (productReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviewCount).toFixed(1) : null;

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

  let galleryImages: string[] = [];
  if (product.images) {
    try {
      galleryImages = JSON.parse(product.images);
    } catch {
      galleryImages = [];
    }
  }
  if (galleryImages.length === 0 && product.thumbnailUrl) {
    galleryImages = [product.thumbnailUrl];
  }

  const showcaseVideos = parseVideoShowcaseList(product.youtubeUrl);
  const fontMeta = resolveStorefrontFont(shop.fontStyle, shop.customFontUrl);
  const platformConfig = await getPlatformConfig();

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

      {/* ─── Top Command Navigation HUD ─── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 80,
          background: storefrontSurface,
          backdropFilter: "blur(16px)",
          borderBottom: `1px solid ${storefrontBorder}`,
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          padding: "12px 20px",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          {/* Breadcrumb path */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link
              href={`/${slug}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 12px",
                borderRadius: 6,
                background: storefrontSurface2,
                border: `1px solid ${storefrontBorder}`,
                color: storefrontTextColor,
                textDecoration: "none",
                fontSize: 11,
                fontWeight: 700,
                transition: "all 0.15s ease",
              }}
            >
              <ArrowLeft size={13} />
              <span>Back to Store</span>
            </Link>

            <span style={{ fontSize: 11, color: storefrontMutedColor }}>/</span>

            <span style={{ fontSize: 11, color: storefrontAccent, fontWeight: 700 }}>
              {shop.name}
            </span>

            <span style={{ fontSize: 11, color: storefrontMutedColor }}>/</span>

            <span style={{ fontSize: 11, color: storefrontMutedColor, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>
              {product.title}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Quick Keys link */}
            <Link
              href={`/${shop.slug}/lookup`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 12px",
                borderRadius: 6,
                background: `linear-gradient(135deg, ${storefrontAccent} 0%, ${storefrontAccent} 100%)`,
                border: `1px solid ${storefrontAccent}88`,
                color: "#ffffff",
                textDecoration: "none",
                fontSize: 11,
                fontWeight: 800,
                boxShadow: `0 0 12px ${storefrontAccent}50`,
              }}
            >
              <Key size={12} />
              <span>Find My Order</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div
        className="product-details-grid"
        style={{
          flex: 1,
          width: "100%",
          maxWidth: 1280,
          margin: "0 auto",
          padding: "32px 20px 60px",
        }}
      >
        {/* Left Column: Gallery, Specs, Video Showcase & Reviews */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Main Product Card */}
          <div
            style={{
              background: storefrontSurface,
              border: `1px solid ${storefrontBorder}`,
              borderRadius: 14,
              padding: 24,
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 10px 35px rgba(0, 0, 0, 0.08)",
            }}
          >
            {/* Gallery Component */}
            <ProductGallery
              images={galleryImages}
              title={product.title}
              accentColor={storefrontAccent}
              isLight={isLightBg}
            />

            {/* Metadata Tags */}
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, marginTop: 16, marginBottom: 12 }}>
              {product.category && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    padding: "3px 8px",
                    borderRadius: 4,
                    background: `${storefrontAccent}18`,
                    border: `1px solid ${storefrontAccent}35`,
                    color: storefrontAccent,
                    textTransform: "uppercase",
                  }}
                >
                  {product.category}
                </span>
              )}

              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: "3px 8px",
                  borderRadius: 4,
                  background: storefrontSurface2,
                  border: `1px solid ${storefrontBorder}`,
                  color: storefrontTextColor,
                }}
              >
                {product.type === "key" ? "Digital Key" : "Instant Delivery"}
              </span>

              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: "3px 8px",
                  borderRadius: 4,
                  background: stock > 0 ? `${storefrontAccent}20` : "rgba(239, 68, 68, 0.1)",
                  border: stock > 0 ? `1px solid ${storefrontAccent}45` : "1px solid rgba(239, 68, 68, 0.3)",
                  color: stock > 0 ? storefrontAccent : "#ef4444",
                }}
              >
                {product.isUnlimitedStock ? "● Instant Delivery" : stock > 0 ? `● ${stock} in Stock` : "● Out of Stock"}
              </span>
            </div>

            <h1 style={{ fontSize: 24, fontWeight: 900, color: storefrontTextColor, margin: "0 0 12px 0", letterSpacing: "-0.01em" }}>
              {product.title}
            </h1>

            {avgRating && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <div style={{ display: "flex", gap: 2 }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={13} fill="#f59e0b" color="#f59e0b" />
                  ))}
                </div>
                <span style={{ fontWeight: 800, color: storefrontTextColor, fontSize: 13 }}>{avgRating}</span>
                <span style={{ color: storefrontMutedColor, fontSize: 11 }}>({reviewCount} verified reviews)</span>
              </div>
            )}

            {/* Description */}
            <div
              style={{
                marginTop: 14,
                padding: 16,
                borderRadius: 8,
                background: storefrontSurface2,
                border: `1px solid ${storefrontBorder}`,
                fontSize: 12.5,
                color: storefrontTextColor,
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
              }}
            >
              {product.description || "No description provided for this product."}
            </div>
          </div>

          {/* Product Video Showcase (Supports 1-5 YouTube & Streamable videos) */}
          {showcaseVideos.length > 0 && (
            <ProductVideoShowcase
              videos={showcaseVideos}
              productTitle={product.title}
            />
          )}

          {/* Customer Reviews */}
          {reviewCount > 0 && (
            <div
              style={{
                background: storefrontSurface,
                border: `1px solid ${storefrontBorder}`,
                borderRadius: 14,
                padding: 20,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 800, color: storefrontTextColor, marginBottom: 14, letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 6 }}>
                <MessageSquare size={14} color={storefrontAccent} />
                <span>Customer Reviews ({reviewCount})</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {productReviews.map((rev: any) => (
                  <div
                    key={rev.id}
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      background: storefrontSurface2,
                      border: `1px solid ${storefrontBorder}`,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <div style={{ display: "flex", gap: 2 }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={11} fill={s <= rev.rating ? "#f59e0b" : "none"} color={s <= rev.rating ? "#f59e0b" : "rgba(255,255,255,0.2)"} />
                        ))}
                      </div>
                      <span style={{ fontSize: 10, color: storefrontAccent, fontWeight: 700 }}>Verified Buyer</span>
                    </div>
                    <p style={{ fontSize: 12, color: storefrontTextColor, margin: 0, lineHeight: 1.4 }}>
                      {rev.comment || "No written review."}
                    </p>
                    <div style={{ fontSize: 10, color: storefrontMutedColor, marginTop: 6 }}>
                      {rev.buyerEmail.replace(/(.{2})(.*)(?=@)/, "$1***")} • {new Date(rev.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Merchant Support & TOS Box */}
          <div
            style={{
              background: storefrontSurface,
              border: `1px solid ${storefrontBorder}`,
              borderRadius: 14,
              padding: 18,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: storefrontTextColor }}>
                Guaranteed by {shop.name}
              </div>
            </div>

            <StorefrontTosModal
              shopName={shop.name}
              termsOfService={shop.termsOfService}
              supportEmail={shop.supportEmail}
              contactInfo={shop.contactInfo}
              discordUrl={shop.discordUrl}
              telegramUrl={shop.telegramUrl}
              accentColor={storefrontAccent}
            />
          </div>
        </div>

        {/* ─── RIGHT COCKPIT: Purchase Authorization Deck (Sticky) ─── */}
        <div style={{ position: "sticky", top: 72 }}>
          <ProductCheckoutClient
            product={product}
            shop={shop}
            stock={stock}
            variantStocks={variantStocks}
            accentColor={storefrontAccent}
            isMaintenanceMode={platformConfig.maintenance_mode}
            maintenanceMessage={platformConfig.maintenance_message}
          />
        </div>
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
            maxWidth: 1280,
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
            <Link href={`/${slug}/lookup`} style={{ color: storefrontAccent, textDecoration: "none", fontWeight: 700 }}>
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
