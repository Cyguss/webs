import { pool } from "../lib/db";

export async function zeroDatabase() {
  console.log("[Zero-DB] Starting database wipe / zero-out...");

  const tablesToClear = [
    "reviews",
    "ticket_messages",
    "tickets",
    "notifications",
    "order_deliveries",
    "inventory_keys",
    "orders",
    "products",
    "coupons",
    "shop_approval_requests",
    "payout_requests",
    "balance_transactions",
    "seller_balances",
    "shops",
    "two_factor",
    "session",
    "account",
    "verification",
    "user",
  ];

  const connection = await pool.getConnection();

  try {
    await connection.query("SET FOREIGN_KEY_CHECKS = 0");

    for (const table of tablesToClear) {
      try {
        await connection.query(`TRUNCATE TABLE \`${table}\``);
        console.log(`  ✓ Truncated table: ${table}`);
      } catch (err: any) {
        // Fallback to DELETE if truncate fails
        await connection.query(`DELETE FROM \`${table}\``);
        console.log(`  ✓ Cleared table via DELETE: ${table}`);
      }
    }

    // Reset platform settings to default state
    try {
      await connection.query("DELETE FROM platform_settings WHERE setting_key = 'block_all_admins'");
      await connection.query(
        "INSERT INTO platform_settings (setting_key, setting_value, updated_at) VALUES ('block_all_admins', 'false', NOW())"
      );
      console.log("  ✓ Reset platform_settings (block_all_admins = false)");
    } catch (err: any) {
      console.log("  ℹ platform_settings reset:", err.message);
    }

    await connection.query("SET FOREIGN_KEY_CHECKS = 1");
    console.log("[Zero-DB] Database has been completely zeroed out successfully!");
  } catch (error: any) {
    console.error("[Zero-DB] Error zeroing database:", error);
    throw error;
  } finally {
    connection.release();
  }
}

// Execute if run directly
if (require.main === module || process.argv[1]?.includes("zero-db")) {
  zeroDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
