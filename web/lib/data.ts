/** Client loaders for the static datasets in /public/data/<comp>. */
import type { Meta, PoolPlayer } from "@/lib/types";
import { dataBase, getComp } from "@/lib/comp";

export interface LadderRow {
  club: string; p: number; w: number; l: number; d: number;
  pf: number; pa: number; pts: number; pd: number;
}
export interface MatchResult { round: number; home: string; away: string; hs: number; as: number; }
export interface Results {
  seasons: string[];
  bySeason: Record<string, MatchResult[]>;
  laddersBySeason: Record<string, LadderRow[]>;
}

const cache = new Map<string, unknown>();
async function loadJson<T>(file: string): Promise<T> {
  const comp = getComp();
  const key = `${comp}/${file}`;
  if (cache.has(key)) return cache.get(key) as T;
  const res = await fetch(`${dataBase(comp)}/${file}`, { cache: "force-cache" });
  const data = (await res.json()) as T;
  cache.set(key, data);
  return data;
}

export const loadMeta = () => loadJson<Meta>("meta.json");
export const loadPool = () => loadJson<PoolPlayer[]>("pool.json");
export const loadResults = () => loadJson<Results>("results.json");
export const loadStrengths = () => loadJson<{ bySeason: Record<string, number[]> }>("strengths.json");
