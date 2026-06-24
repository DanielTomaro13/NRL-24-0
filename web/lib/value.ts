import type { CompareRow } from "@/lib/model";

/** Value-board gating.
 *
 * Small edges are shown as-is. A *big* edge is only trustworthy if the book offering
 * the long (value) price is a genuine outlier — i.e. ≥2 other books price it
 * meaningfully shorter, so the market itself agrees that book is "out", not just the
 * model. That separates real line-shopping value from model-vs-sharp-market noise. */
const SMALL_CAP = 25;   // EV% always shown without corroboration
const HARD_CAP = 100;   // absolute ceiling even when corroborated (kills absurd blowouts)
const MARGIN = 0.95;    // an "other" book must be ≥5% shorter to count as disagreeing
const MIN_OUTLIERS = 2; // how many other books must agree the value book is out

/** Do ≥2 other books price this market meaningfully shorter than the best price? */
export function corroborated(r: CompareRow): boolean {
  if (r.best == null || r.best_book == null || !r.books) return false;
  let shorter = 0;
  for (const [b, p] of Object.entries(r.books)) {
    if (b !== r.best_book && p != null && p <= r.best * MARGIN) shorter++;
  }
  return shorter >= MIN_OUTLIERS;
}

/** Is this row a value bet worth surfacing? */
export function isValue(r: CompareRow): boolean {
  const ev = r.ev;
  if (ev == null || ev <= 0) return false;
  if (r.best == null || r.best > 21 || (r.my_p ?? 0) < 0.08) return false; // drop longshots
  if (ev > HARD_CAP) return false;
  if (ev <= SMALL_CAP) return true;          // modest edge: always fine
  return corroborated(r);                    // big edge: needs the field to agree
}
