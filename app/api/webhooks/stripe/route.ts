import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { env } from "@/config";
import { fulfillOrder } from "@/lib/order-fulfillment";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const sig = req.headers.get("stripe-signature");

    let event: any;
    const webhookSecret = (env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET || "").trim();

    if (process.env.NODE_ENV === "production" || (webhookSecret && webhookSecret.startsWith("whsec_"))) {
      if (!sig || !webhookSecret) {
        console.error("[Stripe Webhook] Missing stripe-signature header or webhook secret.");
        return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
      }

      try {
        event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
      } catch (err: any) {
        console.error("[Stripe Webhook Signature Verification Failed]:", err.message);
        return NextResponse.json({ error: `Signature verification failed: ${err.message}` }, { status: 400 });
      }
    } else {
      // In local development sandbox ONLY without Stripe CLI forwarding
      console.warn("[Stripe Webhook] DEV MODE: Parsing raw webhook payload without signature verification.");
      try {
        event = JSON.parse(rawBody);
      } catch {
        return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
      }
    }

    if (!event || !event.type) {
      return NextResponse.json({ error: "Invalid event payload" }, { status: 400 });
    }

    console.log(`[Stripe Webhook Event Received]: ${event.type}`);

    // Handle checkout session completed
    if (event.type === "checkout.session.completed") {
      const session = event.data?.object;
      const orderId = session?.metadata?.orderId;

      if (orderId && session.payment_status === "paid") {
        console.log(`[Stripe Webhook] Fulfilling order ${orderId} from completed session`);
        await fulfillOrder(orderId);
      }
    }

    // Handle payment intent succeeded
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data?.object;
      const orderId = paymentIntent?.metadata?.orderId;

      if (orderId) {
        console.log(`[Stripe Webhook] Fulfilling order ${orderId} from succeeded payment intent`);
        await fulfillOrder(orderId);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("[Stripe Webhook Handler Error]:", err);
    return NextResponse.json({ error: err.message || "Webhook processing failed" }, { status: 500 });
  }
}
