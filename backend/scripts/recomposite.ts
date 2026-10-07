// Usage: npx tsx scripts/recomposite.ts <dir...>  -> re-runs compositeOnWhite on every *-A-whitebackdrop.* / *-B-mey28.* pair
import { readdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
const { compositeOnWhite } = await import("@services/white-background.service.js");
for (const dir of process.argv.slice(2)) {
  for (const f of readdirSync(dir)) {
    const m = f.match(/^(.*)-A-whitebackdrop\.(\w+)$/);
    if (!m) continue;
    const b = readdirSync(dir).find((g) => g.startsWith(`${m[1]}-B-mey28.`));
    if (!b) continue;
    const t0 = Date.now();
    try {
      const out = await compositeOnWhite(readFileSync(path.join(dir, f)), readFileSync(path.join(dir, b)));
      writeFileSync(path.join(dir, `${m[1]}-C2-result.jpg`), out);
      console.log(`  -> ${m[1]}: ok (${Date.now() - t0} ms, ${out.length} B)`);
    } catch (e) {
      console.log(`  -> ${m[1]}: FAILED ${e instanceof Error ? e.message : e}`);
    }
  }
}
