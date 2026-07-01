const { startApi } = require("./src/runtime/api");

startApi().catch((error) => {
  process.stderr.write(`API startup failed: ${error.message}\n`);
  process.exitCode = 1;
});
