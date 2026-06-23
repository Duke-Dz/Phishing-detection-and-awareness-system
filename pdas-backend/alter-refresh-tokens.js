require('dotenv').config();
const { sequelize } = require('./src/config/sequelize');

async function run() {
  try {
    await sequelize.query(`ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS user_agent VARCHAR(255);`);
    await sequelize.query(`ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);`);
    await sequelize.query(`ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE;`);
    console.log("Database altered successfully.");
  } catch (error) {
    console.error("Error altering database:", error);
  } finally {
    process.exit(0);
  }
}

run();
