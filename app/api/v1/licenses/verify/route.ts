import { NextResponse } from "next/server";
import { verifyMerchantApiKey } from "@/lib/api-keys";
import { db } from "@/lib/db";
import { inventoryKeys, products, orders } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request) {
  const authResult = await verifyMerchantApiKey(req);
  if (!authResult.valid) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  const { shopId } = authResult;

  try {
    const body = await req.json();
    const { key, productId } = body;

    if (!key || typeof key !== "string" || !key.trim()) {
      return NextResponse.json({ error: "License key string is required" }, { status: 400 });
    }

    const trimmedKey = key.trim();

    // Find the key in inventory_keys
    const keyRecord = await db.query.inventoryKeys.findFirst({
      where: eq(inventoryKeys.keyValue, trimmedKey),
    });

    if (!keyRecord) {
      return NextResponse.json({
        valid: false,
        reason: "KEY_NOT_FOUND",
        message: "License key was not found in catalog.",
      }, { status: 404 });
    }

    // Verify product belongs to this shop
    const product = await db.query.products.findFirst({
      where: and(eq(products.id, keyRecord.productId), eq(products.shopId, shopId!)),
    });

    if (!product) {
      return NextResponse.json({
        valid: false,
        reason: "INVALID_STORE",
        message: "Key belongs to another store or product was deleted.",
      }, { status: 403 });
    }

    if (productId && product.id !== productId) {
      return NextResponse.json({
        valid: false,
        reason: "PRODUCT_MISMATCH",
        message: "Key is valid for another product in your catalog.",
      }, { status: 400 });
    }

    // Check if key was issued in an order
    let orderInfo: any = null;
    if (keyRecord.orderId) {
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, keyRecord.orderId),
      });
      if (order) {
        orderInfo = {
          orderId: order.id,
          buyerEmail: order.buyerEmail,
          paymentStatus: order.paymentStatus,
          purchasedAt: order.createdAt,
        };
      }
    }

    return NextResponse.json({
      valid: true,
      product: {
        id: product.id,
        title: product.title,
        type: product.type,
      },
      isUsed: keyRecord.isUsed,
      usedAt: keyRecord.usedAt,
      order: orderInfo,
    });
  } catch (err: any) {
    console.error("[API v1 License Verify Error]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
