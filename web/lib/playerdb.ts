/**
 * Build-time player database (server only). Reads the generated games.json
 * from disk so we can statically pre-render a profile page per notable player
 * and list them in the sitemap.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { GamePlayer } from "@/lib/games-data";
import { slugify } from "@/lib/format";

export interface ProfilePlayer extends GamePlayer {
  slug: string;
}

let _all: ProfilePlayer[] | null = null;

export function allPlayers(): ProfilePlayer[] {
  if (_all) return _all;
  const file = join(process.cwd(), "public", "data", "games.json");
  const data = JSON.parse(readFileSync(file, "utf8")) as { players: GamePlayer[] };
  _all = data.players.map((p) => ({ ...p, slug: slugify(p.name) }));
  return _all;
}

/** Players notable enough to deserve a statically-generated profile page. */
export function notablePlayers(): ProfilePlayer[] {
  return allPlayers().filter((p) => p.apps >= 20);
}

export function playerById(id: string): ProfilePlayer | null {
  return allPlayers().find((p) => String(p.id) === String(id)) ?? null;
}
