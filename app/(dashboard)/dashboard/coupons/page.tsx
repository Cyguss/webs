import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { shops, coupons } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import CouponsClientUI from "./coupons-client-ui";
import { Tag, Sparkles, AlertCircle } from "lucide-react";

export default async function CouponsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/login");
  }

  const userShop = await db.query.shops.findFirst({
    where: eq(shops.userId, session.user.id),
  });

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
