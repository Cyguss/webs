import { headers } from "next/headers";
import { NextResponse } from "next/server";
import {
  verifyAdminSessionTicket,
  getBlockAllAdminsStatus,
  setBlockAllAdminsStatus,
} from "@/lib/admin-gate";

export async function GET() {
  const isBlocked = await getBlockAllAdminsStatus();
  return NextResponse.json({ blockAllAdmins: isBlocked });
}

export async function POST(req: Request) {
  try {
    const headersList = await headers();
    const ticket = headersList.get("x-admin-ticket");

    let isSuperAdmin = verifyAdminSessionTicket(ticket);

    if (!isSuperAdmin) {
      const { auth } = await import("@/lib/auth");
      const session = await auth.api.getSession({ headers: headersList });

      if (session?.user?.id) {
        const { db } = await import("@/lib/db");
        const { user: userTable } = await import("@/lib/db/schema");
        const { eq } = await import("drizzle-orm");

        const currentDbUser = await db.query.user.findFirst({
          where: eq(userTable.id, session.user.id),
        });

        if (currentDbUser?.role === "superadmin" || (session.user as any).role === "superadmin") {
          isSuperAdmin = true;
        }
      }
    }

    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: "Access Denied: Only Super-Admin can engage or disengage Emergency Platform Lockdown." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const blockAllAdmins = Boolean(body.blockAllAdmins ?? body.blocked);

    await setBlockAllAdminsStatus(blockAllAdmins);

    return NextResponse.json({
      success: true,
      blockAllAdmins,
      triggeredBy: "Super-Admin",
      message: blockAllAdmins
        ? "Emergency lockdown engaged. All ordinary administrator access has been frozen platform-wide."
        : "Emergency lockdown lifted. Administrator access restored.",
    });
  } catch (err: any) {
    console.error("Failed to update lockdown:", err);
    return NextResponse.json({ error: "Server error updating lockdown status" }, { status: 500 });
  }
}
