import { db } from "@/lib/db";
import { orders, products, shops } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import CryptoSandboxClient from "./crypto-sandbox-client";
import { generateOrderAccessToken } from "@/lib/order-auth";

export const dynamic = "force-dynamic";

export default async function CryptoSandboxPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  // CRITICAL SECURITY GUARD: Sandbox page is strictly disabled in production unless sandbox mode is explicitly on
  if (process.env.NODE_ENV === "production" && process.env.CRYPTOMUS_SANDBOX !== "true") {
    notFound();
  }

  const sParams = await searchParams;
  const orderId = sParams.orderId;

  if (!orderId) {
    notFound();
  }

  const orderData = await db
    .select({
      order: orders,
      product: products,
      shop: shops,
    })
    .from(orders)
    .leftJoin(products, eq(orders.productId, products.id))
    .leftJoin(shops, eq(orders.shopId, shops.id))
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!orderData || orderData.length === 0) {
    notFound();
  }

  const { order, product, shop } = orderData[0];
  const accessToken = generateOrderAccessToken(order.id, order.buyerEmail);

  return (
    <CryptoSandboxClient
      order={order}
      product={product}
      shop={shop}
      accessToken={accessToken}
    />
  );
}
