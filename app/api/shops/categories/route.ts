import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { shops, products } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getActiveMerchantShop } from "@/lib/tenant";

interface ShopCategory {
  id: string; // slug / key
  name: string; // display name
  icon?: string;
  description?: string;
}

const DEFAULT_PRESET_CATEGORIES: ShopCategory[] = [
  { id: "softwares", name: "Softwares", icon: "Code", description: "Software applications, injectors & executables" },
  { id: "scripts", name: "Scripts", icon: "FileCode", description: "Lua, Python, and custom game scripts" },
  { id: "accounts", name: "Accounts", icon: "User", description: "Full access and verified accounts" },
  { id: "configs", name: "Configs & Tools", icon: "Sliders", description: "Custom configurations and utility tools" },
  { id: "services", name: "Services", icon: "Zap", description: "Boosting, setup, and premium assistance" },
  { id: "gaming", name: "Gaming & Mods", icon: "Gamepad2", description: "Game enhancements, mod menus & assets" },
];

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get("shopId");
    const userShop = await getActiveMerchantShop(session.user.id, shopId);
    if (!userShop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    let savedCategories: ShopCategory[] = [];
    if (userShop.categories) {
      try {
        savedCategories = JSON.parse(userShop.categories);
      } catch {
        savedCategories = [];
      }
    }

    // Also find any distinct categories used across products in this shop
    const shopProducts = await db
      .select({ category: products.category })
      .from(products)
      .where(eq(products.shopId, userShop.id));

    const usedCategorySlugs = new Set<string>();
    for (const p of shopProducts) {
      if (p.category && p.category.trim()) {
        usedCategorySlugs.add(p.category.trim());
      }
    }

    // Merge saved categories with presets and used categories
    const categoriesMap = new Map<string, ShopCategory>();
    
    // Add saved first
    for (const cat of savedCategories) {
      if (cat.id && cat.name) {
        categoriesMap.set(cat.id.toLowerCase(), cat);
      }
    }

    // Ensure any category actively used on products is also included
    for (const catSlug of usedCategorySlugs) {
      const lower = catSlug.toLowerCase();
      if (!categoriesMap.has(lower)) {
        const matchingPreset = DEFAULT_PRESET_CATEGORIES.find((p) => p.id === lower);
        categoriesMap.set(lower, matchingPreset || {
          id: catSlug,
          name: catSlug.charAt(0).toUpperCase() + catSlug.slice(1),
          icon: "Layers",
        });
      }
    }

    return NextResponse.json({
      categories: Array.from(categoriesMap.values()),
      presets: DEFAULT_PRESET_CATEGORIES,
    });
  } catch (err: any) {
    console.error("Error fetching shop categories:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch categories" }, { status: 500 });
  }
}

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
    const userShop = await getActiveMerchantShop(session.user.id, shopId);
    if (!userShop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }
    const { name, slug, icon, description } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const cleanName = name.trim().slice(0, 100);
    const cleanId = (slug && typeof slug === "string" ? slug : cleanName)
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "category";

    let existingCategories: ShopCategory[] = [];
    if (userShop.categories) {
      try {
        existingCategories = JSON.parse(userShop.categories);
      } catch {
        existingCategories = [];
      }
    }

    const existingIndex = existingCategories.findIndex((c) => c.id === cleanId);
    const newCatItem: ShopCategory = {
      id: cleanId,
      name: cleanName,
      icon: icon && typeof icon === "string" ? icon.trim() : "Layers",
      description: description && typeof description === "string" ? description.trim().slice(0, 200) : undefined,
    };

    if (existingIndex >= 0) {
      existingCategories[existingIndex] = newCatItem;
    } else {
      existingCategories.push(newCatItem);
    }

    await db
      .update(shops)
      .set({
        categories: JSON.stringify(existingCategories),
        updatedAt: new Date(),
      })
      .where(eq(shops.id, userShop.id));

    return NextResponse.json({ success: true, category: newCatItem, categories: existingCategories });
  } catch (err: any) {
    console.error("Error creating/updating category:", err);
    return NextResponse.json({ error: err.message || "Failed to save category" }, { status: 500 });
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
    const categoryId = searchParams.get("id");
    const shopId = searchParams.get("shopId");

    const userShop = await getActiveMerchantShop(session.user.id, shopId);
    if (!userShop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    if (!categoryId) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }

    let existingCategories: ShopCategory[] = [];
    if (userShop.categories) {
      try {
        existingCategories = JSON.parse(userShop.categories);
      } catch {
        existingCategories = [];
      }
    }

    const updatedCategories = existingCategories.filter((c) => c.id !== categoryId);

    await db
      .update(shops)
      .set({
        categories: JSON.stringify(updatedCategories),
        updatedAt: new Date(),
      })
      .where(eq(shops.id, userShop.id));

    return NextResponse.json({ success: true, categories: updatedCategories });
  } catch (err: any) {
    console.error("Error deleting category:", err);
    return NextResponse.json({ error: err.message || "Failed to delete category" }, { status: 500 });
  }
}
