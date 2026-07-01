const { startWorker } = require("./src/runtime/worker");

startWorker().catch((error) => {
  process.stderr.write(`Worker startup failed: ${error.message}\n`);
  process.exitCode = 1;
});
