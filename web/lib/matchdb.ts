/**
 * Build-time (server only) match database, per competition. Each match has a
 * self-contained box-score file at public/data/<comp>/matches/<id>.json,
 * written by the pipeline.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { Comp } from "@/lib/comp";
import { serverResults } from "@/lib/serverdata";

export interface BoxPlayer {
  pid: number; name: string; pos: string; pts: number;
  t: number; g: number; fg: number; ta: number; lb: number;
  rm: number; tk: number; tb: number; mt: number; off: number; err: number;
}
export interface BoxScore {
  id: string; comp: Comp; season: string; round: number;
  home: string; away: string; hs: number; as: number;
  date: string | null; venue: string | null;
  homeLineup: BoxPlayer[]; awayLineup: BoxPlayer[];
}

const dir = (comp: Comp) => join(process.cwd(), "public", "data", comp, "matches");

/** Every match id in the competition (for generateStaticParams). */
export function allMatchIds(comp: Comp): string[] {
  const r = serverResults(comp);
  return Object.values(r.bySeason).flat().map((m) => m.id).filter(Boolean);
}

export function matchById(comp: Comp, id: string): BoxScore | null {
  const file = join(dir(comp), `${id}.json`);
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, "utf8")) as BoxScore;
}
