/** Server-only loaders for the model bundle (node:fs). Client code must import
 * types + BOOKS from "@/lib/model" instead, which stays browser-safe. */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type {
  CompareData,
  ModelMeta,
  PickemData,
  PredMatch,
  ScoringData,
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
