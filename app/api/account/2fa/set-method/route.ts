import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const method = body.method === "totp" ? "totp" : "email";

    await db
      .update(user)
      .set({ twoFactorMethod: method, updatedAt: new Date() })
      .where(eq(user.id, session.user.id));

    return NextResponse.json({ success: true, method });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
