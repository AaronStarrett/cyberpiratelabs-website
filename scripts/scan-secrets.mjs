import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const skip = new Set(["node_modules", "dist", ".git", ".astro", ".wrangler", "public/icons"]);
const patterns = [
  /AKIA[0-9A-Z]{16}/,
  /-----BEGIN (RSA |OPENSSH |EC )?PRIVATE KEY-----/,
  /AIza[0-9A-Za-z\-_]{35}/,
  /xox[baprs]-[0-9A-Za-z-]{10,}/,
  /ghp_[A-Za-z0-9]{20,}/,
  /sk-[A-Za-z0-9]{20,}/,
];

async function walk(dir, found = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, found);
    else if (/\.(ts|tsx|astro|js|mjs|json|jsonc|md|gs|css|txt|example|sql)$/.test(entry.name) || entry.name.startsWith(".env")) {
      const text = await readFile(full, "utf8");
      for (const pattern of patterns) {
        if (pattern.test(text)) found.push(`${full} matched ${pattern}`);
      }
    }
  }
  return found;
}

const found = await walk(process.cwd());
if (found.length) {
  console.error(found.join("\n"));
  process.exit(1);
}
console.log("Secret scan found no committed credentials.");
