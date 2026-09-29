import { db } from "@/lib/db";
import {
  orders,
  shops,
  sellerBalances,
  balanceTransactions,
  notifications,
  processedWebhookEvents,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import { stripe } from "@/lib/stripe";

export type ProviderType = "stripe" | "nowpayments" | "cryptomus";
export type ReversalType = "refund" | "chargeback" | "reversal" | "dispute" | "dispute_won";

export interface ProviderReversalEvent {
  provider: ProviderType;
  eventId: string;
  eventType: string;
  reversalType: ReversalType;
  orderId?: string;
  providerPaymentId?: string;
  amount?: number;
  currency?: string;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface ReversalResult {
  success: boolean;
  duplicate?: boolean;
  orderId?: string;
  merchantId?: string;
  amountReversed?: number;
  newAvailableBalance?: string;
  newPendingBalance?: string;
  newReserveBalance?: string;
  payoutableBalance?: string;
  isDebt?: boolean;
  debtAmount?: number;
  error?: string;
}

/**
 * Resolves an order given a provider reversal event.
 * Checks direct orderId, providerPaymentId in DB, or retrieves metadata from Stripe if needed.
 */
async function resolveOrder(
  event: ProviderReversalEvent
): Promise<typeof orders.$inferSelect | null> {
  // 1. Direct order ID matching
  if (event.orderId) {
    const directOrder = await db.query.orders.findFirst({
      where: eq(orders.id, event.orderId),
    });
    if (directOrder) return directOrder;
  }

  // 2. Provider payment ID lookup
  if (event.providerPaymentId) {
    if (event.provider === "stripe") {
      // Check if stripePaymentIntentId matches session ID or payment intent ID
      const orderMatch = await db.query.orders.findFirst({
        where: eq(orders.stripePaymentIntentId, event.providerPaymentId),
      });
      if (orderMatch) return orderMatch;

      // If providerPaymentId is a Charge (ch_...) or PaymentIntent (pi_...), query Stripe for metadata
      if (
        event.providerPaymentId.startsWith("ch_") ||
        event.providerPaymentId.startsWith("pi_") ||
        event.providerPaymentId.startsWith("cs_")
      ) {
        try {
          let resolvedOrderId: string | undefined;

          if (event.providerPaymentId.startsWith("ch_")) {
            const charge = await stripe.charges.retrieve(event.providerPaymentId);
            resolvedOrderId = charge.metadata?.orderId;
            if (!resolvedOrderId && charge.payment_intent) {
              const piId =
                typeof charge.payment_intent === "string"
                  ? charge.payment_intent
                  : charge.payment_intent.id;
              const piMatch = await db.query.orders.findFirst({
                where: eq(orders.stripePaymentIntentId, piId),
              });
              if (piMatch) return piMatch;
            }
          } else if (event.providerPaymentId.startsWith("pi_")) {
            const pi = await stripe.paymentIntents.retrieve(event.providerPaymentId);
            resolvedOrderId = pi.metadata?.orderId;
          }

          if (resolvedOrderId) {
            const orderFromMeta = await db.query.orders.findFirst({
              where: eq(orders.id, resolvedOrderId),
            });
            if (orderFromMeta) return orderFromMeta;
          }
        } catch {
          // Stripe API call might fail in mock/offline test environments; fall through
        }
      }
    } else if (event.provider === "nowpayments" || event.provider === "cryptomus") {
      // Check cryptoPaymentId or order id
      const orderMatch = await db.query.orders.findFirst({
        where: eq(orders.cryptoPaymentId, event.providerPaymentId),
      });
      if (orderMatch) return orderMatch;

      const directById = await db.query.orders.findFirst({
        where: eq(orders.id, event.providerPaymentId),
      });
      if (directById) return directById;
    }
  }

  return null;
}

/**
 * Atomic, idempotent provider-initiated reversal handler for Stripe and Cryptomus.
 * Handles hold/pending balances, available balances, negative balances (debt),
 * auditable ledger entries, and Merchant Inbox notification dispatch.
 */
export async function handlePaymentReversal(
  event: ProviderReversalEvent
): Promise<ReversalResult> {
  if (!event.eventId || !event.provider) {
    return {
      success: false,
      error: "Missing provider or eventId in reversal payload",
    };
  }

  // 1. Resolve order & verify payment authenticity
  const resolvedOrder = await resolveOrder(event);
  if (!resolvedOrder) {
    console.warn(
      `[Payment Reversal] Order not found for provider payment. Provider: ${event.provider}, eventId: ${event.eventId}, paymentId: ${event.providerPaymentId}`
    );
    return {
      success: false,
      error: `Order not found for provider payment (${event.providerPaymentId || event.orderId || "unknown"})`,
    };
  }

  // Pre-fetch shop and merchantId so we can lock merchant balance FIRST to eliminate deadlocks
  const shop = await db.query.shops.findFirst({
    where: eq(shops.id, resolvedOrder.shopId),
  });

  if (!shop) {
    return {
      success: false,
      error: `Shop not found for order ${resolvedOrder.id}`,
    };
  }

  const merchantId = shop.userId;

  // Retry wrapper for handling rare transient MySQL deadlocks under extreme concurrency
  const MAX_RETRIES = 3;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await db.transaction(async (tx) => {
        // 2. LOCK SELLER BALANCE FIRST (Strict canonical locking order prevents deadlocks)
        const balRows = await tx
          .select()
          .from(sellerBalances)
          .where(eq(sellerBalances.userId, merchantId))
          .for("update");

        let sellerBal = balRows[0];
        if (!sellerBal) {
          const newBalId = crypto.randomUUID();
          await tx.insert(sellerBalances).values({
            id: newBalId,
            userId: merchantId,
            availableBalance: "0.00",
            pendingBalance: "0.00",
            totalEarned: "0.00",
            totalWithdrawn: "0.00",
          });
          const [created] = await tx
            .select()
            .from(sellerBalances)
            .where(eq(sellerBalances.id, newBalId));
          sellerBal = created;
        }

        // 3. Idempotency Check: verify if this event was already processed
        const existingEvents = await tx
          .select()
          .from(processedWebhookEvents)
          .where(
            and(
              eq(processedWebhookEvents.provider, event.provider),
              eq(processedWebhookEvents.eventId, event.eventId)
            )
          );

        if (existingEvents.length > 0) {
          console.log(
            `[Payment Reversal] Duplicate event ${event.eventId} for provider ${event.provider}. Skipping.`
          );
          return {
            success: true,
            duplicate: true,
            orderId: resolvedOrder.id,
            merchantId: existingEvents[0].merchantId || undefined,
          };
        }

        // 4. Lock Order row
        const [order] = await tx
          .select()
          .from(orders)
          .where(eq(orders.id, resolvedOrder.id))
          .for("update");

        if (!order) {
          throw new Error(`Order ${resolvedOrder.id} not found during lock`);
        }

        // 5. Fetch all previous financial transactions for this order
        const orderTransactions = await tx
          .select()
          .from(balanceTransactions)
          .where(
            and(
              eq(balanceTransactions.orderId, order.id),
              eq(balanceTransactions.userId, merchantId)
            )
          );

        const saleTx = orderTransactions.find((t) => t.type === "sale" || t.type === "sale_reversed");
        const existingReserveTx = orderTransactions.find((t) => t.type === "dispute_reserve");
        const existingChargebackTx = orderTransactions.find((t) => t.type === "chargeback" || t.type === "reversal");
        const existingDisputeWonTx = orderTransactions.find((t) => t.type === "dispute_won");
        const existingRefundTxs = orderTransactions.filter((t) => t.type === "refund");

        const grossAmount = saleTx ? parseFloat(saleTx.amount) : parseFloat(order.totalAmount || "0");
        const isReleased = saleTx ? saleTx.isReleased : true;
        const rawDebit = event.amount !== undefined ? event.amount : grossAmount;
        const amountToDebit = typeof rawDebit === "number" ? rawDebit : parseFloat(String(rawDebit || "0"));

        const currentAvailable = parseFloat(sellerBal.availableBalance || "0");
        const currentPending = parseFloat(sellerBal.pendingBalance || "0");
        const currentReserve = parseFloat(sellerBal.reserveBalance || "0");
        const currentEarned = parseFloat(sellerBal.totalEarned || "0");

        let newPending = currentPending;
        let newAvailable = currentAvailable;
        let newReserve = currentReserve;
        let newEarned = currentEarned;
        let notifType = "payment_reversed";
        let notifTitle = "Payment reversed";
        let notifMessage = "";
        let newPaymentStatus = order.paymentStatus;
        let ledgerType: string = event.reversalType;
        let ledgerDescription = "";
        let ledgerAmount = (-grossAmount).toFixed(2);
        let ledgerNetAmount = (-amountToDebit).toFixed(2);

        const orderRef = `#${order.id.slice(0, 8)}`;
        const providerName =
          event.provider === "stripe" ? "Stripe" : event.provider === "nowpayments" ? "NOWPayments" : "Cryptomus";

        // ─────────────────────────────────────────────────────────────────────────────
        // FINANCIAL OPERATION 1: DISPUTE CREATED -> CREATE RESERVE
        // Reserve decreases payoutable amount without touching availableBalance.
        // ─────────────────────────────────────────────────────────────────────────────
        if (event.reversalType === "dispute") {
          // If dispute reserve already placed or order already chargebacked: no-op duplicate
          if (existingReserveTx || existingChargebackTx) {
            console.log(`[Payment Reversal] Dispute reserve/chargeback already recorded for order ${order.id}. Skipping.`);
            return {
              success: true,
              duplicate: true,
              orderId: order.id,
              merchantId,
              newAvailableBalance: currentAvailable.toFixed(2),
              newPendingBalance: currentPending.toFixed(2),
              newReserveBalance: currentReserve.toFixed(2),
            };
          }

          // Create reserve
          newReserve = currentReserve + amountToDebit;
          newPaymentStatus = "disputed";
          ledgerType = "dispute_reserve";
          ledgerDescription = `Dispute reserve of $${amountToDebit.toFixed(2)} held by ${event.provider.toUpperCase()} for order ${orderRef}`;
          notifType = "payment_disputed";
          notifTitle = "Payment dispute opened";
          notifMessage = `A payment dispute of $${amountToDebit.toFixed(2)} for order ${orderRef} was opened via ${providerName}. A reserve of $${amountToDebit.toFixed(2)} is held from your payoutable balance until resolved.`;
        }

        // ─────────────────────────────────────────────────────────────────────────────
        // FINANCIAL OPERATION 2: CHARGEBACK / REVERSAL / FUNDS WITHDRAWN -> SETTLE RESERVE
        // Settles active reserve into actual debit, or directly debits available balance.
        // Never duplicates deduction if reserve was held.
        // ─────────────────────────────────────────────────────────────────────────────
        else if (event.reversalType === "chargeback" || event.reversalType === "reversal") {
          // Duplicate chargeback protection across multiple events (funds_withdrawn, dispute.closed, retry)
          if (existingChargebackTx) {
            console.log(`[Payment Reversal] Chargeback already settled for order ${order.id}. Skipping.`);
            return {
              success: true,
              duplicate: true,
              orderId: order.id,
              merchantId,
              newAvailableBalance: currentAvailable.toFixed(2),
              newPendingBalance: currentPending.toFixed(2),
              newReserveBalance: currentReserve.toFixed(2),
            };
          }

          if (existingReserveTx) {
            // Settle existing reserve: release reserve and debit available
            newReserve = Math.max(0, currentReserve - amountToDebit);
            newAvailable = currentAvailable - amountToDebit;
            ledgerDescription = `Chargeback finalized by ${event.provider.toUpperCase()} (settled from dispute reserve) for order ${orderRef}`;
          } else {
            // No prior reserve: deduct from pending if unreleased, else deduct from available (allowing debt)
            if (saleTx && !isReleased) {
              newPending = Math.max(0, currentPending - amountToDebit);
              await tx
                .update(balanceTransactions)
                .set({
                  type: "sale_reversed",
                  description: `${saleTx.description || "Sale"} [REVERSED by ${event.provider.toUpperCase()}]`,
                })
                .where(eq(balanceTransactions.id, saleTx.id));
            } else {
              newAvailable = currentAvailable - amountToDebit;
            }
            ledgerDescription = `Chargeback received from ${event.provider.toUpperCase()} for order ${orderRef}`;
          }

          newEarned = Math.max(0, currentEarned - grossAmount);
          newPaymentStatus = "reversed";
          ledgerType = "chargeback";
          notifType = "payment_reversed";
          notifTitle = "Chargeback finalized";

          const isDebtNow = newAvailable < 0;
          const debtAmt = Math.abs(newAvailable);
          notifMessage = isDebtNow
            ? `A payment reversal of $${amountToDebit.toFixed(2)} for order ${orderRef} was finalized by ${providerName}. Your account now has a $${debtAmt.toFixed(2)} outstanding balance. Payouts are temporarily unavailable until cleared.`
            : `A payment reversal of $${amountToDebit.toFixed(2)} for order ${orderRef} was finalized by ${providerName}. The amount has been deducted from your balance.`;
        }

        // ─────────────────────────────────────────────────────────────────────────────
        // FINANCIAL OPERATION 3: DISPUTE WON -> RELEASE RESERVE / REINSTATE FUNDS
        // ─────────────────────────────────────────────────────────────────────────────
        else if (event.reversalType === "dispute_won") {
          if (existingDisputeWonTx) {
            console.log(`[Payment Reversal] Dispute won already processed for order ${order.id}. Skipping.`);
            return {
              success: true,
              duplicate: true,
              orderId: order.id,
              merchantId,
            };
          }

          if (existingReserveTx && !existingChargebackTx) {
            // Release active reserve back to payoutable balance without touching availableBalance
            newReserve = Math.max(0, currentReserve - amountToDebit);
            ledgerType = "dispute_won";
            ledgerAmount = grossAmount.toFixed(2);
            ledgerNetAmount = amountToDebit.toFixed(2);
            ledgerDescription = `Dispute won! Reserve of $${amountToDebit.toFixed(2)} released for order ${orderRef}`;
          } else {
            // Funds were previously withdrawn and provider reinstated them
            newAvailable = currentAvailable + amountToDebit;
            ledgerType = "dispute_won";
            ledgerAmount = grossAmount.toFixed(2);
            ledgerNetAmount = amountToDebit.toFixed(2);
            ledgerDescription = `Dispute won! Funds of $${amountToDebit.toFixed(2)} reinstated by ${event.provider.toUpperCase()} for order ${orderRef}`;
          }

          newPaymentStatus = "completed";
          notifType = "payment_dispute_won";
          notifTitle = "Dispute won!";
          notifMessage = `Great news! The dispute for order ${orderRef} was resolved in your favor. The $${amountToDebit.toFixed(2)} reserve has been released to your available payout balance.`;
        }

        // ─────────────────────────────────────────────────────────────────────────────
        // FINANCIAL OPERATION 4: REFUND
        // ─────────────────────────────────────────────────────────────────────────────
        else {
          const totalAlreadyRefunded = existingRefundTxs.reduce(
            (acc, t) => acc + Math.abs(parseFloat(t.netAmount || "0")),
            0
          );

          if (order.paymentStatus === "refunded" && totalAlreadyRefunded >= grossAmount) {
            console.log(`[Payment Reversal] Order ${order.id} is already fully refunded. Skipping.`);
            return {
              success: true,
              duplicate: true,
              orderId: order.id,
              merchantId,
            };
          }

          if (saleTx && !isReleased) {
            newPending = Math.max(0, currentPending - amountToDebit);
            await tx
              .update(balanceTransactions)
              .set({
                type: "sale_reversed",
                description: `${saleTx.description || "Sale"} [REFUNDED by ${event.provider.toUpperCase()}]`,
              })
              .where(eq(balanceTransactions.id, saleTx.id));
          } else {
            newAvailable = currentAvailable - amountToDebit;
          }

          newEarned = Math.max(0, currentEarned - grossAmount);
          newPaymentStatus = "refunded";
          ledgerType = "refund";
          ledgerDescription = `Refund of $${amountToDebit.toFixed(2)} processed via ${event.provider.toUpperCase()} for order ${orderRef}`;
          notifType = "payment_reversed";
          notifTitle = "Payment refunded";

          const isDebtNow = newAvailable < 0;
          const debtAmt = Math.abs(newAvailable);
          notifMessage = isDebtNow
            ? `A refund of $${amountToDebit.toFixed(2)} for order ${orderRef} was processed. Your account now has a $${debtAmt.toFixed(2)} outstanding balance.`
            : `A refund of $${amountToDebit.toFixed(2)} for order ${orderRef} was processed.`;
        }

        // 6. Update Seller Balances
        await tx
          .update(sellerBalances)
          .set({
            availableBalance: newAvailable.toFixed(2),
            pendingBalance: newPending.toFixed(2),
            reserveBalance: newReserve.toFixed(2),
            totalEarned: newEarned.toFixed(2),
            updatedAt: new Date(),
          })
          .where(eq(sellerBalances.userId, merchantId));

        // 7. Insert Auditable Ledger Transaction
        await tx.insert(balanceTransactions).values({
          id: crypto.randomUUID(),
          userId: merchantId,
          orderId: order.id,
          type: ledgerType,
          amount: ledgerAmount,
          feeAmount: "0.00",
          netAmount: ledgerNetAmount,
          currency: event.currency || order.currency || "USD",
          provider: event.provider,
          providerPaymentId:
            event.providerPaymentId || order.stripePaymentIntentId || order.cryptoPaymentId || null,
          externalEventId: event.eventId,
          description: ledgerDescription,
          isReleased: true,
          releasedAt: new Date(),
        });

        // 8. Update Order Status
        await tx
          .update(orders)
          .set({
            paymentStatus: newPaymentStatus,
            updatedAt: new Date(),
          })
          .where(eq(orders.id, order.id));

        // 9. Merchant Inbox Notification (Idempotent within same transaction)
        await tx.insert(notifications).values({
          id: crypto.randomUUID(),
          userId: merchantId,
          shopId: order.shopId,
          type: notifType,
          title: notifTitle,
          message: notifMessage,
          reason: event.reason || `Action initiated by payment provider (${providerName}). Event ID: ${event.eventId}`,
          isRead: false,
        });

        // 10. Record Event in Processed Webhook Events (Guarantees replay protection)
        await tx.insert(processedWebhookEvents).values({
          id: crypto.randomUUID(),
          provider: event.provider,
          eventId: event.eventId,
          eventType: event.eventType || event.reversalType || (event as any).type || "unknown",
          orderId: order.id,
          merchantId,
          amount: amountToDebit.toFixed(2),
          currency: event.currency || order.currency || "USD",
          status: "processed",
        });

        const isDebt = newAvailable < 0;
        const debtAmount = isDebt ? Math.abs(newAvailable) : 0;
        const payoutable = Math.max(0, newAvailable - newReserve);

        console.log(
          `✓ [Payment Reversal Processed] Order: ${order.id}, Merchant: ${merchantId}, Action: ${ledgerType}, Available: ${newAvailable.toFixed(2)}, Reserve: ${newReserve.toFixed(2)}, Payoutable: ${payoutable.toFixed(2)}, Debt: ${isDebt}`
        );

        return {
          success: true,
          orderId: order.id,
          merchantId,
          amountReversed: amountToDebit,
          newAvailableBalance: newAvailable.toFixed(2),
          newPendingBalance: newPending.toFixed(2),
          newReserveBalance: newReserve.toFixed(2),
          payoutableBalance: payoutable.toFixed(2),
          isDebt,
          debtAmount,
        };
      });
    } catch (err: any) {
      const errCode = err?.cause?.code || err?.code;
      const errErrno = err?.cause?.errno || err?.errno;

      // Check if error is MySQL duplicate key error (code ER_DUP_ENTRY / 1062)
      if (errCode === "ER_DUP_ENTRY" || errErrno === 1062) {
        console.log(`[Payment Reversal] Concurrent duplicate event caught by unique constraint: ${event.eventId}`);
        return {
          success: true,
          duplicate: true,
          orderId: resolvedOrder.id,
        };
      }

      // If deadlock occurred (1213 / ER_LOCK_DEADLOCK), retry
      if ((errCode === "ER_LOCK_DEADLOCK" || errErrno === 1213) && attempt < MAX_RETRIES) {
        console.warn(`[Payment Reversal] Deadlock detected on attempt ${attempt}. Retrying in ${attempt * 50}ms...`);
        await new Promise((r) => setTimeout(r, attempt * 50));
        continue;
      }

      console.error("[Payment Reversal Execution Error]:", err);
      throw err;
    }
  }

  throw new Error("Payment reversal failed after maximum retries");
}
