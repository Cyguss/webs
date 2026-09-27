import { NextResponse } from "next/server";
import { verifyMerchantApiKey } from "@/lib/api-keys";
import { db } from "@/lib/db";
import { orders, products, inventoryKeys } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await verifyMerchantApiKey(req);
  if (!authResult.valid) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  const { id } = await params;
  const { shopId } = authResult;

  try {
    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, id), eq(orders.shopId, shopId!)),
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const product = await db.query.products.findFirst({
      where: eq(products.id, order.productId),
    });

    // Fetch license keys delivered with this order
    const deliveredKeys = await db
      .select({
        keyValue: inventoryKeys.keyValue,
        usedAt: inventoryKeys.usedAt,
      })
      .from(inventoryKeys)
      .where(eq(inventoryKeys.orderId, order.id));

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        shopId: order.shopId,
        productId: order.productId,
        productTitle: product?.title || "Unknown Product",
        buyerEmail: order.buyerEmail,
        quantity: order.quantity,
        totalAmount: order.totalAmount,
        currency: order.currency,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        keys: deliveredKeys.map((k) => k.keyValue),
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    });
  } catch (err: any) {
    console.error("[API v1 Order Detail Error]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
