import { NextResponse } from "next/server";
import { generateCryptomusSignature } from "@/lib/cryptomus";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();
    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const paymentKey = (process.env.CRYPTOMUS_PAYMENT_KEY || "").trim();
    const totalAmount = parseFloat(order.totalAmount).toFixed(2);

    const payload = {
      type: "payment",
      uuid: `sim_${crypto.randomUUID().slice(0, 16)}`,
      order_id: order.id,
      amount: totalAmount,
      payment_amount: totalAmount,
      payment_amount_usd: totalAmount,
      merchant_amount: (parseFloat(totalAmount) * 0.95).toFixed(2),
      commission: (parseFloat(totalAmount) * 0.05).toFixed(2),
      is_final: true,
      status: "paid",
      network: "tron",
      currency: "USDT",
      payer_currency: "USDT",
    };

    const signature = paymentKey ? generateCryptomusSignature(payload, paymentKey) : "dev_test_sig";

    // Call the actual Cryptomus webhook handler internally
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const webhookRes = await fetch(`${appUrl}/api/webhooks/crypto`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        sign: signature,
      },
      body: JSON.stringify({ ...payload, sign: signature }),
    });

    const resJson = await webhookRes.json();
    return NextResponse.json({ success: true, webhookResponse: resJson });
  } catch (err: any) {
    console.error("[Crypto Simulate Error]:", err);
    return NextResponse.json({ error: err.message || "Failed to simulate payment" }, { status: 500 });
  }
}
