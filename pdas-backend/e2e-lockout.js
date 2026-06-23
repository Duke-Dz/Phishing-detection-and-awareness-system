require('dotenv').config();
const { sequelize } = require('./src/config/sequelize');
const { User } = require('./src/models');
const bcrypt = require('bcryptjs');

async function run() {
  await sequelize.authenticate();
  
  const email = "test_e2e@cybersense.io";
  const password = "Password123!";
  const password_hash = await bcrypt.hash(password, 12);
  
  // Clean up
  await User.destroy({ where: { email } });
  
  // Seed user
  const user = await User.create({
    username: "test_e2e",
    full_name: "Test E2E User",
    email,
    password_hash,
    role: "user",
    email_verified: true,
    is_active: true
  });

  const apiUrl = "http://localhost:5000/api/auth/login";

  async function attemptLogin(pwd) {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: email, password: pwd })
    });
    const body = await res.json();
    return { status: res.status, body };
  }

  console.log("--- Starting Tests ---");
  let passed = 0;

  try {
    // Test A: 4 wrong passwords
    for(let i=0; i<4; i++) {
      await attemptLogin("wrong");
    }
    let u = await User.findByPk(user.user_id);
    if (u.failed_login_attempts === 4 && u.locked_until === null) {
      console.log("✅ Test A Passed: 4 wrong passwords -> confirm counter is 4, no lockout");
      passed++;
    } else {
      console.log(`❌ Test A Failed: counter=${u.failed_login_attempts}, locked=${u.locked_until}`);
    }

    // Test B: 5th wrong password
    let resB = await attemptLogin("wrong");
    u = await User.findByPk(user.user_id);
    if (u.failed_login_attempts === 5 && u.locked_until !== null) {
      console.log("✅ Test B Passed: 5th wrong password -> confirm counter is 5, locked_until is set to now + 15 mins");
      passed++;
    } else {
      console.log(`❌ Test B Failed: counter=${u.failed_login_attempts}, locked=${u.locked_until}`);
    }

    // Test C: 6th attempt while locked
    let resC = await attemptLogin("wrong");
    u = await User.findByPk(user.user_id);
    if (resC.status === 401 && resC.body.message === "Incorrect email, username, or password." && u.failed_login_attempts === 6) {
      console.log("✅ Test C Passed: 6th attempt while locked -> confirm 401 with generic message, counter increments to 6");
      passed++;
    } else {
      console.log(`❌ Test C Failed: status=${resC.status}, msg=${resC.body.message}, counter=${u.failed_login_attempts}`);
    }

    // Test D: Manually clear locked_until in DB, attempt again -> confirm immediate re-lock
    await User.update({ locked_until: null }, { where: { user_id: user.user_id } });
    let resD = await attemptLogin("wrong"); // 7th attempt
    u = await User.findByPk(user.user_id);
    if (u.failed_login_attempts === 7 && u.locked_until !== null) {
      console.log("✅ Test D Passed: Manually clear locked_until, attempt again -> confirm immediate re-lock since counter is still >= 5");
      passed++;
    } else {
      console.log(`❌ Test D Failed: counter=${u.failed_login_attempts}, locked=${u.locked_until}`);
    }

    // Test E: Correct password after lockout expires (we manually clear locked_until to simulate expiry)
    await User.update({ locked_until: null }, { where: { user_id: user.user_id } });
    let resE = await attemptLogin(password);
    u = await User.findByPk(user.user_id);
    if (resE.status === 200 && u.failed_login_attempts === 0 && u.locked_until === null) {
      console.log("✅ Test E Passed: Correct password after lockout expires -> confirm 200, counter resets to 0, locked_until is null");
      passed++;
    } else {
      console.log(`❌ Test E Failed: status=${resE.status}, counter=${u.failed_login_attempts}`);
    }
  } catch (error) {
    console.error("Test execution failed:", error);
  } finally {
    console.log(`--- Finished: ${passed}/5 Tests Passed ---`);
    process.exit(passed === 5 ? 0 : 1);
  }
}

run();
