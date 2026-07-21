process.env.NODE_ENV = "test";

const test = require("node:test");
const assert = require("node:assert/strict");
const { ThreatIntelligence } = require("../../src/models");
const {
  clearDomainCache,
  lookupDomain,
} = require("../../src/services/threatIntelService");

test("concurrent unknown-domain lookups share one database read", async (t) => {
  clearDomainCache();
  let findCount = 0;

  t.after(() => {
    clearDomainCache();
    t.mock.restoreAll();
  });

  t.mock.method(ThreatIntelligence, "findOne", async () => {
    findCount += 1;
    await new Promise((resolve) => setImmediate(resolve));
    return null;
  });

  const results = await Promise.all(
    Array.from({ length: 12 }, () => lookupDomain("newsletter.example")),
  );

  assert.deepEqual(results, Array(12).fill(null));
  assert.equal(findCount, 1);

  assert.equal(await lookupDomain("newsletter.example"), null);
  assert.equal(findCount, 1, "negative results remain cached for the TTL");
});
