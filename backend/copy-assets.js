import { cpSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const assetsDir = join(__dirname, "assets");
const distAssetsDir = join(__dirname, "dist", "assets");

try {
  // Skapa dist/assets mapp om den inte finns
  mkdirSync(distAssetsDir, { recursive: true });

  // Kopiera alla assets
  cpSync(assetsDir, distAssetsDir, { recursive: true });

  console.log("✅ Assets kopierade till dist/assets");
} catch (error) {
  console.error("❌ Fel vid kopiering av assets:", error);
  process.exit(1);
}
