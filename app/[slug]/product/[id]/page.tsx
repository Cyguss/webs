import { db } from "@/lib/db";
import { products, shops, inventoryKeys, reviews, user } from "@/lib/db/schema";
import { eq, and, count, avg, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import ProductCheckoutClient from "./checkout-client";
import { ProductGallery } from "./product-gallery";
import { ArrowLeft, Key, Package, ShieldCheck, Zap, Star, MessageSquare, Lock } from "lucide-react";

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;

  const shop = await db.query.shops.findFirst({
    where: eq(shops.slug, slug),
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
        <div style={{ minHeight: "100vh", background: "#08090c", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ maxWidth: 440, width: "100%", background: "#0f1015", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "40px 32px", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", color: "#818cf8" }}>
              <Lock size={24} />
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "#f3f4f6", marginBottom: 8 }}>Store Pending Review</h1>
            <p style={{ fontSize: 13, color: "#7e8494", lineHeight: 1.6, marginBottom: 24 }}>
              <strong>{shop.name}</strong> is currently pending platform approval. This product cannot be purchased yet.
            </p>
            <Link href="/" style={{ display: "inline-flex", padding: "9px 20px", borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#f3f4f6", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>
              Return Home
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
  const res = await db
    .select({ count: count() })
    .from(inventoryKeys)
    .where(and(eq(inventoryKeys.productId, product.id), eq(inventoryKeys.isUsed, false)));
  stock = res[0]?.count || 0;

  // Fetch product reviews
  const productReviews = await db
    .select()
    .from(reviews)
    .where(eq(reviews.productId, product.id))
    .orderBy(desc(reviews.createdAt));

  const reviewCount = productReviews.length;
  const avgRating = reviewCount > 0 ? (productReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviewCount).toFixed(1) : null;

  const bg = shop.backgroundColor || "#0f0f0f";
  const accent = shop.accentColor || "#6366f1";
  const isLight = false;

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

  return (
    <div className="page-transition" style={{ minHeight: "100vh", background: bg, color: "#fff", fontFamily: "Inter, sans-serif", position: "relative" }}>
      {/* Ambient Blurred Store Banner (Atmospheric background glow, no sharp floating box) */}
      {shop.bannerUrl ? (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 260,
            overflow: "hidden",
            pointerEvents: "none",
            zIndex: 0,
          }}
        >
          <img
            src={shop.bannerUrl}
            alt=""
            referrerPolicy="no-referrer"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "blur(32px)",
              opacity: isLight ? 0.45 : 0.35,
              transform: "scale(1.15)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, ${bg} 100%)`,
            }}
          />
        </div>
      ) : (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 220,
            background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${accent}25, transparent)`,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
      )}

      <style>{`
        @keyframes productPageFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .product-page-content {
          animation: productPageFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      <div className="product-page-content" style={{ maxWidth: 960, margin: "0 auto", padding: "24px 24px 60px", position: "relative", zIndex: 1 }}>
        {/* Navigation & Store Info Bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <Link
            href={`/${slug}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              color: "rgba(255,255,255,0.7)",
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            <ArrowLeft size={16} /> Back to <strong style={{ color: "#fff" }}>{shop.name}</strong>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {shop.logoUrl && (
              <img
                src={shop.logoUrl}
                alt=""
                referrerPolicy="no-referrer"
                style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }}
              />
            )}
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{shop.name} • Official Store</span>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.2fr",
            gap: 36,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 24,
            padding: 32,
            boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
            marginBottom: 40,
          }}
        >
          {/* Left Column: Product Info & Gallery */}
          <div>
            <ProductGallery
              images={galleryImages}
              title={product.title}
              accentColor={accent}
              isLight={isLight}
            />

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "4px 10px",
                  borderRadius: 6,
                  background: "rgba(255,255,255,0.1)",
                  color: "#fff",
                  textTransform: "uppercase",
                }}
              >
                {product.type === "key" ? "License Key" : "Digital Key"}
              </span>
              <span style={{ fontSize: 12, color: stock > 0 ? "#34d399" : "#f87171" }}>
                {stock > 0 ? `● ${stock} in vault` : "● Out of stock"}
              </span>
            </div>

            <h1 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 8px 0", color: "#fff" }}>{product.title}</h1>

            {avgRating && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
                <Star size={16} fill="#f59e0b" color="#f59e0b" />
                <span style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>{avgRating}</span>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>({reviewCount} verified reviews)</span>
              </div>
            )}

            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
              {product.description || "No description provided."}
            </p>

            <div style={{ marginTop: 24, padding: 16, borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#fff", fontWeight: 600, marginBottom: 4 }}>
                <Zap size={15} color={accent} /> Instant Digital Delivery
              </div>
              Key or delivery credentials are shown on screen and emailed to you immediately after payment.
            </div>
          </div>

          {/* Right Column: Interactive Checkout Form Client */}
          <ProductCheckoutClient product={product} shop={shop} stock={stock} accentColor={accent} />
        </div>

        {/* Product Verified Reviews Section */}
        {reviewCount > 0 && (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 28 }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 20px 0", color: "#fff", display: "flex", alignItems: "center", gap: 10 }}>
              <MessageSquare size={20} color={accent} /> Customer Reviews & Ratings ({reviewCount})
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {productReviews.map((rev: any) => (
                <div key={rev.id} style={{ padding: 16, borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", gap: 2 }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={14} fill={s <= rev.rating ? "#f59e0b" : "none"} color={s <= rev.rating ? "#f59e0b" : "rgba(255,255,255,0.2)"} />
                      ))}
                    </div>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Verified Buyer</span>
                  </div>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", margin: 0, lineHeight: 1.5 }}>
                    {rev.comment || "No comment left."}
                  </p>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 8 }}>
                    {rev.buyerEmail.replace(/(.{2})(.*)(?=@)/, "$1***")} • {new Date(rev.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
