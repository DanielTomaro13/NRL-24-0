/**
 * Client-side model maths for Pick'em — a 1:1 port of the Python model in the
 * NRL-Modelling repo (pricing.py over_under_probs + player_points.points_pmf).
 * Lets the page compute P(over a line) for any line the user types, with no odds feed.
 * Verified to 4 dp against the Python reference for all three distribution kinds.
 */
import type { Dist } from "@/lib/model";

function erf(x: number): number {
  const s = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * x);
  const y =
    1 -
    (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
      0.254829592) *
      t) *
      Math.exp(-x * x);
  return s * y;
}
const ncdf = (z: number) => 0.5 * (1 + erf(z / Math.SQRT2));

function poisPmf(lam: number, k: number): number {
  let p = Math.exp(-lam);
  for (let i = 1; i <= k; i++) p *= lam / i;
  return p;
}
function poisTail(lam: number, line: number): number {
  const fl = Math.floor(line);
  let s = 0;
  for (let k = 0; k <= fl; k++) s += poisPmf(lam, k);
  return 1 - s;
}
// points = 4*Pois(lt) + 2*Pois(lg) + Pois(lfg); kmax 8/14/4 (matches points_pmf)
function pointsPover(lt: number, lg: number, lfg: number, line: number): number {
  lt = Math.max(lt, 1e-9);
  lg = Math.max(lg, 1e-9);
  lfg = Math.max(lfg, 1e-9);
  const T: number[] = [], G: number[] = [], F: number[] = [];
  for (let i = 0; i <= 8; i++) T.push(poisPmf(lt, i));
  for (let i = 0; i <= 14; i++) G.push(poisPmf(lg, i));
  for (let i = 0; i <= 4; i++) F.push(poisPmf(lfg, i));
  let s = 0;
  for (let ti = 0; ti < T.length; ti++)
    for (let gi = 0; gi < G.length; gi++) {
      const base = 4 * ti + 2 * gi,
        ptg = T[ti] * G[gi];
      for (let fi = 0; fi < F.length; fi++) if (base + fi > line) s += ptg * F[fi];
    }
  return s;
}
function normOver(mu: number, sg: number, line: number): number {
  sg = Math.max(sg, 1e-6);
  const f = Math.round((line - Math.floor(line)) * 1e4) / 1e4;
  if (f === 0.25 || f === 0.75)
    return (normOver(mu, sg, line - 0.25) + normOver(mu, sg, line + 0.25)) / 2;
  if (Math.abs(f - 0.5) < 1e-6) return 1 - ncdf((line - mu) / sg);
  return 1 - ncdf((line + 0.5 - mu) / sg); // integer line: push band
}

/** Model P(stat > line) for a Pick'em row, or null if the line is invalid. */
export function pOver(d: Dist, line: number): number | null {
  if (!d || isNaN(line)) return null;
  if (d.k === "pois") return Math.min(Math.max(poisTail(d.lam, line), 0), 1);
  if (d.k === "conv") return Math.min(Math.max(pointsPover(d.lt, d.lg, d.lfg, line), 0), 1);
  if (d.k === "norm") return Math.min(Math.max(normOver(d.mu, d.sg, line), 0), 1);
  return null;
}

/** Model fair odds for a probability, e.g. "$1.92". */
export const fair = (p: number | null): string =>
  p && p > 1e-9 ? `$${(1 / p).toFixed(2)}` : "$–";

/** Dabble Power Play multipliers by leg count. */
export const MULTIPLIERS: Record<number, number> = { 2: 3.2, 3: 6.5, 4: 12.0, 5: 25.0 };
