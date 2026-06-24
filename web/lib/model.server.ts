/** Server-only loaders for the model bundle (node:fs). Client code must import
 * types + BOOKS from "@/lib/model" instead, which stays browser-safe. */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type {
  BacktestData,
  CompareData,
  ModelMeta,
  PickemData,
  PredMatch,
  ScoringData,
  ValuePick,
} from "@/lib/model";

const DIR = join(process.cwd(), "public", "data", "model");

async function read<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(join(DIR, file), "utf8")) as T;
  } catch {
    return fallback;
  }
}

export const loadModelMeta = () =>
  read<ModelMeta>("meta.json", { round: null, updated: "", generated: "" });
export const loadPredictions = () =>
  read<{ matches: PredMatch[] }>("predictions.json", { matches: [] });
export const loadCompare = () =>
  read<CompareData>("compare.json", { generated: "", markets: [], matches: [], rows: [] });
export const loadPickem = () =>
  read<PickemData>("pickem.json", {
    generated: "",
    multipliers: {},
    rows: [],
    stats: [],
    matches: [],
    n_dabble: 0,
  });
export const loadScoring = () =>
  read<ScoringData>("scoring.json", { points: [], tries: [] });
export const loadBacktest = () =>
  read<BacktestData>("backtest.json", {
    holdouts: [],
    n_test: null,
    tries: null,
    regression: [],
    generated: null,
  });

/** Top model value markets — real edges only (filters longshot/mismatch noise). */
export async function loadTopValue(n = 6): Promise<ValuePick[]> {
  const cmp = await loadCompare();
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
