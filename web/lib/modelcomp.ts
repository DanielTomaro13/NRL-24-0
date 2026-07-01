/**
 * Competitions the model section can render. The stats side of the site uses the
 * narrower nrl/nrlw `Comp` (see lib/comp.ts); the model section additionally
 * covers State of Origin men's & women's, whose bundles live under
 * public/data/model/<comp>/ (men's NRL also at the root for back-compat).
 */
export type ModelComp = "nrl" | "nrlw" | "soo" | "soow";

export const MODEL_COMPS: {
  id: ModelComp;
  label: string;
  short: string;
  /** match-outcome markets (H2H/line/total) available for this comp */
  teamMarkets: boolean;
}[] = [
  { id: "nrl", label: "NRL", short: "NRL", teamMarkets: false },
  { id: "nrlw", label: "NRLW", short: "NRLW", teamMarkets: true },
  { id: "soo", label: "State of Origin", short: "Origin", teamMarkets: false },
  { id: "soow", label: "Women's Origin", short: "Origin W", teamMarkets: false },
];

export const modelCompLabel = (c: ModelComp) =>
  MODEL_COMPS.find((m) => m.id === c)?.label ?? "NRL";

export function isModelComp(s: string | undefined): s is ModelComp {
  return s === "nrl" || s === "nrlw" || s === "soo" || s === "soow";
}

/** One match's model-fair head-to-head / line / total prices (from team.json). */
export interface TeamMarket {
  matchId: string;
  round: number | null;
  home: string;
  away: string;
  start: string | null;
  pred_margin: number | null;
  pred_total: number | null;
  p_home: number | null;
  p_away: number | null;
  fair_home: number | null;
  fair_away: number | null;
  line_home: number | null;
  total_line: number | null;
  fair_over: number | null;
  fair_under: number | null;
  /** best live book price + EV per side, present when the odds cron priced the
   *  match (men's NRL only for now — fair-odds-only comps omit these) */
  book_home?: string; book_home_price?: number; ev_home?: number;
  book_away?: string; book_away_price?: number; ev_away?: number;
  book_over?: string; book_over_price?: number; book_total_line?: number; ev_over?: number;
  book_under?: string; book_under_price?: number; ev_under?: number;
  book_line?: string; book_line_side?: string; book_line_hcap?: number;
  book_line_price?: number; ev_line?: number;
}
