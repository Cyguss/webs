import { NextResponse } from "next/server";
import { verifyMerchantApiKey } from "@/lib/api-keys";
import { db } from "@/lib/db";
import { products, inventoryKeys } from "@/lib/db/schema";
import { eq, and, count } from "drizzle-orm";

export async function GET(req: Request) {
  const authResult = await verifyMerchantApiKey(req);
  if (!authResult.valid) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  const { shopId } = authResult;

  try {
    const shopProducts = await db.query.products.findMany({
      where: and(eq(products.shopId, shopId!), eq(products.isActive, true)),
    });

    const productsWithStock = await Promise.all(
      shopProducts.map(async (p) => {
        let availableStock = 0;
        if (p.isUnlimitedStock) {
          availableStock = 999999;
        } else if (p.type === "key") {
          const [stockResult] = await db
            .select({ count: count() })
            .from(inventoryKeys)
            .where(
              and(
                eq(inventoryKeys.productId, p.id),
                eq(inventoryKeys.isUsed, false)
              )
            );
          availableStock = stockResult?.count || 0;
        }

        return {
          id: p.id,
          title: p.title,
          description: p.description,
          type: p.type,
          price: p.price,
          currency: p.currency,
          availableStock,
          isUnlimitedStock: p.isUnlimitedStock,
          createdAt: p.createdAt,
        };
      })
    );

    return NextResponse.json({
      success: true,
      shopId,
      count: productsWithStock.length,
      products: productsWithStock,
    });
  } catch (err: any) {
    console.error("[API v1 Products Error]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
