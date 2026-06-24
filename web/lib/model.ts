/**
 * Types + shared constants for the betting-model bundle produced by the NRL-Modelling
 * repo (committed to /public/data/model by pipeline/fetch-model.mjs). This file is
 * browser-safe — server-only JSON loaders live in "@/lib/model.server".
 */

export interface ModelMeta {
  round: number | null;
  updated: string;
  generated: string;
}

export interface PredPlayer {
  playerId: number | null;
  name: string;
  team: string;
  pos: string | null;
  p_anytime: number | null;
  exp_tries: number | null;
  exp_points: number | null;
  exp_kicker: number | null;
}
export interface PredMatch {
  matchId: string;
  team: string;
  opp: string;
  event: string;
  players: PredPlayer[];
}

export interface CompareRow {
  match: string;
  player: string;
  team: string;
  mkey: string;
  market: string;
  line: number | null;
  my_p: number | null;
  my_fair: number | null;
  books: Record<string, number>;
  best_book: string | null;
  best: number | null;
  ev: number | null;
}
export interface CompareData {
  generated: string;
  markets: string[];
  matches: string[];
  rows: CompareRow[];
}

export type Dist =
  | { k: "pois"; lam: number }
  | { k: "conv"; lt: number; lg: number; lfg: number }
  | { k: "norm"; mu: number; sg: number };

export interface PickemRow {
  player: string;
  team: string;
  matchId: string | null;
  event: string;
  stat: string;
  stat_label: string;
  proj: number | null;
  dist: Dist;
  dab_line: number | null;
  offered: string[];
  line: number;
}
export interface PickemData {
  generated: string;
  multipliers: Record<string, number>;
  rows: PickemRow[];
  stats: string[];
  matches: string[];
  n_dabble: number;
}

export interface ScoringPoint {
  player: string;
  team: string;
  line: number | null;
  model_mean: number | null;
  my_price: number | null;
  book: string | null;
  best_price: number | null;
  ev: number | null;
}
export interface ScoringTry {
  player: string;
  team: string;
  p_anytime: number | null;
  exp_tries: number | null;
}
export interface ScoringData {
  points: ScoringPoint[];
  tries: ScoringTry[];
}

export interface ValuePick {
  player: string;
  team: string;
  market: string;
  line: number | null;
  ev: number;
  best: number | null;
  book: string | null;
}

/** Book key -> short label, mirroring the model site. */
export const BOOKS: Record<string, string> = {
  sportsbet: "SB",
  ladbrokes: "LAD",
  tab: "TAB",
  pointsbet: "PB",
  dabble: "DAB",
};
