import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { payoutRequests, sellerBalances, balanceTransactions, notifications, shops } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const headersList = await headers();
    const ticket = headersList.get("x-admin-ticket");
    const { verifyAdminSessionTicket, getBlockAllAdminsStatus } = await import("@/lib/admin-gate");
    const isSuperAdminTicket = verifyAdminSessionTicket(ticket);

    const session = await auth.api.getSession({
      headers: headersList,
    });

    const { user: userTable, account } = await import("@/lib/db/schema");
    const { and } = await import("drizzle-orm");
    let currentDbUser: any = null;
    if (session?.user?.id) {
      currentDbUser = await db.query.user.findFirst({
        where: eq(userTable.id, session.user.id),
      });
    }

    const isSuperAdmin =
      isSuperAdminTicket ||
      currentDbUser?.role === "superadmin" ||
      (session?.user as any)?.role === "superadmin";

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

      if (currentDbUser?.adminPermissionsActive === false) {
        return NextResponse.json(
          { error: "Your administrator permissions have been suspended." },
          { status: 403 }
        );
      }

      // Granular permissions check
      const { parseAdminPermissions } = await import("@/lib/admin-gate");
      const perms = parseAdminPermissions(currentDbUser?.adminPermissions);
      if (!perms.canManagePayouts) {
        return NextResponse.json(
          { error: "You do not have permission to manage payouts." },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const { payoutId, action, adminNote } = body; // action: "approve" | "accept" | "reject"

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
    const shop = await db.query.shops.findFirst({
      where: eq(shops.userId, payout.userId),
    });

    if (action === "approve" || action === "accept") {
      // 1. Mark payout request completed
      await db
        .update(payoutRequests)
        .set({
          status: "completed",
          adminNote: adminNote || "Approved and disbursed manually outside the platform.",
          processedAt: new Date(),
        })
        .where(eq(payoutRequests.id, payoutId));

      // 2. Increment totalWithdrawn in seller balance (availableBalance was already deducted when request was created)
      const sellerBal = await db.query.sellerBalances.findFirst({
        where: eq(sellerBalances.userId, payout.userId),
      });

      if (sellerBal) {
        const newWithdrawn = (parseFloat(sellerBal.totalWithdrawn || "0") + requestedAmount).toFixed(2);
        await db
          .update(sellerBalances)
          .set({ totalWithdrawn: newWithdrawn, updatedAt: new Date() })
          .where(eq(sellerBalances.userId, payout.userId));
      }

      // 3. Dispatch Inbox Notification to Merchant with Discord contact instructions
      const cryptoInfo = payout.cryptoCurrency ? ` (${payout.cryptoCurrency})` : "";
      const noteDetails = adminNote?.trim() ? ` Note from admin: "${adminNote.trim()}".` : "";

      await db.insert(notifications).values({
        id: crypto.randomUUID(),
        userId: payout.userId,
        shopId: shop?.id || null,
        type: "payout_completed",
        title: `Payout Request Approved ($${requestedAmount.toFixed(2)})`,
        message: `Your payout request for $${requestedAmount.toFixed(2)} via ${payout.method.toUpperCase()}${cryptoInfo} has been approved and processed manually outside the site to destination address: ${payout.destinationAddress}.${noteDetails} In case of any problems or questions, please contact our support on Discord: https://discord.gg/krypt`,
        reason: adminNote ? adminNote.trim() : "Approved by platform administration. Contact support on Discord (https://discord.gg/krypt) in case of any issues.",
        isRead: false,
        createdAt: new Date(),
      });
    } else if (action === "reject") {
      // 1. Mark payout request rejected
      await db
        .update(payoutRequests)
        .set({
          status: "rejected",
          adminNote: adminNote || "Rejected by administrator — funds refunded to available balance.",
          processedAt: new Date(),
        })
        .where(eq(payoutRequests.id, payoutId));

      // 2. Refund deducted funds back to merchant available balance
      const sellerBal = await db.query.sellerBalances.findFirst({
        where: eq(sellerBalances.userId, payout.userId),
      });

      if (sellerBal) {
        const newAvailable = (parseFloat(sellerBal.availableBalance || "0") + requestedAmount).toFixed(2);
        await db
          .update(sellerBalances)
          .set({ availableBalance: newAvailable, updatedAt: new Date() })
          .where(eq(sellerBalances.userId, payout.userId));
      }

      // 3. Add balance transaction refund record
      await db.insert(balanceTransactions).values({
        id: crypto.randomUUID(),
        userId: payout.userId,
        type: "refund",
        amount: requestedAmount.toFixed(2),
        feeAmount: "0.00",
        netAmount: requestedAmount.toFixed(2),
        description: `Payout #${payoutId.slice(0, 8)} rejected — refunded to available balance`,
      });

      // 4. Dispatch Inbox Notification to Merchant with Discord contact instructions
      const reasonDetails = adminNote?.trim() ? ` Reason: "${adminNote.trim()}".` : "";

      await db.insert(notifications).values({
        id: crypto.randomUUID(),
        userId: payout.userId,
        shopId: shop?.id || null,
        type: "payout_rejected",
        title: `Payout Request Rejected ($${requestedAmount.toFixed(2)})`,
        message: `Your payout request for $${requestedAmount.toFixed(2)} was rejected and the funds have been returned to your available balance.${reasonDetails} In case of any problems or questions, please contact our support on Discord: https://discord.gg/krypt`,
        reason: adminNote ? adminNote.trim() : "Rejected by platform administration. Funds refunded to balance. Contact support on Discord (https://discord.gg/krypt) for assistance.",
        isRead: false,
        createdAt: new Date(),
      });
    } else {
      return NextResponse.json({ error: "Invalid action. Supported actions: approve, reject" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Admin payout processing error:", err);
    return NextResponse.json({ error: err.message || "Failed to process payout" }, { status: 500 });
  }
}
