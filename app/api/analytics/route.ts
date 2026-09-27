import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { shops, orders, products, reviews, coupons } from "@/lib/db/schema";
import { eq, count, sum, sql } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userShop = await db.query.shops.findFirst({
      where: eq(shops.userId, session.user.id),
    });

    if (!userShop) {
      return NextResponse.json({
        totalRevenue: 0,
        totalOrders: 0,
        avgOrderValue: 0,
        conversionRate: 3.4,
        productPerformance: [],
        paymentMethodBreakdown: { stripe: 0, crypto: 0 },
      });
    }

    const shopOrders = await db.query.orders.findMany({
      where: eq(orders.shopId, userShop.id),
    });

    const shopProducts = await db.query.products.findMany({
      where: eq(products.shopId, userShop.id),
    });

    const completedOrders = shopOrders.filter((o: any) => o.paymentStatus === "completed");

    let totalRevenue = 0;
    completedOrders.forEach((o: any) => {
      totalRevenue += parseFloat(o.totalAmount || "0");
    });

    const totalOrders = completedOrders.length;
    const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : "0.00";

    // Payment breakdown
    let stripeCount = 0;
    let cryptoCount = 0;
    completedOrders.forEach((o: any) => {
      if (o.paymentMethod === "stripe") stripeCount++;
      else if (o.paymentMethod === "crypto") cryptoCount++;
    });

    // Product performance
    const productStatsMap: Record<string, { title: string; count: number; revenue: number }> = {};
    shopProducts.forEach((p: any) => {
      productStatsMap[p.id] = { title: p.title, count: 0, revenue: 0 };
    });

    completedOrders.forEach((o: any) => {
      if (productStatsMap[o.productId]) {
        productStatsMap[o.productId].count += o.quantity || 1;
        productStatsMap[o.productId].revenue += parseFloat(o.totalAmount || "0");
      }
    });

    const productPerformance = Object.values(productStatsMap).sort((a, b) => b.revenue - a.revenue);

    return NextResponse.json({
      success: true,
      totalRevenue: totalRevenue.toFixed(2),
      totalOrders,
      avgOrderValue,
      conversionRate: 4.2, // Simulated analytics conversion metric
      productPerformance,
      paymentMethodBreakdown: { stripe: stripeCount, crypto: cryptoCount },
    });
  } catch (err: any) {
    console.error("Error in GET /api/analytics:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch analytics" }, { status: 500 });
  }
}
