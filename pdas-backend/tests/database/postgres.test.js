const test = require("node:test");
const assert = require("node:assert/strict");

test("PostgreSQL accepts isolated transactions", { skip: process.env.RUN_DB_INTEGRATION !== "true" }, async () => {
  const { sequelize } = require("../../src/config/sequelize");
  try {
    await sequelize.authenticate();
    const transaction = await sequelize.transaction();
    const [rows] = await sequelize.query("SELECT 1 AS healthy", { transaction });
    assert.equal(rows[0].healthy, 1);
    await transaction.rollback();
  } finally {
    await sequelize.close();
  }
});
