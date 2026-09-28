import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { shops, orders, products, inventoryKeys } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    const userShop = await db.query.shops.findFirst({
      where: eq(shops.userId, session.user.id),
    });

    if (!userShop) {
      return NextResponse.json({
        totalRevenue: "0.00",
        netRevenue: "0.00",
        totalOrders: 0,
        totalCheckouts: 0,
        avgOrderValue: "0.00",
        conversionRate: "0.0",
        revenueGrowth: "0.0%",
        growthDirection: "neutral",
        growthLabel: "No sales yet",
        keysInStock: 0,
        productPerformance: [],
        paymentMethodBreakdown: { stripe: 0, crypto: 0 },
      });
    }

    // Quick stock query
    if (type === "keys") {
      const shopProducts = await db.query.products.findMany({
        where: eq(products.shopId, userShop.id),
      });
      const productIds = shopProducts.map((p) => p.id);
      let keysCount = 0;
      for (const pid of productIds) {
        const unused = await db
          .select({ c: count() })
          .from(inventoryKeys)
          .where(eq(inventoryKeys.productId, pid));
        keysCount += unused[0]?.c || 0;
      }
      return NextResponse.json({ keysInStock: keysCount });
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
    const totalCheckouts = shopOrders.length;
    const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : "0.00";
    const netRevenue = (totalRevenue * 0.95).toFixed(2);

    // Calculate REAL Conversion Rate (Completed orders vs initiated checkouts)
    const conversionRate =
      totalCheckouts > 0 ? ((totalOrders / totalCheckouts) * 100).toFixed(1) : "0.0";

    // Calculate Real Month-over-Month Revenue Growth
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    let currentMonthRevenue = 0;
    let lastMonthRevenue = 0;

    completedOrders.forEach((o: any) => {
      const orderDate = new Date(o.createdAt);
      const amount = parseFloat(o.totalAmount || "0");
      if (orderDate >= startOfCurrentMonth) {
        currentMonthRevenue += amount;
      } else if (orderDate >= startOfLastMonth && orderDate < startOfCurrentMonth) {
        lastMonthRevenue += amount;
      }
    });

    let revenueGrowth = "0.0%";
    let growthDirection: "up" | "down" | "neutral" = "neutral";
    let growthLabel = "vs previous month";

    if (lastMonthRevenue > 0) {
      const diff = ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
      revenueGrowth = `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}%`;
      growthDirection = diff > 0 ? "up" : diff < 0 ? "down" : "neutral";
    } else if (currentMonthRevenue > 0) {
      revenueGrowth = "+100%";
      growthDirection = "up";
      growthLabel = "Initial sales period";
    } else {
      revenueGrowth = "0.0%";
      growthDirection = "neutral";
      growthLabel = "Awaiting first sale";
    }

    // Payment breakdown
    let stripeCount = 0;
    let cryptoCount = 0;
    completedOrders.forEach((o: any) => {
      if (o.paymentMethod === "stripe" || o.paymentMethod === "card") stripeCount++;
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
      netRevenue,
      totalOrders,
      totalCheckouts,
      avgOrderValue,
      conversionRate,
      revenueGrowth,
      growthDirection,
      growthLabel,
      productPerformance,
      paymentMethodBreakdown: { stripe: stripeCount, crypto: cryptoCount },
    });
  } catch (err: any) {
    console.error("Error in GET /api/analytics:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch analytics" }, { status: 500 });
  }
}
