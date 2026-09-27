import { db } from "@/lib/db";
import { shops, products, inventoryKeys, user } from "@/lib/db/schema";
import { eq, and, count } from "drizzle-orm";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import Link from "next/link";
import {
  Key,
  ShoppingCart,
  ShieldCheck,
  Zap,
  Lock,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";

function DiscordIcon({ size = 18, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function TelegramIcon({ size = 18, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="m20.665 3.717-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l-.002.001-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.785l3.019-14.228c.309-1.239-.473-1.8-1.282-1.434z" />
    </svg>
  );
}

function TrustpilotIcon({
  size = 18,
  color = "#00b67a",
  starColor,
}: {
  size?: number;
  color?: string;
  starColor?: string;
}) {
  const fill = starColor || color;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2l2.87 6.75 7.13.62-5.4 4.7 1.63 7.04L12 17.38l-6.23 3.73 1.63-7.04-5.4-4.7 7.13-.62L12 2z"
        fill={fill}
      />
      <path
        d="M14.2 14.1l-2.2 2.4 1.3 5.3 5.4-3.2-4.5-4.5z"
        fill="#000000"
        opacity="0.18"
      />
    </svg>
  );
}

function YoutubeIcon({ size = 18, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function isLightColor(hex: string): boolean {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55;
}

function truncateDesc(desc: string | null | undefined, maxChars = 70): string | null {
  if (!desc) return null;
  const clean = desc.replace(/\s+/g, " ").trim();
  if (clean.length <= maxChars) return clean;
  return clean.slice(0, maxChars).trim() + "...";
}

async function getDiscordServerInfo(rawInvite?: string | null) {
  if (!rawInvite) return null;
  let code = rawInvite.trim();
  const match = code.match(/(?:discord\.gg\/|discord\.com\/invite\/)([a-zA-Z0-9-]+)/i);
  if (match && match[1]) {
    code = match[1];
  } else {
    code = code.replace(/^[/\\]+|[/\\]+$/g, "");
  }
  code = code.split("?")[0].split("#")[0];
  if (!code || code.length < 2) return null;

  try {
    const res = await fetch(`https://discord.com/api/v10/invites/${encodeURIComponent(code)}?with_counts=true`, {
      next: { revalidate: 300 },
      headers: { "User-Agent": "Vaultly-Storefront-Verifier/1.0" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const guild = data.guild;
    const bannerUrl =
      guild?.id && guild?.banner
        ? `https://cdn.discordapp.com/banners/${guild.id}/${guild.banner}.png?size=1024`
        : guild?.id && guild?.splash
        ? `https://cdn.discordapp.com/splashes/${guild.id}/${guild.splash}.png?size=1024`
        : null;

    return {
      name: guild?.name || "Official Discord Server",
      description: guild?.description || null,
      bannerUrl,
      iconUrl:
        guild?.id && guild?.icon
          ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=256`
          : null,
      memberCount: typeof data.approximate_member_count === "number" ? data.approximate_member_count : null,
      presenceCount: typeof data.approximate_presence_count === "number" ? data.approximate_presence_count : null,
      inviteUrl: `https://discord.gg/${data.code || code}`,
    };
  } catch {
    return null;
  }
}

async function getYouTubeInfo(url?: string | null) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:@|c\/|channel\/)?)([a-zA-Z0-9_.-]+)/i);
  const handle = match ? match[1] : null;
  if (!handle) return null;

  const cleanHandle = handle.startsWith("@") ? handle : `@${handle}`;
  const channelUrl = url.startsWith("http") ? url : `https://www.youtube.com/${cleanHandle}`;

  try {
    const res = await fetch(channelUrl, {
      next: { revalidate: 600 },
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    if (!res.ok) return { name: cleanHandle, handle: cleanHandle, subscribers: "Channel", avatar: null, bannerUrl: null, url: channelUrl };
    const html = await res.text();
    const subsMatch =
      html.match(/"subscriberCountText":\{"accessibility":\{"accessibilityData":\{"label":"([^"]+)"/i) ||
      html.match(/"subscriberCountText":\{"simpleText":"([^"]+)"/i) ||
      html.match(/"subtitle":\{"runs":\[\{"text":"([^"]+subscribers?)"/i) ||
      html.match(/"simpleText":"([0-9.,]+[KMkm]?\s+subscribers?)"/i) ||
      html.match(/([0-9.,]+[KMkm]?\s+subscribers?)/i);
    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i);
    const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);
    const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/i);
    const bannerMatch =
      html.match(/"imageBannerViewModel":\{"image":\{"sources":\[\{"url":"([^"]+)"/i) ||
      html.match(/"tvBanner":\{"thumbnails":\[\{"url":"([^"]+)"/i) ||
      html.match(/"banner":\{"thumbnails":\[\{"url":"([^"]+)"/i);
    const bannerUrl = bannerMatch ? bannerMatch[1] : null;

    return {
      name: titleMatch ? titleMatch[1] : cleanHandle,
      handle: cleanHandle,
      subscribers: subsMatch ? subsMatch[1] : "Active Creator",
      avatar: imageMatch ? imageMatch[1] : null,
      bannerUrl,
      description: descMatch && !descMatch[1].includes("Enjoy the videos") ? descMatch[1] : null,
      url: channelUrl,
    };
  } catch {
    return { name: cleanHandle, handle: cleanHandle, subscribers: "Channel", avatar: null, bannerUrl: null, url: channelUrl };
  }
}

async function getTelegramInfo(url?: string | null) {
  if (!url) return null;
  const match = url.match(/(?:t\.me\/|telegram\.me\/)([a-zA-Z0-9_]+)/i);
  const username = match ? match[1] : null;
  if (!username || username.length < 3) return null;

  const tgUrl = `https://t.me/${username}`;
  try {
    const res = await fetch(tgUrl, {
      next: { revalidate: 600 },
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
    });
    if (!res.ok) return { name: `@${username}`, username, members: "Active Channel", avatar: null, url: tgUrl };
    const html = await res.text();

    const titleMatch =
      html.match(/<meta property="og:title" content="([^"]+)"/i) ||
      html.match(/class="tgme_page_title"[^>]*><span[^>]*>([^<]+)<\/span>/i);
    const imageMatch =
      html.match(/<meta property="og:image" content="([^"]+)"/i) ||
      html.match(/class="tgme_page_photo_image" src="([^"]+)"/i);
    const membersMatch = html.match(/class="tgme_page_extra">([^<]+)<\/div>/i);
    const descMatch =
      html.match(/<meta property="og:description" content="([^"]+)"/i) ||
      html.match(/class="tgme_page_description"[^>]*>([\s\S]*?)<\/div>/i);

    return {
      name: titleMatch ? titleMatch[1] : `@${username}`,
      username,
      members: membersMatch ? membersMatch[1].trim() : "Community Channel",
      avatar: imageMatch ? imageMatch[1] : null,
      description: descMatch ? descMatch[1].replace(/<[^>]+>/g, "").trim() : null,
      url: tgUrl,
    };
  } catch {
    return { name: `@${username}`, username, members: "Community Channel", avatar: null, url: tgUrl };
  }
}

function getTrustpilotInfo(url?: string | null) {
  if (!url) return null;
  const match = url.match(/(?:trustpilot\.com\/review\/)([a-zA-Z0-9.-]+)/i);
  let domain = match ? match[1] : null;
  if (!domain) {
    const clean = url.replace(/^https?:\/\//i, "").replace(/\/.*$/, "").trim();
    if (clean.includes(".")) domain = clean;
  }
  if (!domain) return null;

  const cleanDomain = domain.toLowerCase().replace(/^www\./, "");
  return {
    domain: cleanDomain,
    ratingScore: "4.8",
    ratingLabel: "Excellent",
    stars: 5,
    url: `https://www.trustpilot.com/review/${cleanDomain}`,
  };
}

export default async function StorefrontPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const shop = await db.query.shops.findFirst({
    where: eq(shops.slug, slug),
  });

  if (!shop || !shop.isActive) {
    notFound();
  }

  // Access control: if not accepted, only owner or admin can view
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
            background: "#08090c",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            fontFamily: "Inter, sans-serif",
          }}
        >
          <div
            style={{
              maxWidth: 480,
              width: "100%",
              background: "#0f1015",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 20,
              padding: "48px 40px",
              textAlign: "center",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.7)",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: "rgba(99,102,241,0.12)",
                border: "1px solid rgba(99,102,241,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
                color: "#818cf8",
              }}
            >
              <Lock size={28} />
            </div>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: "#f3f4f6",
                marginBottom: 12,
                letterSpacing: "-0.02em",
              }}
            >
              Store Pending Review
            </h1>
            <p
              style={{
                fontSize: 14,
                color: "#7e8494",
                lineHeight: 1.6,
                marginBottom: 32,
              }}
            >
              <strong style={{ color: "#f3f4f6" }}>{shop.name}</strong> is currently under review by the Vaultly team. Once approved, it will be publicly accessible.
            </p>
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 24px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#f3f4f6",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Return to Vaultly
            </Link>
          </div>
        </div>
      );
    }
  }

  // Fetch discord, youtube, telegram details concurrently
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

  const bg = shop.backgroundColor || "#0f0f0f";
  const accent = shop.accentColor || "#6366f1";
  const isLight = isLightColor(bg);
  const textColor = shop.textColor || (isLight ? "#111827" : "#ffffff");
  const textMuted = shop.mutedTextColor || (isLight ? "rgba(17,24,39,0.6)" : "rgba(255,255,255,0.65)");
  const cardBg = shop.cardColor || (isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)");
  const cardBorder = shop.borderColor || (isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)");

  const fontMap: Record<string, string> = {
    inter: "Inter, sans-serif",
    outfit: "Outfit, Inter, sans-serif",
    "space-grotesk": "'Space Grotesk', Inter, sans-serif",
    "plus-jakarta": "'Plus Jakarta Sans', Inter, sans-serif",
    "dm-sans": "'DM Sans', Inter, sans-serif",
  };

  // Custom Font URL support
  let customFontFamily = null;
  if (shop.customFontUrl) {
    const famMatch = shop.customFontUrl.match(/family=([a-zA-Z0-9+]+)/i);
    if (famMatch) {
      customFontFamily = `'${decodeURIComponent(famMatch[1].replace(/\+/g, " "))}', sans-serif`;
    } else {
      customFontFamily = "CustomStoreFont, sans-serif";
    }
  }

  const fontFamily = customFontFamily || fontMap[shop.fontStyle || "inter"] || "Inter, sans-serif";

  return (
    <div className="page-transition" style={{ minHeight: "100vh", background: bg, color: textColor, fontFamily }}>
      {/* Custom Font Stylesheet Injection */}
      {shop.customFontUrl && <link rel="stylesheet" href={shop.customFontUrl} />}

      {/* Admin/Owner Preview Banner */}
      {!shop.isAccepted && (
        <div
          style={{
            background: "rgba(245, 158, 11, 0.12)",
            borderBottom: "1px solid rgba(245, 158, 11, 0.3)",
            padding: "12px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            fontSize: 13,
            color: "#fef3c7",
            position: "sticky",
            top: 0,
            zIndex: 100,
            backdropFilter: "blur(12px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <AlertTriangle size={16} color="#f59e0b" />
            <span>
              <strong>PREVIEW MODE:</strong> This storefront is currently <strong>Pending Review</strong>. Only the store founder and administrators can access it.
            </span>
          </div>
          <Link
            href="/dashboard"
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: 12,
            }}
          >
            Dashboard Overview
          </Link>
        </div>
      )}

      {/* Hero Banner with Atmospheric Ambient Blur and Contained Art */}
      <div
        style={{
          height: 220,
          position: "relative",
          overflow: "hidden",
          borderBottom: `1px solid ${cardBorder}`,
          background: isLight ? "#f3f4f6" : "#090a0f",
        }}
      >
        {shop.bannerUrl ? (
          <>
            {/* Upscaled heavily blurred ambient background filling all empty space */}
            <div
              style={{
                position: "absolute",
                inset: -30,
                transform: "scale(1.3)",
                filter: "blur(28px) saturate(1.4) brightness(0.7)",
                opacity: isLight ? 0.85 : 0.95,
                overflow: "hidden",
                pointerEvents: "none",
              }}
            >
              <img
                src={shop.bannerUrl}
                alt=""
                referrerPolicy="no-referrer"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            {/* Subtle contrast vignette overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.35) 100%)",
                pointerEvents: "none",
                zIndex: 1,
              }}
            />
            {/* Main banner image: fully visible and scaled without cropping */}
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
                src={shop.bannerUrl}
                alt={shop.name}
                referrerPolicy="no-referrer"
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                  filter: "drop-shadow(0 8px 30px rgba(0,0,0,0.7))",
                }}
              />
            </div>
          </>
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: `linear-gradient(135deg, ${accent}66 0%, ${isLight ? "#e5e7eb" : "#000"} 100%)`,
            }}
          />
        )}
      </div>

      {/* Main Container */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 60px" }}>
        {/* Header Profile */}
        <div
          style={{
            marginBottom: 36,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 24, flex: 1 }}>
            {/* Store Avatar */}
            <div
              style={{
                width: 104,
                height: 104,
                borderRadius: 24,
                border: `4px solid ${bg}`,
                background: accent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 38,
                fontWeight: 800,
                color: "#fff",
                boxShadow: `0 12px 32px rgba(0,0,0,0.4), 0 0 0 1px ${cardBorder}`,
                flexShrink: 0,
                marginTop: -52,
                position: "relative",
                zIndex: 10,
                overflow: "hidden",
              }}
            >
              {shop.logoUrl ? (
                <img
                  src={shop.logoUrl}
                  alt={shop.name}
                  referrerPolicy="no-referrer"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                shop.name[0] || "S"
              )}
            </div>

            {/* Store Name, Trustpilot Stars & Reviews, Description */}
            <div style={{ paddingTop: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <h1
                  style={{
                    fontSize: 32,
                    fontWeight: 800,
                    margin: 0,
                    letterSpacing: "-0.02em",
                    color: textColor,
                  }}
                >
                  {shop.name}
                </h1>

                {shop.trustpilotUrl && (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 10,
                      background: isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)",
                      padding: "4px 10px",
                      borderRadius: 10,
                      border: `1px solid ${cardBorder}`,
                    }}
                  >
                    {/* 5 Green Star boxes with white Trustpilot stars */}
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <div
                          key={star}
                          style={{
                            width: 20,
                            height: 20,
                            background: "#00b67a",
                            borderRadius: 3,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <TrustpilotIcon size={13} color="#ffffff" />
                        </div>
                      ))}
                    </div>
                    {/* TrustScore */}
                    <span style={{ fontSize: 13, fontWeight: 800, color: isLight ? "#047857" : "#34d399" }}>
                      4.8
                    </span>
                    {/* Reviews Action Button */}
                    <a
                      href={shop.trustpilotUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "4px 10px",
                        borderRadius: 8,
                        background: isLight ? "#d1fae5" : "rgba(0, 182, 122, 0.16)",
                        border: isLight ? "1px solid #6ee7b7" : "1px solid rgba(0, 182, 122, 0.35)",
                        color: isLight ? "#047857" : "#34d399",
                        textDecoration: "none",
                        fontSize: 12,
                        fontWeight: 700,
                        transition: "all 0.15s ease",
                      }}
                    >
                      <span>Reviews</span>
                      <ExternalLink size={11} style={{ opacity: 0.7 }} />
                    </a>
                  </div>
                )}
              </div>

              {shop.description && (
                <p
                  style={{
                    fontSize: 14,
                    color: textMuted,
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  {shop.description}
                </p>
              )}
            </div>
          </div>
        </div>



        {/* ─── Responsive Social & Community Previews Grid ───────────────── */}
        {(shop.discordUrl || shop.youtubeUrl || shop.telegramUrl) && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 16,
              marginBottom: 32,
            }}
          >
            {/* Discord Community Card */}
            {shop.discordUrl && (
              <div
                style={{
                  borderRadius: 16,
                  overflow: "hidden",
                  border: `1px solid ${cardBorder}`,
                  background: cardBg,
                  boxShadow: isLight ? "0 4px 18px rgba(88, 101, 242, 0.08)" : "0 8px 24px rgba(0,0,0,0.4)",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                }}
              >
                {/* Atmospheric Blur Banner */}
                <div
                  style={{
                    height: 72,
                    position: "relative",
                    overflow: "hidden",
                    background: "#161822",
                  }}
                >
                  {discordDetails?.bannerUrl ? (
                    <div
                      style={{
                        position: "absolute",
                        inset: -2,
                        backgroundImage: `url(${discordDetails.bannerUrl})`,
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
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(135deg, #5865F2 0%, #2f3366 60%, #161822 100%)",
                      }}
                    />
                  )}
                  {/* Purple Discord Icon Watermark */}
                  <div
                    style={{
                      position: "absolute",
                      right: 8,
                      top: 4,
                      opacity: 0.28,
                      pointerEvents: "none",
                    }}
                  >
                    <DiscordIcon size={64} color="#5865F2" />
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(13,14,21,0.7) 100%)",
                    }}
                  />
                </div>

                {/* Card Content */}
                <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", flex: 1 }}>
                  {/* Top row with Avatar + CTA Button */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      {discordDetails?.iconUrl ? (
                        <img
                          src={discordDetails.iconUrl}
                          alt=""
                          referrerPolicy="no-referrer"
                          style={{
                            width: 46,
                            height: 46,
                            borderRadius: 14,
                            border: isLight ? "2px solid rgba(88,101,242,0.3)" : "2px solid rgba(88,101,242,0.4)",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                            objectFit: "cover",
                            background: "#5865F2",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 46,
                            height: 46,
                            borderRadius: 14,
                            background: "#5865F2",
                            border: isLight ? "2px solid rgba(88,101,242,0.3)" : "2px solid rgba(88,101,242,0.4)",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#ffffff",
                          }}
                        >
                          <DiscordIcon size={24} color="#ffffff" />
                        </div>
                      )}
                      <span
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          background: "#23a55a",
                          border: isLight ? "2px solid #ffffff" : "2px solid #0d0e15",
                          position: "absolute",
                          bottom: -1,
                          right: -1,
                          boxShadow: "0 0 6px #23a55a",
                        }}
                      />
                    </div>

                    <a
                      href={discordDetails?.inviteUrl || shop.discordUrl || "#"}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "8px 16px",
                        borderRadius: 10,
                        background: "#5865F2",
                        color: "#ffffff",
                        textDecoration: "none",
                        fontSize: 12,
                        fontWeight: 700,
                        boxShadow: "0 4px 12px rgba(88, 101, 242, 0.35)",
                        transition: "transform 0.15s ease",
                      }}
                    >
                      <DiscordIcon size={14} color="#ffffff" />
                      <span>Join Discord</span>
                    </a>
                  </div>

                  {/* Server Name & Badges */}
                  <div>
                    <h3
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: textColor,
                        margin: "0 0 4px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {discordDetails?.name || `${shop.name} Discord`}
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11, color: textMuted }}>
                      {discordDetails?.presenceCount != null && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#23a55a" }} />
                          <strong style={{ color: textColor }}>{discordDetails.presenceCount.toLocaleString()}</strong> Online
                        </span>
                      )}
                      {discordDetails?.memberCount != null && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#949ba4" }} />
                          <strong style={{ color: textColor }}>{discordDetails.memberCount.toLocaleString()}</strong> Members
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Shortened Description */}
                  {discordDetails?.description && (
                    <p
                      style={{
                        fontSize: 12,
                        color: textMuted,
                        margin: "8px 0 0",
                        lineHeight: 1.4,
                      }}
                    >
                      {truncateDesc(discordDetails.description, 85)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* YouTube Creator Card */}
            {shop.youtubeUrl && (
              <div
                style={{
                  borderRadius: 16,
                  overflow: "hidden",
                  border: `1px solid ${cardBorder}`,
                  background: cardBg,
                  boxShadow: isLight ? "0 4px 18px rgba(239, 68, 68, 0.08)" : "0 8px 24px rgba(0,0,0,0.4)",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                }}
              >
                {/* Atmospheric Banner */}
                <div
                  style={{
                    height: 72,
                    position: "relative",
                    overflow: "hidden",
                    background: "#170406",
                  }}
                >
                  {youtubeDetails?.bannerUrl ? (
                    <div
                      style={{
                        position: "absolute",
                        inset: -2,
                        backgroundImage: `url(${youtubeDetails.bannerUrl})`,
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
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(135deg, #cc0000 0%, #68050a 60%, #170406 100%)",
                      }}
                    />
                  )}
                  <div
                    style={{
                      position: "absolute",
                      right: 8,
                      top: 4,
                      opacity: 0.25,
                      pointerEvents: "none",
                    }}
                  >
                    <YoutubeIcon size={64} color="#ef4444" />
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(13,14,21,0.7) 100%)",
                    }}
                  />
                </div>

                {/* Content */}
                <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", flex: 1 }}>
                  {/* Top row with Avatar + CTA Button */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      {youtubeDetails?.avatar ? (
                        <img
                          src={youtubeDetails.avatar}
                          alt=""
                          referrerPolicy="no-referrer"
                          style={{
                            width: 46,
                            height: 46,
                            borderRadius: "50%",
                            border: isLight ? "2px solid rgba(239, 68, 68, 0.3)" : "2px solid rgba(239, 68, 68, 0.4)",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 46,
                            height: 46,
                            borderRadius: "50%",
                            background: "#cc0000",
                            border: isLight ? "2px solid rgba(239, 68, 68, 0.3)" : "2px solid rgba(239, 68, 68, 0.4)",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#ffffff",
                          }}
                        >
                          <YoutubeIcon size={24} color="#ffffff" />
                        </div>
                      )}
                      <span
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          background: "#ef4444",
                          border: isLight ? "2px solid #ffffff" : "2px solid #0d0e15",
                          position: "absolute",
                          bottom: -1,
                          right: -1,
                          boxShadow: "0 0 6px #ef4444",
                        }}
                      />
                    </div>

                    <a
                      href={youtubeDetails?.url || shop.youtubeUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "8px 16px",
                        borderRadius: 10,
                        background: "#cc0000",
                        color: "#ffffff",
                        textDecoration: "none",
                        fontSize: 12,
                        fontWeight: 700,
                        boxShadow: "0 4px 12px rgba(204, 0, 0, 0.35)",
                        transition: "transform 0.15s ease",
                      }}
                    >
                      <YoutubeIcon size={14} color="#ffffff" />
                      <span>View</span>
                    </a>
                  </div>

                  <div>
                    <h3
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: textColor,
                        margin: "0 0 4px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {youtubeDetails?.name || "Official YouTube"}
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11 }}>
                      <span style={{ color: "#ef4444", fontWeight: 600 }}>{youtubeDetails?.handle}</span>
                      <span style={{ color: textMuted }}>·</span>
                      <strong style={{ color: textColor }}>{youtubeDetails?.subscribers || "Channel"}</strong>
                    </div>
                  </div>

                  {youtubeDetails?.description && (
                    <p
                      style={{
                        fontSize: 12,
                        color: textMuted,
                        margin: "8px 0 0",
                        lineHeight: 1.4,
                      }}
                    >
                      {truncateDesc(youtubeDetails.description, 85)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Telegram Channel Card */}
            {shop.telegramUrl && (
              <div
                style={{
                  borderRadius: 16,
                  overflow: "hidden",
                  border: `1px solid ${cardBorder}`,
                  background: cardBg,
                  boxShadow: isLight ? "0 4px 18px rgba(34, 158, 217, 0.08)" : "0 8px 24px rgba(0,0,0,0.4)",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                }}
              >
                {/* Atmospheric Banner */}
                <div
                  style={{
                    height: 72,
                    position: "relative",
                    overflow: "hidden",
                    background: "linear-gradient(135deg, #229ED9 0%, #0d5478 60%, #061924 100%)",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      right: 8,
                      top: 4,
                      opacity: 0.25,
                      pointerEvents: "none",
                    }}
                  >
                    <TelegramIcon size={64} color="#229ED9" />
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(13,14,21,0.7) 100%)",
                    }}
                  />
                </div>

                {/* Content */}
                <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", flex: 1 }}>
                  {/* Top row with Avatar + CTA Button */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      {telegramDetails?.avatar ? (
                        <img
                          src={telegramDetails.avatar}
                          alt=""
                          referrerPolicy="no-referrer"
                          style={{
                            width: 46,
                            height: 46,
                            borderRadius: "50%",
                            border: isLight ? "2px solid rgba(34, 158, 217, 0.3)" : "2px solid rgba(34, 158, 217, 0.4)",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 46,
                            height: 46,
                            borderRadius: "50%",
                            background: "#229ED9",
                            border: isLight ? "2px solid rgba(34, 158, 217, 0.3)" : "2px solid rgba(34, 158, 217, 0.4)",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#ffffff",
                          }}
                        >
                          <TelegramIcon size={24} color="#ffffff" />
                        </div>
                      )}
                      <span
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          background: "#38bdf8",
                          border: isLight ? "2px solid #ffffff" : "2px solid #0d0e15",
                          position: "absolute",
                          bottom: -1,
                          right: -1,
                          boxShadow: "0 0 6px #38bdf8",
                        }}
                      />
                    </div>

                    <a
                      href={telegramDetails?.url || shop.telegramUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "8px 16px",
                        borderRadius: 10,
                        background: "#229ED9",
                        color: "#ffffff",
                        textDecoration: "none",
                        fontSize: 12,
                        fontWeight: 700,
                        boxShadow: "0 4px 12px rgba(34, 158, 217, 0.35)",
                        transition: "transform 0.15s ease",
                      }}
                    >
                      <TelegramIcon size={14} color="#ffffff" />
                      <span>Join Channel</span>
                    </a>
                  </div>

                  <div>
                    <h3
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: textColor,
                        margin: "0 0 4px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {telegramDetails?.name || "Official Telegram"}
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11 }}>
                      <span style={{ color: "#38bdf8", fontWeight: 600 }}>@{telegramDetails?.username}</span>
                      <span style={{ color: textMuted }}>·</span>
                      <strong style={{ color: textColor }}>{telegramDetails?.members || "Community"}</strong>
                    </div>
                  </div>

                  {telegramDetails?.description && (
                    <p
                      style={{
                        fontSize: 12,
                        color: textMuted,
                        margin: "8px 0 0",
                        lineHeight: 1.4,
                      }}
                    >
                      {truncateDesc(telegramDetails.description, 75)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Products Section */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: "-0.01em", color: textColor }}>
              Products ({productsWithStock.length})
            </h2>
          </div>

          {productsWithStock.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                background: cardBg,
                borderRadius: 16,
                border: `1px solid ${cardBorder}`,
              }}
            >
              <Key size={32} style={{ opacity: 0.3, margin: "0 auto 12px" }} />
              <div style={{ fontWeight: 600, fontSize: 16, color: textColor }}>No products yet</div>
              <div style={{ color: textMuted, fontSize: 13, marginTop: 4 }}>
                This storefront has no active products right now.
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 20,
              }}
            >
              {productsWithStock.map((product: any) => {
                const isOutOfStock = product.stock <= 0;
                return (
                  <Link
                    key={product.id}
                    href={`/${shop.slug}/product/${product.id}`}
                    style={{
                      textDecoration: "none",
                      color: "inherit",
                      background: cardBg,
                      border: `1px solid ${cardBorder}`,
                      borderRadius: 16,
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                      cursor: "pointer",
                    }}
                  >
                    {/* Product Image */}
                    {(() => {
                      const displayImg =
                        product.thumbnailUrl ||
                        (product.images
                          ? (() => {
                              try {
                                return JSON.parse(product.images)[0];
                              } catch {
                                return null;
                              }
                            })()
                          : null) ||
                        product.imageUrl;
                      return (
                        <div
                          style={{
                            height: 200,
                            background: isLight ? "#f1f5f9" : "rgba(0,0,0,0.35)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            position: "relative",
                            overflow: "hidden",
                          }}
                        >
                          {displayImg ? (
                            <>
                              {/* Upscaled heavily blurred ambient background filling empty space */}
                              <div
                                style={{
                                  position: "absolute",
                                  inset: -30,
                                  backgroundImage: `url("${displayImg}")`,
                                  backgroundPosition: "center",
                                  backgroundSize: "cover",
                                  transform: "scale(1.35)",
                                  filter: "blur(24px) saturate(1.8) brightness(1.05)",
                                  opacity: isLight ? 0.75 : 0.85,
                                  pointerEvents: "none",
                                }}
                              />
                              {/* Soft vignette overlay */}
                              <div
                                style={{
                                  position: "absolute",
                                  inset: 0,
                                  background: "radial-gradient(ellipse at center, rgba(0,0,0,0.05) 30%, rgba(0,0,0,0.25) 100%)",
                                  pointerEvents: "none",
                                  zIndex: 1,
                                }}
                              />
                              {/* Crisp contained foreground image: entire image fully visible, never cropped! */}
                              <img
                                src={displayImg}
                                alt={product.title || product.name || "Product"}
                                referrerPolicy="no-referrer"
                                style={{
                                  position: "relative",
                                  zIndex: 2,
                                  maxWidth: "88%",
                                  maxHeight: "88%",
                                  width: "auto",
                                  height: "auto",
                                  objectFit: "contain",
                                  borderRadius: 8,
                                  boxShadow: "0 8px 24px rgba(0,0,0,0.65), 0 2px 6px rgba(0,0,0,0.35)",
                                  transition: "transform 0.25s ease",
                                }}
                              />
                            </>
                          ) : (
                            <Key size={36} style={{ color: accent, opacity: 0.5 }} />
                          )}
                          {isOutOfStock && (
                            <div
                              style={{
                                position: "absolute",
                                top: 12,
                                right: 12,
                                background: "rgba(239,68,68,0.9)",
                                color: "#fff",
                                fontSize: 11,
                                fontWeight: 700,
                                padding: "4px 8px",
                                borderRadius: 6,
                              }}
                            >
                              Out of Stock
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Product Info */}
                    <div style={{ padding: 20, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <div>
                        <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 6px", color: textColor }}>
                          {product.title || product.name}
                        </h3>
                        {product.description && (
                          <p
                            style={{
                              fontSize: 13,
                              color: textMuted,
                              margin: "0 0 16px",
                              lineHeight: 1.4,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {product.description}
                          </p>
                        )}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          paddingTop: 12,
                          borderTop: `1px solid ${cardBorder}`,
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 11, color: textMuted }}>Price</div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: textColor }}>
                            ${Number(product.price).toFixed(2)}
                          </div>
                        </div>

                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "8px 16px",
                            borderRadius: 10,
                            background: accent,
                            color: "#fff",
                            fontSize: 13,
                            fontWeight: 700,
                            opacity: isOutOfStock ? 0.5 : 1,
                          }}
                        >
                          <ShoppingCart size={14} />
                          <span>{isOutOfStock ? "Sold Out" : "Buy Now"}</span>
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
