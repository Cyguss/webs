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
} from "lucide-react";
import { StorefrontProductsCatalog } from "@/components/storefront-products-catalog";
import { StorefrontSidebarRecovery } from "@/components/storefront-sidebar-recovery";
import { ThemeToggle } from "@/components/theme-toggle";

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
      if (p.type === "key") {
        const res = await db
          .select({ count: count() })
          .from(inventoryKeys)
          .where(and(eq(inventoryKeys.productId, p.id), eq(inventoryKeys.isUsed, false as any)));
        stock = res[0]?.count || 0;
      } else {
        stock = p.isUnlimitedStock ? 9999 : p.stockLimit || 0;
      }
      return { ...p, stock };
    })
  );

  const bg = "var(--color-background)";
  const accent = "rgb(55, 44, 102)";

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

  return (
    <div
      className="page-transition"
      style={{
        minHeight: "100vh",
        background: "var(--color-background)",
        color: "var(--color-foreground)",
        fontFamily: "var(--font-mono, monospace)",
        position: "relative",
      }}
    >
      {/* ─── Platform Global Announcement Banner ─── */}
      {platformConfig.announcement_banner_active && platformConfig.announcement_banner_text && (
        <div
          style={{
            background: "rgba(55, 44, 102, 0.45)",
            borderBottom: "1px solid rgba(139, 92, 246, 0.35)",
            padding: "7px 20px",
            textAlign: "center",
            fontSize: 11,
            fontWeight: 700,
            color: "#c4b5fd",
            letterSpacing: "0.06em",
            zIndex: 101,
          }}
        >
          {platformConfig.announcement_banner_text}
        </div>
      )}

      {/* ─── Top Tactical HUD Command Bar (Black & White with rgb(55, 44, 102) accent) ─── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 90,
          background: "rgba(4, 4, 6, 0.94)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 4px 24px rgba(0, 0, 0, 0.9)",
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
                color: "#ffffff",
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 6,
                  background: "#08080c",
                  border: "1px solid rgba(139, 92, 246, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  boxShadow: "0 0 10px rgba(55, 44, 102, 0.5)",
                }}
              >
                {shop.logoUrl ? (
                  <img src={shop.logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 5 }} />
                ) : (
                  <ShoppingBag size={15} color="#c4b5fd" />
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontWeight: 900, fontSize: 13, letterSpacing: "0.04em", color: "#ffffff" }}>
                  {shop.name}
                </span>
                <span style={{ fontSize: 10, color: "rgba(255, 255, 255, 0.45)" }}>
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
                background: "linear-gradient(135deg, rgb(55, 44, 102) 0%, rgb(75, 60, 138) 100%)",
                border: "1px solid rgba(167, 139, 250, 0.4)",
                color: "#ffffff",
                textDecoration: "none",
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.04em",
                boxShadow: "0 0 14px rgba(55, 44, 102, 0.5)",
                transition: "all 0.15s ease",
              }}
            >
              <Key size={13} />
              <span>Find My Order</span>
            </Link>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Hub root link */}
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 12px",
                borderRadius: 6,
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "rgba(255, 255, 255, 0.8)",
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
        style={{
          maxWidth: 1380,
          margin: "0 auto",
          padding: "24px 20px 60px",
          display: "grid",
          gridTemplateColumns: "330px 1fr",
          gap: 24,
          alignItems: "start",
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
              background: "linear-gradient(180deg, #090812 0%, #05040a 100%)",
              border: "1px solid rgba(55, 44, 102, 0.45)",
              borderRadius: 14,
              padding: 20,
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.8)",
            }}
          >
            {/* Cyber Corner HUD Notches */}
            <div style={{ position: "absolute", top: 6, left: 6, width: 8, height: 8, borderTop: "2px solid rgba(139, 92, 246, 0.6)", borderLeft: "2px solid rgba(139, 92, 246, 0.6)" }} />
            <div style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, borderTop: "2px solid rgba(139, 92, 246, 0.6)", borderRight: "2px solid rgba(139, 92, 246, 0.6)" }} />
            <div style={{ position: "absolute", bottom: 6, left: 6, width: 8, height: 8, borderBottom: "2px solid rgba(139, 92, 246, 0.6)", borderLeft: "2px solid rgba(139, 92, 246, 0.6)" }} />
            <div style={{ position: "absolute", bottom: 6, right: 6, width: 8, height: 8, borderBottom: "2px solid rgba(139, 92, 246, 0.6)", borderRight: "2px solid rgba(139, 92, 246, 0.6)" }} />

            {/* Merchant Avatar & Main Node Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 10,
                  background: "#08080c",
                  border: "1px solid rgba(139, 92, 246, 0.45)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  fontWeight: 900,
                  color: "#ffffff",
                  flexShrink: 0,
                  boxShadow: "0 0 16px rgba(55, 44, 102, 0.5)",
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
                <h1 style={{ fontSize: 17, fontWeight: 900, color: "#ffffff", margin: 0, letterSpacing: "0.02em" }}>
                  {shop.name}
                </h1>
              </div>
            </div>

            {/* Merchant Bio / Mission Statement */}
            <p
              style={{
                fontSize: 12,
                color: "rgba(255, 255, 255, 0.7)",
                lineHeight: 1.5,
                margin: "0 0 16px 0",
              }}
            >
              {shop.description || "Automated digital license dispatch node. Instant peer-to-peer delivery."}
            </p>

            {/* 4-Cell Telemetry Matrix */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
                paddingTop: 12,
                borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              <div style={{ padding: "8px 10px", background: "rgba(255, 255, 255, 0.02)", borderRadius: 6, border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                <div style={{ fontSize: 9, color: "rgba(255, 255, 255, 0.4)", textTransform: "uppercase" }}>Delivery</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#ffffff", marginTop: 2 }}>Instant</div>
              </div>

              <div style={{ padding: "8px 10px", background: "rgba(255, 255, 255, 0.02)", borderRadius: 6, border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                <div style={{ fontSize: 9, color: "rgba(255, 255, 255, 0.4)", textTransform: "uppercase" }}>Products</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#c4b5fd", marginTop: 2 }}>{shopProducts.length} Available</div>
              </div>

              <div style={{ padding: "8px 10px", background: "rgba(255, 255, 255, 0.02)", borderRadius: 6, border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                <div style={{ fontSize: 9, color: "rgba(255, 255, 255, 0.4)", textTransform: "uppercase" }}>Security</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#ffffff", marginTop: 2 }}>Encrypted</div>
              </div>

              <div style={{ padding: "8px 10px", background: "rgba(255, 255, 255, 0.02)", borderRadius: 6, border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                <div style={{ fontSize: 9, color: "rgba(255, 255, 255, 0.4)", textTransform: "uppercase" }}>Rating</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#ffffff", marginTop: 2 }}>5.0 ★</div>
              </div>
            </div>
          </div>

          {/* Embedded Instant Key Recovery Widget */}
          <StorefrontSidebarRecovery shopSlug={shop.slug} shopName={shop.name} accentColor={accent} />

          {/* Socials & Community */}
          {(shop.discordUrl || shop.telegramUrl || shop.youtubeUrl || shop.trustpilotUrl) && (
            <div
              style={{
                background: "rgba(8, 8, 12, 0.95)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: 12,
                padding: 14,
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(255, 255, 255, 0.6)", marginBottom: 10, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Community & Links
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {shop.discordUrl && (
                  <a
                    href={shop.discordUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: "8px 12px",
                      borderRadius: 6,
                      background: "rgba(55, 44, 102, 0.2)",
                      border: "1px solid rgba(139, 92, 246, 0.3)",
                      color: "#ffffff",
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
                      <DiscordIcon size={14} color="#a78bfa" />
                      <span>Discord Server</span>
                    </div>
                    <span style={{ fontSize: 9.5, color: "#c4b5fd" }}>
                      {discordDetails?.presenceCount ? `${discordDetails.presenceCount} online` : "Join"}
                    </span>
                  </a>
                )}

                {shop.telegramUrl && (
                  <a
                    href={shop.telegramUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: "8px 12px",
                      borderRadius: 6,
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      color: "#ffffff",
                      textDecoration: "none",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <TelegramIcon size={14} color="#ffffff" />
                      <span>Telegram</span>
                    </div>
                    <ExternalLink size={11} color="rgba(255,255,255,0.4)" />
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
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      color: "#ffffff",
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
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      color: "#ffffff",
                      textDecoration: "none",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <YoutubeIcon size={14} color="#ffffff" />
                      <span>YouTube</span>
                    </div>
                    <ExternalLink size={11} color="rgba(255,255,255,0.4)" />
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
              border: "1px solid rgba(55, 44, 102, 0.45)",
              position: "relative",
              overflow: "hidden",
              background: "#08080c",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.8)",
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
                    filter: "brightness(0.65) contrast(1.15)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(180deg, rgba(3,3,5,0.2) 0%, rgba(3,3,5,0.9) 100%)",
                  }}
                />
              </>
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: "radial-gradient(circle at 80% 20%, rgba(55, 44, 102, 0.5) 0%, rgba(3,3,5,0.95) 70%)",
                }}
              />
            )}

            {/* Scanline Grid Pattern */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: "linear-gradient(rgba(0,0,0,0) 50%, rgba(0,0,0,0.5) 50%)",
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
              <div style={{ fontSize: 22, fontWeight: 900, color: "#ffffff", letterSpacing: "0.02em" }}>
                {shop.name}
              </div>
            </div>
          </div>

          {/* Product Matrix & Control Deck */}
          <StorefrontProductsCatalog
            products={productsWithStock as any}
            shopSlug={shop.slug}
            shopName={shop.name}
            accentColor={accent}
            textColor="#ffffff"
            textMuted="rgba(255, 255, 255, 0.65)"
            cardBg="#08080c"
            cardBorder="rgba(55, 44, 102, 0.4)"
            isLight={false}
            shopCategories={parsedShopCategories}
          />
        </main>
      </div>

      {/* ─── Storefront Footer ─── */}
      <footer
        style={{
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          background: "rgba(4, 4, 6, 0.98)",
          padding: "24px 20px",
          marginTop: 40,
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
            color: "rgba(255, 255, 255, 0.4)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#ffffff", fontWeight: 800 }}>KRYPT.MARKET</span>
            <span>•</span>
            <span>{shop.name}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Link href={`/${shop.slug}/lookup`} style={{ color: "#c4b5fd", textDecoration: "none" }}>
              Find My Order
            </Link>
            <Link href="/" style={{ color: "rgba(255, 255, 255, 0.6)", textDecoration: "none" }}>
              Create Store
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
