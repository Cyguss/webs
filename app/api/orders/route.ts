import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { shops, orders, products, orderDeliveries } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

import { getActiveMerchantShop } from "@/lib/tenant";

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userShop = await getActiveMerchantShop(session.user.id);

    if (!userShop) {
      return NextResponse.json({ orders: [] });
    }

    const { searchParams } = new URL(req.url);
    const limitParam = parseInt(searchParams.get("limit") || "20", 10);
    const limit = isNaN(limitParam) ? 20 : Math.min(limitParam, 100);

    const rawOrders = await db
      .select({
        id: orders.id,
        buyerEmail: orders.buyerEmail,
        quantity: orders.quantity,
        unitPrice: orders.unitPrice,
        totalAmount: orders.totalAmount,
        currency: orders.currency,
        paymentMethod: orders.paymentMethod,
        paymentStatus: orders.paymentStatus,
        createdAt: orders.createdAt,
        productTitle: products.title,
        deliveryValue: orderDeliveries.deliveryValue,
      })
      .from(orders)
      .leftJoin(products, eq(orders.productId, products.id))
      .leftJoin(orderDeliveries, eq(orders.id, orderDeliveries.orderId))
      .where(eq(orders.shopId, userShop.id))
      .orderBy(desc(orders.createdAt))
      .limit(limit);

    const { count } = await import("drizzle-orm");
    const [countResult] = await db
      .select({ count: count() })
      .from(orders)
      .where(eq(orders.shopId, userShop.id));
    const totalCount = countResult?.count || 0;

    return NextResponse.json({ orders: rawOrders, totalCount });
  } catch (err: any) {
    console.error("Error fetching orders:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch orders" }, { status: 500 });
  }
}
