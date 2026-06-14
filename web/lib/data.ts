/** Client loaders for the static datasets in /public/data. */
import type { Meta, PoolPlayer } from "@/lib/types";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

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
  if (cache.has(file)) return cache.get(file) as T;
  const res = await fetch(`${BASE}/data/${file}`, { cache: "force-cache" });
  const data = (await res.json()) as T;
  cache.set(file, data);
  return data;
}

export const loadMeta = () => loadJson<Meta>("meta.json");
export const loadPool = () => loadJson<PoolPlayer[]>("pool.json");
export const loadResults = () => loadJson<Results>("results.json");
export const loadStrengths = () => loadJson<{ bySeason: Record<string, number[]> }>("strengths.json");
