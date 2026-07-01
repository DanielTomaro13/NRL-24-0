// Pull the model/odds JSON bundles from the NRL-Modelling repo (the data engine)
// into web/public/data/model/<comp> so the static export can render the /model pages
// for every competition (NRL, NRLW, State of Origin men's & women's).
//
// The Python model pipeline lives in DanielTomaro13/NRL-Modelling and commits a
// compact bundle per track to reports/site[/<track>]. We fetch the raw files at
// build time (and keep a committed snapshot so the build never depends on network).
//
// Layout fetched:
//   reports/site/          -> public/data/model/        (men's NRL, back-compat root)
//   reports/site/          -> public/data/model/nrl/
//   reports/site/nrlw/     -> public/data/model/nrlw/
//   reports/site/soo/      -> public/data/model/soo/
//   reports/site/soow/     -> public/data/model/soow/
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const BASE =
  process.env.MODEL_DATA_BASE ??
  "https://raw.githubusercontent.com/DanielTomaro13/NRL-Modelling/main/reports/site";
const FILES = [
  "meta.json", "predictions.json", "compare.json", "pickem.json", "scoring.json",
  "backtest.json", "lineups.json", "supercoach.json", "team.json",
];
// comp id -> sub-path under reports/site ("" = men's at the root)
const COMPS = { nrl: "", nrlw: "nrlw", soo: "soo", soow: "soow" };
const OUT = new URL("../web/public/data/model/", import.meta.url);

async function save(text, ...segments) {
  const dest = new URL(segments.join("/"), OUT);
  await mkdir(dirname(dest.pathname), { recursive: true });
  await writeFile(dest, text);
}

let ok = 0, total = 0;
for (const [comp, sub] of Object.entries(COMPS)) {
  const base = sub ? `${BASE}/${sub}` : BASE;
  for (const f of FILES) {
    total++;
    try {
      const res = await fetch(`${base}/${f}`, { redirect: "follow" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      JSON.parse(text); // validate
      await save(text, comp, f);
      if (comp === "nrl") await save(text, f); // back-compat root copy
      console.log(`  ok  ${comp}/${f}  (${text.length.toLocaleString()} bytes)`);
      ok++;
    } catch (e) {
      console.warn(`  WARN ${comp}/${f}: ${e.message} — keeping any committed copy`);
    }
  }
}
console.log(`model data: ${ok}/${total} files refreshed across ${Object.keys(COMPS).length} comps`);
