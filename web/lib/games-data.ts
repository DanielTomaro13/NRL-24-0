/**
 * Shared types + loaders for the mini-games dataset (public/data/games.json),
 * produced by pipeline/build-data.mjs from real NRL Champion Data.
 *
 * Champion Data exposes match stats but not nationality / birthdate / shirt
 * numbers, so the NRL games are built on what the feeds *do* give us: club,
 * position, era span and real career stat lines.
 */
import { dataBase, getComp } from "@/lib/comp";
export interface GamePlayer {
  id: number;
  name: string;
  club: string;
  pos: string;       // FB | WG | CE | FE | HB | PR | HK | 2R | LK
  posName: string;
  firstYear: number;
  lastYear: number;
  apps: number;
  tries: number;
  tryAssists: number;
  lineBreaks: number;
  runMetres: number; // per game
  tackles: number;   // per game
  rating: number;
  fame: number;
}

export interface GamesData {
  season: string;
  players: GamePlayer[];
  strengthsBySeason: Record<string, number[]>;
}

/** A player with a URL slug — used by the players DB and profile pages. */
export interface ProfilePlayer extends GamePlayer {
  slug: string;
}

const _cache: Partial<Record<string, GamesData>> = {};
export async function loadGamesData(): Promise<GamesData> {
  const comp = getComp();
  if (_cache[comp]) return _cache[comp]!;
  const res = await fetch(`${dataBase(comp)}/games.json`, { cache: "force-cache" });
  _cache[comp] = await res.json();
  return _cache[comp]!;
}

/** Deterministic daily seed so "today's" puzzles are the same for everyone. */
export function dailySeed(salt = ""): number {
  const d = new Date();
  const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}-${salt}`;
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export const dayNumber = () =>
  Math.floor((Date.now() - Date.UTC(2026, 0, 1)) / 86400000) + 1;

/** Mulberry32 seeded PRNG. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickN<T>(arr: T[], n: number, rand: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}
