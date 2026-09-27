const mysql = require("mysql2/promise");

async function run() {
  const db = await mysql.createConnection({
    host: "127.0.0.1",
    port: 3306,
    user: "root",
    password: "proxima123",
    database: "vaultly",
  });

  console.log("Running approval system migration...");

  // 1. Add isAccepted column to shops
  try {
    await db.query(`ALTER TABLE \`shops\` ADD COLUMN \`is_accepted\` TINYINT(1) NOT NULL DEFAULT 0`);
    console.log("Added is_accepted column to shops");
  } catch (err) {
    if (err.code === "ER_DUP_FIELDNAME") {
      console.log("is_accepted column already exists in shops");
    } else {
      console.error("Error adding is_accepted:", err.message);
    }
  }

  // 2. Create shop_approval_requests table
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS \`shop_approval_requests\` (
        \`id\` VARCHAR(36) NOT NULL PRIMARY KEY,
        \`shop_id\` VARCHAR(36) NOT NULL,
        \`user_id\` VARCHAR(36) NOT NULL,
        \`status\` VARCHAR(20) NOT NULL DEFAULT 'pending',
        \`admin_note\` TEXT NULL,
        \`processed_by\` VARCHAR(100) NULL,
        \`webhook_sent_at\` DATETIME NULL,
        \`requested_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`processed_at\` DATETIME NULL,
        CONSTRAINT \`fk_sar_shop\` FOREIGN KEY (\`shop_id\`) REFERENCES \`shops\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`fk_sar_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("Created shop_approval_requests table");
  } catch (err) {
    console.error("Error creating shop_approval_requests:", err.message);
  }

  // 3. Expand platform_settings.setting_key to 100 chars
  try {
    await db.query(`ALTER TABLE \`platform_settings\` MODIFY COLUMN \`setting_key\` VARCHAR(100) NOT NULL`);
    console.log("Expanded setting_key column to 100 chars");
  } catch (err) {
    console.log("Could not modify setting_key (may already be correct):", err.message);
  }

  const [cols] = await db.query("DESCRIBE `shops`");
  console.log("Shops columns:", cols.map((c) => c.Field).join(", "));

  await db.end();
  console.log("Migration complete.");
}

run().catch(console.error);
