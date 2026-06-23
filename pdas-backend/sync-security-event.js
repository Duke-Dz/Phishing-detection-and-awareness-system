require('dotenv').config();
const { SecurityEvent } = require('./src/models');

async function run() {
  try {
    await SecurityEvent.sync();
    console.log("SecurityEvent table created.");
  } catch (error) {
    console.error("Error creating table:", error);
  } finally {
    process.exit(0);
  }
}

run();
