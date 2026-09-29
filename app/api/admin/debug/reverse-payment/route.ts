import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders, shops, user, sellerBalances, products } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { verifyAdminSessionTicket, parseAdminPermissions } from "@/lib/admin-gate";
import { handlePaymentReversal, ReversalType } from "@/lib/payment-reversal";
import crypto from "crypto";

function getClientIp(headersList: Headers): string {
  const forwarded = headersList.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headersList.get("x-real-ip") || "127.0.0.1";
}

async function verifyDebugAccess() {
  // CRITICAL SECURITY GUARD: Debug reversal endpoint is disabled in production unless ALLOW_ADMIN_DEBUG is true
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_ADMIN_DEBUG !== "true") {
    return { authorized: false, isSuperAdmin: false, user: null };
  }

  const headersList = await headers();
  const ticket = headersList.get("x-admin-ticket");
  const ip = getClientIp(headersList);
  const isSuperAdminTicket = verifyAdminSessionTicket(ticket, ip);

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

  if (isSuperAdmin) {
    return {
      authorized: true,
      isSuperAdmin: true,
      user: currentDbUser || { email: "superadmin@platform.local", id: "superadmin" },
    };
  }

  if (!session?.user?.id || !currentDbUser) {
    return { authorized: false, isSuperAdmin: false, user: null };
  }

  if (currentDbUser.role === "admin" && currentDbUser.adminPermissionsActive !== false) {
    const perms = parseAdminPermissions(currentDbUser.adminPermissions);
    if (perms.canAccessDebug) {
      return { authorized: true, isSuperAdmin: false, user: currentDbUser };
    }
  }

  return { authorized: false, isSuperAdmin: false, user: currentDbUser };
}

/**
 * GET /api/admin/debug/reverse-payment
 * Returns a list of candidate orders for payment reversal testing.
 */
export async function GET() {
  try {
    const authCheck = await verifyDebugAccess();
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: "Access denied. Debug privileges required." },
        { status: 403 }
      );
    }

    const recentOrders = await db
      .select({
        id: orders.id,
        buyerEmail: orders.buyerEmail,
        totalAmount: orders.totalAmount,
        currency: orders.currency,
        paymentMethod: orders.paymentMethod,
        paymentStatus: orders.paymentStatus,
        createdAt: orders.createdAt,
        shopId: orders.shopId,
        shopName: shops.name,
        shopSlug: shops.slug,
        merchantUserId: shops.userId,
        productTitle: products.title,
      })
      .from(orders)
      .leftJoin(shops, eq(orders.shopId, shops.id))
      .leftJoin(products, eq(orders.productId, products.id))
      .orderBy(desc(orders.createdAt))
      .limit(50);

    return NextResponse.json({
      success: true,
      orders: recentOrders,
    });
  } catch (err: any) {
    console.error("[Admin Debug API Error]:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load debug orders" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/debug/reverse-payment
 * Simulates a provider-initiated refund / chargeback / reversal on a given order.
 */
export async function POST(req: Request) {
  try {
    const authCheck = await verifyDebugAccess();
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: "Access denied. Debug privileges required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { orderId, reversalType = "refund", reason, amount } = body;

    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const validTypes: ReversalType[] = ["refund", "chargeback", "reversal", "dispute", "dispute_won"];
    const finalType: ReversalType = validTypes.includes(reversalType)
      ? reversalType
      : "refund";

    // 1. Verify target order exists
    const targetOrder = await db.query.orders.findFirst({
      where: eq(orders.id, orderId.trim()),
    });

    if (!targetOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // 2. Fetch target shop & merchant
    const targetShop = await db.query.shops.findFirst({
      where: eq(shops.id, targetOrder.shopId),
    });

    const merchantUser = targetShop
      ? await db.query.user.findFirst({ where: eq(user.id, targetShop.userId) })
      : null;

    // 3. Current merchant balance before reversal
    const prevBalance = targetShop
      ? await db.query.sellerBalances.findFirst({
          where: eq(sellerBalances.userId, targetShop.userId),
        })
      : null;

    const eventId = `dbg_rev_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    const reversalAmount =
      amount !== undefined && !isNaN(Number(amount)) && Number(amount) > 0
        ? Number(amount)
        : parseFloat(targetOrder.totalAmount);

    const provider =
      targetOrder.paymentMethod === "stripe" ? "stripe" : "nowpayments";

    // 4. Trigger atomic provider payment reversal
    const result = await handlePaymentReversal({
      provider,
      eventId,
      eventType: `debug.${provider}.${finalType}`,
      reversalType: finalType,
      orderId: targetOrder.id,
      amount: reversalAmount,
      reason:
        reason?.trim() ||
        `Admin Debug Tool (${authCheck.isSuperAdmin ? "Super-Admin" : "Staff"}): Simulated ${finalType.toUpperCase()}`,
      metadata: {
        debugTriggeredBy: authCheck.user?.email || authCheck.user?.id,
        simulatedAt: new Date().toISOString(),
      },
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Payment reversal execution failed",
          result,
        },
        { status: 400 }
      );
    }

    // 5. Fetch updated merchant balance
    const updatedBalance = targetShop
      ? await db.query.sellerBalances.findFirst({
          where: eq(sellerBalances.userId, targetShop.userId),
        })
      : null;

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${finalType.toUpperCase()} of $${reversalAmount.toFixed(2)} for Order #${targetOrder.id.slice(0, 8)}`,
      eventId,
      reversalType: finalType,
      order: {
        id: targetOrder.id,
        buyerEmail: targetOrder.buyerEmail,
        totalAmount: targetOrder.totalAmount,
        previousPaymentStatus: targetOrder.paymentStatus,
        newPaymentStatus: finalType === "dispute" ? "disputed" : "reversed",
      },
      merchant: {
        id: targetShop?.userId,
        name: merchantUser?.name || "Merchant",
        email: merchantUser?.email || "N/A",
        shopName: targetShop?.name || "Store",
        shopId: targetShop?.id,
      },
      balances: {
        previousAvailable: prevBalance?.availableBalance || "0.00",
        previousPending: prevBalance?.pendingBalance || "0.00",
        newAvailable: updatedBalance?.availableBalance || result.newAvailableBalance || "0.00",
        newPending: updatedBalance?.pendingBalance || result.newPendingBalance || "0.00",
        isDebt: result.isDebt || false,
        debtAmount: result.debtAmount || 0,
      },
      reversalResult: result,
    });
  } catch (err: any) {
    console.error("[Admin Debug Reversal Error]:", err);
    return NextResponse.json(
      { error: err.message || "Failed to execute debug reversal" },
      { status: 500 }
    );
  }
}
