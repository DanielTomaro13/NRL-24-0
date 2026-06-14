import { pageMeta } from "@/lib/seo";
import FixturesView from "@/components/FixturesView";

export const metadata = pageMeta({
  title: "NRL Fixtures & Results",
  description: "Every completed NRL match grouped by round, with real scores. Browse results season by season.",
  path: "/fixtures",
  keywords: ["NRL fixtures", "NRL results", "NRL scores"],
});

export default function FixturesPage() {
  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <header>
        <h1 style={{ fontSize: "2rem", margin: 0, textTransform: "uppercase" }}>Fixtures &amp; Results</h1>
        <p style={{ color: "var(--muted)", marginTop: 6 }}>Completed NRL matches by round, with real scores.</p>
      </header>
      <FixturesView />
    </div>
  );
}
