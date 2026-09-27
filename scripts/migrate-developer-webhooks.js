const mysql = require("mysql2/promise");

async function main() {
  console.log("Connecting to MariaDB...");
  const conn = await mysql.createConnection({
    host: "127.0.0.1",
    port: 3306,
    user: "root",
    password: "proxima123",
    database: "vaultly",
  });

  console.log("Connected. Creating api_keys, webhook_endpoints, and webhook_logs tables...");

  await conn.query(`
    CREATE TABLE IF NOT EXISTS \`api_keys\` (
      \`id\` VARCHAR(36) PRIMARY KEY,
      \`user_id\` VARCHAR(36) NOT NULL,
      \`shop_id\` VARCHAR(36) NOT NULL,
      \`name\` VARCHAR(100) NOT NULL,
      \`key_prefix\` VARCHAR(16) NOT NULL,
      \`key_hash\` VARCHAR(64) NOT NULL UNIQUE,
      \`permissions\` TEXT NOT NULL,
      \`is_active\` BOOLEAN NOT NULL DEFAULT TRUE,
      \`last_used_at\` TIMESTAMP NULL,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX \`idx_api_keys_shop_id\` (\`shop_id\`),
      INDEX \`idx_api_keys_key_hash\` (\`key_hash\`),
      FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE,
      FOREIGN KEY (\`shop_id\`) REFERENCES \`shops\`(\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS \`webhook_endpoints\` (
      \`id\` VARCHAR(36) PRIMARY KEY,
      \`user_id\` VARCHAR(36) NOT NULL,
      \`shop_id\` VARCHAR(36) NOT NULL,
      \`url\` TEXT NOT NULL,
      \`secret\` VARCHAR(64) NOT NULL,
      \`events\` TEXT NOT NULL,
      \`is_active\` BOOLEAN NOT NULL DEFAULT TRUE,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX \`idx_webhook_endpoints_shop_id\` (\`shop_id\`),
      FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE,
      FOREIGN KEY (\`shop_id\`) REFERENCES \`shops\`(\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS \`webhook_logs\` (
      \`id\` VARCHAR(36) PRIMARY KEY,
      \`webhook_endpoint_id\` VARCHAR(36) NOT NULL,
      \`shop_id\` VARCHAR(36) NOT NULL,
      \`event\` VARCHAR(50) NOT NULL,
      \`payload\` MEDIUMTEXT NOT NULL,
      \`response_status\` INT NULL,
      \`response_body\` TEXT NULL,
      \`duration_ms\` INT NULL,
      \`success\` BOOLEAN NOT NULL DEFAULT FALSE,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX \`idx_webhook_logs_endpoint\` (\`webhook_endpoint_id\`),
      INDEX \`idx_webhook_logs_shop\` (\`shop_id\`),
      FOREIGN KEY (\`webhook_endpoint_id\`) REFERENCES \`webhook_endpoints\`(\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log("Developer & Webhooks tables created successfully!");
  await conn.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
