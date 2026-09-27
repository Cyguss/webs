import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { shops } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Resolves the active shop for a merchant based on the active store cookie
 * and verifies that the store actually belongs to the authenticated user.
 */
export async function getActiveMerchantShop(userId: string) {
  if (!userId) return null;

  try {
    const cookieStore = await cookies();
    const activeShopId = cookieStore.get("vlt_active_shop_id")?.value;

    if (activeShopId) {
      const selectedShop = await db.query.shops.findFirst({
        where: and(eq(shops.id, activeShopId), eq(shops.userId, userId)),
      });
      if (selectedShop) return selectedShop;
    }

    // Fallback to user's first shop
    const defaultShop = await db.query.shops.findFirst({
      where: eq(shops.userId, userId),
    });

    return defaultShop || null;
  } catch (err) {
    console.error("[getActiveMerchantShop Error]", err);
    return null;
  }
}
