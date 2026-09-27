import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { fulfillOrder } from "@/lib/order-fulfillment";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");
    const sessionId = searchParams.get("sessionId");

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // If already completed, return success immediately
    if (order.paymentStatus === "completed") {
      return NextResponse.json({ success: true, paymentStatus: "completed", orderId });
    }

    // If session ID is provided, verify with Stripe API
    if (sessionId) {
      const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);

      if (stripeSession.metadata?.orderId !== orderId) {
        return NextResponse.json({ error: "Session metadata mismatch" }, { status: 400 });
      }

      if (stripeSession.payment_status === "paid") {
        const fulfillRes = await fulfillOrder(orderId);
        return NextResponse.json({
          success: true,
          paymentStatus: "completed",
          orderId,
          fulfilled: fulfillRes.success,
        });
      }
    }

    return NextResponse.json({
      success: false,
      paymentStatus: order.paymentStatus,
      orderId,
    });
  } catch (err: any) {
    console.error("[Verify Checkout Session Error]:", err);
    return NextResponse.json({ error: err.message || "Failed to verify payment" }, { status: 500 });
  }
}
