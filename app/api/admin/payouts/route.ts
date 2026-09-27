import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { payoutRequests, sellerBalances, balanceTransactions } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const headersList = await headers();
    const ticket = headersList.get("x-admin-ticket");
    const { verifyAdminSessionTicket, getBlockAllAdminsStatus } = await import("@/lib/admin-gate");
    const isSuperAdmin = verifyAdminSessionTicket(ticket);

    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!isSuperAdmin && (!session || !session.user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if ordinary admins are blocked or lost role
    if (!isSuperAdmin && session?.user?.id) {
      const isBlocked = await getBlockAllAdminsStatus();
      if (isBlocked) {
        return NextResponse.json(
          { error: "Administrative actions are currently locked down by the Super-Admin (Emergency Lockdown)." },
          { status: 403 }
        );
      }

      // Live verification of Discord admin role
      const { user: userTable, account } = await import("@/lib/db/schema");
      const { and } = await import("drizzle-orm");
      const currentDbUser = await db.query.user.findFirst({
        where: eq(userTable.id, session.user.id),
      });
      const discordAccount = await db.query.account.findFirst({
        where: and(eq(account.userId, session.user.id), eq(account.providerId, "discord")),
      });
      const discordId = currentDbUser?.discordId || discordAccount?.accountId;

      if (!discordId) {
        return NextResponse.json({ error: "No connected Discord account found." }, { status: 403 });
      }

      const { isDiscordUserAdmin } = await import("@/lib/discord");
      const check = await isDiscordUserAdmin(discordId);
      if (!check.isAdmin) {
        await db.update(userTable).set({ role: "user", updatedAt: new Date() }).where(eq(userTable.id, session.user.id));
        return NextResponse.json(
          { error: "Your Discord Administrator role was revoked. You no longer have permission to perform this action." },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const { payoutId, action, adminNote } = body; // action: "approve" | "reject"

    if (!payoutId || !action) {
      return NextResponse.json({ error: "Missing payout ID or action" }, { status: 400 });
    }

    const payout = await db.query.payoutRequests.findFirst({
      where: eq(payoutRequests.id, payoutId),
    });

    if (!payout || payout.status !== "pending") {
      return NextResponse.json({ error: "Payout request not found or already processed" }, { status: 404 });
    }

    const requestedAmount = parseFloat(payout.amountRequested);
    const amountSent = parseFloat(payout.amountSent || payout.amountRequested);

    if (action === "approve") {
      // Mark completed
      await db
        .update(payoutRequests)
        .set({
          status: "completed",
          adminNote: adminNote || "Approved and sent by platform admin",
          processedAt: new Date(),
        })
        .where(eq(payoutRequests.id, payoutId));

      // Update totalWithdrawn in seller balances
      const sellerBal = await db.query.sellerBalances.findFirst({
        where: eq(sellerBalances.userId, payout.userId),
      });

      if (sellerBal) {
        const newWithdrawn = (parseFloat(sellerBal.totalWithdrawn) + requestedAmount).toFixed(2);
        await db
          .update(sellerBalances)
          .set({ totalWithdrawn: newWithdrawn, updatedAt: new Date() })
          .where(eq(sellerBalances.userId, payout.userId));
      }
    } else if (action === "reject") {
      // Mark failed
      await db
        .update(payoutRequests)
        .set({
          status: "failed",
          adminNote: adminNote || "Rejected by admin — funds refunded to balance",
          processedAt: new Date(),
        })
        .where(eq(payoutRequests.id, payoutId));

      // Refund deducted funds back to seller available balance
      const sellerBal = await db.query.sellerBalances.findFirst({
        where: eq(sellerBalances.userId, payout.userId),
      });

      if (sellerBal) {
        const newAvailable = (parseFloat(sellerBal.availableBalance) + requestedAmount).toFixed(2);
        await db
          .update(sellerBalances)
          .set({ availableBalance: newAvailable, updatedAt: new Date() })
          .where(eq(sellerBalances.userId, payout.userId));
      }

      // Add balance transaction record
      await db.insert(balanceTransactions).values({
        id: crypto.randomUUID(),
        userId: payout.userId,
        type: "refund",
        amount: requestedAmount.toFixed(2),
        feeAmount: "0.00",
        netAmount: requestedAmount.toFixed(2),
        description: `Payout #${payoutId.slice(0, 8)} rejected — refunded to available balance`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Admin payout processing error:", err);
    return NextResponse.json({ error: err.message || "Failed to process payout" }, { status: 500 });
  }
}
