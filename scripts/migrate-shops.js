const mysql = require("mysql2/promise");

async function run() {
  const db = await mysql.createConnection({
    host: "127.0.0.1",
    port: 3306,
    user: "root",
    password: "proxima123",
    database: "vaultly",
  });

  const columnsToAdd = [
    { name: "discord_webhook_url", type: "TEXT NULL" },
    { name: "meta_title", type: "TEXT NULL" },
    { name: "meta_description", type: "TEXT NULL" },
    { name: "custom_font_url", type: "TEXT NULL" },
  ];

  for (const col of columnsToAdd) {
    try {
      await db.query(`ALTER TABLE \`shops\` ADD COLUMN \`${col.name}\` ${col.type}`);
      console.log(`Added column ${col.name} to shops`);
    } catch (err) {
      if (err.code === "ER_DUP_FIELDNAME") {
        console.log(`Column ${col.name} already exists`);
      } else {
        console.error(`Error adding ${col.name}:`, err.message);
      }
    }
  }

  const [cols] = await db.query("DESCRIBE `shops`");
  console.log("Shops columns:", cols.map((c) => c.Field).join(", "));
  await db.end();
}

run().catch(console.error);
