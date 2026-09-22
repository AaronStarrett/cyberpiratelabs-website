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
const navy = token("navy");
const teal = token("teal");
const signal = token("signal");
const highlight = token("highlight");

const source = "public/brand/cpl-logo.png";
await mkdir("public/icons", { recursive: true });

for (const size of [32, 48, 180, 192, 512]) {
  await sharp(source)
    .resize(size, size, { fit: "fill" })
    .png()
    .toFile(`public/icons/icon-${size}.png`);
}

const logo = await sharp(source).resize(86, 86, { fit: "inside" }).png().toBuffer();
const caption = Buffer.from(`<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="deck" x2="1" y2="1"><stop stop-color="${navy}"/><stop offset="1" stop-color="${shadow}"/></linearGradient>
  </defs>
  <rect width="1200" height="630" fill="${shadow}"/>
  <rect x="665" width="535" height="630" fill="url(#deck)"/>
  <path d="M700 0v630M800 0v630M900 0v630M1000 0v630M1100 0v630M665 100h535M665 200h535M665 300h535M665 400h535M665 500h535" fill="none" stroke="${teal}" stroke-opacity=".18"/>
  <text x="176" y="87" font-family="Arial, Helvetica, sans-serif" font-size="25" fill="${plate}">Cyber Pirate Labs</text>
  <text x="177" y="115" font-family="Arial, Helvetica, sans-serif" letter-spacing="3" font-size="13" fill="${muted}">CPL COMMAND CENTER</text>
  <text x="68" y="260" font-family="Arial, Helvetica, sans-serif" font-size="59" font-weight="500" letter-spacing="-2" fill="${plate}">Your business.</text>
  <text x="68" y="329" font-family="Arial, Helvetica, sans-serif" font-size="59" font-weight="500" letter-spacing="-2" fill="${signal}">Under command.</text>
  <text x="71" y="386" font-family="Arial, Helvetica, sans-serif" font-size="23" fill="${highlight}">From scattered requests to organized work.</text>
  <path d="M72 459h535" stroke="${teal}" stroke-opacity=".6"/>
  <text x="72" y="501" font-family="Arial, Helvetica, sans-serif" font-size="16" fill="${highlight}">REQUEST</text>
  <text x="202" y="501" font-family="Arial, Helvetica, sans-serif" font-size="20" fill="${signal}">→</text>
  <text x="248" y="501" font-family="Arial, Helvetica, sans-serif" font-size="16" fill="${highlight}">FIELD WORK</text>
  <text x="411" y="501" font-family="Arial, Helvetica, sans-serif" font-size="20" fill="${signal}">→</text>
  <text x="458" y="501" font-family="Arial, Helvetica, sans-serif" font-size="16" fill="${highlight}">REPORT</text>
  <text x="71" y="581" font-family="Arial, Helvetica, sans-serif" font-size="14" fill="${muted}">Interactive product preview · Sample data · Early access</text>
  <rect x="736" y="166" width="398" height="385" rx="12" fill="${shadow}" opacity=".4"/>
  <rect x="720" y="150" width="398" height="385" rx="12" fill="${plate}"/>
  <rect x="720" y="150" width="398" height="57" rx="12" fill="${navy}"/>
  <rect x="720" y="185" width="398" height="22" fill="${navy}"/>
  <circle cx="747" cy="179" r="5" fill="${signal}"/>
  <text x="764" y="185" font-family="Arial, Helvetica, sans-serif" font-size="16" fill="${plate}">COMMAND CENTER</text>
  <text x="750" y="250" font-family="Arial, Helvetica, sans-serif" font-size="12" letter-spacing="2" fill="${teal}">HA-1044 / SAMPLE REPORT</text>
  <text x="750" y="288" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="600" fill="${navy}">18 Cedar Wharf</text>
  <text x="750" y="318" font-family="Arial, Helvetica, sans-serif" font-size="16" fill="${teal}">Roof assessment</text>
  <path d="M750 341h338" stroke="${teal}" stroke-opacity=".25"/>
  <rect x="750" y="360" width="83" height="75" rx="5" fill="${highlight}"/>
  <path d="M761 400l30-22 31 22M767 400v23h49v-23" stroke="${teal}" stroke-width="2" fill="none"/>
  <text x="849" y="380" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="600" fill="${navy}">Field evidence attached</text>
  <text x="849" y="407" font-family="Arial, Helvetica, sans-serif" font-size="13" fill="${teal}">Job context carried forward.</text>
  <text x="849" y="428" font-family="Arial, Helvetica, sans-serif" font-size="13" fill="${teal}">Ready for a human review.</text>
  <rect x="750" y="462" width="338" height="43" rx="5" fill="${highlight}"/>
  <text x="769" y="489" font-family="Arial, Helvetica, sans-serif" font-size="15" fill="${navy}">One job. Every moving part.</text>
</svg>`);
await sharp(caption)
  .composite([{ input: logo, left: 68, top: 51 }])
  .png()
  .toFile("public/og.png");
