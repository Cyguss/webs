const mysql = require("mysql2/promise");

async function main() {
  const conn = await mysql.createConnection("mysql://root:proxima123@127.0.0.1:3306/vaultly");
  console.log("Connected to MariaDB.");

  const queries = [
    `ALTER TABLE \`user\` ADD COLUMN IF NOT EXISTS \`role\` VARCHAR(20) NOT NULL DEFAULT 'user'`,
    `ALTER TABLE \`user\` ADD COLUMN IF NOT EXISTS \`discord_id\` VARCHAR(64) NULL`,
    `ALTER TABLE \`user\` ADD COLUMN IF NOT EXISTS \`discord_username\` VARCHAR(100) NULL`,
    `ALTER TABLE \`user\` ADD COLUMN IF NOT EXISTS \`discord_roles\` TEXT NULL`,
  ];

  for (const q of queries) {
    try {
      await conn.query(q);
      console.log("Executed:", q);
    } catch (err) {
      console.error("Error executing query:", err.message);
    }
  }

  const [cols] = await conn.query("DESCRIBE `user`");
  console.log("Current user columns:", cols.map((c) => c.Field));
  await conn.end();
}

main().catch(console.error);
