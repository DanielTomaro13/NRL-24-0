/** Browser-safe types + helpers for the NRL SuperCoach feed.
 *  Server loader lives in "@/lib/model.server" (loadSuperCoach). */

export interface ScPlayer {
  id: number; name: string; team: string; teamAbbr: string;
  positions: string[]; dpp: boolean;
  price: number; priceChange: number; totalPriceChange: number;
  avg: number; avg3: number; avg5: number; proj: number;
  games: number; totalPoints: number; std: number; consistency: number;
  scores: Array<{ round: number; pts: number }>;
  owned: number; ppm: number;
  status: string; statusText: string | null; note: string | null; noteDate: string | null;
  opp: string | null; oppHome: boolean; oppAvg: number;
  ven: string | null; venAvg: number;
  next: Array<{ opp: string; home: boolean }>;
}
export interface ScFeed {
  generated: string; season: number; round: number; n_players: number; players: ScPlayer[];
}

/** NRL SuperCoach position codes → label + colour. */
export const SC_POS: Record<string, { label: string; color: string }> = {
  FLB: { label: "Fullback", color: "var(--accent-2, #6cf)" },
  CTW: { label: "Centre / Wing", color: "var(--accent, #f93)" },
  "5/8": { label: "Five-eighth", color: "var(--gold, #fc6)" },
  HFB: { label: "Halfback", color: "var(--gold, #fc6)" },
  HOK: { label: "Hooker", color: "#9d8cff" },
  FRF: { label: "Front row", color: "#7bd88f" },
  "2RF": { label: "Second row", color: "#7bd88f" },
};
export const posColor = (c: string) => SC_POS[c]?.color ?? "var(--muted)";

export const money = (v: number) => "$" + Math.round(v).toLocaleString();
export const moneyK = (v: number) => "$" + Math.round(v / 1000) + "k";
export const signed = (v: number) => (v > 0 ? "+" : "") + Math.round(v).toLocaleString();

export const valuePer100k = (p: ScPlayer) => (p.price > 0 ? (p.proj || p.avg) / (p.price / 100_000) : 0);
export const formDelta = (p: ScPlayer) => (p.avg3 && p.avg ? p.avg3 - p.avg : 0);
export const isPlaying = (p: ScPlayer) => p.price > 0 && p.status !== "out" && p.status !== "did-not-play";

export function availability(p: ScPlayer): { label: string; color: string } | null {
  const t = (p.statusText || "").toLowerCase();
  if (t.includes("out") || p.status === "out") return { label: "OUT", color: "var(--danger)" };
  if (t.includes("susp")) return { label: "SUSP", color: "var(--danger)" };
  if (t.includes("test") || t.includes("doubt") || t.includes("quest")) return { label: "TEST", color: "var(--gold)" };
  if (p.statusText) return { label: "NEWS", color: "var(--accent-2, #6cf)" };
  return null;
}

/** Bookmaker-agnostic player key = first-initial + surname, accent/punct folded. */
export function playerKey(name: string): string {
  const s = (name || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/\([^)]*\)/g, " ").replace(/[^a-z\s'.-]/g, " ");
  const toks = s.replace(/['.-]/g, "").split(/\s+/).filter(Boolean);
  if (!toks.length) return "";
  return toks.length === 1 ? toks[0] : `${toks[0][0]}_${toks[toks.length - 1]}`;
}

export function scIndex(feed: ScFeed | null): Map<string, ScPlayer> {
  const m = new Map<string, ScPlayer>();
  for (const p of feed?.players ?? []) if (!m.has(playerKey(p.name))) m.set(playerKey(p.name), p);
  return m;
}

/** Standard-normal CDF (Abramowitz–Stegun). */
function normalCdf(x: number, mean: number, sd: number): number {
  if (sd <= 0) return x >= mean ? 1 : 0;
  const z = (x - mean) / (sd * Math.SQRT2), t = 1 / (1 + 0.3275911 * Math.abs(z));
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z);
  return 0.5 * (1 + (z >= 0 ? y : -y));
}
export function probScOver(p: ScPlayer, line: number): number {
  const mean = p.proj || p.avg3 || p.avg;
  if (!mean) return 0;
  const sd = p.std > 3 ? p.std : Math.max(12, 0.3 * mean);
  return 1 - normalCdf(line, mean, sd);
}
