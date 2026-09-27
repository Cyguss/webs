import { NextResponse } from "next/server";
import { verifyMerchantApiKey } from "@/lib/api-keys";
import { db } from "@/lib/db";
import { orders, products } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: Request) {
  const authResult = await verifyMerchantApiKey(req);
  if (!authResult.valid) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  const { shopId } = authResult;
  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 100);
  const page = Math.max(parseInt(url.searchParams.get("page") || "1", 10), 1);
  const offset = (page - 1) * limit;

  try {
    const shopOrders = await db
      .select({
        id: orders.id,
        productId: orders.productId,
        productTitle: products.title,
        buyerEmail: orders.buyerEmail,
        totalAmount: orders.totalAmount,
        currency: orders.currency,
        quantity: orders.quantity,
        paymentMethod: orders.paymentMethod,
        paymentStatus: orders.paymentStatus,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .leftJoin(products, eq(orders.productId, products.id))
      .where(eq(orders.shopId, shopId!))
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      shopId,
      page,
      limit,
      orders: shopOrders,
    });
  } catch (err: any) {
    console.error("[API v1 Orders Error]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
