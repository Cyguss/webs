import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { shops, products, inventoryKeys } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import StorefrontEditorClient from "./editor-client";

import { getActiveMerchantShop } from "@/lib/tenant";

export default async function StorefrontPage({
  searchParams,
}: {
  searchParams: Promise<{ shopId?: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/login");
  }

  const { shopId } = await searchParams;
  const userShop = await getActiveMerchantShop(session.user.id, shopId);

  if (!userShop) {
    redirect("/dashboard");
  }

  const shopProducts = await db
    .select()
    .from(products)
    .where(and(eq(products.shopId, userShop.id), eq(products.isActive, true as any)));

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

  let parsedShopCategories: any[] = [];
  if (userShop.categories) {
    try {
      parsedShopCategories = JSON.parse(userShop.categories);
    } catch {
      parsedShopCategories = [];
    }
  }

  return (
    <StorefrontEditorClient
      shop={userShop}
      initialProducts={productsWithStock as any}
      initialCategories={parsedShopCategories}
    />
  );
}
