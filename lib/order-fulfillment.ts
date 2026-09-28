import { db } from "@/lib/db";
import {
  orders,
  products,
  inventoryKeys,
  orderDeliveries,
  sellerBalances,
  balanceTransactions,
  coupons,
  shops,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { sendOrderDeliveryEmail } from "@/lib/email";
import { dispatchWebhookEvent, sendDiscordSaleNotification } from "@/lib/webhooks";
import { calculateExpirationDate, getKeyDurationDisplay } from "@/lib/key-duration";

export interface FulfillOrderResult {
  success: boolean;
  orderId: string;
  alreadyFulfilled?: boolean;
  keysDelivered?: string[];
  error?: string;
}

/**
 * Idempotent, atomic fulfillment of an order.
 * Safe against concurrent invocations (Webhook + Client Verification).
 */
export async function fulfillOrder(orderId: string): Promise<FulfillOrderResult> {
  let deliveredKeyValues: string[] = [];
  let emailPayload: any = null;

  try {
    await db.transaction(async (tx) => {
      // 1. Fetch and verify order status (Idempotency Guard)
      const order = await tx.query.orders.findFirst({
        where: eq(orders.id, orderId),
      });

      if (!order) {
        throw new Error(`Order ${orderId} not found`);
      }

      if (order.paymentStatus === "completed") {
        // Already fulfilled safely by another handler
        return;
      }

      const product = await tx.query.products.findFirst({
        where: eq(products.id, order.productId),
      });

      if (!product) {
        throw new Error(`Product ${order.productId} not found`);
      }

      const shop = await tx.query.shops.findFirst({
        where: eq(shops.id, order.shopId),
      });

      const quantity = order.quantity || 1;
      const totalAmountNum = parseFloat(order.totalAmount);
      const now = new Date();

      let assignedDuration = order.keyDuration || product.duration || "lifetime";
      let assignedDurationDays = order.keyDurationDays ?? product.durationDays ?? 0;
      let keyExpiresAt: Date | null = null;

      // 2. Assign digital keys if product type is 'key' (Atomic row-level lock prevents double-spend)
      if (product.type === "key") {
        // Try to find keys matching specific duration variant first, or fallback to any available unused key
        let availableKeys: any[] = [];
        if (order.variantId || order.keyDuration) {
          availableKeys = await tx
            .select()
            .from(inventoryKeys)
            .where(
              and(
                eq(inventoryKeys.productId, product.id),
                eq(inventoryKeys.isUsed, false),
                order.variantId
                  ? eq(inventoryKeys.variantId, order.variantId)
                  : eq(inventoryKeys.duration, order.keyDuration || "lifetime")
              )
            )
            .limit(quantity)
            .for("update");
        }

        if (availableKeys.length < quantity) {
          // Fallback to any unused keys for this product
          availableKeys = await tx
            .select()
            .from(inventoryKeys)
            .where(
              and(
                eq(inventoryKeys.productId, product.id),
                eq(inventoryKeys.isUsed, false)
              )
            )
            .limit(quantity)
            .for("update");
        }

        if (availableKeys.length < quantity) {
          throw new Error(
            `Insufficient stock during fulfillment. Needed ${quantity}, found ${availableKeys.length}`
          );
        }

        // Inherit key duration from assigned key, order, or product
        assignedDuration = availableKeys[0]?.duration || order.keyDuration || product.duration || "lifetime";
        assignedDurationDays = availableKeys[0]?.durationDays ?? order.keyDurationDays ?? product.durationDays ?? 0;
        keyExpiresAt = calculateExpirationDate(now, assignedDuration, assignedDurationDays);

        for (const key of availableKeys) {
          await tx
            .update(inventoryKeys)
            .set({ isUsed: true, usedAt: now, orderId: order.id })
            .where(and(eq(inventoryKeys.id, key.id), eq(inventoryKeys.isUsed, false)));
        }

        deliveredKeyValues = availableKeys.map((k) => k.keyValue);

        await tx.insert(orderDeliveries).values({
          id: crypto.randomUUID(),
          orderId: order.id,
          deliveryType: "key",
          deliveryValue: deliveredKeyValues.join("\n"),
        });
      } else {
        // Service / file / manual fulfillment
        await tx.insert(orderDeliveries).values({
          id: crypto.randomUUID(),
          orderId: order.id,
          deliveryType: "manual",
          deliveryValue: "Order received. Seller will deliver directly to buyer email.",
        });
      }

      // 3. Mark order as completed with calculated key validity
      await tx
        .update(orders)
        .set({
          paymentStatus: "completed",
          fulfilledAt: now,
          keyDuration: assignedDuration,
          keyDurationDays: assignedDurationDays,
          keyExpiresAt: keyExpiresAt,
          updatedAt: now,
        })
        .where(eq(orders.id, order.id));

      // 4. Increment coupon use count if applied
      if (order.couponId) {
        const couponRecord = await tx.query.coupons.findFirst({
          where: eq(coupons.id, order.couponId),
        });
        if (couponRecord) {
          await tx
            .update(coupons)
            .set({ usedCount: couponRecord.usedCount + 1 })
            .where(eq(coupons.id, order.couponId));
        }
      }

      // 5. Credit Seller Pending Balance & record ledger transaction
      if (shop) {
        const sellerId = shop.userId;
        const isStripe = order.paymentMethod === "stripe" || order.paymentMethod === "card";
        const gatewayFee = isStripe ? (totalAmountNum * 0.029 + 0.3) : (totalAmountNum * 0.01);
        
        // Fetch dynamic platform fee percent from platform settings
        let feePercent = 5.0;
        try {
          const { getPlatformFeePercent } = await import("@/lib/platform-settings");
          feePercent = await getPlatformFeePercent();
        } catch {
          feePercent = parseFloat(process.env.PLATFORM_FEE_PERCENT || "5");
        }
        const platformFeePercent = (isNaN(feePercent) ? 5.0 : feePercent) / 100;
        const platformFee = totalAmountNum * platformFeePercent;
        const totalFees = gatewayFee + platformFee;
        const netSellerCredit = Math.max(0, totalAmountNum - totalFees);

        const sellerBal = await tx.query.sellerBalances.findFirst({
          where: eq(sellerBalances.userId, sellerId),
        });

        if (!sellerBal) {
          const newBalId = crypto.randomUUID();
          await tx.insert(sellerBalances).values({
            id: newBalId,
            userId: sellerId,
            availableBalance: "0",
            pendingBalance: netSellerCredit.toFixed(2),
            totalEarned: totalAmountNum.toFixed(2),
            totalWithdrawn: "0",
          });
        } else {
          const newPending = (
            parseFloat(sellerBal.pendingBalance) + netSellerCredit
          ).toFixed(2);
          const newEarned = (
            parseFloat(sellerBal.totalEarned) + totalAmountNum
          ).toFixed(2);

          await tx
            .update(sellerBalances)
            .set({
              pendingBalance: newPending,
              totalEarned: newEarned,
              updatedAt: new Date(),
            })
            .where(eq(sellerBalances.userId, sellerId));
        }

        // Ledger transaction entry
        await tx.insert(balanceTransactions).values({
          id: crypto.randomUUID(),
          userId: sellerId,
          orderId: order.id,
          type: "sale",
          amount: totalAmountNum.toFixed(2),
          feeAmount: totalFees.toFixed(2),
          netAmount: netSellerCredit.toFixed(2),
          description: `Sale (${quantity}x): ${product.title} (${order.buyerEmail}) [Fee: $${totalFees.toFixed(2)}]`,
        });

        const durationInfo = getKeyDurationDisplay(assignedDuration, assignedDurationDays, product.customDurationLabel);
        emailPayload = {
          orderId: order.id,
          shopId: order.shopId,
          buyerEmail: order.buyerEmail,
          shopName: shop.name,
          productTitle: product.title,
          quantity,
          unitPrice: product.price,
          totalAmount: totalAmountNum,
          currency: product.currency || "USD",
          paymentMethod: order.paymentMethod,
          keyDuration: durationInfo.label,
          keyExpiresAt: keyExpiresAt ? keyExpiresAt.toISOString() : null,
          keys:
            deliveredKeyValues.length > 0
              ? deliveredKeyValues
              : ["Manual Fulfillment — Seller will deliver directly."],
          customNote: product.receiptNote || null,
        };
      }
    });

    // 6. Asynchronous Notifications & Webhooks (Dispatched outside transaction)
    if (emailPayload) {
      // A. Buyer delivery email
      try {
        await sendOrderDeliveryEmail(emailPayload);
      } catch (emailErr) {
        console.warn("[Fulfillment] Order delivery email failed gracefully:", emailErr);
      }

      // B. Merchant Discord webhook embed
      try {
        await sendDiscordSaleNotification(emailPayload.shopId, {
          orderId: emailPayload.orderId,
          productTitle: emailPayload.productTitle,
          quantity: emailPayload.quantity,
          totalAmount: emailPayload.totalAmount,
          currency: emailPayload.currency,
          paymentMethod: emailPayload.paymentMethod,
          buyerEmail: emailPayload.buyerEmail,
          keysCount: emailPayload.keys?.length || 1,
        });
      } catch (discordErr) {
        console.warn("[Fulfillment] Discord sale webhook failed gracefully:", discordErr);
      }

      // C. Outbound Webhooks (Developer API)
      try {
        await dispatchWebhookEvent(emailPayload.shopId, "order.completed", {
          orderId: emailPayload.orderId,
          shopId: emailPayload.shopId,
          productTitle: emailPayload.productTitle,
          quantity: emailPayload.quantity,
          totalAmount: emailPayload.totalAmount,
          currency: emailPayload.currency,
          paymentMethod: emailPayload.paymentMethod,
          buyerEmail: emailPayload.buyerEmail,
          keys: emailPayload.keys,
        });
      } catch (webhookErr) {
        console.warn("[Fulfillment] Outbound webhook dispatch failed gracefully:", webhookErr);
      }
    }

    return {
      success: true,
      orderId,
      keysDelivered: deliveredKeyValues,
    };
  } catch (err: any) {
    console.error("[Fulfillment Error]", err);
    return {
      success: false,
      orderId,
      error: err.message || "Failed to fulfill order",
    };
  }
}
