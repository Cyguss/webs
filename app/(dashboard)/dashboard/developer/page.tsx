import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { shops } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { DeveloperClient } from "./developer-client";

export const metadata = {
  title: "Developer & API Keys | KRYPT Dashboard",
  description: "Manage merchant API keys, outbound webhooks, and integrate with external bots and services.",
};

import { getActiveMerchantShop } from "@/lib/tenant";

export default async function DeveloperPage({
  searchParams,
}: {
  searchParams: Promise<{ shopId?: string }>;
}) {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { shopId } = await searchParams;
  const shop = await getActiveMerchantShop(session.user.id, shopId);

  if (!shop) {
    redirect("/dashboard/onboarding");
  }

  return <DeveloperClient shop={shop} />;
}
