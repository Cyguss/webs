import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { shops } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { DeveloperClient } from "./developer-client";

export const metadata = {
  title: "Developer & API Keys | Vaultly Dashboard",
  description: "Manage merchant API keys, outbound webhooks, and integrate with external bots and services.",
};

export default async function DeveloperPage() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user?.id) {
    redirect("/login");
  }

  const shop = await db.query.shops.findFirst({
    where: eq(shops.userId, session.user.id),
  });

  if (!shop) {
    redirect("/dashboard/onboarding");
  }

  return <DeveloperClient shop={shop} />;
}
