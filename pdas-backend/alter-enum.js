require('dotenv').config();
const { sequelize } = require('./src/config/sequelize');

async function run() {
  try {
    await sequelize.query(`ALTER TYPE "enum_security_events_event_type" ADD VALUE IF NOT EXISTS 'PASSWORD_RESET_REQUESTED';`);
    await sequelize.query(`ALTER TYPE "enum_security_events_event_type" ADD VALUE IF NOT EXISTS 'PASSWORD_RESET_COMPLETED';`);
    await sequelize.query(`ALTER TYPE "enum_security_events_event_type" ADD VALUE IF NOT EXISTS 'EMAIL_VERIFIED';`);
    await sequelize.query(`ALTER TYPE "enum_security_events_event_type" ADD VALUE IF NOT EXISTS 'ACCOUNT_REGISTERED';`);
    console.log("Enum altered successfully.");
  } catch (error) {
    console.error("Error altering enum:", error.message);
  } finally {
    process.exit(0);
  }
}

run();
