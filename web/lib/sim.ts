/**
 * Season simulator. Two layers:
 *  - recordFromRating(): the deterministic headline W–L the draft game has
 *    always used (squad average 75→95 maps to 0→24 wins).
 *  - simulateSeason(): a light Monte-Carlo over a 24-game season that adds a
 *    perfect-season probability, a win distribution and a real-strength
 *    percentile for colour. Opponents are sampled from real per-season club
 *    strengths (public/data/strengths.json).
 */

export interface SimResult {
  wins: number;
  losses: number;
  perfectPct: number;       // % of seasons that finished 24–0
  spoonPct: number;         // % that finished 0–24
  realPercentile: number;   // 0–100 vs real NRL club-seasons
  distribution: number[];   // index = wins (0..24) -> count share 0..1
}

export function recordFromRating(avg: number): { wins: number; losses: number } {
  const t = (avg - 75) / (95 - 75);
  const wins = Math.round(Math.max(0, Math.min(1, t)) * 24);
  return { wins, losses: 24 - wins };
}

export function verdict(wins: number): { t: string; s: string; tone?: string } {
  if (wins >= 24) return { t: "PERFECT SEASON", s: "24–0. Immortal. Nobody laid a glove on you.", tone: "perfect" };
  if (wins >= 22) return { t: "MINOR PREMIERS", s: "Top of the ladder and the clear flag favourite." };
  if (wins >= 18) return { t: "TOP-FOUR SIDE", s: "Genuine contender. A home final and a real shot." };
  if (wins >= 14) return { t: "FINALS BOUND", s: "You scrape into the eight. Anything can happen." };
  if (wins >= 9) return { t: "MID-TABLE", s: "Flashes of class, not enough on the bell." };
  if (wins >= 1) return { t: "WOODEN SPOON", s: "Long season. The bunker can't save this one." };
  return { t: "WINLESS", s: "0–24. A perfectly, gloriously terrible side.", tone: "spoon" };
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Normalise a squad average rating to a 0–1 quality. */
export function qualityFromRating(avg: number): number {
  return Math.max(0.02, Math.min(0.98, (avg - 72) / (99 - 72)));
}

/** Log5 head-to-head win probability, upset-capped. */
const UPSET_CAP = 0.92;
function winProb(a: number, b: number): number {
  const p = (a * (1 - b)) / (a * (1 - b) + b * (1 - a) || 1e-9);
  return Math.max(1 - UPSET_CAP, Math.min(UPSET_CAP, p));
}

/** Min-max normalise a strength distribution into 0–1 quality values. */
function normalise(values: number[]): number[] {
  if (!values.length) return [0.3, 0.5, 0.7];
  const lo = Math.min(...values), hi = Math.max(...values);
  const span = hi - lo || 1;
  return values.map((v) => 0.15 + 0.7 * ((v - lo) / span));
}

export function simulateSeason(
  avg: number,
  strengthPool: number[],
  seed = 24,
  runs = 4000
): SimResult {
  const me = qualityFromRating(avg);
  const opp = normalise(strengthPool);
  const rand = mulberry32(seed);
  const dist = new Array(25).fill(0);
  let perfect = 0, spoon = 0;
  for (let r = 0; r < runs; r++) {
    let wins = 0;
    for (let g = 0; g < 24; g++) {
      const o = opp[Math.floor(rand() * opp.length)];
      if (rand() < winProb(me, o)) wins++;
    }
    dist[wins]++;
    if (wins === 24) perfect++;
    if (wins === 0) spoon++;
  }
  const below = opp.filter((o) => o < me).length;
  const rec = recordFromRating(avg);
  return {
    wins: rec.wins,
    losses: rec.losses,
    perfectPct: (perfect / runs) * 100,
    spoonPct: (spoon / runs) * 100,
    realPercentile: Math.round((below / opp.length) * 100),
    distribution: dist.map((c) => c / runs),
  };
}
