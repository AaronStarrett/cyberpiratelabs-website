import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (entry.name.endsWith(".html")) acc.push(full);
  }
  return acc;
}

function contents(html, pattern) {
  return [...html.matchAll(pattern)].map((match) => match[1] ?? "");
}

const scriptHashes = new Set();
const styleHashes = new Set();
for (const file of walk("dist")) {
  const html = readFileSync(file, "utf8");
  for (const body of contents(html, /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) {
    scriptHashes.add(`'sha256-${createHash("sha256").update(body).digest("base64")}'`);
  }
  for (const body of contents(html, /<style[^>]*>([\s\S]*?)<\/style>/g)) {
    styleHashes.add(`'sha256-${createHash("sha256").update(body).digest("base64")}'`);
  }
}

const scriptSrc = ["'self'", "https://challenges.cloudflare.com", ...scriptHashes].join(" ");
const styleSrc = ["'self'", ...styleHashes].join(" ");
const policy = `default-src 'self'; img-src 'self'; style-src ${styleSrc}; font-src 'self'; script-src ${scriptSrc}; frame-src https://challenges.cloudflare.com; connect-src 'self' https://challenges.cloudflare.com; base-uri 'self'; form-action 'self'; object-src 'none'; frame-ancestors 'none'`;

const headers = `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: DENY
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
  Content-Security-Policy: ${policy}
`;

writeFileSync("dist/_headers", headers);
writeFileSync("public/_headers", headers);
console.log(`CSP includes ${scriptHashes.size} script hashes and ${styleHashes.size} style hashes.`);
