import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { shops, coupons } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code")?.trim().toUpperCase();
    const shopId = searchParams.get("shopId");

    if (!code || !shopId) {
      return NextResponse.json({ error: "Coupon code and shop ID required" }, { status: 400 });
    }

    const coupon = await db.query.coupons.findFirst({
      where: and(eq(coupons.shopId, shopId), eq(coupons.code, code), eq(coupons.isActive, 1 as any)),
    });

    if (!coupon) {
      return NextResponse.json({ error: "Invalid or expired promo code" }, { status: 404 });
    }

    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ error: "Coupon usage limit reached" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      couponId: coupon.id,
      code: coupon.code,
      discountPercent: coupon.discountPercent,
      discountAmount: coupon.discountAmount ? parseFloat(coupon.discountAmount) : null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to check coupon" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userShop = await db.query.shops.findFirst({
      where: eq(shops.userId, session.user.id),
    });

    if (!userShop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    const body = await req.json();
    const { code, discountPercent, discountAmount, maxUses } = body;

    if (!code) {
      return NextResponse.json({ error: "Coupon code is required" }, { status: 400 });
    }

    const couponId = crypto.randomUUID();

    await db.insert(coupons).values({
      id: couponId,
      shopId: userShop.id,
      code: code.trim().toUpperCase(),
      discountPercent: discountPercent ? parseInt(discountPercent) : null,
      discountAmount: discountAmount ? parseFloat(discountAmount).toFixed(2) : null,
      maxUses: maxUses ? parseInt(maxUses) : null,
      usedCount: 0,
      isActive: 1 as any,
    });

    return NextResponse.json({ success: true, couponId });
  } catch (err: any) {
    console.error("Error creating coupon:", err);
    return NextResponse.json({ error: err.message || "Failed to create coupon" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await db.delete(coupons).where(eq(coupons.id, id));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete coupon" }, { status: 500 });
  }
}
