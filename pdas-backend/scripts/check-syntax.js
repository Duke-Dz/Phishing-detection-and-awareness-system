const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const roots = ["server.js", "worker.js", "scripts", "src", "tests"];
const files = [];

const collect = (entry) => {
  const stat = fs.statSync(entry);
  if (stat.isDirectory()) {
    for (const child of fs.readdirSync(entry)) collect(path.join(entry, child));
  } else if (entry.endsWith(".js")) {
    files.push(entry);
  }
};

roots.forEach(collect);
for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status !== 0) {
    process.stderr.write(result.stderr);
    process.exit(result.status || 1);
  }
}
process.stdout.write(`Syntax checked ${files.length} JavaScript files.\n`);
