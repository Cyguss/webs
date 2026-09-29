import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { shops, user } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export interface MerchantShopContext {
  shop: typeof shops.$inferSelect | null;
  isPreviewMode: boolean; // true if requesting user is viewing a shop they do NOT own via admin privilege
  isAdmin: boolean;       // true if requesting user has role "admin" or "superadmin"
  isSuperAdmin: boolean;  // true if requesting user has role "superadmin"
  isOwner: boolean;       // true if requesting user owns this shop
  ownerUser?: {
    id: string;
    email: string | null;
    name: string | null;
  } | null;
}

/**
 * Resolves the active merchant shop context for an authenticated user.
 * 
 * Rules:
 * 1. If explicit `requestedShopId` is provided:
 *    - If the user owns the shop -> returns the shop (normal multi-store access).
 *    - If user is admin/superadmin -> returns the shop in Request-Scoped Preview Mode.
 *    - If user is a normal merchant -> DENIES access to foreign shop, returns null/own shop.
 * 2. If no `requestedShopId` is provided:
 *    - Reads `vlt_active_shop_id` cookie for user's owned shops.
 *    - Falls back to user's first owned shop.
 * 
 * Guarantees:
 * - URL is the source of preview selection (`?shopId=<ID>`).
 * - Administrator identity remains unchanged.
 * - `shops.userId` and account ownership are NEVER modified.
 * - No permanent cookies override the admin's normal `/dashboard`.
 */
export async function getMerchantShopContext(
  userId: string,
  requestedShopId?: string | null
): Promise<MerchantShopContext> {
  if (!userId) {
    return {
      shop: null,
      isPreviewMode: false,
      isAdmin: false,
      isSuperAdmin: false,
      isOwner: false,
      ownerUser: null,
    };
  }

  try {
    const requestingUser = await db.query.user.findFirst({
      where: eq(user.id, userId),
    });

    const isSuperAdmin = requestingUser?.role === "superadmin";
    const isAdmin = (requestingUser?.role === "admin" && requestingUser?.adminPermissionsActive !== false) || isSuperAdmin;

    // 1. If explicit requestedShopId is provided (from URL query param or request)
    if (requestedShopId && requestedShopId.trim()) {
      const cleanShopId = requestedShopId.trim();
      const targetShop = await db.query.shops.findFirst({
        where: eq(shops.id, cleanShopId),
      });

      if (targetShop) {
        // Case A: The user is the legitimate owner of this shop
        if (targetShop.userId === userId) {
          return {
            shop: targetShop,
            isPreviewMode: false,
            isAdmin,
            isSuperAdmin,
            isOwner: true,
            ownerUser: requestingUser
              ? {
                  id: requestingUser.id,
                  email: requestingUser.email,
                  name: requestingUser.name,
                }
              : null,
          };
        }

        // Case B: The user is an authorized admin/superadmin previewing another merchant's shop
        if (isAdmin) {
          let ownerUser: any = null;
          if (targetShop.userId) {
            ownerUser = await db.query.user.findFirst({
              where: eq(user.id, targetShop.userId),
            });
          }

          return {
            shop: targetShop,
            isPreviewMode: true,
            isAdmin,
            isSuperAdmin,
            isOwner: false,
            ownerUser: ownerUser
              ? { id: ownerUser.id, email: ownerUser.email, name: ownerUser.name }
              : null,
          };
        }

        // Case C: Normal user trying to access a shop they do not own -> DENIED
      }
    }

    // 2. Normal workspace selection via cookie for user's owned shops
    const cookieStore = await cookies();
    const activeShopId = cookieStore.get("vlt_active_shop_id")?.value;

    if (activeShopId) {
      const selectedShop = await db.query.shops.findFirst({
        where: and(eq(shops.id, activeShopId), eq(shops.userId, userId)),
      });
      if (selectedShop) {
        return {
          shop: selectedShop,
          isPreviewMode: false,
          isAdmin,
          isSuperAdmin,
          isOwner: true,
          ownerUser: requestingUser
            ? { id: requestingUser.id, email: requestingUser.email, name: requestingUser.name }
            : null,
        };
      }
    }

    // 3. Fallback to user's first owned shop
    const defaultShop = await db.query.shops.findFirst({
      where: eq(shops.userId, userId),
    });

    return {
      shop: defaultShop || null,
      isPreviewMode: false,
      isAdmin,
      isSuperAdmin,
      isOwner: !!defaultShop,
      ownerUser: requestingUser && defaultShop
        ? { id: requestingUser.id, email: requestingUser.email, name: requestingUser.name }
        : null,
    };
  } catch (err) {
    console.error("[getMerchantShopContext Error]", err);
    return {
      shop: null,
      isPreviewMode: false,
      isAdmin: false,
      isSuperAdmin: false,
      isOwner: false,
      ownerUser: null,
    };
  }
}

/**
 * Convenience helper returning the active shop object.
 */
export async function getActiveMerchantShop(
  userId: string,
  requestedShopId?: string | null
) {
  const ctx = await getMerchantShopContext(userId, requestedShopId);
  return ctx.shop;
}
