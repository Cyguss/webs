import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sellerBalances } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { releaseMatureEscrowBalances } from "@/lib/escrow";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get("shopId");

    const { getMerchantShopContext } = await import("@/lib/tenant");
    const ctx = await getMerchantShopContext(session.user.id, shopId);

    const targetUserId = ctx.shop ? ctx.shop.userId : session.user.id;

    // 1. Automatically release any mature escrow sales for this user
    await releaseMatureEscrowBalances(targetUserId);

    // 2. Fetch updated balance record
    const balanceRecord = await db.query.sellerBalances.findFirst({
      where: eq(sellerBalances.userId, targetUserId),
    });

    const { getPayoutHoldDays } = await import("@/lib/platform-settings");
    const holdDays = await getPayoutHoldDays();

    const available = parseFloat(balanceRecord?.availableBalance || "0.00");
    const reserve = parseFloat(balanceRecord?.reserveBalance || "0.00");
    const payoutable = Math.max(0, available - reserve);

    return NextResponse.json({
      availableBalance: balanceRecord?.availableBalance || "0.00",
      pendingBalance: balanceRecord?.pendingBalance || "0.00",
      reserveBalance: balanceRecord?.reserveBalance || "0.00",
      payoutableBalance: payoutable.toFixed(2),
      totalEarned: balanceRecord?.totalEarned || "0.00",
      totalWithdrawn: balanceRecord?.totalWithdrawn || "0.00",
      holdDays,
    });
  } catch (err: any) {
    console.error("Error fetching balance:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch balance" }, { status: 500 });
  }
}
