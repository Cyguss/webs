import mysql from "mysql2/promise";

const TABLE_DEFINITIONS = [
  // 1. User
  `CREATE TABLE IF NOT EXISTS \`user\` (
    \`id\` VARCHAR(36) NOT NULL PRIMARY KEY,
    \`name\` TEXT NOT NULL,
    \`email\` VARCHAR(255) NOT NULL UNIQUE,
    \`email_verified\` BOOLEAN NOT NULL DEFAULT 0,
    \`image\` TEXT,
    \`two_factor_enabled\` BOOLEAN DEFAULT 0,
    \`two_factor_method\` VARCHAR(20) DEFAULT 'email',
    \`role\` VARCHAR(20) NOT NULL DEFAULT 'user',
    \`discord_id\` VARCHAR(64),
    \`discord_username\` VARCHAR(100),
    \`discord_roles\` TEXT,
    \`admin_permissions_active\` BOOLEAN NOT NULL DEFAULT 1,
    \`admin_permissions\` TEXT,
    \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  // 2. Session
  `CREATE TABLE IF NOT EXISTS \`session\` (
    \`id\` VARCHAR(36) NOT NULL PRIMARY KEY,
    \`expires_at\` TIMESTAMP NOT NULL,
    \`token\` VARCHAR(255) NOT NULL UNIQUE,
    \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    \`ip_address\` TEXT,
    \`user_agent\` TEXT,
    \`user_id\` VARCHAR(36) NOT NULL,
    INDEX \`session_user_id_idx\` (\`user_id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  // 3. Account
  `CREATE TABLE IF NOT EXISTS \`account\` (
    \`id\` VARCHAR(36) NOT NULL PRIMARY KEY,
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
    INDEX \`account_user_id_idx\` (\`user_id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  // 4. Verification
  `CREATE TABLE IF NOT EXISTS \`verification\` (
    \`id\` VARCHAR(36) NOT NULL PRIMARY KEY,
    \`identifier\` TEXT NOT NULL,
    \`value\` TEXT NOT NULL,
    \`expires_at\` TIMESTAMP NOT NULL,
    \`created_at\` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    \`updated_at\` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  // 5. Two Factor
  `CREATE TABLE IF NOT EXISTS \`two_factor\` (
    \`id\` VARCHAR(36) NOT NULL PRIMARY KEY,
    \`secret\` TEXT NOT NULL,
    \`backup_codes\` TEXT NOT NULL,
    \`user_id\` VARCHAR(36) NOT NULL,
    \`verified\` BOOLEAN DEFAULT 0,
    \`failed_verification_count\` INT DEFAULT 0,
    \`locked_until\` TIMESTAMP NULL,
    INDEX \`two_factor_user_id_idx\` (\`user_id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  // 6. Shops
  `CREATE TABLE IF NOT EXISTS \`shops\` (
    \`id\` VARCHAR(36) NOT NULL PRIMARY KEY,
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
    \`youtube_url\` TEXT,
    \`trustpilot_url\` TEXT,
    \`telegram_url\` TEXT,
    \`discord_webhook_url\` TEXT,
    \`meta_title\` TEXT,
    \`meta_description\` TEXT,
    \`custom_font_url\` TEXT,
    \`text_color\` VARCHAR(20),
    \`muted_text_color\` VARCHAR(20),
    \`card_color\` VARCHAR(20),
    \`border_color\` VARCHAR(20),
    \`theme_mode\` VARCHAR(20) DEFAULT 'dark',
    \`support_email\` VARCHAR(255),
    \`contact_info\` TEXT,
    \`terms_of_service\` TEXT,
    \`custom_css\` TEXT,
    \`custom_html\` TEXT,
    \`is_active\` BOOLEAN NOT NULL DEFAULT 1,
    \`is_accepted\` BOOLEAN NOT NULL DEFAULT 0,
    \`categories\` TEXT,
    \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX \`shops_user_id_idx\` (\`user_id\`),
    INDEX \`shops_slug_idx\` (\`slug\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  // 7. Shop Approval Requests
  `CREATE TABLE IF NOT EXISTS \`shop_approval_requests\` (
    \`id\` VARCHAR(36) NOT NULL PRIMARY KEY,
    \`shop_id\` VARCHAR(36) NOT NULL,
    \`user_id\` VARCHAR(36) NOT NULL,
    \`status\` VARCHAR(20) NOT NULL DEFAULT 'pending',
    \`admin_note\` TEXT,
    \`processed_by\` VARCHAR(100),
    \`webhook_sent_at\` TIMESTAMP NULL,
    \`requested_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`processed_at\` TIMESTAMP NULL,
    INDEX \`shop_reqs_shop_id_idx\` (\`shop_id\`),
    INDEX \`shop_reqs_user_id_idx\` (\`user_id\`),
    INDEX \`shop_reqs_status_idx\` (\`status\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  // 8. Products
  `CREATE TABLE IF NOT EXISTS \`products\` (
    \`id\` VARCHAR(36) NOT NULL PRIMARY KEY,
    \`shop_id\` VARCHAR(36) NOT NULL,
    \`title\` VARCHAR(255) NOT NULL,
    \`description\` TEXT,
    \`category\` VARCHAR(100),
    \`type\` VARCHAR(50) NOT NULL,
    \`price\` VARCHAR(32) NOT NULL,
    \`currency\` VARCHAR(10) NOT NULL DEFAULT 'USD',
    \`stock_limit\` INT,
    \`is_unlimited_stock\` BOOLEAN NOT NULL DEFAULT 0,
    \`thumbnail_url\` TEXT,
    \`images\` TEXT,
    \`youtube_url\` TEXT,
    \`is_active\` BOOLEAN NOT NULL DEFAULT 1,
    \`receipt_note\` TEXT,
    \`duration\` VARCHAR(50) NOT NULL DEFAULT 'lifetime',
    \`duration_days\` INT NOT NULL DEFAULT 0,
    \`custom_duration_label\` VARCHAR(100),
    \`variants\` TEXT,
    \`sort_order\` INT NOT NULL DEFAULT 0,
    \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX \`products_shop_id_idx\` (\`shop_id\`),
    INDEX \`products_is_active_idx\` (\`is_active\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  // 9. Inventory Keys
  `CREATE TABLE IF NOT EXISTS \`inventory_keys\` (
    \`id\` VARCHAR(36) NOT NULL PRIMARY KEY,
    \`product_id\` VARCHAR(36) NOT NULL,
    \`variant_id\` VARCHAR(50),
    \`key_value\` TEXT NOT NULL,
    \`duration\` VARCHAR(50) DEFAULT 'lifetime',
    \`duration_days\` INT DEFAULT 0,
    \`custom_duration_label\` VARCHAR(100),
    \`is_used\` BOOLEAN NOT NULL DEFAULT 0,
    \`used_at\` TIMESTAMP NULL,
    \`order_id\` VARCHAR(36),
    \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX \`inv_keys_prod_used_idx\` (\`product_id\`, \`is_used\`),
    INDEX \`inv_keys_order_idx\` (\`order_id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  // 10. Coupons
  `CREATE TABLE IF NOT EXISTS \`coupons\` (
    \`id\` VARCHAR(36) NOT NULL PRIMARY KEY,
    \`shop_id\` VARCHAR(36) NOT NULL,
    \`code\` VARCHAR(100) NOT NULL,
    \`discount_percent\` INT,
    \`discount_amount\` VARCHAR(32),
    \`max_uses\` INT,
    \`used_count\` INT NOT NULL DEFAULT 0,
    \`is_active\` BOOLEAN NOT NULL DEFAULT 1,
    \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX \`coupons_shop_code_idx\` (\`shop_id\`, \`code\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  // 11. Reviews
  `CREATE TABLE IF NOT EXISTS \`reviews\` (
    \`id\` VARCHAR(36) NOT NULL PRIMARY KEY,
    \`product_id\` VARCHAR(36) NOT NULL,
    \`order_id\` VARCHAR(36),
    \`buyer_email\` VARCHAR(255) NOT NULL,
    \`rating\` INT NOT NULL,
    \`comment\` TEXT,
    \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX \`reviews_product_id_idx\` (\`product_id\`),
    INDEX \`reviews_order_id_idx\` (\`order_id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  // 12. Orders
  `CREATE TABLE IF NOT EXISTS \`orders\` (
    \`id\` VARCHAR(36) NOT NULL PRIMARY KEY,
    \`shop_id\` VARCHAR(36) NOT NULL,
    \`product_id\` VARCHAR(36) NOT NULL,
    \`variant_id\` VARCHAR(50),
    \`coupon_id\` VARCHAR(36),
    \`buyer_email\` VARCHAR(255) NOT NULL,
    \`quantity\` INT NOT NULL DEFAULT 1,
    \`unit_price\` VARCHAR(32) NOT NULL,
    \`total_amount\` VARCHAR(32) NOT NULL,
    \`currency\` VARCHAR(10) NOT NULL DEFAULT 'USD',
    \`payment_method\` VARCHAR(50) NOT NULL,
    \`payment_status\` VARCHAR(50) NOT NULL DEFAULT 'pending',
    \`stripe_payment_intent_id\` VARCHAR(255),
    \`crypto_payment_id\` VARCHAR(255),
    \`access_secret_hash\` VARCHAR(64),
    \`fulfilled_at\` TIMESTAMP NULL,
    \`key_duration\` VARCHAR(50),
    \`key_duration_days\` INT,
    \`key_expires_at\` TIMESTAMP NULL,
    \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX \`orders_shop_id_idx\` (\`shop_id\`),
    INDEX \`orders_product_id_idx\` (\`product_id\`),
    INDEX \`orders_created_at_idx\` (\`created_at\`),
    INDEX \`orders_payment_status_idx\` (\`payment_status\`),
    INDEX \`orders_secret_hash_idx\` (\`access_secret_hash\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  // 13. Order Deliveries
  `CREATE TABLE IF NOT EXISTS \`order_deliveries\` (
    \`id\` VARCHAR(36) NOT NULL PRIMARY KEY,
    \`order_id\` VARCHAR(36) NOT NULL,
    \`delivery_type\` VARCHAR(50) NOT NULL,
    \`delivery_value\` TEXT,
    \`delivered_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX \`order_deliv_order_id_idx\` (\`order_id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  // 14. Seller Balances
  `CREATE TABLE IF NOT EXISTS \`seller_balances\` (
    \`id\` VARCHAR(36) NOT NULL PRIMARY KEY,
    \`user_id\` VARCHAR(36) NOT NULL UNIQUE,
    \`available_balance\` VARCHAR(32) NOT NULL DEFAULT '0',
    \`pending_balance\` VARCHAR(32) NOT NULL DEFAULT '0',
    \`reserve_balance\` VARCHAR(32) NOT NULL DEFAULT '0',
    \`total_earned\` VARCHAR(32) NOT NULL DEFAULT '0',
    \`total_withdrawn\` VARCHAR(32) NOT NULL DEFAULT '0',
    \`currency\` VARCHAR(10) NOT NULL DEFAULT 'USD',
    \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX \`seller_bal_user_id_idx\` (\`user_id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  // 15. Balance Transactions
  `CREATE TABLE IF NOT EXISTS \`balance_transactions\` (
    \`id\` VARCHAR(36) NOT NULL PRIMARY KEY,
    \`user_id\` VARCHAR(36) NOT NULL,
    \`order_id\` VARCHAR(36),
    \`type\` VARCHAR(50) NOT NULL,
    \`amount\` VARCHAR(32) NOT NULL,
    \`fee_amount\` VARCHAR(32) NOT NULL DEFAULT '0',
    \`net_amount\` VARCHAR(32) NOT NULL,
    \`description\` TEXT,
    \`is_released\` BOOLEAN NOT NULL DEFAULT 0,
    \`released_at\` TIMESTAMP NULL,
    \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX \`bal_tx_user_id_idx\` (\`user_id\`),
    INDEX \`bal_tx_created_at_idx\` (\`created_at\`),
    INDEX \`bal_tx_rel_idx\` (\`user_id\`, \`is_released\`, \`type\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  // 16. Payout Requests
  `CREATE TABLE IF NOT EXISTS \`payout_requests\` (
    \`id\` VARCHAR(36) NOT NULL PRIMARY KEY,
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
    INDEX \`payout_req_user_id_idx\` (\`user_id\`),
    INDEX \`payout_req_status_idx\` (\`status\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  // 17. Tickets
  `CREATE TABLE IF NOT EXISTS \`tickets\` (
    \`id\` VARCHAR(36) NOT NULL PRIMARY KEY,
    \`shop_id\` VARCHAR(36) NOT NULL,
    \`order_id\` VARCHAR(36),
    \`buyer_email\` VARCHAR(255) NOT NULL,
    \`subject\` VARCHAR(255) NOT NULL,
    \`status\` VARCHAR(50) NOT NULL DEFAULT 'open',
    \`priority\` VARCHAR(50) NOT NULL DEFAULT 'normal',
    \`access_secret_hash\` VARCHAR(64),
    \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX \`tickets_shop_id_idx\` (\`shop_id\`),
    INDEX \`tickets_status_idx\` (\`status\`),
    INDEX \`tickets_secret_hash_idx\` (\`access_secret_hash\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  // 18. Ticket Messages
  `CREATE TABLE IF NOT EXISTS \`ticket_messages\` (
    \`id\` VARCHAR(36) NOT NULL PRIMARY KEY,
    \`ticket_id\` VARCHAR(36) NOT NULL,
    \`sender_type\` VARCHAR(20) NOT NULL,
    \`message\` TEXT NOT NULL,
    \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX \`ticket_msgs_ticket_id_idx\` (\`ticket_id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  // 19. Platform Settings
  `CREATE TABLE IF NOT EXISTS \`platform_settings\` (
    \`setting_key\` VARCHAR(100) NOT NULL PRIMARY KEY,
    \`setting_value\` TEXT NOT NULL,
    \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  // 20. Notifications
  `CREATE TABLE IF NOT EXISTS \`notifications\` (
    \`id\` VARCHAR(36) NOT NULL PRIMARY KEY,
    \`user_id\` VARCHAR(36) NOT NULL,
    \`shop_id\` VARCHAR(36),
    \`type\` VARCHAR(50) NOT NULL DEFAULT 'general',
    \`title\` VARCHAR(255) NOT NULL,
    \`message\` TEXT NOT NULL,
    \`reason\` TEXT,
    \`is_read\` BOOLEAN NOT NULL DEFAULT 0,
    \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX \`notif_user_read_idx\` (\`user_id\`, \`is_read\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  // 21. API Keys
  `CREATE TABLE IF NOT EXISTS \`api_keys\` (
    \`id\` VARCHAR(36) NOT NULL PRIMARY KEY,
    \`user_id\` VARCHAR(36) NOT NULL,
    \`shop_id\` VARCHAR(36) NOT NULL,
    \`name\` VARCHAR(100) NOT NULL,
    \`key_prefix\` VARCHAR(16) NOT NULL,
    \`key_hash\` VARCHAR(64) NOT NULL UNIQUE,
    \`permissions\` TEXT NOT NULL,
    \`is_active\` BOOLEAN NOT NULL DEFAULT 1,
    \`last_used_at\` TIMESTAMP NULL,
    \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX \`idx_api_keys_shop_id\` (\`shop_id\`),
    INDEX \`idx_api_keys_key_hash\` (\`key_hash\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  // 22. Webhook Endpoints
  `CREATE TABLE IF NOT EXISTS \`webhook_endpoints\` (
    \`id\` VARCHAR(36) NOT NULL PRIMARY KEY,
    \`user_id\` VARCHAR(36) NOT NULL,
    \`shop_id\` VARCHAR(36) NOT NULL,
    \`url\` TEXT NOT NULL,
    \`secret\` VARCHAR(64) NOT NULL,
    \`events\` TEXT NOT NULL,
    \`is_active\` BOOLEAN NOT NULL DEFAULT 1,
    \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX \`idx_webhook_endpoints_shop_id\` (\`shop_id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  // 23. Webhook Logs
  `CREATE TABLE IF NOT EXISTS \`webhook_logs\` (
    \`id\` VARCHAR(36) NOT NULL PRIMARY KEY,
    \`webhook_endpoint_id\` VARCHAR(36) NOT NULL,
    \`shop_id\` VARCHAR(36) NOT NULL,
    \`event\` VARCHAR(50) NOT NULL,
    \`payload\` TEXT NOT NULL,
    \`response_status\` INT,
    \`response_body\` TEXT,
    \`duration_ms\` INT,
    \`success\` BOOLEAN NOT NULL DEFAULT 0,
    \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX \`idx_webhook_logs_endpoint\` (\`webhook_endpoint_id\`),
    INDEX \`idx_webhook_logs_shop\` (\`shop_id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  // 24. Processed Webhook Events (Idempotency & Replay Protection)
  `CREATE TABLE IF NOT EXISTS \`processed_webhook_events\` (
    \`id\` VARCHAR(36) NOT NULL PRIMARY KEY,
    \`provider\` VARCHAR(50) NOT NULL,
    \`event_id\` VARCHAR(255) NOT NULL,
    \`event_type\` VARCHAR(100) NOT NULL,
    \`order_id\` VARCHAR(36),
    \`merchant_id\` VARCHAR(36),
    \`amount\` VARCHAR(32),
    \`currency\` VARCHAR(10) DEFAULT 'USD',
    \`status\` VARCHAR(50) NOT NULL DEFAULT 'processed',
    \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY \`uk_provider_event\` (\`provider\`, \`event_id\`),
    INDEX \`proc_wh_order_idx\` (\`order_id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
];

let initPromise: Promise<void> | null = null;

export async function ensureDatabaseSchema(pool: mysql.Pool): Promise<void> {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      const conn = await pool.getConnection();
      try {
        // Execute table creation sequentially
        for (const sql of TABLE_DEFINITIONS) {
          try {
            await conn.query(sql);
          } catch (tblErr: any) {
            console.error(`[DB Init] Error executing table definition:`, tblErr?.message);
          }
        }

        // Helper to safely add column on MySQL without IF NOT EXISTS syntax errors
        async function ensureColumn(table: string, column: string, definition: string) {
          try {
            const [rows]: any = await conn.query(
              `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
              [table, column]
            );
            if (!rows || rows.length === 0) {
              await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
              console.log(`✓ [DB Auto-Init] Added missing column ${table}.${column}`);
            }
          } catch {
            // Fallback direct ALTER ignoring duplicate column error (1060 / ER_DUP_FIELDNAME)
            try {
              await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
              console.log(`✓ [DB Auto-Init] Added missing column ${table}.${column}`);
            } catch (alterErr: any) {
              if (alterErr?.errno !== 1060 && alterErr?.code !== "ER_DUP_FIELDNAME") {
                console.warn(`[DB Auto-Init] Column migration notice for ${table}.${column}:`, alterErr?.message);
              }
            }
          }
        }

        // Verify and add missing columns if any table was partially migrated previously
        const columnsToEnsure = [
          { table: "user", column: "two_factor_method", def: "VARCHAR(20) DEFAULT 'email'" },
          { table: "user", column: "admin_permissions_active", def: "BOOLEAN NOT NULL DEFAULT 1" },
          { table: "user", column: "admin_permissions", def: "TEXT NULL" },
          { table: "user", column: "discord_id", def: "VARCHAR(64) NULL" },
          { table: "user", column: "discord_username", def: "VARCHAR(100) NULL" },
          { table: "user", column: "discord_roles", def: "TEXT NULL" },
          { table: "shops", column: "is_accepted", def: "BOOLEAN NOT NULL DEFAULT 0" },
          { table: "shops", column: "theme_mode", def: "VARCHAR(20) DEFAULT 'dark'" },
          { table: "shops", column: "support_email", def: "VARCHAR(255) NULL" },
          { table: "shops", column: "contact_info", def: "TEXT NULL" },
          { table: "shops", column: "terms_of_service", def: "TEXT NULL" },
          { table: "shops", column: "categories", def: "TEXT NULL" },
          { table: "shops", column: "twitter_url", def: "TEXT NULL" },
          { table: "shops", column: "discord_url", def: "TEXT NULL" },
          { table: "shops", column: "telegram_url", def: "TEXT NULL" },
          { table: "shops", column: "youtube_url", def: "TEXT NULL" },
          { table: "shops", column: "trustpilot_url", def: "TEXT NULL" },
          { table: "shops", column: "discord_webhook_url", def: "TEXT NULL" },
          { table: "products", column: "category", def: "VARCHAR(100) NULL" },
          { table: "products", column: "youtube_url", def: "TEXT NULL" },
          { table: "products", column: "duration", def: "VARCHAR(50) NOT NULL DEFAULT 'lifetime'" },
          { table: "products", column: "duration_days", def: "INT NOT NULL DEFAULT 0" },
          { table: "products", column: "custom_duration_label", def: "VARCHAR(100) NULL" },
          { table: "products", column: "variants", def: "TEXT NULL" },
          { table: "products", column: "sort_order", def: "INT NOT NULL DEFAULT 0" },
          { table: "inventory_keys", column: "duration", def: "VARCHAR(50) DEFAULT 'lifetime'" },
          { table: "inventory_keys", column: "duration_days", def: "INT DEFAULT 0" },
          { table: "inventory_keys", column: "custom_duration_label", def: "VARCHAR(100) NULL" },
          { table: "inventory_keys", column: "variant_id", def: "VARCHAR(50) NULL" },
          { table: "orders", column: "variant_id", def: "VARCHAR(50) NULL" },
          { table: "orders", column: "key_duration", def: "VARCHAR(50) NULL" },
          { table: "orders", column: "key_duration_days", def: "INT NULL" },
          { table: "orders", column: "key_expires_at", def: "TIMESTAMP NULL" },
          { table: "orders", column: "access_secret_hash", def: "VARCHAR(64) NULL" },
          { table: "balance_transactions", column: "is_released", def: "BOOLEAN NOT NULL DEFAULT 0" },
          { table: "balance_transactions", column: "released_at", def: "TIMESTAMP NULL" },
          { table: "balance_transactions", column: "currency", def: "VARCHAR(10) NOT NULL DEFAULT 'USD'" },
          { table: "balance_transactions", column: "provider", def: "VARCHAR(50) NULL" },
          { table: "balance_transactions", column: "provider_payment_id", def: "VARCHAR(255) NULL" },
          { table: "balance_transactions", column: "external_event_id", def: "VARCHAR(255) NULL" },
          { table: "seller_balances", column: "reserve_balance", def: "VARCHAR(32) NOT NULL DEFAULT '0'" },
          { table: "tickets", column: "access_secret_hash", def: "VARCHAR(64) NULL" },
        ];

        for (const col of columnsToEnsure) {
          await ensureColumn(col.table, col.column, col.def);
        }

        // Insert default platform settings if missing
        const defaultSettings = [
          { key: "platform_fee_percent", value: "5" },
          { key: "allow_store_creation", value: "true" },
          { key: "allow_user_registration", value: "true" },
          { key: "enable_crypto_payments", value: "true" },
          { key: "enable_stripe_payments", value: "true" },
          { key: "cryptomus_sandbox_mode", value: "true" },
          { key: "announcement_banner_active", value: "false" },
          { key: "announcement_banner_text", value: "" },
          { key: "announcement_banner_type", value: "info" },
          { key: "block_all_admins", value: "false" },
          { key: "maintenance_mode", value: "false" },
          { key: "maintenance_message", value: "KRYPT MARKET protocol is undergoing scheduled maintenance. Node synchronization will resume shortly." },
          { key: "bot_config", value: JSON.stringify({ enabled: true, autoRoles: true }) },
        ];

        for (const s of defaultSettings) {
          try {
            await conn.query(
              `INSERT IGNORE INTO \`platform_settings\` (\`setting_key\`, \`setting_value\`) VALUES (?, ?)`,
              [s.key, s.value]
            );
          } catch {}
        }

        console.log("✓ [DB Auto-Init] All database tables and initial schema verified.");
      } finally {
        conn.release();
      }
    } catch (err: any) {
      console.error("[DB Auto-Init] Failed to ensure database schema:", err?.message || err);
      // Reset so next request can retry if connection was temporarily down
      initPromise = null;
      throw err;
    }
  })();

  return initPromise;
}
