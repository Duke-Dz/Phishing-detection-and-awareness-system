import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../dist/", import.meta.url));
const findings = [];
const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\b(?:sk_live|sk_test)_[A-Za-z0-9_-]{16,}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bgh[opusr]_[A-Za-z0-9]{30,}\b/,
];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(path);
      continue;
    }

    const displayPath = relative(root, path);
    if (extname(entry.name) === ".map") {
      findings.push(`${displayPath}: production source map`);
      continue;
    }

    if (![".js", ".css", ".html"].includes(extname(entry.name))) continue;
    const contents = await readFile(path, "utf8");
    if (/sourceMappingURL\s*=/.test(contents)) {
      findings.push(`${displayPath}: source map reference`);
    }
    for (const pattern of secretPatterns) {
      if (pattern.test(contents)) findings.push(`${displayPath}: secret-like value`);
    }
  }
}

await walk(root);

if (findings.length) {
  console.error("Production build audit failed:");
  findings.forEach((finding) => console.error(`- ${finding}`));
  process.exitCode = 1;
} else {
  console.log("Production build audit passed: no source maps or secret-like values found.");
}
