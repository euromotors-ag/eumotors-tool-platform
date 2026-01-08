import { copyFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sourcePath = join(__dirname, "../node_modules/pdfjs-dist/build/pdf.worker.min.mjs");
const destPath = join(__dirname, "../public/pdf.worker.min.mjs");

if (existsSync(sourcePath)) {
  copyFileSync(sourcePath, destPath);
  console.log("✓ PDF.js worker file copied to public folder");
} else {
  console.warn("⚠ PDF.js worker file not found at:", sourcePath);
  console.warn("  Make sure pdfjs-dist is installed");
}

