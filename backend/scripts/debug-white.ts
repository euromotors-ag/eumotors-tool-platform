// Debug helper: runs the "white" profile pipeline on local images and saves every
// intermediate render so the result can be inspected. Usage:
//   npx tsx scripts/debug-white.ts <outDir> <image> [image...]
import dotenv from "dotenv";
import path from "path";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const [outDir, ...images] = process.argv.slice(2);
if (!outDir || images.length === 0) {
  console.error("usage: tsx scripts/debug-white.ts <outDir> <image...>");
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });

const { processImageSync } = await import("@services/carcutter.service.js");
const { getTemporaryUrl } = await import("@services/s3.service.js");
const { compositeOnWhite } = await import("@services/white-background.service.js");
const { DEFAULT_PROFILES } = await import("../types/types.js");
const sharp = (await import("sharp")).default;

const profile = DEFAULT_PROFILES.white;
const namespace = process.env.DEBUG_NAMESPACE ?? "sync:white";

for (const imagePath of images) {
  const name = path.basename(path.dirname(imagePath)).split(/\s-\s/)[0].replace(/\W+/g, "_").slice(0, 40) + "-" + path.basename(imagePath, path.extname(imagePath));
  const img = readFileSync(imagePath);
  const meta = await sharp(img).metadata();
  console.log(`\n=== ${imagePath} (${meta.width}x${meta.height} ${meta.format})`);

  const [urlA, urlB] = await Promise.all([
    getTemporaryUrl(img, "image/jpeg", namespace),
    getTemporaryUrl(img, "image/jpeg", `${namespace}:floor`),
  ]);
  console.log("urlA", urlA, "\nurlB", urlB);

  const t0 = Date.now();
  const [a, b] = await Promise.all([
    processImageSync({ url: urlA, cut_type: profile.cut_type, background: profile.background }),
    processImageSync({ url: urlB, cut_type: profile.cut_type, scene_id: profile.lightFloorSceneId }),
  ]);
  console.log(`renders took ${Date.now() - t0} ms; A ${a.fileType.mime} ${a.buffer.length} B; ${b.fileType.mime} ${b.buffer.length} B`);
  writeFileSync(path.join(outDir, `${name}-A-whitebackdrop.${a.fileType.ext}`), a.buffer);
  writeFileSync(path.join(outDir, `${name}-B-mey28.${b.fileType.ext}`), b.buffer);

  const ma = await sharp(a.buffer).metadata();
  const mb = await sharp(b.buffer).metadata();
  console.log(`A ${ma.width}x${ma.height} ${ma.format}; B ${mb.width}x${mb.height} ${mb.format}`);

  try {
    const t1 = Date.now();
    const out = await compositeOnWhite(a.buffer, b.buffer);
    console.log(`composite ok in ${Date.now() - t1} ms`);
    writeFileSync(path.join(outDir, `${name}-C-result.jpg`), out);
  } catch (err) {
    console.error("composite FAILED:", err instanceof Error ? err.message : err);
  }
}
