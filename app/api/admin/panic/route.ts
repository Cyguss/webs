import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user, session as sessionTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function POST() {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const [caller] = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (!caller) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Panic switch is intended for ordinary admins to self-revoke their own permissions
    // If user is not an admin, they cannot use admin panic
    if (caller.role !== "admin" && caller.role !== "superadmin") {
      return NextResponse.json({ error: "Not authorized." }, { status: 403 });
    }

    // Freeze caller's admin permissions while preserving admin badge/status
    await db
      .update(user)
      .set({
        adminPermissionsActive: false,
        updatedAt: new Date(),
      })
      .where(eq(user.id, caller.id));

    // Terminate all active sessions for this user for immediate lockout
    try {
      await db.delete(sessionTable).where(eq(sessionTable.userId, caller.id));
    } catch (sessionErr) {
      console.error("[Panic Switch] Failed to clear session rows:", sessionErr);
    }

    console.warn(`[SECURITY ALERT] Admin Panic Switch triggered by ${caller.email} (${caller.id}). Permissions deactivated.`);

    return NextResponse.json({
      success: true,
      message: "Emergency Panic Switch activated. Your administrative access has been deactivated and your session has been terminated.",
    });
  } catch (err: any) {
    console.error("[Admin Panic API Error]", err);
    return NextResponse.json({ error: err.message || "Failed to execute panic lockout" }, { status: 500 });
  }
}
