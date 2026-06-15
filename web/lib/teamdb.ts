/**
 * Build-time (server only) team database, per competition. Derived entirely
 * from the existing generated JSON — no extra pipeline output needed:
 *   • season-by-season ladder finishes  ← results.json (laddersBySeason)
 *   • club roster / all-time leaders     ← games.json (via playerdb)
 */
import type { Comp } from "@/lib/comp";
import type { LadderRow } from "@/lib/data";
import { slugify } from "@/lib/format";
import { serverMeta, serverResults } from "@/lib/serverdata";
import { allPlayers, type ProfilePlayer } from "@/lib/playerdb";

export interface TeamSeason extends LadderRow {
  season: string;
  finish: number; // 1-based ladder position that season
  teams: number;  // clubs in the comp that season (e.g. "3rd of 17")
}

export interface TeamSummary {
  club: string;
  slug: string;
  seasons: TeamSeason[];          // newest first
  roster: ProfilePlayer[];        // players whose career club is this one, by rating
  totals: { games: number; wins: number; losses: number; draws: number; pf: number; pa: number };
  titles: number;                 // minor-premiership (1st) finishes in the dataset
}

export const clubSlug = (club: string) => slugify(club);

export function allClubs(comp: Comp = "nrl"): string[] {
  return [...serverMeta(comp).clubs].sort();
}

export function clubBySlug(comp: Comp, slug: string): string | null {
  return allClubs(comp).find((c) => clubSlug(c) === slug) ?? null;
}

export function teamSummary(comp: Comp, club: string): TeamSummary {
  const r = serverResults(comp);
  const seasons: TeamSeason[] = [];
  const totals = { games: 0, wins: 0, losses: 0, draws: 0, pf: 0, pa: 0 };
  let titles = 0;

  for (const season of r.seasons) {
    const ladder = r.laddersBySeason[season] ?? [];
    const idx = ladder.findIndex((row) => row.club === club);
    if (idx < 0) continue;
    const row = ladder[idx];
    const finish = idx + 1;
    if (finish === 1) titles += 1;
    totals.games += row.p; totals.wins += row.w; totals.losses += row.l;
    totals.draws += row.d; totals.pf += row.pf; totals.pa += row.pa;
    seasons.push({ ...row, season, finish, teams: ladder.length });
  }

  const roster = allPlayers(comp)
    .filter((p) => p.club === club)
    .sort((a, b) => b.rating - a.rating || b.fame - a.fame);

  return { club, slug: clubSlug(club), seasons, roster, totals, titles };
}
