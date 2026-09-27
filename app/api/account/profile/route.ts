import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!name || name.length < 2) {
      return NextResponse.json({ error: "Display name must be at least 2 characters long." }, { status: 400 });
    }

    if (name.length > 50) {
      return NextResponse.json({ error: "Display name cannot exceed 50 characters." }, { status: 400 });
    }

    await db
      .update(user)
      .set({ name, updatedAt: new Date() })
      .where(eq(user.id, session.user.id));

    return NextResponse.json({ success: true, name });
  } catch (err: any) {
    console.error("[Update Profile Error]:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
