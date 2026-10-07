import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { shops, products, inventoryKeys } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createProductSchema, updateProductSchema } from "@/lib/validations/product";
import { getActiveMerchantShop } from "@/lib/tenant";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const body = await req.json();
    const shopId = body.shopId || searchParams.get("shopId");

    // Get active user shop
    const userShop = await getActiveMerchantShop(session.user.id, shopId);

    if (!userShop) {
      return NextResponse.json({ error: "Shop not found. Please create a shop first." }, { status: 404 });
    }
    const result = createProductSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Invalid product data" },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      category,
      price,
      currency,
      keys,
      structuredKeys,
      categorizedKeys,
      thumbnailUrl,
      images,
      youtubeUrl,
      receiptNote,
      duration,
      durationDays,
      customDurationLabel,
      variants,
    } = result.data;
    const productId = crypto.randomUUID();

    const processedImages = Array.isArray(images)
      ? images.map((u: string) => (typeof u === "string" ? u.trim() : "")).filter(Boolean).slice(0, 5)
      : [];
    const primaryThumb = thumbnailUrl || processedImages[0] || null;

    const prodCategory = category?.trim() || null;
    const prodDuration = duration || "lifetime";
    const prodDurationDays = durationDays ?? 0;
    const prodCustomLabel = customDurationLabel?.trim() || null;
    const prodYoutubeUrl = youtubeUrl?.trim() || null;

    let prodVariants = null;
    if (Array.isArray(variants) && variants.length > 0) {
      const seenPredefined = new Set<string>();
      let customCount = 0;
      const unique = [];
      for (const v of variants) {
        if (!v || !v.duration) continue;
        if (v.duration === "custom") {
          if (customCount < 5) {
            customCount++;
            unique.push(v);
          }
        } else {
          if (!seenPredefined.has(v.duration)) {
            seenPredefined.add(v.duration);
            unique.push(v);
          }
        }
      }
      prodVariants = unique.length > 0 ? JSON.stringify(unique) : null;
    }

    // Insert product — keys only platform
    await db.insert(products).values({
      id: productId,
      shopId: userShop.id,
      title,
      description: description || null,
      category: prodCategory,
      receiptNote: receiptNote || null,
      type: "key",
      price: price.toString(),
      currency: currency || "USD",
      isUnlimitedStock: false,
      stockLimit: null,
      thumbnailUrl: primaryThumb,
      images: processedImages.length > 0 ? JSON.stringify(processedImages) : null,
      youtubeUrl: prodYoutubeUrl,
      duration: prodDuration,
      durationDays: prodDurationDays,
      customDurationLabel: prodCustomLabel,
      variants: prodVariants,
      isActive: true,
    });

    // Insert inventory keys (supporting flat, categorized, and structured keys)
    const allKeysToInsert: any[] = [];

    // 1. Structured keys with explicit duration / variant
    if (Array.isArray(structuredKeys) && structuredKeys.length > 0) {
      for (const sk of structuredKeys) {
        if (sk && sk.keyValue && sk.keyValue.trim()) {
          allKeysToInsert.push({
            id: crypto.randomUUID(),
            productId,
            variantId: sk.variantId || null,
            keyValue: sk.keyValue.trim(),
            duration: sk.duration || prodDuration,
            durationDays: sk.durationDays ?? prodDurationDays,
            customDurationLabel: prodCustomLabel,
            isUsed: false,
          });
        }
      }
    }

    // 2. Categorized keys record: { [durationOrVariantId]: string[] }
    if (categorizedKeys && typeof categorizedKeys === "object") {
      const parsedVarList = Array.isArray(variants) ? variants : [];
      for (const [catKey, keyList] of Object.entries(categorizedKeys)) {
        if (Array.isArray(keyList)) {
          const matchingVariant = parsedVarList.find((v) => v.id === catKey || v.duration === catKey);
          const catDuration = matchingVariant?.duration || catKey || prodDuration;
          const catDays = matchingVariant?.durationDays ?? prodDurationDays;
          const catVarId = matchingVariant?.id || (catKey.includes("_") ? catKey : null);

          for (const rawKey of keyList) {
            if (typeof rawKey === "string" && rawKey.trim()) {
              allKeysToInsert.push({
                id: crypto.randomUUID(),
                productId,
                variantId: catVarId,
                keyValue: rawKey.trim(),
                duration: catDuration,
                durationDays: catDays,
                customDurationLabel: prodCustomLabel,
                isUsed: false,
              });
            }
          }
        }
      }
    }

    // 3. Fallback flat keys array
    if (allKeysToInsert.length === 0 && Array.isArray(keys) && keys.length > 0) {
      for (const k of keys) {
        if (typeof k === "string" && k.trim()) {
          allKeysToInsert.push({
            id: crypto.randomUUID(),
            productId,
            keyValue: k.trim(),
            duration: prodDuration,
            durationDays: prodDurationDays,
            customDurationLabel: prodCustomLabel,
            isUsed: false,
          });
        }
      }
    }

    if (allKeysToInsert.length > 0) {
      // Deduplicate key values
      const seenKeyStrings = new Set<string>();
      const deduplicatedKeys = allKeysToInsert.filter((item) => {
        if (seenKeyStrings.has(item.keyValue)) return false;
        seenKeyStrings.add(item.keyValue);
        return true;
      });

      const BATCH_SIZE = 100;
      for (let i = 0; i < deduplicatedKeys.length; i += BATCH_SIZE) {
        await db.insert(inventoryKeys).values(deduplicatedKeys.slice(i, i + BATCH_SIZE));
      }
    }

    return NextResponse.json({ success: true, productId });
  } catch (err: any) {
    console.error("Error creating product:", err);
    return NextResponse.json({ error: err.message || "Failed to create product" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("id");
    const shopId = searchParams.get("shopId");

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const existingProduct = await db.query.products.findFirst({
      where: eq(products.id, productId),
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const targetShop = await db.query.shops.findFirst({
      where: eq(shops.id, existingProduct.shopId),
    });

    if (!targetShop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    const isSuperAdmin = session.user.role === "superadmin";
    const isAdmin = (session.user.role === "admin" && (session.user as any).adminPermissionsActive !== false) || isSuperAdmin;
    const isOwner = targetShop.userId === session.user.id;

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Explicitly clean up inventory keys for this product
    await db.delete(inventoryKeys).where(eq(inventoryKeys.productId, productId));
    await db.delete(products).where(eq(products.id, productId));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error deleting product:", err);
    return NextResponse.json({ error: err.message || "Failed to delete product" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("id");
    const shopId = searchParams.get("shopId");

    if (productId) {
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
        return NextResponse.json({ error: "Product shop not found" }, { status: 404 });
      }

      const isSuperAdmin = session.user.role === "superadmin";
      const isAdmin = (session.user.role === "admin" && (session.user as any).adminPermissionsActive !== false) || isSuperAdmin;
      const isOwner = targetShop.userId === session.user.id;

      if (!isOwner && !isAdmin) {
        return NextResponse.json({ error: "Unauthorized access to product" }, { status: 403 });
      }

      let parsedImages: string[] = [];
      if (product.images) {
        try {
          parsedImages = JSON.parse(product.images);
        } catch {
          parsedImages = [];
        }
      }
      if (parsedImages.length === 0 && product.thumbnailUrl) {
        parsedImages = [product.thumbnailUrl];
      }

      let parsedVariants: any[] = [];
      if (product.variants) {
        try {
          parsedVariants = JSON.parse(product.variants);
        } catch {
          parsedVariants = [];
        }
      }

      const keys = await db
        .select()
        .from(inventoryKeys)
        .where(eq(inventoryKeys.productId, productId));

      return NextResponse.json({ product: { ...product, parsedImages, parsedVariants }, keys, shopId: product.shopId });
    }

    const userShop = await getActiveMerchantShop(session.user.id, shopId);
    if (!userShop) {
      return NextResponse.json({ error: "No active shop found" }, { status: 404 });
    }

    const allProducts = await db
      .select()
      .from(products)
      .where(eq(products.shopId, userShop.id));

    return NextResponse.json({ products: allProducts });
  } catch (err: any) {
    console.error("Error fetching product:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch product" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const body = await req.json();
    const shopId = body.shopId || searchParams.get("shopId");
    const result = updateProductSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Invalid update data" },
        { status: 400 }
      );
    }

    const {
      id,
      title,
      description,
      category,
      price,
      thumbnailUrl,
      images,
      youtubeUrl,
      isActive,
      newKeys,
      structuredKeys,
      categorizedKeys,
      receiptNote,
      duration,
      durationDays,
      customDurationLabel,
      variants,
    } = result.data;

    const existingProduct = await db.query.products.findFirst({
      where: eq(products.id, id),
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const targetShop = await db.query.shops.findFirst({
      where: eq(shops.id, existingProduct.shopId),
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

    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category ? category.trim() : null;
    if (price !== undefined) updateData.price = price.toString();
    if (receiptNote !== undefined) updateData.receiptNote = receiptNote || null;
    if (youtubeUrl !== undefined) updateData.youtubeUrl = youtubeUrl?.trim() || null;
    if (duration !== undefined) updateData.duration = duration;
    if (durationDays !== undefined) updateData.durationDays = durationDays;
    if (customDurationLabel !== undefined) updateData.customDurationLabel = customDurationLabel?.trim() || null;
    if (variants !== undefined) {
      if (Array.isArray(variants) && variants.length > 0) {
        const seenPredefined = new Set<string>();
        let customCount = 0;
        const unique = [];
        for (const v of variants) {
          if (!v || !v.duration) continue;
          if (v.duration === "custom") {
            if (customCount < 5) {
              customCount++;
              unique.push(v);
            }
          } else {
            if (!seenPredefined.has(v.duration)) {
              seenPredefined.add(v.duration);
              unique.push(v);
            }
          }
        }
        updateData.variants = unique.length > 0 ? JSON.stringify(unique) : null;
      } else {
        updateData.variants = null;
      }
    }
    if (images !== undefined) {
      const processedImages = Array.isArray(images)
        ? images.map((u: string) => (typeof u === "string" ? u.trim() : "")).filter(Boolean).slice(0, 5)
        : [];
      updateData.images = processedImages.length > 0 ? JSON.stringify(processedImages) : null;
      if (thumbnailUrl === undefined && processedImages[0]) {
        updateData.thumbnailUrl = processedImages[0];
      }
    }
    if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl || null;
    if (isActive !== undefined) updateData.isActive = isActive;

    await db.update(products).set(updateData).where(eq(products.id, id));

    // Insert keys (supporting structuredKeys, categorizedKeys, and newKeys)
    const allKeysToInsert: any[] = [];
    const prodDuration = duration || existingProduct.duration || "lifetime";
    const prodDurationDays = durationDays !== undefined ? durationDays : (existingProduct.durationDays ?? 0);
    const prodCustomLabel = customDurationLabel !== undefined ? (customDurationLabel?.trim() || null) : existingProduct.customDurationLabel;

    if (Array.isArray(structuredKeys) && structuredKeys.length > 0) {
      for (const sk of structuredKeys) {
        if (sk && sk.keyValue && sk.keyValue.trim()) {
          allKeysToInsert.push({
            id: crypto.randomUUID(),
            productId: id,
            variantId: sk.variantId || null,
            keyValue: sk.keyValue.trim(),
            duration: sk.duration || prodDuration,
            durationDays: sk.durationDays ?? prodDurationDays,
            customDurationLabel: prodCustomLabel,
            isUsed: false,
          });
        }
      }
    }

    if (categorizedKeys && typeof categorizedKeys === "object") {
      const parsedVarList = Array.isArray(variants) ? variants : [];
      for (const [catKey, keyList] of Object.entries(categorizedKeys)) {
        if (Array.isArray(keyList)) {
          const matchingVariant = parsedVarList.find((v) => v.id === catKey || v.duration === catKey);
          const catDuration = matchingVariant?.duration || catKey || prodDuration;
          const catDays = matchingVariant?.durationDays ?? prodDurationDays;
          const catVarId = matchingVariant?.id || (catKey.includes("_") ? catKey : null);

          for (const rawKey of keyList) {
            if (typeof rawKey === "string" && rawKey.trim()) {
              allKeysToInsert.push({
                id: crypto.randomUUID(),
                productId: id,
                variantId: catVarId,
                keyValue: rawKey.trim(),
                duration: catDuration,
                durationDays: catDays,
                customDurationLabel: prodCustomLabel,
                isUsed: false,
              });
            }
          }
        }
      }
    }

    if (allKeysToInsert.length === 0 && Array.isArray(newKeys) && newKeys.length > 0) {
      for (const k of newKeys) {
        if (typeof k === "string" && k.trim()) {
          allKeysToInsert.push({
            id: crypto.randomUUID(),
            productId: id,
            keyValue: k.trim(),
            duration: prodDuration,
            durationDays: prodDurationDays,
            customDurationLabel: prodCustomLabel,
            isUsed: false,
          });
        }
      }
    }

    if (allKeysToInsert.length > 0) {
      const existingDbKeys = await db
        .select({ keyValue: inventoryKeys.keyValue })
        .from(inventoryKeys)
        .where(eq(inventoryKeys.productId, id));

      const existingKeySet = new Set(existingDbKeys.map((k) => k.keyValue.trim()));

      const seenKeyStrings = new Set<string>();
      const deduplicatedKeys = allKeysToInsert.filter((item) => {
        if (existingKeySet.has(item.keyValue)) return false;
        if (seenKeyStrings.has(item.keyValue)) return false;
        seenKeyStrings.add(item.keyValue);
        return true;
      });

      const BATCH_SIZE = 100;
      for (let i = 0; i < deduplicatedKeys.length; i += BATCH_SIZE) {
        await db.insert(inventoryKeys).values(deduplicatedKeys.slice(i, i + BATCH_SIZE));
      }
    }


    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error updating product:", err);
    return NextResponse.json({ error: err.message || "Failed to update product" }, { status: 500 });
  }
}
