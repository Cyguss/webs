import { db } from "@/lib/db";
import { sellerBalances, balanceTransactions } from "@/lib/db/schema";
import { eq, and, lte } from "drizzle-orm";
import crypto from "crypto";

export interface EscrowReleaseResult {
  releasedCount: number;
  totalReleased: number;
  newAvailableBalance: string;
  newPendingBalance: string;
}

/**
 * Atomically releases mature sales from pendingBalance to availableBalance.
 * Safe against race conditions and concurrent requests via row-level locks.
 */
export async function releaseMatureEscrowBalances(userId: string): Promise<EscrowReleaseResult> {
  if (!userId) {
    return {
      releasedCount: 0,
      totalReleased: 0,
      newAvailableBalance: "0.00",
      newPendingBalance: "0.00",
    };
  }

  const { getPayoutHoldDays } = await import("@/lib/platform-settings");
  const holdDays = await getPayoutHoldDays();
  const matureThreshold = new Date(Date.now() - holdDays * 24 * 60 * 60 * 1000);

  return await db.transaction(async (tx) => {
    // 1. Lock unreleased mature sales
    const matureSales = await tx
      .select()
      .from(balanceTransactions)
      .where(
        and(
          eq(balanceTransactions.userId, userId),
          eq(balanceTransactions.type, "sale"),
          eq(balanceTransactions.isReleased, false),
          lte(balanceTransactions.createdAt, matureThreshold)
        )
      )
      .for("update");

    // 2. Fetch and lock seller balance record
    const balanceRows = await tx
      .select()
      .from(sellerBalances)
      .where(eq(sellerBalances.userId, userId))
      .for("update");

    let balanceRecord = balanceRows[0];
    if (!balanceRecord) {
      const newBalId = crypto.randomUUID();
      await tx.insert(sellerBalances).values({
        id: newBalId,
        userId,
        availableBalance: "0.00",
        pendingBalance: "0.00",
        totalEarned: "0.00",
        totalWithdrawn: "0.00",
      });
      const [created] = await tx
        .select()
        .from(sellerBalances)
        .where(eq(sellerBalances.id, newBalId));
      balanceRecord = created;
    }

    if (matureSales.length === 0) {
      return {
        releasedCount: 0,
        totalReleased: 0,
        newAvailableBalance: balanceRecord.availableBalance || "0.00",
        newPendingBalance: balanceRecord.pendingBalance || "0.00",
      };
    }

    let totalToRelease = 0;
    const saleIds: string[] = [];
    for (const sale of matureSales) {
      const net = parseFloat(sale.netAmount || "0");
      if (!isNaN(net) && net > 0) {
        totalToRelease += net;
      }
      saleIds.push(sale.id);
    }

    if (totalToRelease <= 0) {
      return {
        releasedCount: 0,
        totalReleased: 0,
        newAvailableBalance: balanceRecord.availableBalance || "0.00",
        newPendingBalance: balanceRecord.pendingBalance || "0.00",
      };
    }

    const currentPending = parseFloat(balanceRecord.pendingBalance || "0");
    const currentAvailable = parseFloat(balanceRecord.availableBalance || "0");

    const newPending = Math.max(0, currentPending - totalToRelease).toFixed(2);
    const newAvailable = (currentAvailable + totalToRelease).toFixed(2);

    await tx
      .update(sellerBalances)
      .set({
        pendingBalance: newPending,
        availableBalance: newAvailable,
        updatedAt: new Date(),
      })
      .where(eq(sellerBalances.userId, userId));

    const now = new Date();
    for (const saleId of saleIds) {
      await tx
        .update(balanceTransactions)
        .set({
          isReleased: true,
          releasedAt: now,
        })
        .where(eq(balanceTransactions.id, saleId));
    }

    // Record audit ledger entry
    await tx.insert(balanceTransactions).values({
      id: crypto.randomUUID(),
      userId,
      type: "escrow_release",
      amount: totalToRelease.toFixed(2),
      feeAmount: "0.00",
      netAmount: totalToRelease.toFixed(2),
      description: `Automated escrow release of ${matureSales.length} mature transaction(s)`,
      isReleased: true,
      releasedAt: now,
    });

    return {
      releasedCount: matureSales.length,
      totalReleased: totalToRelease,
      newAvailableBalance: newAvailable,
      newPendingBalance: newPending,
    };
  });
}

export interface GlobalEscrowReleaseResult {
  totalUsersProcessed: number;
  totalSalesReleased: number;
  totalAmountReleased: number;
  details: Array<{
    userId: string;
    releasedCount: number;
    totalReleased: number;
  }>;
}

/**
 * Global batch processor for cron jobs: finds all users with unreleased mature escrow
 * and safely releases their funds in individual isolated transactions.
 */
export async function releaseAllMatureEscrowBalances(): Promise<GlobalEscrowReleaseResult> {
  const { getPayoutHoldDays } = await import("@/lib/platform-settings");
  const holdDays = await getPayoutHoldDays();
  const matureThreshold = new Date(Date.now() - holdDays * 24 * 60 * 60 * 1000);

  // Find all distinct users who have unreleased mature sales
  const unreleasedUsers = await db
    .selectDistinct({ userId: balanceTransactions.userId })
    .from(balanceTransactions)
    .where(
      and(
        eq(balanceTransactions.type, "sale"),
        eq(balanceTransactions.isReleased, false),
        lte(balanceTransactions.createdAt, matureThreshold)
      )
    );

  const result: GlobalEscrowReleaseResult = {
    totalUsersProcessed: 0,
    totalSalesReleased: 0,
    totalAmountReleased: 0,
    details: [],
  };

  for (const { userId } of unreleasedUsers) {
    if (!userId) continue;
    try {
      const userRes = await releaseMatureEscrowBalances(userId);
      if (userRes.releasedCount > 0) {
        result.totalUsersProcessed += 1;
        result.totalSalesReleased += userRes.releasedCount;
        result.totalAmountReleased += userRes.totalReleased;
        result.details.push({
          userId,
          releasedCount: userRes.releasedCount,
          totalReleased: userRes.totalReleased,
        });
      }
    } catch (err) {
      console.error(`[Escrow Cron] Error releasing escrow for user ${userId}:`, err);
    }
  }

  return result;
}

