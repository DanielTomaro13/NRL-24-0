// Pull the model/odds JSON bundle from the NRL-Modelling repo (the data engine)
// into web/public/data/model so the static export can render the /model pages.
//
// The Python model pipeline lives in DanielTomaro13/NRL-Modelling and commits a
// compact bundle to reports/site/. We fetch the raw files at build time (and keep
// a committed snapshot so the build never depends on the network).
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const BASE =
  process.env.MODEL_DATA_BASE ??
  "https://raw.githubusercontent.com/DanielTomaro13/NRL-Modelling/main/reports/site";
const FILES = ["meta.json", "predictions.json", "compare.json", "pickem.json", "scoring.json"];
const OUT = new URL("../web/public/data/model/", import.meta.url);

await mkdir(OUT, { recursive: true });

let ok = 0;
for (const f of FILES) {
  try {
    const res = await fetch(`${BASE}/${f}`, { redirect: "follow" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    JSON.parse(text); // validate
    const dest = new URL(f, OUT);
    await mkdir(dirname(dest.pathname), { recursive: true });
    await writeFile(dest, text);
    console.log(`  ok  ${f}  (${text.length.toLocaleString()} bytes)`);
    ok++;
  } catch (e) {
    console.warn(`  WARN ${f}: ${e.message} — keeping any committed copy`);
  }
}
console.log(`model data: ${ok}/${FILES.length} files refreshed`);
