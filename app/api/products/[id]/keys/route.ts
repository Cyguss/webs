import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { shops, products, inventoryKeys, orders } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getActiveMerchantShop } from "@/lib/tenant";

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
    const { searchParams } = new URL(req.url);
    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const targetShop = await db.query.shops.findFirst({
      where: eq(shops.id, product.shopId),
    });

    if (!targetShop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    const isSuperAdmin = session.user.role === "superadmin";
    const isAdmin = (session.user.role === "admin" && (session.user as any).adminPermissionsActive !== false) || isSuperAdmin;
    const isOwner = targetShop.userId === session.user.id;

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const keys = await db
      .select({
        id: inventoryKeys.id,
        keyValue: inventoryKeys.keyValue,
        duration: inventoryKeys.duration,
        durationDays: inventoryKeys.durationDays,
        customDurationLabel: inventoryKeys.customDurationLabel,
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
    const { searchParams } = new URL(req.url);
    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const targetShop = await db.query.shops.findFirst({
      where: eq(shops.id, product.shopId),
    });

    if (!targetShop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    const isSuperAdmin = session.user.role === "superadmin";
    const isAdmin = (session.user.role === "admin" && (session.user as any).adminPermissionsActive !== false) || isSuperAdmin;
    const isOwner = targetShop.userId === session.user.id;

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { keys, duration, durationDays, customDurationLabel, variantId } = body;

    if (!Array.isArray(keys) || keys.length === 0) {
      return NextResponse.json({ error: "No keys provided" }, { status: 400 });
    }

    const keyDuration = duration || product.duration || "lifetime";
    const keyDurationDays = durationDays !== undefined ? durationDays : (product.durationDays ?? 0);
    const keyCustomLabel = customDurationLabel !== undefined ? (customDurationLabel?.trim() || null) : product.customDurationLabel;
    const keyVariantId = variantId || null;

    // Filter, clean whitespace, and deduplicate within incoming batch
    const uniqueKeysSet = new Set<string>();
    const cleanedKeys: string[] = [];

    for (const rawKey of keys) {
      if (typeof rawKey === "string") {
        const trimmed = rawKey.trim();
        if (trimmed.length > 0 && !uniqueKeysSet.has(trimmed)) {
          uniqueKeysSet.add(trimmed);
          cleanedKeys.push(trimmed);
        }
      }
    }

    if (cleanedKeys.length === 0) {
      return NextResponse.json({ error: "No valid unique keys found" }, { status: 400 });
    }

    // Query existing keys for this product to prevent duplicate keys in database
    const existingDbKeys = await db
      .select({ keyValue: inventoryKeys.keyValue })
      .from(inventoryKeys)
      .where(eq(inventoryKeys.productId, productId));

    const existingKeySet = new Set(existingDbKeys.map((k) => k.keyValue.trim()));
    const finalKeysToInsert = cleanedKeys.filter((k) => !existingKeySet.has(k));

    if (finalKeysToInsert.length === 0) {
      return NextResponse.json(
        {
          error: "All provided keys already exist in the inventory for this product.",
          count: 0,
          duplicatesFiltered: keys.length,
        },
        { status: 400 }
      );
    }

    const keysToInsert = finalKeysToInsert.map((keyValue: string) => ({
      id: crypto.randomUUID(),
      productId,
      variantId: keyVariantId,
      keyValue,
      duration: keyDuration,
      durationDays: keyDurationDays,
      customDurationLabel: keyCustomLabel,
      isUsed: false,
    }));

    // Insert in batches of 100 to avoid packet size or transaction limits on large bulk uploads
    const BATCH_SIZE = 100;
    for (let i = 0; i < keysToInsert.length; i += BATCH_SIZE) {
      const chunk = keysToInsert.slice(i, i + BATCH_SIZE);
      await db.insert(inventoryKeys).values(chunk);
    }

    const totalDuplicates = keys.length - keysToInsert.length;

    return NextResponse.json({
      success: true,
      count: keysToInsert.length,
      duplicatesFiltered: totalDuplicates,
    });

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

    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const targetShop = await db.query.shops.findFirst({
      where: eq(shops.id, product.shopId),
    });

    if (!targetShop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    const isSuperAdmin = session.user.role === "superadmin";
    const isAdmin = (session.user.role === "admin" && (session.user as any).adminPermissionsActive !== false) || isSuperAdmin;
    const isOwner = targetShop.userId === session.user.id;

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
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
