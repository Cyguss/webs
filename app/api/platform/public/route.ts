import { NextResponse } from "next/server";
import { getPlatformFeePercent } from "@/lib/platform-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const feePercent = await getPlatformFeePercent();
    return NextResponse.json({
      platformFeePercent: feePercent,
    });
  } catch (err) {
    return NextResponse.json({ platformFeePercent: 5 }, { status: 200 });
  }
}
