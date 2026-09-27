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

    const isSuperAdmin = verifyAdminSessionTicket(ticket);

    // Verify if user is an ordinary Discord Admin via session
    let isDiscordAdmin = false;
    let sessionUser: any = null;

    if (!isSuperAdmin) {
      const { auth } = await import("@/lib/auth");
      const session = await auth.api.getSession({ headers: headersList });

      if (session?.user?.id) {
        sessionUser = session.user;
        const { db } = await import("@/lib/db");
        const { user: userTable, account } = await import("@/lib/db/schema");
        const { eq, and } = await import("drizzle-orm");

        const currentDbUser = await db.query.user.findFirst({
          where: eq(userTable.id, session.user.id),
        });
        const discordAccount = await db.query.account.findFirst({
          where: and(eq(account.userId, session.user.id), eq(account.providerId, "discord")),
        });

        const discordId = currentDbUser?.discordId || discordAccount?.accountId;
        if (discordId) {
          const { isDiscordUserAdmin } = await import("@/lib/discord");
          const check = await isDiscordUserAdmin(discordId);
          isDiscordAdmin = check.isAdmin;
        }
      }
    }

    if (!isSuperAdmin && !isDiscordAdmin) {
      return NextResponse.json(
        { error: "Unauthorized. Administrator privileges required." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const blockAllAdmins = Boolean(body.blockAllAdmins ?? body.blocked);

    // CRITICAL SECURITY RULE: Ordinary admins can PANIC LOCK, but ONLY Super-Admin can UNLOCK!
    if (!isSuperAdmin && !blockAllAdmins) {
      return NextResponse.json(
        {
          error: "Permission denied. Only Super-Admin with master credentials can lift the platform lockdown.",
        },
        { status: 403 }
      );
    }

    await setBlockAllAdminsStatus(blockAllAdmins);

    return NextResponse.json({
      success: true,
      blockAllAdmins,
      triggeredBy: isSuperAdmin ? "Super-Admin" : `Discord Admin (${sessionUser?.name || "Staff"})`,
      message: blockAllAdmins
        ? "Emergency lockdown engaged. All ordinary administrator access has been frozen platform-wide."
        : "Emergency lockdown lifted. Administrator access restored.",
    });
  } catch (err: any) {
    console.error("Failed to update lockdown:", err);
    return NextResponse.json({ error: "Server error updating lockdown status" }, { status: 500 });
  }
}
