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

export interface FulfillOrderOptions {
  accessSecret?: string;
}

/**
 * Idempotent, atomic fulfillment of an order.
 * Safe against concurrent invocations (Webhook + Client Verification) using row-level locking.
 */
export async function fulfillOrder(
  orderId: string,
  options?: FulfillOrderOptions
): Promise<FulfillOrderResult> {
  let deliveredKeyValues: string[] = [];
  let emailPayload: any = null;
  let alreadyCompleted = false;

  try {
    await db.transaction(async (tx) => {
      // 1. Fetch and verify order status with row-level locking (Idempotency & Concurrency Guard)
      const orderRows = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .for("update");

      const order = orderRows[0];

      if (!order) {
        throw new Error(`Order ${orderId} not found`);
      }

      if (order.paymentStatus === "completed") {
        // Already fulfilled safely by another handler
        alreadyCompleted = true;
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
        let availableKeys: any[] = [];

        // Strict variant matching: do not silently substitute keys from other variants
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
        } else {
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
            `Insufficient stock during fulfillment for requested variant. Needed ${quantity}, found ${availableKeys.length}`
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

        const sellerBalRows = await tx
          .select()
          .from(sellerBalances)
          .where(eq(sellerBalances.userId, sellerId))
          .for("update");

        const sellerBal = sellerBalRows[0];

        const currentAvailable = sellerBal ? parseFloat(sellerBal.availableBalance || "0") : 0;
        const currentPending = sellerBal ? parseFloat(sellerBal.pendingBalance || "0") : 0;
        const currentEarned = sellerBal ? parseFloat(sellerBal.totalEarned || "0") : 0;

        if (!sellerBal) {
          const newBalId = crypto.randomUUID();
          await tx.insert(sellerBalances).values({
            id: newBalId,
            userId: sellerId,
            availableBalance: "0.00",
            pendingBalance: netSellerCredit.toFixed(2),
            totalEarned: totalAmountNum.toFixed(2),
            totalWithdrawn: "0.00",
          });

          // Ledger transaction entry (unreleased pending escrow)
          await tx.insert(balanceTransactions).values({
            id: crypto.randomUUID(),
            userId: sellerId,
            orderId: order.id,
            type: "sale",
            amount: totalAmountNum.toFixed(2),
            feeAmount: totalFees.toFixed(2),
            netAmount: netSellerCredit.toFixed(2),
            currency: order.currency || "USD",
            description: `Sale (${quantity}x): ${product.title} (${order.buyerEmail}) [Fee: $${totalFees.toFixed(2)}]`,
            isReleased: false,
          });
        } else if (currentAvailable < 0) {
          // Merchant has outstanding debt (negative available balance).
          // Subsequent sale first repays the debt, and any surplus moves to available balance.
          const currentDebt = Math.abs(currentAvailable);
          const debtRepaid = Math.min(netSellerCredit, currentDebt);
          const surplus = netSellerCredit - debtRepaid;

          const newAvailable = (currentAvailable + debtRepaid + surplus).toFixed(2);
          const newEarned = (currentEarned + totalAmountNum).toFixed(2);

          await tx
            .update(sellerBalances)
            .set({
              availableBalance: newAvailable,
              totalEarned: newEarned,
              updatedAt: new Date(),
            })
            .where(eq(sellerBalances.userId, sellerId));

          // Record main sale ledger entry
          await tx.insert(balanceTransactions).values({
            id: crypto.randomUUID(),
            userId: sellerId,
            orderId: order.id,
            type: "sale",
            amount: totalAmountNum.toFixed(2),
            feeAmount: totalFees.toFixed(2),
            netAmount: netSellerCredit.toFixed(2),
            currency: order.currency || "USD",
            description: `Sale (${quantity}x): ${product.title} (${order.buyerEmail}) [Applied to debt & balance]`,
            isReleased: true,
            releasedAt: new Date(),
          });

          // Record debt settlement ledger transaction
          if (debtRepaid > 0) {
            await tx.insert(balanceTransactions).values({
              id: crypto.randomUUID(),
              userId: sellerId,
              orderId: order.id,
              type: "debt_settlement",
              amount: debtRepaid.toFixed(2),
              feeAmount: "0.00",
              netAmount: debtRepaid.toFixed(2),
              currency: order.currency || "USD",
              description: `Automatic debt repayment of $${debtRepaid.toFixed(2)} from sale #${order.id.slice(0, 8)}`,
              isReleased: true,
              releasedAt: new Date(),
            });
          }
        } else {
          // Normal flow: credit pending balance
          const newPending = (currentPending + netSellerCredit).toFixed(2);
          const newEarned = (currentEarned + totalAmountNum).toFixed(2);

          await tx
            .update(sellerBalances)
            .set({
              pendingBalance: newPending,
              totalEarned: newEarned,
              updatedAt: new Date(),
            })
            .where(eq(sellerBalances.userId, sellerId));

          // Ledger transaction entry (unreleased pending escrow)
          await tx.insert(balanceTransactions).values({
            id: crypto.randomUUID(),
            userId: sellerId,
            orderId: order.id,
            type: "sale",
            amount: totalAmountNum.toFixed(2),
            feeAmount: totalFees.toFixed(2),
            netAmount: netSellerCredit.toFixed(2),
            currency: order.currency || "USD",
            description: `Sale (${quantity}x): ${product.title} (${order.buyerEmail}) [Fee: $${totalFees.toFixed(2)}]`,
            isReleased: false,
          });
        }

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
          accessSecret: options?.accessSecret,
          keys:
            deliveredKeyValues.length > 0
              ? deliveredKeyValues
              : ["Manual Fulfillment — Seller will deliver directly."],
          customNote: product.receiptNote || null,
        };
      }
    });

    if (alreadyCompleted) {
      return {
        success: true,
        orderId,
        alreadyFulfilled: true,
      };
    }

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
