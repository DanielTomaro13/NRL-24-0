export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** The nine rugby-league position codes in team-sheet order. */
export const POS_CODES = ["FB", "WG", "CE", "FE", "HB", "PR", "HK", "2R", "LK"] as const;
export type PosCode = (typeof POS_CODES)[number];

export const POS_LABEL: Record<string, string> = {
  FB: "Fullback", WG: "Wing", CE: "Centre", FE: "Five-Eighth",
  HB: "Halfback", PR: "Prop", HK: "Hooker", "2R": "Second Row", LK: "Lock",
};

/** Broad position group for filtering. */
export const POS_GROUP: Record<string, string> = {
  FB: "Back", WG: "Back", CE: "Back", FE: "Halves", HB: "Halves",
  PR: "Forward", HK: "Forward", "2R": "Forward", LK: "Forward",
};

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() || "")
    .join(".");
}
