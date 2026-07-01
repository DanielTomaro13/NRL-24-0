/** Server-only loaders for the model bundle (node:fs). Client code must import
 * types + BOOKS from "@/lib/model" instead, which stays browser-safe. */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type {
  BacktestData,
  CompareData,
  LineupMatch,
  ModelMeta,
  PickemData,
  PredMatch,
  ScoringData,
  ValuePick,
} from "@/lib/model";
import type { ScFeed } from "@/lib/supercoach";
import type { ModelComp, TeamMarket } from "@/lib/modelcomp";

const ROOT = join(process.cwd(), "public", "data", "model");

/** Resolve a comp's bundle dir. Default/undefined and "nrl" read the back-compat
 * root; other comps read public/data/model/<comp>. */
function dir(comp?: ModelComp): string {
  return !comp || comp === "nrl" ? ROOT : join(ROOT, comp);
}

async function read<T>(file: string, fallback: T, comp?: ModelComp): Promise<T> {
  try {
    return JSON.parse(await readFile(join(dir(comp), file), "utf8")) as T;
  } catch {
    return fallback;
  }
}

export const loadModelMeta = (comp?: ModelComp) =>
  read<ModelMeta>("meta.json", { round: null, updated: "", generated: "" }, comp);
export const loadPredictions = (comp?: ModelComp) =>
  read<{ matches: PredMatch[] }>("predictions.json", { matches: [] }, comp);
export const loadCompare = (comp?: ModelComp) =>
  read<CompareData>("compare.json", { generated: "", markets: [], matches: [], rows: [] }, comp);
export const loadPickem = (comp?: ModelComp) =>
  read<PickemData>("pickem.json", {
    generated: "",
    multipliers: {},
    rows: [],
    stats: [],
    matches: [],
    n_dabble: 0,
  }, comp);
export const loadScoring = (comp?: ModelComp) =>
  read<ScoringData>("scoring.json", { points: [], tries: [] }, comp);
export const loadLineups = (comp?: ModelComp) =>
  read<{ matches: LineupMatch[] }>("lineups.json", { matches: [] }, comp);
export const loadSuperCoach = (comp?: ModelComp) =>
  read<ScFeed>("supercoach.json", { generated: "", season: 0, round: 0, n_players: 0, players: [] }, comp);
export const loadBacktest = (comp?: ModelComp) =>
  read<BacktestData>("backtest.json", {
    holdouts: [],
    n_test: null,
    tries: null,
    regression: [],
    generated: null,
  }, comp);
/** Match-outcome markets (H2H / line / total) — NRLW only for now. */
export const loadTeamMarkets = (comp?: ModelComp) =>
  read<{ matches: TeamMarket[] }>("team.json", { matches: [] }, comp);

/** Top model value markets — real edges only (filters longshot/mismatch noise). */
export async function loadTopValue(n = 6, comp?: ModelComp): Promise<ValuePick[]> {
  const cmp = await loadCompare(comp);
  return cmp.rows
    .filter((r) => r.ev != null && r.ev > 0 && r.ev <= 25 && r.best != null)
    .sort((a, b) => (b.ev ?? 0) - (a.ev ?? 0))
    .slice(0, n)
    .map((r) => ({
      player: r.player,
      team: r.team,
      market: r.market,
      line: r.line,
      ev: r.ev as number,
      best: r.best,
      book: r.best_book,
    }));
}
