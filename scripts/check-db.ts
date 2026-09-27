import { db } from "../lib/db";
import { shops, products } from "../lib/db/schema";

async function main() {
  const allShops = await db.select().from(shops);
  console.log("Shops:", allShops.map(s => ({ id: s.id, name: s.name, slug: s.slug, isAccepted: s.isAccepted })));
  const allProds = await db.select().from(products);
  console.log("Products:", allProds.map(p => ({ id: p.id, title: p.title, price: p.price, shopId: p.shopId })));
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
