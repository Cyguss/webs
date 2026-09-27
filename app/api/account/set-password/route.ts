import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const newPassword = body?.newPassword;

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long." }, { status: 400 });
    }

    try {
      const result = await auth.api.setPassword({
        body: { newPassword },
        headers: headersList,
      });

      return NextResponse.json({ success: true, result });
    } catch (authErr: any) {
      return NextResponse.json(
        { error: authErr?.body?.message || authErr?.message || "Failed to set password" },
        { status: 400 }
      );
    }
  } catch (err: any) {
    console.error("[Set Password Error]:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
