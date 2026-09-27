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
