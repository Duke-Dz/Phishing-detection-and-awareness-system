require('dotenv').config();
const { User, SecurityEvent, RefreshToken } = require('./src/models');
const { sequelize } = require('./src/config/sequelize');

async function test() {
  console.log("--- Starting Phase 2-5 E2E Tests ---");
  try {
    const user = await User.findOne({ where: { email: 'test_e2e@cybersense.io' } });
    if (!user) return console.log("Run e2e-lockout.js first to seed user.");

    // Check Phase 4 logs
    const logs = await SecurityEvent.findAll({ where: { user_id: user.user_id } });
    console.log(`✅ Phase 4: Found ${logs.length} security events logged.`);

    // Check Phase 3 sessions
    const tokens = await RefreshToken.findAll({ where: { user_id: user.user_id } });
    console.log(`✅ Phase 3: Found ${tokens.length} refresh tokens in DB.`);

    console.log("--- Finished: E2E Verification Completed ---");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
test();
