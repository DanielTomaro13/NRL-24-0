/**
 * Season model.
 *
 * A squad's average rating sets a per-game win probability via a logistic
 * curve, and a season is 24 independent games. The curve + caps are tuned so
 * that the BEST squad you can realistically assemble (~96 average) wins ~88.3%
 * per game — which is exactly a 5% chance of running the table 24–0
 * (0.883^24 ≈ 0.05). Caps make 5% a hard ceiling: nothing can beat it, and the
 * chance collapses fast below a near-perfect side. The Wooden Spoon (0–24) is
 * symmetric — the worst side you can build has the same ~5% shot at going
 * winless.
 */

export interface SimResult {
  wins: number;
  losses: number;
  perfectPct: number;       // % chance of 24–0
  spoonPct: number;         // % chance of 0–24
  realPercentile: number;   // 0–100 vs real NRL club-seasons
  distribution: number[];   // index = wins (0..24) -> share 0..1
}

// logistic midpoint (avg 82 -> 50% per game) and spread; caps clamp the
// per-game win chance to [0.117, 0.883] so 24–0 and 0–24 both top out at ~5%.
const MID = 82, SPREAD = 6.94, P_MIN = 0.117, P_MAX = 0.883;

/** Per-game win probability for a squad average. */
export function winProbFromRating(avg: number): number {
  const p = 1 / (1 + Math.exp(-(avg - MID) / SPREAD));
  return Math.max(P_MIN, Math.min(P_MAX, p));
}

/** Exact chance (%) of a flawless 24–0 for this rating. ~5% at the realistic ceiling. */
export function perfectChance(avg: number): number {
  return Math.pow(winProbFromRating(avg), 24) * 100;
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

/** One simulated 24-game season. Seed it from the squad so a given side is
 *  deterministic (no re-roll fishing) — going 24–0 is a genuine rare event. */
export function seasonRecord(avg: number, seed: number): { wins: number; losses: number } {
  const rand = mulberry32(seed >>> 0);
  const p = winProbFromRating(avg);
  let wins = 0;
  for (let i = 0; i < 24; i++) if (rand() < p) wins++;
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

function qualityFromRating(avg: number): number {
  return Math.max(0.02, Math.min(0.98, (avg - 72) / (99 - 72)));
}
function normalise(values: number[]): number[] {
  if (!values.length) return [0.3, 0.5, 0.7];
  const lo = Math.min(...values), hi = Math.max(...values);
  const span = hi - lo || 1;
  return values.map((v) => 0.15 + 0.7 * ((v - lo) / span));
}

/** Headline record (seeded from the squad) plus the season's shape. */
export function simulateSeason(
  avg: number,
  strengthPool: number[],
  seed = 24,
  runs = 5000
): SimResult {
  const p = winProbFromRating(avg);
  const rand = mulberry32((seed >>> 0) ^ 0x9e3779b9);
  const dist = new Array(25).fill(0);
  let perfect = 0, spoon = 0;
  for (let r = 0; r < runs; r++) {
    let wins = 0;
    for (let g = 0; g < 24; g++) if (rand() < p) wins++;
    dist[wins]++;
    if (wins === 24) perfect++;
    if (wins === 0) spoon++;
  }
  const opp = normalise(strengthPool);
  const me = qualityFromRating(avg);
  const below = opp.filter((o) => o < me).length;
  const rec = seasonRecord(avg, seed);
  return {
    wins: rec.wins,
    losses: rec.losses,
    perfectPct: perfectChance(avg),
    spoonPct: Math.pow(1 - p, 24) * 100,
    realPercentile: Math.round((below / opp.length) * 100),
    distribution: dist.map((c) => c / runs),
  };
}
