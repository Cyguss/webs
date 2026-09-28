import { NextResponse } from "next/server";
import { db, pool, ensureDatabaseSchema } from "@/lib/db";
import { user, shops, products, inventoryKeys, coupons, sellerBalances, account } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Seed endpoint is strictly disabled in production environment." },
      { status: 403 }
    );
  }

  try {
    // 0. Ensure schema & all tables exist
    await ensureDatabaseSchema(pool);

    const demoEmail = "demo@krypt.market";
    const demoPassword = "Password123!";
    const demoUserId = "user_demo_123";
    const demoShopId = "shp_demo_101";

    // 1. Create User if not exists
    const [existingUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, demoEmail))
      .limit(1);

    if (!existingUser) {
      await db.insert(user).values({
        id: demoUserId,
        email: demoEmail,
        name: "Demo Seller",
        emailVerified: true,
      });

      await db.insert(account).values({
        id: crypto.randomUUID(),
        userId: demoUserId,
        accountId: demoUserId,
        providerId: "credential",
        password: "$2a$10$abcdefghijklmnopqrstuvwxyz1234567890",
      });
    }

    const userId = existingUser ? existingUser.id : demoUserId;

    // 2. Create Shop if not exists
    const [existingShop] = await db
      .select()
      .from(shops)
      .where(eq(shops.userId, userId))
      .limit(1);

    let activeShopId = existingShop?.id;

    if (!existingShop) {
      await db.insert(shops).values({
        id: demoShopId,
        userId: userId,
        slug: "demo-store",
        name: "Apex Digital Vault",
        description: "Instant license keys, digital passes, and custom gaming services.",
        backgroundColor: "#030407",
        accentColor: "#00ff66",
        twitterUrl: "https://x.com/kryptmarket",
        discordUrl: "https://discord.gg/krypt",
        telegramUrl: "https://t.me/kryptmarket",
        isAccepted: true,
        isActive: true,
      });
      activeShopId = demoShopId;
    }

    const shopId = activeShopId || demoShopId;

    // 3. Create Sample Products
    const [existingProd] = await db
      .select()
      .from(products)
      .where(eq(products.shopId, shopId))
      .limit(1);

    if (!existingProd) {
      const prod1Id = crypto.randomUUID();
      await db.insert(products).values({
        id: prod1Id,
        shopId: shopId,
        title: "VIP Key Pass - 30 Days",
        description: "Instant 30-day VIP access license key. 24/7 automated delivery.",
        type: "key",
        price: "19.99",
        isUnlimitedStock: false,
        isActive: true,
      });

      const keysToSeed = [
        "APEX-VIP30-9981-XXXX-0001",
        "APEX-VIP30-9981-XXXX-0002",
        "APEX-VIP30-9981-XXXX-0003",
        "APEX-VIP30-9981-XXXX-0004",
        "APEX-VIP30-9981-XXXX-0005",
      ].map((keyValue) => ({
        id: crypto.randomUUID(),
        productId: prod1Id,
        keyValue,
        isUsed: false,
      }));
      await db.insert(inventoryKeys).values(keysToSeed);

      await db.insert(products).values({
        id: crypto.randomUUID(),
        shopId: shopId,
        title: "Custom Storefront Branding Setup",
        description: "Professional manual customization & branding setup for your shop within 24 hours.",
        type: "service",
        price: "49.99",
        isUnlimitedStock: true,
        isActive: true,
      });
    }

    // 4. Create Sample Promo Coupon
    const [existingCoupon] = await db
      .select()
      .from(coupons)
      .where(eq(coupons.shopId, shopId))
      .limit(1);

    if (!existingCoupon) {
      await db.insert(coupons).values({
        id: crypto.randomUUID(),
        shopId: shopId,
        code: "SAVE20",
        discountPercent: 20,
        maxUses: 100,
        usedCount: 3,
        isActive: true,
      });
    }

    // 5. Seed Seller Balance
    const [existingBal] = await db
      .select()
      .from(sellerBalances)
      .where(eq(sellerBalances.userId, userId))
      .limit(1);

    if (!existingBal) {
      await db.insert(sellerBalances).values({
        id: crypto.randomUUID(),
        userId: userId,
        availableBalance: "149.95",
        pendingBalance: "39.98",
        totalEarned: "189.93",
        totalWithdrawn: "0.00",
      });
    }

    return NextResponse.json({
      success: true,
      credentials: {
        email: demoEmail,
        password: demoPassword,
        storefrontUrl: `/${existingShop?.slug || "demo-store"}`,
      },
    });
  } catch (err: any) {
    console.error("Seed error:", err);
    return NextResponse.json({ error: err.message || "Failed to seed demo data" }, { status: 500 });
  }
}
