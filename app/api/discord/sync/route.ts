import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { syncUserDiscord } from "@/lib/discord";

export async function POST(req: Request) {
  try {
    let session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session || !session.user) {
      session = await auth.api.getSession({
        headers: await headers(),
      });
    }

    // Check if user is authenticated via session
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please sign in to connect Discord." }, { status: 401 });
    }

    const result = await syncUserDiscord(userId);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[Discord Sync] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to synchronize Discord roles" },
      { status: 500 }
    );
  }
}
