/**
 * make-admin.js
 * Promotes a user to the 'admin' role directly in the database.
 *
 * Usage:
 *   node scripts/make-admin.js <email>
 *
 * Example:
 *   node scripts/make-admin.js admin@pdas.local
 */

require("dotenv").config();
const { Sequelize } = require("sequelize");

const email = process.argv[2];
if (!email) {
  console.error("❌ Usage: node scripts/make-admin.js <email>");
  process.exit(1);
}

const seq = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    logging: false,
  }
);

(async () => {
  try {
    await seq.authenticate();
    console.log("✅ Connected to database.");

    // Show all current users first
    const users = await seq.query(
      `SELECT user_id, full_name, email, role, is_active, created_at
       FROM users ORDER BY created_at ASC`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    console.log("\n📋 All registered users:");
    console.table(
      users.map((u) => ({
        email: u.email,
        name: u.full_name,
        role: u.role,
        active: u.is_active,
        created: u.created_at,
      }))
    );

    // Find the target user
    const [target] = users.filter((u) => u.email === email.toLowerCase());
    if (!target) {
      console.error(`\n❌ No user found with email: ${email}`);
      await seq.close();
      process.exit(1);
    }

    if (target.role === "admin") {
      console.log(`\nℹ️  ${email} is already an admin. No change needed.`);
      await seq.close();
      return;
    }

    console.log(`\n⚙️  Current role: '${target.role}' → upgrading to 'admin'...`);

    // Promote to admin
    await seq.query(
      `UPDATE users SET role = 'admin' WHERE email = :email`,
      { replacements: { email: email.toLowerCase() }, type: Sequelize.QueryTypes.UPDATE }
    );

    console.log(`\n✅ SUCCESS: ${email} has been promoted to 'admin'.`);
    console.log("   Log in again in Postman to get a fresh token with the admin role.");
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  } finally {
    await seq.close();
  }
})();
