const mysql = require("mysql2/promise");

async function migrate() {
  const connection = await mysql.createConnection({
    host: "127.0.0.1",
    port: 3306,
    user: "root",
    password: "proxima123",
    database: "vaultly",
  });

  console.log("Connected to MySQL database.");

  try {
    const [cols] = await connection.query("SHOW COLUMNS FROM `shops`");
    const colNames = cols.map((c) => c.Field);

    if (!colNames.includes("youtube_url")) {
      await connection.query("ALTER TABLE `shops` ADD COLUMN `youtube_url` TEXT NULL AFTER `discord_url`");
      console.log("Added youtube_url column to shops table.");
    } else {
      console.log("youtube_url already exists.");
    }

    if (!colNames.includes("trustpilot_url")) {
      await connection.query("ALTER TABLE `shops` ADD COLUMN `trustpilot_url` TEXT NULL AFTER `youtube_url`");
      console.log("Added trustpilot_url column to shops table.");
    } else {
      console.log("trustpilot_url already exists.");
    }

    console.log("Migration completed successfully.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await connection.end();
  }
}

migrate();
