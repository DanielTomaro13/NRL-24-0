/**
 * Competition switch. NRL is the primary competition; NRLW mirrors it with the
 * same stats, games and pages. The choice is kept in localStorage and read by
 * every client data loader, so flipping it (via the header toggle) reloads the
 * page and the whole site re-fetches for that competition.
 */
export type Comp = "nrl" | "nrlw";

export const COMPS: { id: Comp; label: string }[] = [
  { id: "nrl", label: "NRL" },
  { id: "nrlw", label: "NRLW" },
];

const KEY = "nrl240:comp";

export function getComp(): Comp {
  if (typeof window === "undefined") return "nrl";
  return localStorage.getItem(KEY) === "nrlw" ? "nrlw" : "nrl";
}

export function setComp(c: Comp) {
  if (typeof window === "undefined") return;
  if (getComp() === c) return;
  localStorage.setItem(KEY, c);
  window.location.reload();
}

export const compLabel = (c: Comp) => (c === "nrlw" ? "NRLW" : "NRL");

/** Base path for a competition's static data. */
export const dataBase = (c: Comp) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/data/${c}`;
