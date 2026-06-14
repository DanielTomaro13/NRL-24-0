import { pageMeta } from "@/lib/seo";
import LadderView from "@/components/LadderView";

export const metadata = pageMeta({
  title: "NRL & NRLW Ladder — every season's standings",
  description: "NRL and NRLW ladders for every season, built from real match results. Wins, points, for and against. Switch competition in the header.",
  path: "/ladder",
  keywords: ["NRL ladder", "NRLW ladder", "NRL standings", "NRL table"],
});

export default function LadderPage() {
  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <header>
        <h1 style={{ fontSize: "2rem", margin: 0, textTransform: "uppercase" }}>Ladder</h1>
        <p style={{ color: "var(--muted)", marginTop: 6 }}>
          Standings for every season, computed from real match results.
        </p>
      </header>
      <LadderView />
    </div>
  );
}
