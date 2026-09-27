const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "..", "vaultly.db");
const db = new Database(dbPath);

console.log("Seeding demo shop & data for registered seller@vaultly.io...");

// Find user ID for seller@vaultly.io
const user = db.prepare("SELECT id FROM users WHERE email = ?").get("seller@vaultly.io");

if (!user) {
  console.error("Seller user not found!");
  process.exit(1);
}

const sellerId = user.id;
const demoShopId = "shp_demo_100";

// Insert/Update Shop (demo-store and cyber-vault)
db.prepare(`
  INSERT OR REPLACE INTO shops (id, user_id, slug, name, description, background_color, accent_color, twitter_url, discord_url, telegram_url)
  VALUES (?, ?, 'demo-store', 'Apex Digital Vault', 'Instant license keys, digital passes, and custom gaming services.', '#0d0f17', '#6366f1', 'https://x.com/vaultly', 'https://discord.gg/vaultly', 'https://t.me/vaultly')
`).run(demoShopId, sellerId);

db.prepare(`
  INSERT OR REPLACE INTO shops (id, user_id, slug, name, description, background_color, accent_color, twitter_url, discord_url, telegram_url)
  VALUES ('shp_demo_101', ?, 'cyber-vault', 'CyberVault Software', 'Premium automation tools & instant license keys.', '#090a0f', '#818cf8', 'https://x.com/vaultly', 'https://discord.gg/vaultly', 'https://t.me/vaultly')
`).run(sellerId);

// Insert Demo Product 1 (Key)
const prod1Id = "prd_demo_001";
db.prepare(`
  INSERT OR REPLACE INTO products (id, shop_id, title, description, type, price, is_unlimited_stock, is_active)
  VALUES (?, ?, 'VIP Key Pass - 30 Days', 'Instant 30-day VIP access license key. 24/7 automated delivery.', 'key', '19.99', 0, 1)
`).run(prod1Id, demoShopId);

// Insert Inventory Keys
const keys = [
  "APEX-VIP30-9981-XXXX-0001",
  "APEX-VIP30-9981-XXXX-0002",
  "APEX-VIP30-9981-XXXX-0003",
  "APEX-VIP30-9981-XXXX-0004",
  "APEX-VIP30-9981-XXXX-0005"
];
keys.forEach((k, idx) => {
  db.prepare(`
    INSERT OR REPLACE INTO inventory_keys (id, product_id, key_value, is_used)
    VALUES (?, ?, ?, 0)
  `).run(`key_demo_${idx + 1}`, prod1Id, k);
});

// Insert Demo Product 2 (Manual Service)
db.prepare(`
  INSERT OR REPLACE INTO products (id, shop_id, title, description, type, price, is_unlimited_stock, is_active)
  VALUES ('prd_demo_002', ?, 'Custom Storefront Branding Setup', 'Professional manual customization & branding setup for your shop within 24 hours.', 'manual', '49.99', 1, 1)
`).run(demoShopId);

// Add products for cyber-vault (shp_demo_101)
db.prepare(`
  INSERT OR REPLACE INTO products (id, shop_id, title, description, type, price, is_unlimited_stock, is_active)
  VALUES ('prd_cv_001', 'shp_demo_101', 'Apex Pro License (1 Month)', 'High performance automated software license key valid for 30 days.', 'key', '29.99', 0, 1)
`).run();

const cvKeys = ["CYBER-PRO-8891-AAAA", "CYBER-PRO-8892-BBBB", "CYBER-PRO-8893-CCCC"];
cvKeys.forEach((k, idx) => {
  db.prepare(`
    INSERT OR REPLACE INTO inventory_keys (id, product_id, key_value, is_used)
    VALUES (?, 'prd_cv_001', ?, 0)
  `).run(`key_cv_${idx + 1}`, k);
});

db.prepare(`
  INSERT OR REPLACE INTO products (id, shop_id, title, description, type, price, is_unlimited_stock, is_active)
  VALUES ('prd_cv_002', 'shp_demo_101', 'Cyber VPN Private Access', 'Dedicated high speed encrypted proxy access.', 'manual', '14.99', 1, 1)
`).run();

// Insert Demo Coupon
db.prepare(`
  INSERT OR REPLACE INTO coupons (id, shop_id, code, discount_percent, max_uses, used_count, is_active)
  VALUES ('cpn_demo_001', ?, 'SAVE20', 20, 100, 3, 1)
`).run(demoShopId);

// Insert Demo Seller Balance
db.prepare(`
  INSERT OR REPLACE INTO seller_balances (id, user_id, available_balance, pending_balance, total_earned, total_withdrawn)
  VALUES ('bal_demo_100', ?, '149.95', '39.98', '189.93', '0.00')
`).run(sellerId);

console.log("Demo account ready!");
console.log("Seller Email: seller@vaultly.io");
console.log("Seller Password: Password123!");
