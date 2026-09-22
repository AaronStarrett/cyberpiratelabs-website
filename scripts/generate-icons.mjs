import { readFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const brandSource = readFileSync(new URL("../shared/brand.ts", import.meta.url), "utf8");
function token(name) {
  const match = brandSource.match(new RegExp(`${name}:\\s*"(#[0-9A-Fa-f]{6})"`));
  if (!match) throw new Error(`Missing brand token ${name}`);
  return match[1];
}
const shadow = token("shadow");
const plate = token("plate");
const muted = token("muted");

const source = "public/brand/cpl-logo.png";
await mkdir("public/icons", { recursive: true });

for (const size of [32, 48, 180, 192, 512]) {
  await sharp(source)
    .resize(size, size, { fit: "fill" })
    .png()
    .toFile(`public/icons/icon-${size}.png`);
}

const logo = await sharp(source).resize(520, 520, { fit: "inside" }).png().toBuffer();
const caption = Buffer.from(`<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="${shadow}"/>
  <text x="620" y="250" font-family="IBM Plex Sans, sans-serif" font-size="64" fill="${plate}">CPL Command Center</text>
  <text x="620" y="330" font-family="IBM Plex Sans, sans-serif" font-size="28" fill="${muted}">Your business. Under command.</text>
</svg>`);
await sharp(caption)
  .composite([{ input: logo, left: 48, top: 55 }])
  .png()
  .toFile("public/og.png");
