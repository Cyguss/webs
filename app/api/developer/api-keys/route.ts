import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiKeys, shops } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { createMerchantApiKey, revokeMerchantApiKey } from "@/lib/api-keys";

export async function GET(req: Request) {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const shopId = searchParams.get("shopId");

  const { getActiveMerchantShop } = await import("@/lib/tenant");
  const shop = await getActiveMerchantShop(session.user.id, shopId);

  if (!shop) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  const keys = await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      permissions: apiKeys.permissions,
      isActive: apiKeys.isActive,
      lastUsedAt: apiKeys.lastUsedAt,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .where(and(eq(apiKeys.shopId, shop.id), eq(apiKeys.isActive, true)))
    .orderBy(desc(apiKeys.createdAt));

  return NextResponse.json({
    success: true,
    keys: keys.map((k) => ({
      ...k,
      permissions: JSON.parse(k.permissions || "[]"),
    })),
  });
}

export async function POST(req: Request) {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, permissions, shopId } = body;

    const { getActiveMerchantShop } = await import("@/lib/tenant");
    const shop = await getActiveMerchantShop(session.user.id, shopId);

    if (!shop) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Key name is required" }, { status: 400 });
    }

    const created = await createMerchantApiKey({
      userId: shop.userId,
      shopId: shop.id,
      name: name.trim(),
      permissions: permissions || ["orders:read", "licenses:verify", "products:read"],
    });

    return NextResponse.json({
      success: true,
      key: created,
    });
  } catch (err: any) {
    console.error("[Create API Key Error]", err);
    return NextResponse.json({ error: "Failed to generate API key" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { keyId, shopId } = body;

    if (!keyId) {
      return NextResponse.json({ error: "Key ID is required" }, { status: 400 });
    }

    const { getActiveMerchantShop } = await import("@/lib/tenant");
    const shop = await getActiveMerchantShop(session.user.id, shopId);

    if (!shop) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const key = await db.query.apiKeys.findFirst({
      where: and(eq(apiKeys.id, keyId), eq(apiKeys.shopId, shop.id)),
    });

    if (!key) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    await db.update(apiKeys).set({ isActive: false }).where(eq(apiKeys.id, keyId));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[Revoke API Key Error]", err);
    return NextResponse.json({ error: "Failed to revoke API key" }, { status: 500 });
  }
}
