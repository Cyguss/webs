import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { shops } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import OnboardingClient from "./onboarding-client";

export default async function OnboardingPage() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session || !session.user) {
    redirect("/login");
  }

  // If user already has a configured storefront, redirect directly to dashboard
  const userShop = await db.query.shops.findFirst({
    where: eq(shops.userId, session.user.id),
  });

  if (userShop) {
    redirect("/dashboard");
  }

  return <OnboardingClient user={session.user} />;
}
