const mysql = require("mysql2/promise");

async function main() {
  const conn = await mysql.createConnection("mysql://root:proxima123@127.0.0.1:3306/vaultly");
  console.log("Connected to MariaDB.");

  await conn.query(`
    CREATE TABLE IF NOT EXISTS platform_settings (
      setting_key VARCHAR(50) PRIMARY KEY,
      setting_value TEXT NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await conn.query(`
    INSERT IGNORE INTO platform_settings (setting_key, setting_value)
    VALUES ('block_all_admins', 'false')
  `);

  const [rows] = await conn.query("SELECT * FROM platform_settings");
  console.log("Settings in DB:", rows);
  await conn.end();
}

main().catch(console.error);
