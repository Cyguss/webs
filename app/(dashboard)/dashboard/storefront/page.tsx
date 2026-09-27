import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { shops } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import StorefrontEditorClient from "./editor-client";

export default async function StorefrontPage() {
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

  return <StorefrontEditorClient shop={userShop} />;
}
