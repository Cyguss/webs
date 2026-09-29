import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { shops, coupons } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import CouponsClientUI from "./coupons-client-ui";
import { Tag, Sparkles, AlertCircle } from "lucide-react";

import { getActiveMerchantShop } from "@/lib/tenant";

export default async function CouponsPage({
  searchParams,
}: {
  searchParams: Promise<{ shopId?: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/login");
  }

  const { shopId } = await searchParams;
  const userShop = await getActiveMerchantShop(session.user.id, shopId);

  if (!userShop) {
    redirect("/dashboard");
  }

  const shopCoupons = await db
    .select()
    .from(coupons)
    .where(eq(coupons.shopId, userShop.id))
    .orderBy(desc(coupons.createdAt));

  return <CouponsClientUI initialCoupons={shopCoupons} shopId={userShop.id} />;
}
