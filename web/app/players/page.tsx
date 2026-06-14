import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { allPlayers, notablePlayers } from "@/lib/playerdb";
import PlayersClient from "@/components/PlayersClient";

export const metadata = pageMeta({
  title: "NRL & NRLW Players — search every player",
  description: "Search and filter every NRL and NRLW player in the dataset by name, club and position. Career games, tries and an all-time rating for each.",
  path: "/players",
  keywords: ["NRL players", "NRLW players", "NRL player ratings", "NRL player stats"],
});

export default function PlayersPage() {
  // top 150 for the static HTML (SEO + fast paint); the client loads the full
  // set for search on mount
  const initial = allPlayers("nrl").sort((a, b) => b.fame - a.fame).slice(0, 150);
  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <header>
        <h1 style={{ fontSize: "2rem", margin: 0, textTransform: "uppercase" }}>Players</h1>
      </header>
      <PlayersClient initial={initial} />

      {/* crawlable index so NRLW profiles aren't orphaned (they're swapped in
          client-side above; this keeps real <a> links in the static HTML) */}
      <section style={{ marginTop: "2.5rem", borderTop: "1px solid var(--border)", paddingTop: "1.25rem" }}>
        <h2 style={{ fontSize: "1.1rem", margin: "0 0 8px" }}>Browse NRLW players</h2>
        <p style={{ fontSize: ".82rem", lineHeight: 1.9, color: "var(--muted)" }}>
          {notablePlayers("nrlw").map((p, i) => (
            <span key={p.id}>
              {i > 0 ? " · " : ""}
              <Link href={`/w/players/${p.id}/${p.slug}`} style={{ color: "var(--muted)" }}>{p.name}</Link>
            </span>
          ))}
        </p>
      </section>
    </div>
  );
}
