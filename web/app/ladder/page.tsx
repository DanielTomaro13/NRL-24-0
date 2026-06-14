import { pageMeta } from "@/lib/seo";
import { serverMeta } from "@/lib/serverdata";
import LadderView from "@/components/LadderView";

export function generateMetadata() {
  const m = serverMeta();
  return pageMeta({
    title: `NRL Ladder — ${m.latestSeason} standings`,
    description: `The ${m.latestSeason} NRL ladder and every season back to ${m.seasons[m.seasons.length - 1]}, built from real match results. Wins, points, for and against.`,
    path: "/ladder",
    keywords: ["NRL ladder", "NRL standings", "NRL table"],
  });
}

export default function LadderPage() {
  const m = serverMeta();
  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <header>
        <h1 style={{ fontSize: "2rem", margin: 0, textTransform: "uppercase" }}>NRL Ladder</h1>
        <p style={{ color: "var(--muted)", marginTop: 6 }}>
          Standings for every season {m.seasons[m.seasons.length - 1]}–{m.latestSeason}, computed from real match results.
        </p>
      </header>
      <LadderView />
    </div>
  );
}
