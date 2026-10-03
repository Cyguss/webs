import { pool } from "../lib/db";

async function main() {
  const email = "michal280508@gmail.com";
  console.log(`Setting superadmin role for ${email}...`);
  await pool.query(
    "UPDATE user SET role = 'superadmin', admin_permissions_active = 1, admin_permissions = 'all' WHERE email = ?",
    [email]
  );
  const [rows] = await pool.query(
    "SELECT id, email, role, admin_permissions_active, admin_permissions FROM user WHERE email = ?",
    [email]
  );
  console.log("Updated user in database:", rows);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
