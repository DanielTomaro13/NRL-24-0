/** Build-time (server) readers for the static datasets, per competition. */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Meta } from "@/lib/types";
import type { Results } from "@/lib/data";
import type { Comp } from "@/lib/comp";

function read<T>(comp: Comp, file: string): T {
  return JSON.parse(readFileSync(join(process.cwd(), "public", "data", comp, file), "utf8")) as T;
}

export const serverMeta = (comp: Comp = "nrl") => read<Meta>(comp, "meta.json");
export const serverResults = (comp: Comp = "nrl") => read<Results>(comp, "results.json");
