import { pageMeta } from "@/lib/seo";
import { serverResults } from "@/lib/serverdata";
import FixturesView from "@/components/FixturesView";

export const metadata = pageMeta({
  title: "NRL & NRLW Fixtures & Results",
  description: "Every completed NRL and NRLW match grouped by round, with real scores. Browse results season by season and by club.",
  path: "/fixtures",
  keywords: ["NRL fixtures", "NRL results", "NRLW results", "NRL scores"],
});

export default function FixturesPage() {
  const r = serverResults("nrl");
  const latestSeason = r.seasons[0];
  const initial = { seasons: r.seasons, latestSeason, matches: r.bySeason[latestSeason] ?? [] };
  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <header>
        <h1 style={{ fontSize: "2rem", margin: 0, textTransform: "uppercase" }}>Fixtures &amp; Results</h1>
        <p style={{ color: "var(--muted)", marginTop: 6 }}>Completed matches by round, with real scores. Switch NRL/NRLW in the header.</p>
      </header>
      <FixturesView initial={initial} />
    </div>
  );
}
