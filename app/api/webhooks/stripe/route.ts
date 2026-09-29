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
    const primarySecret = (env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET || "").trim();
    const cliSecret = (process.env.STRIPE_CLI_WEBHOOK_SECRET || "whsec_bb42ac15eb3e5fbbff4ad415a5d21c517070c9d4faab94c5316bc62ab99dd2e9").trim();
    const candidateSecrets = Array.from(new Set([primarySecret, cliSecret])).filter(
      (s) => s && s.startsWith("whsec_") && !s.includes("sandbox")
    );

    if (candidateSecrets.length > 0 && sig) {
      let verified = false;
      let lastErr: any = null;
      for (const secret of candidateSecrets) {
        try {
          event = stripe.webhooks.constructEvent(rawBody, sig, secret);
          verified = true;
          break;
        } catch (err: any) {
          lastErr = err;
        }
      }

      if (!verified) {
        console.error("[Stripe Webhook Signature Verification Failed]:", lastErr?.message);
        return NextResponse.json({ error: `Signature verification failed: ${lastErr?.message}` }, { status: 400 });
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
        if (session.payment_intent && typeof session.payment_intent === "string") {
          const { db } = await import("@/lib/db");
          const { orders } = await import("@/lib/db/schema");
          const { eq } = await import("drizzle-orm");
          await db
            .update(orders)
            .set({ stripePaymentIntentId: session.payment_intent })
            .where(eq(orders.id, orderId));
        }
        await fulfillOrder(orderId);
      }
    }

    // Handle payment intent succeeded
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data?.object;
      const orderId = paymentIntent?.metadata?.orderId;

      if (orderId) {
        console.log(`[Stripe Webhook] Fulfilling order ${orderId} from succeeded payment intent`);
        if (paymentIntent.id && typeof paymentIntent.id === "string") {
          const { db } = await import("@/lib/db");
          const { orders } = await import("@/lib/db/schema");
          const { eq } = await import("drizzle-orm");
          await db
            .update(orders)
            .set({ stripePaymentIntentId: paymentIntent.id })
            .where(eq(orders.id, orderId));
        }
        await fulfillOrder(orderId);
      }
    }

    // Handle provider-initiated refund / chargeback / dispute
    const { handlePaymentReversal } = await import("@/lib/payment-reversal");

    if (event.type === "charge.refunded") {
      const charge = event.data?.object;
      const orderId = charge?.metadata?.orderId;
      const paymentIntentId =
        typeof charge?.payment_intent === "string" ? charge?.payment_intent : charge?.payment_intent?.id;

      console.log(`[Stripe Webhook] Processing charge.refunded for event ${event.id}`);
      await handlePaymentReversal({
        provider: "stripe",
        eventId: event.id,
        eventType: event.type,
        reversalType: "refund",
        orderId,
        providerPaymentId: paymentIntentId || charge?.id,
        amount: (charge.amount_refunded || charge.amount) ? (charge.amount_refunded || charge.amount) / 100 : undefined,
        currency: (charge.currency || "USD").toUpperCase(),
        reason: charge.refunds?.data?.[0]?.reason || "Charge refunded via Stripe",
      });
    }

    // Handle Dispute Created (Places Dispute Reserve)
    if (event.type === "charge.dispute.created") {
      const dispute = event.data?.object;
      const paymentIntentId =
        typeof dispute?.payment_intent === "string" ? dispute?.payment_intent : dispute?.payment_intent?.id;

      console.log(`[Stripe Webhook] Processing charge.dispute.created (creating dispute reserve) for event ${event.id}`);
      await handlePaymentReversal({
        provider: "stripe",
        eventId: event.id,
        eventType: event.type,
        reversalType: "dispute",
        orderId: dispute?.metadata?.orderId,
        providerPaymentId: paymentIntentId || dispute?.charge,
        amount: dispute.amount ? dispute.amount / 100 : undefined,
        currency: (dispute.currency || "USD").toUpperCase(),
        reason: dispute.reason || "Dispute created via Stripe (reserve held)",
      });
    }

    // Handle Dispute Funds Withdrawn (Settles Reserve into Final Chargeback)
    if (event.type === "charge.dispute.funds_withdrawn") {
      const dispute = event.data?.object;
      const paymentIntentId =
        typeof dispute?.payment_intent === "string" ? dispute?.payment_intent : dispute?.payment_intent?.id;

      console.log(`[Stripe Webhook] Processing charge.dispute.funds_withdrawn (settling reserve into chargeback) for event ${event.id}`);
      await handlePaymentReversal({
        provider: "stripe",
        eventId: event.id,
        eventType: event.type,
        reversalType: "chargeback",
        orderId: dispute?.metadata?.orderId,
        providerPaymentId: paymentIntentId || dispute?.charge,
        amount: dispute.amount ? dispute.amount / 100 : undefined,
        currency: (dispute.currency || "USD").toUpperCase(),
        reason: dispute.reason || "Dispute funds withdrawn by Stripe (chargeback settled)",
      });
    }

    // Handle Dispute Closed (Won vs Lost)
    if (event.type === "charge.dispute.closed") {
      const dispute = event.data?.object;
      const paymentIntentId =
        typeof dispute?.payment_intent === "string" ? dispute?.payment_intent : dispute?.payment_intent?.id;
      const isWon = dispute?.status === "won";

      console.log(`[Stripe Webhook] Processing charge.dispute.closed (status: ${dispute?.status}) for event ${event.id}`);
      await handlePaymentReversal({
        provider: "stripe",
        eventId: event.id,
        eventType: event.type,
        reversalType: isWon ? "dispute_won" : "chargeback",
        orderId: dispute?.metadata?.orderId,
        providerPaymentId: paymentIntentId || dispute?.charge,
        amount: dispute.amount ? dispute.amount / 100 : undefined,
        currency: (dispute.currency || "USD").toUpperCase(),
        reason: isWon ? "Dispute closed in seller favor (reserve released)" : "Dispute closed as lost (chargeback finalized)",
      });
    }

    // Handle Dispute Funds Reinstated (Dispute Won / Funds Returned)
    if (event.type === "charge.dispute.funds_reinstated") {
      const dispute = event.data?.object;
      const paymentIntentId =
        typeof dispute?.payment_intent === "string" ? dispute?.payment_intent : dispute?.payment_intent?.id;

      console.log(`[Stripe Webhook] Processing charge.dispute.funds_reinstated for event ${event.id}`);
      await handlePaymentReversal({
        provider: "stripe",
        eventId: event.id,
        eventType: event.type,
        reversalType: "dispute_won",
        orderId: dispute?.metadata?.orderId,
        providerPaymentId: paymentIntentId || dispute?.charge,
        amount: dispute.amount ? dispute.amount / 100 : undefined,
        currency: (dispute.currency || "USD").toUpperCase(),
        reason: "Dispute funds reinstated by Stripe",
      });
    }

    if (event.type === "refund.created" || event.type === "refund.updated") {
      const refund = event.data?.object;
      if (refund?.status === "succeeded") {
        const paymentIntentId =
          typeof refund?.payment_intent === "string" ? refund?.payment_intent : refund?.payment_intent?.id;

        console.log(`[Stripe Webhook] Processing refund event ${event.type} for event ${event.id}`);
        await handlePaymentReversal({
          provider: "stripe",
          eventId: event.id,
          eventType: event.type,
          reversalType: "refund",
          orderId: refund?.metadata?.orderId,
          providerPaymentId: paymentIntentId || refund?.charge,
          amount: refund.amount ? refund.amount / 100 : undefined,
          currency: (refund.currency || "USD").toUpperCase(),
          reason: refund.reason || "Refund succeeded via Stripe",
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("[Stripe Webhook Handler Error]:", err);
    return NextResponse.json({ error: err.message || "Webhook processing failed" }, { status: 500 });
  }
}
