import { NextResponse } from "next/server";
import { fulfillOrder } from "@/lib/order-fulfillment";
import { verifyNowPaymentsWebhook } from "@/lib/nowpayments";

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

    const nowpaymentsSig = req.headers.get("x-nowpayments-sig") || req.headers.get("x-nowpayments-signature");
    const ipnSecret = (process.env.NOWPAYMENTS_IPN_SECRET || "").trim();

    // ── NOWPayments IPN Signature Verification ──
    if (ipnSecret) {
      if (!nowpaymentsSig) {
        console.error("[NOWPayments IPN] Missing x-nowpayments-sig header.");
        return NextResponse.json({ error: "Missing signature header" }, { status: 401 });
      }

      const isValid = verifyNowPaymentsWebhook(body, nowpaymentsSig, ipnSecret);
      if (!isValid) {
        console.error("[NOWPayments IPN] Signature verification failed!");
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }
    }

    // Extract Order ID & Payment Status
    const orderId = body.order_id || body.orderId;
    const paymentStatus = (body.payment_status || body.status || "").toLowerCase();
    const paymentId = body.payment_id || body.paymentId || body.uuid || body.id;

    console.log(`[NOWPayments IPN Event] Order: ${orderId}, Status: ${paymentStatus}, PaymentId: ${paymentId}`);

    if (!orderId) {
      return NextResponse.json({ error: "Missing order_id in webhook payload" }, { status: 400 });
    }

    // ── Order Paid & Confirmed: Trigger Atomic Fulfillment ──
    // NOWPayments: "finished" or "confirmed" means blockchain transfer confirmed & received
    const isCompleted =
      paymentStatus === "finished" ||
      paymentStatus === "confirmed" ||
      paymentStatus === "paid" ||
      paymentStatus === "paid_over";

    if (isCompleted) {
      const fulfillRes = await fulfillOrder(orderId);
      console.log(`[NOWPayments IPN] Fulfillment result for order ${orderId}:`, fulfillRes.success);
    }

    // ── Payment Refund / Reversal: Trigger Atomic Reversal ──
    const isRefund =
      paymentStatus === "refunded" ||
      paymentStatus === "refund_paid" ||
      paymentStatus === "refund_process" ||
      body.type === "refund";

    if (isRefund) {
      const { handlePaymentReversal } = await import("@/lib/payment-reversal");
      const eventId = String(body.payment_id || body.uuid || `nowpay_${orderId}_${paymentStatus}`);
      console.log(`[NOWPayments IPN] Processing reversal for order ${orderId}, status: ${paymentStatus}`);

      await handlePaymentReversal({
        provider: "nowpayments",
        eventId,
        eventType: `nowpayments.${paymentStatus || "refund"}`,
        reversalType: "refund",
        orderId,
        providerPaymentId: paymentId ? String(paymentId) : undefined,
        amount: body.price_amount ? parseFloat(body.price_amount) : undefined,
        currency: (body.price_currency || "USD").toUpperCase(),
        reason: `NOWPayments refund status: ${paymentStatus}`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[NOWPayments Webhook Error]:", err);
    return NextResponse.json({ error: err.message || "Webhook processing failed" }, { status: 500 });
  }
}

// Allow GET for webhook health checks
export async function GET() {
  return NextResponse.json({
    status: "active",
    gateway: "NOWPayments",
    timestamp: new Date().toISOString(),
  });
}
