import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, products, shops } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { generateOrderAccessToken } from "@/lib/order-auth";
import { sendOrderLookupEmail, OrderLookupEmailItem } from "@/lib/email";

// Simple in-memory rate limiting to prevent spam
const lookupRateLimits = new Map<string, { count: number; lastTime: number }>();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawEmail = (body.email || "").trim().toLowerCase();
    const shopSlug = (body.shopSlug || "").trim().toLowerCase();

    if (!rawEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    // Rate limit: max 5 lookups per email per 10 minutes
    const now = Date.now();
    const rateLimit = lookupRateLimits.get(rawEmail);
    if (rateLimit && now - rateLimit.lastTime < 10 * 60 * 1000 && rateLimit.count >= 5) {
      return NextResponse.json(
        { error: "Too many lookup attempts for this email. Please check your inbox or try again in a few minutes." },
        { status: 429 }
      );
    }

    lookupRateLimits.set(rawEmail, {
      count: rateLimit && now - rateLimit.lastTime < 10 * 60 * 1000 ? rateLimit.count + 1 : 1,
      lastTime: now,
    });

    const userOrders = await db
      .select({
        order: orders,
        product: products,
        shop: shops,
      })
      .from(orders)
      .leftJoin(products, eq(orders.productId, products.id))
      .leftJoin(shops, eq(orders.shopId, shops.id))
      .where(eq(orders.buyerEmail, rawEmail))
      .orderBy(desc(orders.createdAt))
      .limit(50);

    if (!userOrders || userOrders.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        orders: [],
        message: "No orders found associated with this email address.",
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const emailOrderItems: OrderLookupEmailItem[] = [];
    const clientOrderSummaries = [];

    for (const item of userOrders) {
      const ord = item.order;
      const prod = item.product;
      const shp = item.shop;

      const token = generateOrderAccessToken(ord.id, ord.buyerEmail);
      const receiptUrl = `${appUrl}/order/${ord.id}?token=${token}`;

      if (ord.paymentStatus === "completed") {
        emailOrderItems.push({
          orderId: ord.id,
          shopName: shp?.name || "Merchant Store",
          productTitle: prod?.title || "Digital Product",
          totalAmount: ord.totalAmount,
          currency: ord.currency || "USD",
          createdAt: ord.createdAt,
          receiptUrl,
        });
      }

      clientOrderSummaries.push({
        id: ord.id,
        shortId: ord.id.slice(0, 8).toUpperCase(),
        productTitle: prod?.title || "Digital Product",
        shopName: shp?.name || "Merchant Store",
        shopSlug: shp?.slug || null,
        totalAmount: ord.totalAmount,
        currency: ord.currency || "USD",
        paymentStatus: ord.paymentStatus,
        paymentMethod: ord.paymentMethod,
        createdAt: ord.createdAt,
        receiptUrl,
      });
    }

    let emailSent = false;
    if (emailOrderItems.length > 0) {
      try {
        const mailRes = await sendOrderLookupEmail({
          email: rawEmail,
          orders: emailOrderItems,
        });
        emailSent = mailRes.success;
      } catch (mailErr) {
        console.warn("[Order Lookup] Failed to send lookup email:", mailErr);
      }
    }

    return NextResponse.json({
      success: true,
      count: clientOrderSummaries.length,
      orders: clientOrderSummaries,
      emailSent,
      message: emailSent
        ? `Found ${clientOrderSummaries.length} order(s). Access links have also been sent to your email.`
        : `Found ${clientOrderSummaries.length} order(s). Click any order below to view your keys.`,
    });
  } catch (err: any) {
    console.error("[Order Lookup Error]", err);
    return NextResponse.json(
      { error: err.message || "Failed to search for orders" },
      { status: 500 }
    );
  }
}
