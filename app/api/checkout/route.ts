import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { shops, products, inventoryKeys, orders, coupons } from "@/lib/db/schema";
import { eq, and, count } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import { env } from "@/config";
import { fulfillOrder } from "@/lib/order-fulfillment";
import { checkoutSchema } from "@/lib/validations/checkout";
import { isDisposableEmail } from "@/lib/anti-fraud/disposable-email";
import { generateOrderAccessToken } from "@/lib/order-auth";
import { rateLimit, rateLimitPresets, getClientIp, createRateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const headersList = await headers();
    const clientIp = getClientIp(headersList);

    // Rate Limiting Guard (Prevents card testing, bot spam, and inventory locking)
    const rateCheck = rateLimit({
      key: `checkout:${clientIp}`,
      ...rateLimitPresets.checkout,
    });
    if (!rateCheck.allowed) {
      return createRateLimitResponse(
        rateCheck,
        "Too many checkout attempts from this IP address. Please wait a moment before trying again."
      );
    }

    const body = await req.json();
    const result = checkoutSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Invalid checkout payload" },
        { status: 400 }
      );
    }

    const { productId, buyerEmail, paymentMethod, quantity, couponId, variantId, duration: reqDuration } = result.data;
    const parsedQty = quantity;

    // Anti-Fraud: Block temporary and burner email addresses
    if (isDisposableEmail(buyerEmail)) {
      return NextResponse.json(
        {
          error: "Disposable and temporary email addresses are not permitted. Please use a permanent email address (e.g. Gmail, Outlook, iCloud) to ensure your receipt and digital license keys are securely delivered.",
        },
        { status: 400 }
      );
    }

    // 2. Fetch product & shop
    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
    });

    if (!product || !product.isActive) {
      return NextResponse.json({ error: "Product not found or unavailable" }, { status: 404 });
    }

    const shop = await db.query.shops.findFirst({
      where: eq(shops.id, product.shopId),
    });

    if (!shop || !shop.isActive) {
      return NextResponse.json({ error: "Store is currently inactive" }, { status: 404 });
    }

    // Determine variant & unit price
    let chosenVariant: any = null;
    let chosenDuration = product.duration || "lifetime";
    let chosenDurationDays = product.durationDays ?? 0;
    let unitPriceNum = parseFloat(product.price);

    if (product.variants) {
      try {
        const parsedVariants = JSON.parse(product.variants);
        if (Array.isArray(parsedVariants) && parsedVariants.length > 0) {
          if (variantId) {
            chosenVariant = parsedVariants.find((v: any) => v.id === variantId);
          } else if (reqDuration) {
            chosenVariant = parsedVariants.find((v: any) => v.duration === reqDuration);
          }
          if (!chosenVariant && parsedVariants[0]) {
            chosenVariant = parsedVariants[0];
          }
          if (chosenVariant) {
            unitPriceNum = parseFloat(chosenVariant.price) || unitPriceNum;
            chosenDuration = chosenVariant.duration || chosenDuration;
            chosenDurationDays = chosenVariant.durationDays !== undefined ? chosenVariant.durationDays : chosenDurationDays;
          }
        }
      } catch {}
    } else if (reqDuration) {
      chosenDuration = reqDuration;
    }

    // Store approval security check:
    // If shop is not accepted, only owner or admin can test checkout
    if (!shop.isAccepted) {
      const headersList = await headers();
      const session = await auth.api.getSession({ headers: headersList });
      const isOwner = session?.user?.id && session.user.id === shop.userId;
      const isAdmin =
        session?.user &&
        ((session.user as any).role === "admin" || (session.user as any).role === "superadmin");

      if (!isOwner && !isAdmin) {
        return NextResponse.json(
          { error: "This store is pending platform review and cannot accept purchases yet." },
          { status: 403 }
        );
      }
    }

    // 3. Check stock if type is 'key'
    if (product.type === "key") {
      const unusedKeys = await db
        .select({ count: count() })
        .from(inventoryKeys)
        .where(and(eq(inventoryKeys.productId, productId), eq(inventoryKeys.isUsed, false)));

      const availableCount = unusedKeys[0]?.count || 0;
      if (availableCount < parsedQty) {
        return NextResponse.json(
          { error: `Out of stock. Only ${availableCount} key(s) remaining.` },
          { status: 400 }
        );
      }
    }

    let totalAmountNum = unitPriceNum * parsedQty;

    // 4. Secure Coupon Validation (Scoped to Shop & Usage Limits)
    let validCouponId: string | null = null;
    if (couponId) {
      const couponRecord = await db.query.coupons.findFirst({
        where: and(
          eq(coupons.id, couponId),
          eq(coupons.shopId, product.shopId), // MUST belong to this shop
          eq(coupons.isActive, true)
        ),
      });

      if (couponRecord) {
        if (!couponRecord.maxUses || couponRecord.usedCount < couponRecord.maxUses) {
          validCouponId = couponRecord.id;
          if (couponRecord.discountPercent) {
            const discountFactor = Math.max(0, 1 - couponRecord.discountPercent / 100);
            totalAmountNum = totalAmountNum * discountFactor;
          } else if (couponRecord.discountAmount) {
            totalAmountNum = Math.max(0, totalAmountNum - parseFloat(couponRecord.discountAmount));
          }
        }
      }
    }

    const orderId = crypto.randomUUID();
    const { generateOrderBearerSecret, hashOrderBearerSecret } = await import("@/lib/order-auth");
    const bearerSecret = generateOrderBearerSecret();
    const secretHash = hashOrderBearerSecret(bearerSecret);

    // 5. Create order record with variant, duration, and cryptographically random secret hash
    await db.insert(orders).values({
      id: orderId,
      shopId: product.shopId,
      productId: product.id,
      variantId: chosenVariant?.id || variantId || null,
      couponId: validCouponId,
      buyerEmail: buyerEmail.trim().toLowerCase(),
      quantity: parsedQty,
      unitPrice: unitPriceNum.toFixed(2),
      totalAmount: totalAmountNum.toFixed(2),
      currency: product.currency || "USD",
      paymentMethod,
      paymentStatus: "pending",
      accessSecretHash: secretHash,
      fulfilledAt: null,
      keyDuration: chosenDuration,
      keyDurationDays: chosenDurationDays,
    });

    const appUrl = env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // 5b. Immediate fulfillment for free orders (100% coupon promo)
    if (totalAmountNum <= 0) {
      await fulfillOrder(orderId, { accessSecret: bearerSecret });
      return NextResponse.json({
        success: true,
        orderId,
        checkoutUrl: `${appUrl}/order/${orderId}?secret=${bearerSecret}`,
      });
    }

    // 6. Handle Real Stripe Hosted Checkout Session (Sandbox / Live)
    if (paymentMethod === "stripe" || paymentMethod === "card") {
      const unitAmountInCents = Math.round((totalAmountNum / parsedQty) * 100);

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: (product.currency || "usd").toLowerCase(),
              product_data: {
                name: `${product.title} — ${shop.name}`,
                description: product.description ? product.description.slice(0, 250) : undefined,
              },
              unit_amount: unitAmountInCents,
            },
            quantity: parsedQty,
          },
        ],
        mode: "payment",
        customer_email: buyerEmail.trim().toLowerCase(),
        success_url: `${appUrl}/order/${orderId}?session_id={CHECKOUT_SESSION_ID}&secret=${bearerSecret}`,
        cancel_url: `${appUrl}/${shop.slug}/product/${product.id}?canceled=1`,
        metadata: {
          orderId,
          productId: product.id,
          shopId: product.shopId,
          quantity: parsedQty.toString(),
        },
      });

      await db
        .update(orders)
        .set({ stripePaymentIntentId: session.id })
        .where(eq(orders.id, orderId));

      return NextResponse.json({
        success: true,
        orderId,
        checkoutUrl: session.url,
      });
    }

    // 7. Handle Crypto Payment via NOWPayments
    if (paymentMethod === "crypto") {
      const appUrl = env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const { createNowPaymentsInvoice } = await import("@/lib/nowpayments");
      const nowpaymentsRes = await createNowPaymentsInvoice({
        orderId,
        priceAmount: totalAmountNum,
        priceCurrency: (product.currency || "usd").toLowerCase(),
        orderDescription: `Order #${orderId.slice(0, 8)} - ${product.title}`,
        ipnCallbackUrl: `${appUrl}/api/webhooks/crypto`,
        successUrl: `${appUrl}/order/${orderId}?secret=${bearerSecret}&crypto=1`,
        cancelUrl: `${appUrl}/order/${orderId}?canceled=true`,
      });

      if (nowpaymentsRes.success && nowpaymentsRes.invoiceUrl) {
        await db
          .update(orders)
          .set({ cryptoPaymentId: nowpaymentsRes.id || orderId })
          .where(eq(orders.id, orderId));

        return NextResponse.json({
          success: true,
          orderId,
          checkoutUrl: nowpaymentsRes.invoiceUrl,
        });
      }

      return NextResponse.json(
        {
          error: nowpaymentsRes.error || "NOWPayments live checkout initialization failed.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
  } catch (err: any) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: err.message || "Failed to process checkout" }, { status: 500 });
  }
}
