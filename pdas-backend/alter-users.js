require('dotenv').config();
const { sequelize } = require('./src/config/sequelize');

async function run() {
  try {
    await sequelize.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0 NOT NULL;`);
    await sequelize.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE;`);
    await sequelize.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_failed_login TIMESTAMP WITH TIME ZONE;`);
    console.log("Database altered successfully.");
  } catch (error) {
    console.error("Error altering database:", error);
  } finally {
    process.exit(0);
  }
}

run();
