import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { shops, sellerBalances, user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { updateStorefrontSchema } from "@/lib/validations/storefront";
import { MAX_SHOPS_PER_USER } from "@/config";

const RESERVED_SLUGS = [
  "dashboard",
  "api",
  "login",
  "register",
  "admin",
  "order",
  "onboarding",
  "settings",
  "storefront",
  "products",
  "orders",
  "earnings",
  "tickets",
  "analytics",
  "coupons",
];

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { isStoreCreationAllowed } = await import("@/lib/platform-settings");
    const allowed = await isStoreCreationAllowed();
    const isSuperAdmin = (session.user as any).role === "superadmin";

    if (!allowed && !isSuperAdmin) {
      return NextResponse.json(
        {
          error: "Store creation is temporarily disabled by platform administrators for maintenance. Please check back shortly.",
        },
        { status: 403 }
      );
    }

    // Multi-store support enabled for expansion
    const existingShops = await db.query.shops.findMany({
      where: eq(shops.userId, session.user.id),
    });

    if (existingShops.length >= 10) {
      return NextResponse.json(
        {
          error: "Store limit reached (maximum 10 storefronts per account). Contact support for enterprise expansion.",
        },
        { status: 400 }
      );
    }

    const body = await req.json();
    const name = (body.name || "").trim();
    let slug = (body.slug || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    if (!name || name.length < 2) {
      return NextResponse.json(
        { error: "Store name must be at least 2 characters" },
        { status: 400 }
      );
    }

    if (!slug || slug.length < 3) {
      return NextResponse.json(
        { error: "Store slug must be at least 3 characters" },
        { status: 400 }
      );
    }

    if (RESERVED_SLUGS.includes(slug)) {
      return NextResponse.json(
        { error: "This slug is reserved by the KRYPT Protocol" },
        { status: 400 }
      );
    }

    // Check store limit per user
    const existingUserShops = await db.query.shops.findMany({
      where: eq(shops.userId, session.user.id),
    });

    if (existingUserShops.length >= MAX_SHOPS_PER_USER) {
      return NextResponse.json(
        {
          error: `Limit reached: You can create a maximum of ${MAX_SHOPS_PER_USER} store(s) per account.`,
        },
        { status: 400 }
      );
    }

    // Check if slug is taken
    const slugTaken = await db.query.shops.findFirst({
      where: eq(shops.slug, slug),
    });

    if (slugTaken) {
      return NextResponse.json(
        { error: `The slug "${slug}" is already taken. Please choose another subdomain.` },
        { status: 400 }
      );
    }

    // Check if name is taken
    const nameTaken = await db.query.shops.findFirst({
      where: eq(shops.name, name),
    });

    if (nameTaken) {
      return NextResponse.json(
        { error: `A store named "${name}" already exists. Please choose a different name.` },
        { status: 400 }
      );
    }

    const newShopId = `shp_${crypto.randomUUID().slice(0, 12)}`;
    await db.insert(shops).values({
      id: newShopId,
      userId: session.user.id,
      name,
      slug,
      description: body.description || `Welcome to the official ${name} store!`,
      accentColor: body.accentColor || "#6366f1",
      backgroundColor: body.backgroundColor || "#0f0f0f",
      isActive: true,
    });

    // Ensure seller balance exists
    const existingBalance = await db.query.sellerBalances.findFirst({
      where: eq(sellerBalances.userId, session.user.id),
    });
    if (!existingBalance) {
      await db.insert(sellerBalances).values({
        id: `bal_${crypto.randomUUID().slice(0, 12)}`,
        userId: session.user.id,
        availableBalance: "0",
        pendingBalance: "0",
        totalEarned: "0",
        totalWithdrawn: "0",
      });
    }

    return NextResponse.json({
      success: true,
      shop: { id: newShopId, name, slug },
    });
  } catch (err: any) {
    console.error("Error creating shop:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create store" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await db.query.user.findFirst({
      where: eq(user.id, session.user.id),
    });

    const userShops = await db.query.shops.findMany({
      where: eq(shops.userId, session.user.id),
    });

    const cookieHeader = (await headers()).get("cookie") || "";
    const activeShopMatch = cookieHeader.match(/vlt_active_shop_id=([^;]+)/);
    const activeShopId = activeShopMatch ? activeShopMatch[1] : null;

    let userShop = activeShopId
      ? userShops.find((s) => s.id === activeShopId) || userShops[0]
      : userShops[0];

    const { shopApprovalRequests } = await import("@/lib/db/schema");
    const { desc } = await import("drizzle-orm");

    const allShopReqs = await db.query.shopApprovalRequests.findMany({
      where: eq(shopApprovalRequests.userId, session.user.id),
      orderBy: [desc(shopApprovalRequests.requestedAt)],
    } as any);

    const shopsWithStatus = userShops.map((s) => {
      let status: "approved" | "pending" | "rejected" = "pending";
      if (s.isAccepted) {
        status = "approved";
      } else {
        const req = allShopReqs.find((r) => r.shopId === s.id);
        if (req?.status === "rejected") {
          status = "rejected";
        } else {
          status = "pending";
        }
      }
      return {
        ...s,
        approvalStatus: status,
      };
    });

    const currentShopWithStatus = userShop
      ? shopsWithStatus.find((s) => s.id === userShop.id) || shopsWithStatus[0]
      : null;

    return NextResponse.json({
      shop: currentShopWithStatus || null,
      shops: shopsWithStatus || [],
      role: dbUser?.role || "user",
      hasDiscordConnected: !!dbUser?.discordId,
      discordUsername: dbUser?.discordUsername || null,
      approvalStatus: currentShopWithStatus?.approvalStatus || "pending",
    });
  } catch (err: any) {
    console.error("Error fetching shop:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch shop" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const shopId = body.shopId as string | undefined;

    // Find target shop
    let userShop: any;
    if (shopId) {
      userShop = await db.query.shops.findFirst({
        where: eq(shops.id, shopId),
      });
      if (!userShop || userShop.userId !== session.user.id) {
        return NextResponse.json({ error: "Shop not found or not yours" }, { status: 404 });
      }
    } else {
      userShop = await db.query.shops.findFirst({
        where: eq(shops.userId, session.user.id),
      });
    }

    if (!userShop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    const parseResult = updateStorefrontSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || "Invalid storefront payload" },
        { status: 400 }
      );
    }

    const {
      name,
      slug,
      description,
      logoUrl,
      bannerUrl,
      backgroundColor,
      accentColor,
      twitterUrl,
      discordUrl,
      youtubeUrl,
      trustpilotUrl,
      telegramUrl,
      metaTitle,
      metaDescription,
      customDomain,
      fontStyle,
      discordWebhookUrl,
      customFontUrl,
      textColor,
      mutedTextColor,
      cardColor,
      borderColor,
      themeMode,
    } = parseResult.data;

    // Validate + uniqueness check for slug
    let newSlug = userShop.slug;
    if (slug !== undefined && slug !== userShop.slug) {
      newSlug = slug
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      if (!newSlug || newSlug.length < 3) {
        return NextResponse.json({ error: "Slug must be at least 3 characters" }, { status: 400 });
      }
      if (RESERVED_SLUGS.includes(newSlug)) {
        return NextResponse.json({ error: `Slug "${newSlug}" is reserved by the system` }, { status: 400 });
      }
      const taken = await db.query.shops.findFirst({ where: eq(shops.slug, newSlug) });
      if (taken && taken.id !== userShop.id) {
        return NextResponse.json({ error: `Slug "${newSlug}" is already taken` }, { status: 409 });
      }
    }

    // Validate + uniqueness check for name
    let newName = userShop.name;
    if (name !== undefined && name.trim() !== userShop.name) {
      newName = name.trim();
      if (!newName || newName.length < 2) {
        return NextResponse.json({ error: "Store name must be at least 2 characters" }, { status: 400 });
      }
      const existingStore = await db.query.shops.findFirst({
        where: eq(shops.name, newName),
      });
      if (existingStore && existingStore.id !== userShop.id) {
        return NextResponse.json(
          { error: `A store named "${newName}" already exists. Please choose a unique name.` },
          { status: 409 }
        );
      }
    }

    // Validate + normalize customDomain
    let cleanCustomDomain = userShop.customDomain;
    if (customDomain !== undefined) {
      const trimmed = customDomain ? customDomain.trim() : "";
      if (!trimmed) {
        cleanCustomDomain = null;
      } else {
        cleanCustomDomain = trimmed
          .toLowerCase()
          .replace(/^https?:\/\//i, "")
          .replace(/\/.*$/, "")
          .replace(/:\d+$/, "");

        // Basic domain validation: alphanumeric with dots and hyphens
        if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(cleanCustomDomain)) {
          return NextResponse.json({ error: "Invalid domain format (e.g. store.yourbrand.com)" }, { status: 400 });
        }

        // Check if customDomain is taken by another store
        const domainTaken = await db.query.shops.findFirst({
          where: eq(shops.customDomain, cleanCustomDomain),
        });
        if (domainTaken && domainTaken.id !== userShop.id) {
          return NextResponse.json(
            { error: `The domain "${cleanCustomDomain}" is already bound to another store.` },
            { status: 409 }
          );
        }
      }
    }

    await db
      .update(shops)
      .set({
        name: newName,
        slug: newSlug,
        description: description ?? userShop.description,
        logoUrl: logoUrl ?? userShop.logoUrl,
        bannerUrl: bannerUrl ?? userShop.bannerUrl,
        backgroundColor: backgroundColor ?? userShop.backgroundColor,
        accentColor: accentColor ?? userShop.accentColor,
        twitterUrl: twitterUrl ?? userShop.twitterUrl,
        discordUrl: discordUrl ?? userShop.discordUrl,
        youtubeUrl: youtubeUrl ?? userShop.youtubeUrl,
        trustpilotUrl: trustpilotUrl ?? userShop.trustpilotUrl,
        telegramUrl: telegramUrl ?? userShop.telegramUrl,
        metaTitle: metaTitle ?? userShop.metaTitle,
        metaDescription: metaDescription ?? userShop.metaDescription,
        customDomain: cleanCustomDomain,
        fontStyle: fontStyle ?? userShop.fontStyle,
        discordWebhookUrl: discordWebhookUrl ?? userShop.discordWebhookUrl,
        customFontUrl: customFontUrl !== undefined ? (customFontUrl ? customFontUrl.trim() : null) : userShop.customFontUrl,
        textColor: textColor ?? userShop.textColor,
        mutedTextColor: mutedTextColor ?? userShop.mutedTextColor,
        cardColor: cardColor ?? userShop.cardColor,
        borderColor: borderColor ?? userShop.borderColor,
        themeMode: themeMode ?? userShop.themeMode ?? "dark",
        categories: body.categories !== undefined ? (typeof body.categories === "string" ? body.categories : JSON.stringify(body.categories)) : userShop.categories,
        updatedAt: new Date(),
      })
      .where(eq(shops.id, userShop.id));

    return NextResponse.json({ success: true, slug: newSlug, name: newName });
  } catch (err: any) {
    console.error("Error updating shop customization:", err);
    return NextResponse.json({ error: err.message || "Failed to update storefront" }, { status: 500 });
  }
}
