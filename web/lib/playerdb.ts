/**
 * Build-time player database (server only), per competition. Reads the
 * generated games.json from disk so we can statically pre-render a profile page
 * per notable player and list them in the sitemap.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { GamePlayer, ProfilePlayer } from "@/lib/games-data";
import type { Comp } from "@/lib/comp";
import { slugify } from "@/lib/format";

export type { ProfilePlayer };

const _cache: Partial<Record<Comp, ProfilePlayer[]>> = {};

export function allPlayers(comp: Comp = "nrl"): ProfilePlayer[] {
  if (_cache[comp]) return _cache[comp]!;
  const file = join(process.cwd(), "public", "data", comp, "games.json");
  const data = JSON.parse(readFileSync(file, "utf8")) as { players: GamePlayer[] };
  _cache[comp] = data.players.map((p) => ({ ...p, slug: slugify(p.name) }));
  return _cache[comp]!;
}

/** Players notable enough to deserve a statically-generated profile page. */
export function notablePlayers(comp: Comp = "nrl"): ProfilePlayer[] {
  return allPlayers(comp).filter((p) => p.apps >= 20);
}

export function playerById(comp: Comp, id: string): ProfilePlayer | null {
  return allPlayers(comp).find((p) => String(p.id) === String(id)) ?? null;
}
