import { db } from "@/lib/db";
import { shops } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { OrderLookupForm } from "@/components/order-lookup-form";
import { ArrowLeft, Key, Terminal } from "lucide-react";

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

  const accentColor = shop.accentColor || "rgb(55, 44, 102)";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: shop.backgroundColor || "#030305",
        color: shop.textColor || "#ffffff",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
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
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "14px 24px",
          background: "rgba(8, 8, 12, 0.95)",
          backdropFilter: "blur(12px)",
          position: "relative",
          zIndex: 10,
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link
            href={`/${shop.slug}`}
            style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit", fontWeight: 800, fontSize: 16, fontFamily: "var(--font-mono, monospace)" }}
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
                  background: "linear-gradient(135deg, rgb(55, 44, 102) 0%, rgb(78, 62, 140) 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  fontWeight: 900,
                  border: "1px solid rgba(167, 139, 250, 0.4)",
                }}
              >
                {shop.name[0] || "S"}
              </div>
            )}
            <span>{shop.name}</span>
          </Link>

          <Link
            href={`/${shop.slug}`}
            style={{
              fontSize: 12,
              fontFamily: "var(--font-mono, monospace)",
              color: "rgba(255, 255, 255, 0.7)",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 6,
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <ArrowLeft size={13} />
            <span>[BACK_TO_STORE]</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px", position: "relative", zIndex: 10 }}>
        <OrderLookupForm
          shopSlug={shop.slug}
          shopName={shop.name}
          accentColor={accentColor}
        />
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(255, 255, 255, 0.06)", padding: "18px 24px", textAlign: "center", fontSize: 11, fontFamily: "var(--font-mono, monospace)", color: "rgba(255, 255, 255, 0.4)", position: "relative", zIndex: 10 }}>
        &copy; {new Date().getFullYear()} {shop.name} // POWERED_BY_KRYPT_PROTOCOL
      </footer>
    </div>
  );
}

