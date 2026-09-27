const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "..", "vaultly.db");
const db = new Database(dbPath);

console.log("Initializing SQLite database at:", dbPath);

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email_verified INTEGER NOT NULL DEFAULT 0,
    image TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    id_token TEXT,
    access_token_expires_at TEXT,
    refresh_token_expires_at TEXT,
    scope TEXT,
    password TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    expires_at TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    user_agent TEXT,
    user_id TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS verifications (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS shops (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    banner_url TEXT,
    background_color TEXT DEFAULT '#0f0f0f',
    accent_color TEXT DEFAULT '#6366f1',
    font_style TEXT DEFAULT 'inter',
    twitter_url TEXT,
    discord_url TEXT,
    telegram_url TEXT,
    discord_webhook_url TEXT,
    meta_title TEXT,
    meta_description TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    shop_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    price TEXT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    stock_limit INTEGER,
    is_unlimited_stock INTEGER NOT NULL DEFAULT 0,
    thumbnail_url TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS inventory_keys (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    key_value TEXT NOT NULL,
    is_used INTEGER NOT NULL DEFAULT 0,
    used_at TEXT,
    order_id TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS coupons (
    id TEXT PRIMARY KEY,
    shop_id TEXT NOT NULL,
    code TEXT NOT NULL,
    discount_percent INTEGER,
    discount_amount TEXT,
    max_uses INTEGER,
    used_count INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    order_id TEXT NOT NULL,
    buyer_email TEXT NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    shop_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    coupon_id TEXT,
    buyer_email TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price TEXT NOT NULL,
    total_amount TEXT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    payment_method TEXT NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'pending',
    stripe_payment_intent_id TEXT,
    crypto_payment_id TEXT,
    fulfilled_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS order_deliveries (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    delivery_type TEXT NOT NULL,
    delivery_value TEXT,
    delivered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS seller_balances (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    available_balance TEXT NOT NULL DEFAULT '0',
    pending_balance TEXT NOT NULL DEFAULT '0',
    total_earned TEXT NOT NULL DEFAULT '0',
    total_withdrawn TEXT NOT NULL DEFAULT '0',
    currency TEXT NOT NULL DEFAULT 'USD',
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS balance_transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    order_id TEXT,
    type TEXT NOT NULL,
    amount TEXT NOT NULL,
    fee_amount TEXT NOT NULL DEFAULT '0',
    net_amount TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS payout_requests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    amount_requested TEXT NOT NULL,
    fee_amount TEXT NOT NULL,
    amount_sent TEXT NOT NULL,
    method TEXT NOT NULL,
    destination_address TEXT NOT NULL,
    crypto_currency TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    admin_note TEXT,
    processed_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

console.log("Tables created successfully.");

// Insert Demo User
const demoUserId = "usr_demo_100";
const demoShopId = "shp_demo_100";

db.prepare(`
  INSERT OR REPLACE INTO users (id, email, name, email_verified)
  VALUES (?, ?, ?, 1)
`).run(demoUserId, "seller@vaultly.io", "Demo Seller");

// Insert Account
db.prepare(`
  INSERT OR REPLACE INTO accounts (id, account_id, provider_id, user_id, password)
  VALUES (?, ?, 'credential', ?, ?)
`).run("acc_demo_100", demoUserId, demoUserId, "Password123!");

// Insert Shop
db.prepare(`
  INSERT OR REPLACE INTO shops (id, user_id, slug, name, description, background_color, accent_color, twitter_url, discord_url, telegram_url)
  VALUES (?, ?, 'demo-store', 'Apex Digital Vault', 'Instant license keys, digital passes, and custom gaming services.', '#0d0f17', '#6366f1', 'https://x.com/vaultly', 'https://discord.gg/vaultly', 'https://t.me/vaultly')
`).run(demoShopId, demoUserId);

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

// Insert Demo Product 2 (Manual)
db.prepare(`
  INSERT OR REPLACE INTO products (id, shop_id, title, description, type, price, is_unlimited_stock, is_active)
  VALUES ('prd_demo_002', ?, 'Custom Storefront Branding Setup', 'Professional manual customization & branding setup for your shop within 24 hours.', 'manual', '49.99', 1, 1)
`).run(demoShopId);

// Insert Demo Coupon
db.prepare(`
  INSERT OR REPLACE INTO coupons (id, shop_id, code, discount_percent, max_uses, used_count, is_active)
  VALUES ('cpn_demo_001', ?, 'SAVE20', 20, 100, 3, 1)
`).run(demoShopId);

// Insert Demo Seller Balance
db.prepare(`
  INSERT OR REPLACE INTO seller_balances (id, user_id, available_balance, pending_balance, total_earned, total_withdrawn)
  VALUES ('bal_demo_100', ?, '149.95', '39.98', '189.93', '0.00')
`).run(demoUserId);

console.log("Database seeded successfully!");
console.log("Demo Seller Email: seller@vaultly.io");
console.log("Demo Seller Password: Password123!");
