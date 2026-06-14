import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { allPlayers, type ProfilePlayer } from "@/lib/playerdb";
import { clubColors } from "@/lib/clubs";

export const metadata = pageMeta({
  title: "NRL Stat Leaders — tries, metres, tackles & more",
  description: "Career stat leaders across the dataset: most tries, run metres, tackles, line breaks, games and the top-rated players. Built from real NRL match data.",
  path: "/stats",
  keywords: ["NRL stats", "NRL try scorers", "NRL stat leaders", "most NRL tries"],
});

const BOARDS: { key: keyof ProfilePlayer; label: string; fmt?: (n: number) => string }[] = [
  { key: "tries", label: "Most Tries" },
  { key: "runMetres", label: "Run Metres / game" },
  { key: "tackles", label: "Tackles / game" },
  { key: "lineBreaks", label: "Line Breaks" },
  { key: "apps", label: "Most Games" },
  { key: "rating", label: "Top Rated" },
];

export default function StatsPage() {
  const players = allPlayers();
  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <header>
        <h1 style={{ fontSize: "2rem", margin: 0, textTransform: "uppercase" }}>Stat Leaders</h1>
        <p style={{ color: "var(--muted)", marginTop: 6 }}>Career leaders across the dataset, from real NRL match stats.</p>
      </header>
      <div className="grid-cards" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))" }}>
        {BOARDS.map((b) => {
          const top = [...players].sort((a, b2) => (b2[b.key] as number) - (a[b.key] as number)).slice(0, 10);
          return (
            <div key={b.key} className="card" style={{ padding: "1rem" }}>
              <h2 style={{ margin: "0 0 8px", fontSize: "1rem" }}>{b.label}</h2>
              <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 4 }}>
                {top.map((p, i) => {
                  const [c1] = clubColors(p.club);
                  return (
                    <li key={p.id} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: ".86rem" }}>
                      <span style={{ width: 16, color: "var(--muted)", fontFamily: "var(--font-mono)", fontSize: ".75rem" }}>{i + 1}</span>
                      <span style={{ width: 7, height: 7, borderRadius: 2, background: c1, flexShrink: 0 }} />
                      <Link href={`/players/${p.id}/${p.slug}`} style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</Link>
                      <span style={{ fontFamily: "var(--font-cond)", color: "var(--gold)" }}>{p[b.key] as number}</span>
                    </li>
                  );
                })}
              </ol>
            </div>
          );
        })}
      </div>
    </div>
  );
}
