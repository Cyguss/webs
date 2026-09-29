import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { verifyAdminSessionTicket } from "@/lib/admin-gate";
import { db } from "@/lib/db";
import { user, shops, products, orders, sellerBalances, payoutRequests, shopApprovalRequests } from "@/lib/db/schema";
import { desc, eq, count, sql } from "drizzle-orm";

function getClientIp(headersList: Headers): string {
  const forwarded = headersList.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headersList.get("x-real-ip") || "127.0.0.1";
}

export async function GET() {
  try {
    const headersList = await headers();
    const ticket = headersList.get("x-admin-ticket");
    const ip = getClientIp(headersList);

    const { verifyAdminSessionTicket, getBlockAllAdminsStatus } = await import("@/lib/admin-gate");
    const isSuperAdminTicket = verifyAdminSessionTicket(ticket, ip);

    // Check session
    const { auth } = await import("@/lib/auth");
    const session = await auth.api.getSession({
      headers: headersList,
    });

    let currentDbUser: any = null;
    if (session?.user?.id) {
      currentDbUser = await db.query.user.findFirst({
        where: eq(user.id, session.user.id),
      });
    }

    const isSuperAdmin =
      isSuperAdminTicket ||
      currentDbUser?.role === "superadmin" ||
      (session?.user as any)?.role === "superadmin";

    let isDiscordAdmin = false;

    if (!isSuperAdmin) {
      if (!session?.user?.id || !currentDbUser) {
        return NextResponse.json({ error: "Authentication required." }, { status: 401 });
      }

      // If user has admin role in DB
      if (currentDbUser.role === "admin") {
        isDiscordAdmin = true;
      } else {
        // Find discord ID from user table or account table
        const { account } = await import("@/lib/db/schema");
        const { and } = await import("drizzle-orm");
        const discordAccount = await db.query.account.findFirst({
          where: and(eq(account.userId, session.user.id), eq(account.providerId, "discord")),
        });

        const discordId = currentDbUser?.discordId || discordAccount?.accountId;

        if (!discordId) {
          return NextResponse.json(
            { isRevoked: true, error: "No connected Discord account found. Administrator permissions required." },
            { status: 403 }
          );
        }

        // Real-time live check via Discord Bot API
        const { isDiscordUserAdmin } = await import("@/lib/discord");
        const discordCheck = await isDiscordUserAdmin(discordId);

        if (!discordCheck.isAdmin) {
          return NextResponse.json(
            {
              isRevoked: true,
              error: "Your Discord Administrator role was revoked. Access to the admin panel has been removed.",
            },
            { status: 403 }
          );
        }

        isDiscordAdmin = true;
      }

      // Valid Discord Admin confirmed in real-time
      isDiscordAdmin = true;
      if (currentDbUser?.role !== "admin") {
        await db.update(user).set({ role: "admin", updatedAt: new Date() }).where(eq(user.id, session.user.id));
      }
    }

    // If ordinary admin has their permissions suspended, refuse access!
    if (!isSuperAdmin && currentDbUser?.adminPermissionsActive === false) {
      return NextResponse.json(
        {
          error: "Your administrator permissions have been suspended by the Super-Admin.",
          isSuspended: true,
          isSuperAdmin: false,
          discordUsername: currentDbUser?.discordUsername || session?.user?.name,
        },
        { status: 403 }
      );
    }

    const blockAllAdmins = await getBlockAllAdminsStatus();

    // If ordinary admin and Super-Admin enabled lockdown, refuse access!
    if (!isSuperAdmin && blockAllAdmins) {
      return NextResponse.json(
        {
          error: "Ordinary administrator access is locked down by the Super-Admin (Emergency Lockdown).",
          isBlocked: true,
          blockAllAdmins: true,
          isSuperAdmin: false,
          discordUsername: currentDbUser?.discordUsername || session?.user?.name,
        },
        { status: 403 }
      );
    }

    // 1. Platform Totals
    const [
      allUsers,
      allShops,
      allProducts,
      allOrders,
      allBalances,
      allPayouts,
      allApprovalRequests,
    ] = await Promise.all([
      db.select().from(user).orderBy(desc(user.createdAt)),
      db.select().from(shops).orderBy(desc(shops.createdAt)),
      db.select().from(products).orderBy(desc(products.createdAt)),
      db.select().from(orders).orderBy(desc(orders.createdAt)).limit(100),
      db.select().from(sellerBalances),
      db.select().from(payoutRequests).orderBy(desc(payoutRequests.createdAt)),
      db.select().from(shopApprovalRequests).orderBy(desc(shopApprovalRequests.requestedAt)),
    ]);

    // Calculate Platform Gross Volume
    let totalGrossRevenue = 0;
    for (const ord of allOrders) {
      if (ord.paymentStatus === "completed") {
        totalGrossRevenue += parseFloat(ord.totalAmount || "0");
      }
    }

    // Map shop counts & balances to users
    const userStats = allUsers.map((u) => {
      const userShopList = allShops.filter((s) => s.userId === u.id);
      const balance = allBalances.find((b) => b.userId === u.id);
      const { parseAdminPermissions } = require("@/lib/admin-gate");
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        adminPermissionsActive: u.adminPermissionsActive !== false,
        adminPermissions: parseAdminPermissions(u.adminPermissions),
        discordId: u.discordId,
        discordUsername: u.discordUsername,
        createdAt: u.createdAt,
        shopsCount: userShopList.length,
        shops: userShopList.map((s) => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
          isAccepted: s.isAccepted,
        })),
        shop: userShopList[0] || null,
        totalEarned: balance?.totalEarned || "0",
        availableBalance: balance?.availableBalance || "0",
      };
    });

    // Enrich shops with owner information
    const enrichedShops = allShops.map((s) => {
      const owner = allUsers.find((u) => u.id === s.userId);
      const shopProducts = allProducts.filter((p) => p.shopId === s.id);
      const latestRequest = allApprovalRequests
        .filter((r) => r.shopId === s.id)
        .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())[0];
      return {
        id: s.id,
        slug: s.slug,
        name: s.name,
        description: s.description,
        accentColor: s.accentColor,
        isActive: s.isActive,
        isAccepted: s.isAccepted,
        createdAt: s.createdAt,
        ownerName: owner?.name || "Unknown",
        ownerEmail: owner?.email || "N/A",
        ownerDiscord: owner?.discordUsername || null,
        productsCount: shopProducts.length,
        approvalStatus: latestRequest?.status || null,
        approvalRequestId: latestRequest?.id || null,
      };
    });

    // Enrich approval requests with shop + user info
    const enrichedApprovalRequests = allApprovalRequests.map((r) => {
      const shop = allShops.find((s) => s.id === r.shopId);
      const owner = allUsers.find((u) => u.id === r.userId);
      return {
        ...r,
        shopName: shop?.name || "Unknown",
        shopSlug: shop?.slug || "unknown",
        ownerName: owner?.name || "Unknown",
        ownerEmail: owner?.email || "N/A",
      };
    });

    // Enrich payout requests with merchant + shop info
    const enrichedPayouts = allPayouts.map((p) => {
      const owner = allUsers.find((u) => u.id === p.userId);
      const shop = allShops.find((s) => s.userId === p.userId);
      return {
        ...p,
        merchantName: owner?.name || "Unknown Merchant",
        merchantEmail: owner?.email || "N/A",
        merchantDiscord: owner?.discordUsername || null,
        shopName: shop?.name || null,
        shopSlug: shop?.slug || null,
      };
    });

    const { parseAdminPermissions } = await import("@/lib/admin-gate");
    const currentUserPermissions = isSuperAdmin
      ? {
          canApproveShops: true,
          canDeleteShops: true,
          canManageUsers: true,
          canManagePayouts: true,
          canViewFinancials: true,
          canManageSettings: true,
          canAccessDebug: true,
        }
      : parseAdminPermissions(currentDbUser?.adminPermissions);

    return NextResponse.json({
      success: true,
      isSuperAdmin,
      isDiscordAdmin,
      blockAllAdmins,
      discordUsername: currentDbUser?.discordUsername || session?.user?.name || null,
      currentUserPermissions,
      stats: {
        totalUsers: allUsers.length,
        totalShops: allShops.length,
        totalProducts: allProducts.length,
        totalOrders: allOrders.length,
        totalGrossRevenue: totalGrossRevenue.toFixed(2),
        pendingPayoutsCount: allPayouts.filter((p) => p.status === "pending").length,
        pendingApprovalsCount: allApprovalRequests.filter((r) => r.status === "pending").length,
      },
      users: userStats,
      shops: enrichedShops,
      orders: allOrders.slice(0, 30),
      payouts: enrichedPayouts,
      approvalRequests: enrichedApprovalRequests,
    });
  } catch (err: any) {
    console.error("[Admin API] Failed to fetch overview data:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch administrator data" },
      { status: 500 }
    );
  }
}
