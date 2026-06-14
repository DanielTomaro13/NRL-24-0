/** NRL club colours, keyed by a substring of the Champion Data squad name. */
const CLUB_COLORS: [match: string, primary: string, secondary: string][] = [
  ["Broncos", "#6f0e3b", "#fec325"],
  ["Raiders", "#9bd231", "#1d1d1b"],
  ["Bulldogs", "#003b7c", "#ffffff"],
  ["Sharks", "#00a9c7", "#ffffff"],
  ["Dolphins", "#d50032", "#cc9b6b"],
  ["Titans", "#009edd", "#fbb040"],
  ["Sea Eagles", "#6f1a3b", "#ffffff"],
  ["Storm", "#5e2d8e", "#fdb913"],
  ["Knights", "#003b73", "#ee3124"],
  ["Warriors", "#1d1d1b", "#c8c9cb"],
  ["Cowboys", "#002b5c", "#ffd200"],
  ["Eels", "#006eb5", "#ffd200"],
  ["Panthers", "#1d1d1b", "#5e9d3a"],
  ["Rabbitohs", "#005e30", "#ee3124"],
  ["Dragons", "#e2231a", "#ffffff"],
  ["Roosters", "#002857", "#e2231a"],
  ["Tigers", "#f68b1f", "#1d1d1b"],
];

export function clubColors(club: string): [string, string] {
  const hit = CLUB_COLORS.find(([m]) => club.includes(m));
  return hit ? [hit[1].replace(/\s/g, ""), hit[2]] : ["#1d2e27", "#9fb0a6"];
}

/** A short 3-letter abbreviation for a club. */
export function clubAbbr(club: string): string {
  const map: Record<string, string> = {
    Broncos: "BRI", Raiders: "CAN", Bulldogs: "CBY", Sharks: "CRO",
    Dolphins: "DOL", Titans: "GLD", "Sea Eagles": "MAN", Storm: "MEL",
    Knights: "NEW", Warriors: "WAR", Cowboys: "NQL", Eels: "PAR",
    Panthers: "PEN", Rabbitohs: "SOU", Dragons: "SGI", Roosters: "SYD",
    Tigers: "WST",
  };
  for (const [k, v] of Object.entries(map)) if (club.includes(k)) return v;
  return club.slice(0, 3).toUpperCase();
}
