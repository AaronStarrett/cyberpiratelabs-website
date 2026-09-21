import { mkdir } from "node:fs/promises";
import sharp from "sharp";

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
  <rect width="1200" height="630" fill="#f4f7f6"/>
  <text x="620" y="250" font-family="Georgia, serif" font-size="64" fill="#071c27">CPL Command Center</text>
  <text x="620" y="330" font-family="Georgia, serif" font-size="28" fill="#314854">Turn scattered work into a connected operation.</text>
</svg>`);
await sharp(caption)
  .composite([{ input: logo, left: 48, top: 55 }])
  .png()
  .toFile("public/og.png");
