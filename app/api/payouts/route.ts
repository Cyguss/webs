import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sellerBalances, payoutRequests, balanceTransactions } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { createPayoutSchema } from "@/lib/validations/payout";

const PLATFORM_FEE_PERCENTAGE = 0.05; // 5% fee on payouts
const MIN_PAYOUT_AMOUNT = 10.0; // $10 minimum

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = createPayoutSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Invalid payout request" },
        { status: 400 }
      );
    }

    const { amount, method, destinationAddress, cryptoCurrency } = result.data;
    const requestedAmount = amount;

    const feeAmount = requestedAmount * PLATFORM_FEE_PERCENTAGE;
    const amountSent = requestedAmount - feeAmount;
    const payoutId = crypto.randomUUID();

    // Atomic Transaction: Eliminates Double-Spending Race Condition via row-level locking
    await db.transaction(async (tx) => {
      const balanceRows = await tx
        .select()
        .from(sellerBalances)
        .where(eq(sellerBalances.userId, session.user.id))
        .for("update");

      const balanceRecord = balanceRows[0];
      const currentAvailable = balanceRecord ? parseFloat(balanceRecord.availableBalance) : 0;

      if (!balanceRecord || requestedAmount > currentAvailable) {
        throw new Error(`Insufficient available balance. Available: $${currentAvailable.toFixed(2)}`);
      }

      const newAvailable = (currentAvailable - requestedAmount).toFixed(2);
      const newWithdrawn = (parseFloat(balanceRecord.totalWithdrawn || "0") + requestedAmount).toFixed(2);

      const updateResult = await tx
        .update(sellerBalances)
        .set({
          availableBalance: newAvailable,
          totalWithdrawn: newWithdrawn,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(sellerBalances.userId, session.user.id),
            sql`CAST(${sellerBalances.availableBalance} AS DECIMAL(10,2)) >= ${requestedAmount}`
          )
        );

      await tx.insert(payoutRequests).values({
        id: payoutId,
        userId: session.user.id,
        amountRequested: requestedAmount.toFixed(2),
        feeAmount: feeAmount.toFixed(2),
        amountSent: amountSent.toFixed(2),
        method,
        destinationAddress,
        cryptoCurrency: cryptoCurrency || null,
        status: "pending",
      });

      await tx.insert(balanceTransactions).values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        type: "payout",
        amount: (-requestedAmount).toFixed(2),
        feeAmount: feeAmount.toFixed(2),
        netAmount: (-amountSent).toFixed(2),
        description: `Payout request via ${method.toUpperCase()} (${destinationAddress})`,
      });
    });

    return NextResponse.json({
      success: true,
      payoutId,
      message: "Payout request submitted successfully. Processing usually takes 24-48 hours.",
    });
  } catch (err: any) {
    console.error("Error creating payout request:", err);
    return NextResponse.json({ error: err.message || "Failed to submit payout request" }, { status: 500 });
  }
}
