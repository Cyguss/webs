import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { shops, products, orders } from "@/lib/db/schema";
import { eq, and, or, like, desc } from "drizzle-orm";
import { getActiveMerchantShop } from "@/lib/tenant";

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("q") || "").trim();

    if (!query) {
      return NextResponse.json({ products: [], orders: [] });
    }

    const shopId = searchParams.get("shopId");
    const userShop = await getActiveMerchantShop(session.user.id, shopId);

    if (!userShop) {
      return NextResponse.json({ products: [], orders: [] });
    }

    const pattern = `%${query}%`;

    // Search products
    const matchedProducts = await db
      .select({
        id: products.id,
        title: products.title,
        price: products.price,
        type: products.type,
        isActive: products.isActive,
      })
      .from(products)
      .where(
        and(
          eq(products.shopId, userShop.id),
          or(
            like(products.title, pattern),
            like(products.description, pattern)
          )
        )
      )
      .limit(5);

    // Search orders
    const matchedOrders = await db
      .select({
        id: orders.id,
        buyerEmail: orders.buyerEmail,
        totalAmount: orders.totalAmount,
        status: orders.paymentStatus,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(
        and(
          eq(orders.shopId, userShop.id),
          or(
            like(orders.id, pattern),
            like(orders.buyerEmail, pattern)
          )
        )
      )
      .orderBy(desc(orders.createdAt))
      .limit(5);

    return NextResponse.json({
      products: matchedProducts,
      orders: matchedOrders,
    });
  } catch (err: any) {
    console.error("Dashboard search error:", err);
    return NextResponse.json({ products: [], orders: [] });
  }
}
