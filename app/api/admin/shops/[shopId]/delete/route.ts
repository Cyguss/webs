import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { shops, user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyAdminSessionTicket } from "@/lib/admin-gate";

function getClientIp(h: Headers): string {
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") || "127.0.0.1";
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const headersList = await headers();
    const { shopId } = await params;
    const ticket = headersList.get("x-admin-ticket");
    const ip = getClientIp(headersList);
    const isSuperAdminTicket = verifyAdminSessionTicket(ticket, ip);

    // Also check session for admin / superadmin
    const session = await auth.api.getSession({ headers: headersList });
    let isSuperAdminSession = false;
    let isAdminSession = false;

    if (session?.user?.id) {
      const callerDb = await db.query.user.findFirst({ where: eq(user.id, session.user.id) });
      if (callerDb?.role === "superadmin") isSuperAdminSession = true;
      if (callerDb?.role === "admin") isAdminSession = true;
    }

    if (!isSuperAdminTicket && !isSuperAdminSession) {
      const { getBlockAllAdminsStatus } = await import("@/lib/admin-gate");
      const isBlocked = await getBlockAllAdminsStatus();
      if (isBlocked) {
        return NextResponse.json(
          { error: "Administrative actions are currently locked down by Super-Admin (Emergency Lockdown)." },
          { status: 403 }
        );
      }
    }

    const hasPermission = isSuperAdminTicket || isSuperAdminSession || isAdminSession;
    if (!hasPermission) {
      return NextResponse.json({ error: "Administrator permission required" }, { status: 403 });
    }

    const shop = await db.query.shops.findFirst({ where: eq(shops.id, shopId) });
    if (!shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    await db.delete(shops).where(eq(shops.id, shopId));

    return NextResponse.json({ success: true, message: `Shop ${shop.name} deleted successfully` });
  } catch (err: any) {
    console.error("[Admin Delete Shop] Error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
