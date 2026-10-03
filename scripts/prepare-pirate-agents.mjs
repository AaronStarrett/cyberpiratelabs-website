// Offline asset preparation only. The website serves the committed WebP files.
import sharp from "sharp";
import { mkdir, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const output = new URL("public/illustrations/", root);
await mkdir(output, { recursive: true });

for (const variant of ["voice", "chat"]) {
  const name = `cpl-pirate-agent-${variant}`;
  const source = fileURLToPath(new URL(`design/pirate-agents/${name}.source.png`, root));
  const metadata = await sharp(source).metadata();
  if (!metadata.hasAlpha || metadata.width !== metadata.height) {
    throw new Error(`${name}: expected a square master with transparency`);
  }
  for (const size of [480, 960]) {
    const suffix = size === 480 ? "" : "@2x";
    const destination = fileURLToPath(new URL(`${name}${suffix}.webp`, output));
    await sharp(source)
      .resize(size, size, { fit: "contain", withoutEnlargement: true })
      .webp({ quality: 90, alphaQuality: 100, effort: 6 })
      .toFile(destination);
    const { size: bytes } = await stat(destination);
    console.log(`${name}${suffix}: ${size} x ${size}, ${bytes} bytes, alpha preserved`);
  }
}
