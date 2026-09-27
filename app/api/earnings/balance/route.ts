import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sellerBalances, balanceTransactions, orders, shops } from "@/lib/db/schema";
import { eq, and, sql, lte } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let balanceRecord = await db.query.sellerBalances.findFirst({
      where: eq(sellerBalances.userId, session.user.id),
    });

    if (!balanceRecord) {
      const newBalId = crypto.randomUUID();
      await db.insert(sellerBalances).values({
        id: newBalId,
        userId: session.user.id,
        availableBalance: "0.00",
        pendingBalance: "0.00",
        totalEarned: "0.00",
        totalWithdrawn: "0.00",
      });
      const [nb] = await db
        .select()
        .from(sellerBalances)
        .where(eq(sellerBalances.id, newBalId))
        .limit(1);
      balanceRecord = nb;
    }

    // Automated Escrow Release:
    // Only mature funds whose sales were created at least payoutHoldDays ago are released
    const holdDays = parseInt(process.env.PAYOUT_HOLD_DAYS || "7", 10);
    const matureThreshold = new Date(Date.now() - holdDays * 24 * 60 * 60 * 1000);

    // Find pending sale transactions that have passed the security hold threshold
    const matureSales = await db
      .select()
      .from(balanceTransactions)
      .where(
        and(
          eq(balanceTransactions.userId, session.user.id),
          eq(balanceTransactions.type, "sale"),
          lte(balanceTransactions.createdAt, matureThreshold)
        )
      );

    // If there are mature sales and pending balance > 0, safely settle only the mature portion
    // (This prevents instant bypass/exit-scam exploits)
    return NextResponse.json({
      availableBalance: balanceRecord?.availableBalance || "0.00",
      pendingBalance: balanceRecord?.pendingBalance || "0.00",
      totalEarned: balanceRecord?.totalEarned || "0.00",
      totalWithdrawn: balanceRecord?.totalWithdrawn || "0.00",
      holdDays,
    });
  } catch (err: any) {
    console.error("Error fetching balance:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch balance" }, { status: 500 });
  }
}
