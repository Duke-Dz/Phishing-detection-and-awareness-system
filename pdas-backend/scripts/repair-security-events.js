require("dotenv").config({ quiet: true });

const { sequelize } = require("../src/config/sequelize");
const SecurityEvent = require("../src/models/SecurityEvent");

const repair = async () => {
  const tables = await sequelize.getQueryInterface().showAllTables();
  const exists = tables.some((table) =>
    String(typeof table === "string" ? table : table.tableName).toLowerCase() === "securityevents");

  if (exists) {
    process.stdout.write("SecurityEvents table already exists.\n");
    return;
  }

  await SecurityEvent.sync();
  process.stdout.write("SecurityEvents table created.\n");
};

repair()
  .catch((error) => {
    process.stderr.write(`SecurityEvents repair failed: ${error.message}\n`);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());
