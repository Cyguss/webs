import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, reviews } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, rating, comment } = body;

    if (!orderId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Order ID and valid rating (1-5) are required" }, { status: 400 });
    }

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check if review already submitted
    const existing = await db.query.reviews.findFirst({
      where: eq(reviews.orderId, orderId),
    });

    if (existing) {
      return NextResponse.json({ error: "You have already submitted a review for this order." }, { status: 400 });
    }

    const reviewId = crypto.randomUUID();

    await db.insert(reviews).values({
      id: reviewId,
      productId: order.productId,
      orderId: order.id,
      buyerEmail: order.buyerEmail,
      rating: parseInt(rating),
      comment: comment ? comment.trim() : null,
    });

    return NextResponse.json({ success: true, reviewId });
  } catch (err: any) {
    console.error("Error posting review:", err);
    return NextResponse.json({ error: err.message || "Failed to submit review" }, { status: 500 });
  }
}
