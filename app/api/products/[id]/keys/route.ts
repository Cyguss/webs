import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { shops, products, inventoryKeys, orders } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: productId } = await params;

    const userShop = await db.query.shops.findFirst({
      where: eq(shops.userId, session.user.id),
    });

    if (!userShop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    // Verify product ownership
    const product = await db.query.products.findFirst({
      where: and(eq(products.id, productId), eq(products.shopId, userShop.id)),
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const keys = await db
      .select({
        id: inventoryKeys.id,
        keyValue: inventoryKeys.keyValue,
        isUsed: inventoryKeys.isUsed,
        usedAt: inventoryKeys.usedAt,
        orderId: inventoryKeys.orderId,
        createdAt: inventoryKeys.createdAt,
      })
      .from(inventoryKeys)
      .where(eq(inventoryKeys.productId, productId));

    return NextResponse.json({ keys, product });
  } catch (err: any) {
    console.error("Error fetching product keys:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch keys" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: productId } = await params;

    const userShop = await db.query.shops.findFirst({
      where: eq(shops.userId, session.user.id),
    });

    if (!userShop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    const product = await db.query.products.findFirst({
      where: and(eq(products.id, productId), eq(products.shopId, userShop.id)),
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const body = await req.json();
    const { keys } = body;

    if (!Array.isArray(keys) || keys.length === 0) {
      return NextResponse.json({ error: "No keys provided" }, { status: 400 });
    }

    const keysToInsert = keys
      .map((k: string) => k.trim())
      .filter((k: string) => k.length > 0)
      .map((keyValue: string) => ({
        id: crypto.randomUUID(),
        productId,
        keyValue,
        isUsed: false,
      }));

    if (keysToInsert.length > 0) {
      await db.insert(inventoryKeys).values(keysToInsert);
    }

    return NextResponse.json({ success: true, count: keysToInsert.length });
  } catch (err: any) {
    console.error("Error adding product keys:", err);
    return NextResponse.json({ error: err.message || "Failed to add keys" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: productId } = await params;
    const { searchParams } = new URL(req.url);
    const keyId = searchParams.get("keyId");

    if (!keyId) {
      return NextResponse.json({ error: "Key ID is required" }, { status: 400 });
    }

    const userShop = await db.query.shops.findFirst({
      where: eq(shops.userId, session.user.id),
    });

    if (!userShop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    // Verify ownership
    const product = await db.query.products.findFirst({
      where: and(eq(products.id, productId), eq(products.shopId, userShop.id)),
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Ensure key belongs to this product
    const existingKey = await db.query.inventoryKeys.findFirst({
      where: and(eq(inventoryKeys.id, keyId), eq(inventoryKeys.productId, productId)),
    });

    if (!existingKey) {
      return NextResponse.json({ error: "Key not found" }, { status: 404 });
    }

    await db.delete(inventoryKeys).where(eq(inventoryKeys.id, keyId));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error deleting key:", err);
    return NextResponse.json({ error: err.message || "Failed to delete key" }, { status: 500 });
  }
}
