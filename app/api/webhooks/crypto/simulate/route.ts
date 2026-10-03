import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // CRITICAL SECURITY GUARD: Simulation is strictly disabled in production unless sandbox is explicitly enabled
  const isSandbox = (process.env.NOWPAYMENTS_SANDBOX || "false").toLowerCase() === "true";
  if (process.env.NODE_ENV === "production" && !isSandbox) {
    return NextResponse.json(
      { error: "Payment simulation is strictly forbidden in production mode without sandbox enabled." },
      { status: 403 }
    );
  }

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

    const totalAmount = parseFloat(order.totalAmount).toFixed(2);

    const payload = {
      payment_id: `sim_${crypto.randomUUID().slice(0, 16)}`,
      payment_status: "finished",
      pay_address: "TXq98y2nU19283741829374918237912TRC20",
      price_amount: parseFloat(totalAmount),
      price_currency: "usd",
      pay_amount: parseFloat(totalAmount),
      actually_paid: parseFloat(totalAmount),
      pay_currency: "usdttrc20",
      order_id: order.id,
      order_description: `Order #${order.id.slice(0, 8)}`,
      purchase_id: order.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const ipnSecret = (process.env.NOWPAYMENTS_IPN_SECRET || "").trim();
    const sortedString = JSON.stringify(payload, Object.keys(payload).sort());
    const nowpaymentsSig = ipnSecret
      ? crypto.createHmac("sha512", ipnSecret).update(sortedString).digest("hex")
      : "dev_test_sig";

    // Call the actual crypto webhook handler internally
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const webhookRes = await fetch(`${appUrl}/api/webhooks/crypto`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-nowpayments-sig": nowpaymentsSig,
      },
      body: JSON.stringify(payload),
    });

    const resJson = await webhookRes.json();
    return NextResponse.json({ success: true, webhookResponse: resJson });
  } catch (err: any) {
    console.error("[Crypto Simulate Error]:", err);
    return NextResponse.json({ error: err.message || "Failed to simulate payment" }, { status: 500 });
  }
}
