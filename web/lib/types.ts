/** Game engine types for the Perfect-Season draft (/play). */

export interface PoolPlayer {
  id: string;
  pid: number;
  name: string;
  club: string;
  era: string;
  pos: string;      // FB | WG | CE | FE | HB | PR | HK | 2R | LK
  posName: string;
  rating: number;
  g: number;
  tries: number;
  runMetres: number;
  lineBreaks: number;
  tryAssists: number;
  tackles: number;
  tackleBreaks: number;
}

export interface Meta {
  generatedAt: string;
  seasons: string[];
  latestSeason: string;
  clubs: string[];
  clubsBySeason: Record<string, string[]>;
}

export type Mode = "quick" | "classic" | "full17" | "cap" | "gauntlet" | "spoon";

export interface Slot {
  code: string; // a position code, or "INT" for interchange (any player)
  n: number;    // jersey number
}

const STARTING_13: Slot[] = [
  { code: "FB", n: 1 }, { code: "WG", n: 2 }, { code: "CE", n: 3 },
  { code: "CE", n: 4 }, { code: "WG", n: 5 }, { code: "FE", n: 6 },
  { code: "HB", n: 7 }, { code: "PR", n: 8 }, { code: "HK", n: 9 },
  { code: "PR", n: 10 }, { code: "2R", n: 11 }, { code: "2R", n: 12 },
  { code: "LK", n: 13 },
];

const QUICK_9: Slot[] = [
  { code: "FB", n: 1 }, { code: "WG", n: 2 }, { code: "CE", n: 3 },
  { code: "FE", n: 4 }, { code: "HB", n: 5 }, { code: "HK", n: 6 },
  { code: "PR", n: 7 }, { code: "2R", n: 8 }, { code: "LK", n: 9 },
];

const MATCHDAY_17: Slot[] = [
  ...STARTING_13,
  { code: "INT", n: 14 }, { code: "INT", n: 15 },
  { code: "INT", n: 16 }, { code: "INT", n: 17 },
];

export const SQUADS: Record<Mode, Slot[]> = {
  quick: QUICK_9,
  classic: STARTING_13,
  full17: MATCHDAY_17,
  cap: MATCHDAY_17,
  gauntlet: STARTING_13,
  spoon: STARTING_13,
};

export const REROLLS: Record<Mode, { club: number; era: number }> = {
  quick: { club: 1, era: 1 },
  classic: { club: 1, era: 1 },
  full17: { club: 2, era: 2 },
  cap: { club: 2, era: 2 },
  gauntlet: { club: 1, era: 1 },
  spoon: { club: 1, era: 1 },
};

export const MODE_INFO: Record<Mode, { name: string; tag: string; desc: string }> = {
  quick: { name: "Quick Nine", tag: "the spine", desc: "One player for each of the nine positions — fullback through lock. A fast all-time spine." },
  classic: { name: "Full 13", tag: "the original", desc: "The complete 1–13 team sheet: two wings, two centres, two props and two second-rowers." },
  full17: { name: "Match-day 17", tag: "deep bench", desc: "The full 17: a starting 13 plus a four-man interchange that takes any player." },
  cap: { name: "Salary Cap 17", tag: "hard mode", desc: "Build a match-day 17 under the salary cap. Stars cost a fortune — spend like a recruitment manager." },
  gauntlet: { name: "The Gauntlet", tag: "survival", desc: "Draft a 13, then beat every season's premier in a head-to-head. Lose once and the run is over." },
  spoon: { name: "Wooden Spoon", tag: "anti-footy", desc: "Build the worst side imaginable and chase a perfect 0–24. Harder than it sounds." },
};

/** Salary cap mode — a player's price ($) modelled off their rating. */
export const SALARY_CAP = 9_400_000;
export function salaryFor(rating: number): number {
  const t = Math.max(0, (rating - 60) / 39); // 0..1
  return Math.round((150_000 + Math.pow(t, 2.3) * 1_550_000) / 1000) * 1000;
}

/** Does a player fit a slot? INT slots take anyone. */
export function fitsSlot(slot: Slot, posCode: string): boolean {
  return slot.code === "INT" || slot.code === posCode;
}
