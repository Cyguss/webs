const mysql = require("mysql2/promise");

async function init() {
  console.log("Connecting to MariaDB at 127.0.0.1:3306...");

  // First connect without specifying database to create vaultly if needed
  const conn = await mysql.createConnection({
    host: "127.0.0.1",
    port: 3306,
    user: "root",
    password: "proxima123",
  });

  console.log("Connected to MariaDB server. Ensuring database 'vaultly' exists...");
  await conn.query("CREATE DATABASE IF NOT EXISTS `vaultly` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
  await conn.end();

  // Connect to vaultly database to create tables
  const db = await mysql.createConnection({
    host: "127.0.0.1",
    port: 3306,
    user: "root",
    password: "proxima123",
    database: "vaultly",
  });

  console.log("Creating tables...");

  // Better-Auth tables
  await db.query(`
    CREATE TABLE IF NOT EXISTS \`user\` (
      \`id\` VARCHAR(36) PRIMARY KEY,
      \`name\` TEXT NOT NULL,
      \`email\` VARCHAR(255) NOT NULL UNIQUE,
      \`email_verified\` BOOLEAN NOT NULL DEFAULT FALSE,
      \`image\` TEXT,
      \`two_factor_enabled\` BOOLEAN DEFAULT FALSE,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS \`session\` (
      \`id\` VARCHAR(36) PRIMARY KEY,
      \`expires_at\` TIMESTAMP NOT NULL,
      \`token\` VARCHAR(255) NOT NULL UNIQUE,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      \`ip_address\` TEXT,
      \`user_agent\` TEXT,
      \`user_id\` VARCHAR(36) NOT NULL,
      FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS \`account\` (
      \`id\` VARCHAR(36) PRIMARY KEY,
      \`account_id\` TEXT NOT NULL,
      \`provider_id\` TEXT NOT NULL,
      \`user_id\` VARCHAR(36) NOT NULL,
      \`access_token\` TEXT,
      \`refresh_token\` TEXT,
      \`id_token\` TEXT,
      \`access_token_expires_at\` TIMESTAMP NULL,
      \`refresh_token_expires_at\` TIMESTAMP NULL,
      \`scope\` TEXT,
      \`password\` TEXT,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS \`verification\` (
      \`id\` VARCHAR(36) PRIMARY KEY,
      \`identifier\` TEXT NOT NULL,
      \`value\` TEXT NOT NULL,
      \`expires_at\` TIMESTAMP NOT NULL,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS \`two_factor\` (
      \`id\` VARCHAR(36) PRIMARY KEY,
      \`secret\` TEXT NOT NULL,
      \`backup_codes\` TEXT NOT NULL,
      \`user_id\` VARCHAR(36) NOT NULL,
      \`verified\` BOOLEAN DEFAULT FALSE,
      \`failed_verification_count\` INT DEFAULT 0,
      \`locked_until\` TIMESTAMP NULL DEFAULT NULL,
      FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Core Platform tables
  await db.query(`
    CREATE TABLE IF NOT EXISTS \`shops\` (
      \`id\` VARCHAR(36) PRIMARY KEY,
      \`user_id\` VARCHAR(36) NOT NULL,
      \`slug\` VARCHAR(100) NOT NULL UNIQUE,
      \`name\` VARCHAR(255) NOT NULL,
      \`description\` TEXT,
      \`logo_url\` TEXT,
      \`banner_url\` TEXT,
      \`background_color\` VARCHAR(20) DEFAULT '#0f0f0f',
      \`accent_color\` VARCHAR(20) DEFAULT '#6366f1',
      \`font_style\` VARCHAR(50) DEFAULT 'inter',
      \`custom_domain\` VARCHAR(255),
      \`twitter_url\` TEXT,
      \`discord_url\` TEXT,
      \`telegram_url\` TEXT,
      \`discord_webhook_url\` TEXT,
      \`meta_title\` TEXT,
      \`meta_description\` TEXT,
      \`is_active\` BOOLEAN NOT NULL DEFAULT TRUE,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS \`products\` (
      \`id\` VARCHAR(36) PRIMARY KEY,
      \`shop_id\` VARCHAR(36) NOT NULL,
      \`title\` VARCHAR(255) NOT NULL,
      \`description\` TEXT,
      \`type\` VARCHAR(50) NOT NULL,
      \`price\` VARCHAR(32) NOT NULL,
      \`currency\` VARCHAR(10) NOT NULL DEFAULT 'USD',
      \`stock_limit\` INT NULL,
      \`is_unlimited_stock\` BOOLEAN NOT NULL DEFAULT FALSE,
      \`thumbnail_url\` TEXT,
      \`is_active\` BOOLEAN NOT NULL DEFAULT TRUE,
      \`sort_order\` INT NOT NULL DEFAULT 0,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (\`shop_id\`) REFERENCES \`shops\`(\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS \`inventory_keys\` (
      \`id\` VARCHAR(36) PRIMARY KEY,
      \`product_id\` VARCHAR(36) NOT NULL,
      \`key_value\` TEXT NOT NULL,
      \`is_used\` BOOLEAN NOT NULL DEFAULT FALSE,
      \`used_at\` TIMESTAMP NULL,
      \`order_id\` VARCHAR(36) NULL,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS \`orders\` (
      \`id\` VARCHAR(36) PRIMARY KEY,
      \`shop_id\` VARCHAR(36) NOT NULL,
      \`product_id\` VARCHAR(36) NOT NULL,
      \`coupon_id\` VARCHAR(36) NULL,
      \`buyer_email\` VARCHAR(255) NOT NULL,
      \`quantity\` INT NOT NULL DEFAULT 1,
      \`unit_price\` VARCHAR(32) NOT NULL,
      \`total_amount\` VARCHAR(32) NOT NULL,
      \`currency\` VARCHAR(10) NOT NULL DEFAULT 'USD',
      \`payment_method\` VARCHAR(50) NOT NULL,
      \`payment_status\` VARCHAR(50) NOT NULL DEFAULT 'pending',
      \`stripe_payment_intent_id\` VARCHAR(255),
      \`crypto_payment_id\` VARCHAR(255),
      \`fulfilled_at\` TIMESTAMP NULL,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (\`shop_id\`) REFERENCES \`shops\`(\`id\`),
      FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS \`order_deliveries\` (
      \`id\` VARCHAR(36) PRIMARY KEY,
      \`order_id\` VARCHAR(36) NOT NULL,
      \`delivery_type\` VARCHAR(50) NOT NULL,
      \`delivery_value\` TEXT,
      \`delivered_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS \`seller_balances\` (
      \`id\` VARCHAR(36) PRIMARY KEY,
      \`user_id\` VARCHAR(36) NOT NULL UNIQUE,
      \`available_balance\` VARCHAR(32) NOT NULL DEFAULT '0',
      \`pending_balance\` VARCHAR(32) NOT NULL DEFAULT '0',
      \`total_earned\` VARCHAR(32) NOT NULL DEFAULT '0',
      \`total_withdrawn\` VARCHAR(32) NOT NULL DEFAULT '0',
      \`currency\` VARCHAR(10) NOT NULL DEFAULT 'USD',
      \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS \`payout_requests\` (
      \`id\` VARCHAR(36) PRIMARY KEY,
      \`user_id\` VARCHAR(36) NOT NULL,
      \`amount_requested\` VARCHAR(32) NOT NULL,
      \`fee_amount\` VARCHAR(32) NOT NULL,
      \`amount_sent\` VARCHAR(32),
      \`method\` VARCHAR(50) NOT NULL,
      \`destination_address\` TEXT NOT NULL,
      \`crypto_currency\` VARCHAR(20),
      \`status\` VARCHAR(50) NOT NULL DEFAULT 'pending',
      \`admin_note\` TEXT,
      \`processed_at\` TIMESTAMP NULL,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS \`tickets\` (
      \`id\` VARCHAR(36) PRIMARY KEY,
      \`shop_id\` VARCHAR(36) NOT NULL,
      \`order_id\` VARCHAR(36),
      \`buyer_email\` VARCHAR(255) NOT NULL,
      \`subject\` VARCHAR(255) NOT NULL,
      \`status\` VARCHAR(50) NOT NULL DEFAULT 'open',
      \`priority\` VARCHAR(50) NOT NULL DEFAULT 'normal',
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (\`shop_id\`) REFERENCES \`shops\`(\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS \`coupons\` (
      \`id\` VARCHAR(36) PRIMARY KEY,
      \`shop_id\` VARCHAR(36) NOT NULL,
      \`code\` VARCHAR(100) NOT NULL,
      \`discount_percent\` INT NULL,
      \`discount_amount\` VARCHAR(32) NULL,
      \`max_uses\` INT NULL,
      \`used_count\` INT NOT NULL DEFAULT 0,
      \`is_active\` BOOLEAN NOT NULL DEFAULT TRUE,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (\`shop_id\`) REFERENCES \`shops\`(\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS \`reviews\` (
      \`id\` VARCHAR(36) PRIMARY KEY,
      \`product_id\` VARCHAR(36) NOT NULL,
      \`order_id\` VARCHAR(36) NULL,
      \`buyer_email\` VARCHAR(255) NOT NULL,
      \`rating\` INT NOT NULL,
      \`comment\` TEXT,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS \`balance_transactions\` (
      \`id\` VARCHAR(36) PRIMARY KEY,
      \`user_id\` VARCHAR(36) NOT NULL,
      \`order_id\` VARCHAR(36) NULL,
      \`type\` VARCHAR(50) NOT NULL,
      \`amount\` VARCHAR(32) NOT NULL,
      \`fee_amount\` VARCHAR(32) NOT NULL DEFAULT '0',
      \`net_amount\` VARCHAR(32) NOT NULL,
      \`description\` TEXT,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS \`ticket_messages\` (
      \`id\` VARCHAR(36) PRIMARY KEY,
      \`ticket_id\` VARCHAR(36) NOT NULL,
      \`sender_type\` VARCHAR(20) NOT NULL,
      \`message\` TEXT NOT NULL,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (\`ticket_id\`) REFERENCES \`tickets\`(\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log("MariaDB tables successfully initialized!");
  await db.end();
}

init().catch((err) => {
  console.error("Initialization failed:", err);
  process.exit(1);
});
