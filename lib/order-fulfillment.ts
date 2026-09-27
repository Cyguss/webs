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

      // 2. Assign digital keys if product type is 'key' (Atomic row-level lock prevents double-spend)
      if (product.type === "key") {
        const availableKeys = await tx
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

        if (availableKeys.length < quantity) {
          throw new Error(
            `Insufficient stock during fulfillment. Needed ${quantity}, found ${availableKeys.length}`
          );
        }

        for (const key of availableKeys) {
          await tx
            .update(inventoryKeys)
            .set({ isUsed: true, usedAt: new Date(), orderId: order.id })
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

      // 3. Mark order as completed
      await tx
        .update(orders)
        .set({
          paymentStatus: "completed",
          fulfilledAt: new Date(),
          updatedAt: new Date(),
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
        const platformFeePercent = parseFloat(process.env.PLATFORM_FEE_PERCENT || "5") / 100;
        const platformFee = totalAmountNum * platformFeePercent;
        const totalFees = gatewayFee + platformFee;
        const netSellerCredit = Math.max(0, totalAmountNum - totalFees);

        let sellerBal = await tx.query.sellerBalances.findFirst({
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
