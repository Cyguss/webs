import { NextResponse } from "next/server";
import { releaseAllMatureEscrowBalances } from "@/lib/escrow";

export const dynamic = "force-dynamic";

function isCronAuthorized(req: Request): boolean {
  const cronSecret = (process.env.CRON_SECRET || "").trim();

  // If running in development without CRON_SECRET configured, permit local invocation
  if (process.env.NODE_ENV !== "production" && !cronSecret) {
    return true;
  }

  const authHeader = req.headers.get("authorization");
  const xCronHeader = req.headers.get("x-cron-secret");

  if (cronSecret) {
    if (authHeader === `Bearer ${cronSecret}`) return true;
    if (xCronHeader === cronSecret) return true;
    return false;
  }

  // In production, CRON_SECRET is required
  return false;
}

export async function GET(req: Request) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized cron invocation" }, { status: 401 });
  }

  try {
    const result = await releaseAllMatureEscrowBalances();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error: any) {
    console.error("[Cron Escrow Release Error]:", error);
    return NextResponse.json(
      { error: "Internal server error during escrow release", message: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  return GET(req);
}
