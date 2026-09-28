import { NextResponse } from "next/server";
import { fulfillOrder } from "@/lib/order-fulfillment";
import { verifyCryptomusWebhook } from "@/lib/cryptomus";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    let body: any;

    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const paymentKey = (process.env.CRYPTOMUS_PAYMENT_KEY || "").trim();
    const sign = body.sign || req.headers.get("sign") || "";

    // Signature verification (Strict fail-closed security)
    if (process.env.NODE_ENV === "production" || paymentKey) {
      if (!paymentKey || !sign) {
        console.error("[Cryptomus Webhook] Missing CRYPTOMUS_PAYMENT_KEY or signature header.");
        return NextResponse.json({ error: "Missing webhook secret or signature" }, { status: 401 });
      }

      const isValid = verifyCryptomusWebhook(rawBody, sign, paymentKey);
      if (!isValid) {
        console.error("[Cryptomus Webhook] Signature verification failed!");
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }
    } else {
      console.warn("[Cryptomus Webhook] CRYPTOMUS_PAYMENT_KEY not set — skipping signature verification in development sandbox only.");
    }

    const { order_id, status, is_final } = body;

    console.log(`[Cryptomus Webhook Event] Order: ${order_id}, Status: ${status}, IsFinal: ${is_final}`);

    // Cryptomus statuses: "paid" | "paid_over" mean order is fully funded
    if (order_id && (status === "paid" || status === "paid_over")) {
      const fulfillRes = await fulfillOrder(order_id);
      console.log(`[Cryptomus Webhook] Fulfillment result for ${order_id}:`, fulfillRes.success);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[Cryptomus Webhook Error]:", err);
    return NextResponse.json({ error: err.message || "Webhook processing failed" }, { status: 500 });
  }
}
