import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { shops, products, inventoryKeys } from "@/lib/db/schema";
import { eq, count, and, inArray } from "drizzle-orm";
import { formatCurrency } from "@/lib/utils";
import { Plus, Key, Package, Edit, Trash2, ToggleLeft, ToggleRight, Layers } from "lucide-react";
import Link from "next/link";
import { getKeyDurationDisplay } from "@/lib/key-duration";

export default async function ProductsPage() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (!session) redirect("/login");

  const [shop] = await db.select().from(shops).where(eq(shops.userId, session.user.id)).limit(1);
  if (!shop) redirect("/dashboard");

  const productList = await db.select().from(products).where(eq(products.shopId, shop.id));

  // Get key stock counts in a single grouped query
  let stockMap: Record<string, number> = {};
  const keyProductIds = productList.filter((p: any) => p.type === "key").map((p: any) => p.id);
  if (keyProductIds.length > 0) {
    const stockResults = await db
      .select({
        productId: inventoryKeys.productId,
        stock: count(),
      })
      .from(inventoryKeys)
      .where(and(inArray(inventoryKeys.productId, keyProductIds), eq(inventoryKeys.isUsed, false)))
      .groupBy(inventoryKeys.productId);

    stockMap = Object.fromEntries(stockResults.map((s) => [s.productId, s.stock]));
  }

  return (
    <div className="page-fly-in" style={{ maxWidth: 1240, margin: "0 auto", width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--color-foreground)", letterSpacing: "-0.02em", marginBottom: 4 }}>Products</h1>
          <p style={{ color: "var(--color-muted-foreground)", fontSize: 14 }}>
            {productList.length} product{productList.length !== 1 ? "s" : ""} in your store
          </p>
        </div>
        <Link href="/dashboard/products/new" className="btn btn-primary">
          <Plus size={16} />
          New product
        </Link>
      </div>

      {productList.length === 0 ? (
        <div
          className="card"
          style={{ textAlign: "center", padding: 64 }}
        >
          <Package size={48} style={{ margin: "0 auto 16px", opacity: 0.3, color: "var(--color-muted-foreground)" }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No products yet</h3>
          <p style={{ color: "var(--color-muted-foreground)", fontSize: 14, marginBottom: 24 }}>
            Create your first product to start selling
          </p>
          <Link href="/dashboard/products/new" className="btn btn-primary">
            <Plus size={16} />
            Create product
          </Link>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Type</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {productList.map((product: any) => (
                <tr key={product.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          background: "var(--color-surface-2)",
                          border: "1px solid var(--color-border)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          overflow: "hidden",
                        }}
                      >
                        {product.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={product.thumbnailUrl} alt="" referrerPolicy="no-referrer" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <Package size={16} color="var(--color-muted-foreground)" />
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
                          <span>{product.title}</span>
                          {product.category && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                padding: "1px 6px",
                                borderRadius: 4,
                                background: "rgba(99,102,241,0.12)",
                                color: "#818cf8",
                                border: "1px solid rgba(99,102,241,0.25)",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 3,
                                textTransform: "capitalize",
                              }}
                            >
                              <Layers size={9} />
                              <span>{product.category}</span>
                            </span>
                          )}
                        </div>
                        {product.description && (
                          <div style={{ fontSize: 12, color: "var(--color-muted-foreground)", marginTop: 2, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {product.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
                      <span className={`badge ${product.type === "key" ? "badge-primary" : "badge-muted"}`}>
                        {product.type === "key" ? (
                          <><Key size={11} /> Keys</>
                        ) : (
                          <><Package size={11} /> Manual</>
                        )}
                      </span>
                      {(() => {
                        const dMeta = getKeyDurationDisplay(
                          product.duration,
                          product.durationDays,
                          product.customDurationLabel
                        );
                        return (
                          <span
                            style={{
                              fontSize: 10,
                              fontFamily: "monospace",
                              fontWeight: 700,
                              padding: "1px 6px",
                              borderRadius: 4,
                              background: `${dMeta.badgeColor}18`,
                              color: dMeta.badgeColor,
                              border: `1px solid ${dMeta.badgeColor}35`,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {dMeta.shortLabel}
                          </span>
                        );
                      })()}
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {formatCurrency(parseFloat(product.price))}
                  </td>
                  <td>
                    {product.type === "key" ? (
                      <span
                        className={`badge ${
                          (stockMap[product.id] ?? 0) === 0
                            ? "badge-danger"
                            : (stockMap[product.id] ?? 0) < 5
                            ? "badge-warning"
                            : "badge-success"
                        }`}
                      >
                        {stockMap[product.id] ?? 0} keys
                      </span>
                    ) : product.isUnlimitedStock ? (
                      <span className="badge badge-muted">Unlimited</span>
                    ) : (
                      <span className="badge badge-muted">{product.stockLimit ?? "—"}</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${product.isActive ? "badge-success" : "badge-muted"}`}>
                      {product.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Link
                        href={`/dashboard/products/${product.id}/edit`}
                        className="btn btn-ghost"
                        style={{ padding: "6px 10px" }}
                      >
                        <Edit size={14} />
                      </Link>
                      {product.type === "key" && (
                        <Link
                          href={`/dashboard/products/${product.id}/keys`}
                          className="btn btn-ghost"
                          style={{ padding: "6px 10px", fontSize: 12 }}
                        >
                          <Key size={14} />
                          Keys
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
