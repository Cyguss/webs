import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { orders, products, shops } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { generateOrderBearerSecret, hashOrderBearerSecret } from "@/lib/order-auth";
import { sendOrderLookupEmail, OrderLookupEmailItem } from "@/lib/email";
import { rateLimit, rateLimitPresets, getClientIp, createRateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const headersList = await headers();
    const clientIp = getClientIp(headersList);

    const body = await req.json();
    const rawEmail = (body.email || "").trim().toLowerCase();
    const shopSlug = (body.shopSlug || "").trim().toLowerCase();

    if (!rawEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    // Rate limit: max 5 lookups per IP and per email
    const ipCheck = rateLimit({
      key: `lookup_ip:${clientIp}`,
      limit: 5,
      windowMs: 10 * 60 * 1000,
    });
    if (!ipCheck.allowed) {
      return createRateLimitResponse(
        ipCheck,
        "Too many lookup attempts from this network. Please check your inbox or try again in a few minutes."
      );
    }

    const emailCheck = rateLimit({
      key: `lookup_email:${rawEmail}`,
      limit: 5,
      windowMs: 10 * 60 * 1000,
    });
    if (!emailCheck.allowed) {
      return createRateLimitResponse(
        emailCheck,
        "Too many lookup attempts for this mailbox. Please check your inbox or try again in a few minutes."
      );
    }

    const userOrders = await db
      .select({
        order: orders,
        product: products,
        shop: shops,
      })
      .from(orders)
      .leftJoin(products, eq(orders.productId, products.id))
      .leftJoin(shops, eq(orders.shopId, shops.id))
      .where(
        shopSlug
          ? and(eq(orders.buyerEmail, rawEmail), eq(shops.slug, shopSlug))
          : eq(orders.buyerEmail, rawEmail)
      )
      .orderBy(desc(orders.createdAt))
      .limit(50);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const emailOrderItems: OrderLookupEmailItem[] = [];

    if (userOrders && userOrders.length > 0) {
      for (const item of userOrders) {
        const ord = item.order;
        const prod = item.product;
        const shp = item.shop;

        if (ord.paymentStatus === "completed") {
          // Generate a fresh random bearer secret for secure access via email
          const bearerSecret = generateOrderBearerSecret();
          const secretHash = hashOrderBearerSecret(bearerSecret);

          // Update the order's secret hash in the database
          await db
            .update(orders)
            .set({
              accessSecretHash: secretHash,
              updatedAt: new Date(),
            })
            .where(eq(orders.id, ord.id));

          const receiptUrl = `${appUrl}/order/${ord.id}?secret=${bearerSecret}`;

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
      }

      if (emailOrderItems.length > 0) {
        try {
          await sendOrderLookupEmail({
            email: rawEmail,
            orders: emailOrderItems,
          });
        } catch (mailErr) {
          console.warn("[Order Lookup] Failed to send lookup email:", mailErr);
        }
      }
    }

    // Secure response: NEVER return receipt URLs, tokens, secrets, or order items to unauthenticated caller.
    return NextResponse.json({
      success: true,
      message: "If any completed orders exist for this email, secure access links have been dispatched to your inbox.",
    });
  } catch (err: any) {
    console.error("[Order Lookup Error]", err);
    return NextResponse.json(
      { error: "Failed to process order recovery request" },
      { status: 500 }
    );
  }
}
