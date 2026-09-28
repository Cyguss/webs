import AdminPortal from "./admin-portal";
import { Metadata } from "next";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const metadata: Metadata = {
  title: "Admin Master Control | KRYPT",
  description: "Platform Administration and Security",
};

export default async function AdminPage() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  let initialRole = "user";
  let initialIsAdmin = false;
  let initialIsSuperAdmin = false;

  if (session?.user?.id) {
    const dbUser = await db.query.user.findFirst({
      where: eq(user.id, session.user.id),
    });
    if (dbUser) {
      initialRole = dbUser.role || "user";
      if (initialRole === "admin" || initialRole === "superadmin") {
        initialIsAdmin = true;
      }
      if (initialRole === "superadmin") {
        initialIsSuperAdmin = true;
      }
    }
  }

  return (
    <AdminPortal
      initialIsAdmin={initialIsAdmin}
      initialIsSuperAdmin={initialIsSuperAdmin}
      initialRole={initialRole}
      userName={session?.user?.name || null}
    />
  );
}
