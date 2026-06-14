import { pageMeta } from "@/lib/seo";
import { allPlayers } from "@/lib/playerdb";
import StatsClient from "@/components/StatsClient";

export const metadata = pageMeta({
  title: "NRL & NRLW Stat Leaders — tries, metres, tackles & more",
  description: "Career stat leaders for the NRL and NRLW: most tries, run metres, tackles, line breaks, games and the top-rated players, filterable by position. Built from real match data.",
  path: "/stats",
  keywords: ["NRL stats", "NRLW stats", "NRL try scorers", "NRL stat leaders"],
});

export default function StatsPage() {
  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <header>
        <h1 style={{ fontSize: "2rem", margin: 0, textTransform: "uppercase" }}>Stat Leaders</h1>
        <p style={{ color: "var(--muted)", marginTop: 6 }}>Career leaders from real match stats. Filter by position; switch NRL/NRLW in the header.</p>
      </header>
      <StatsClient initial={allPlayers("nrl")} />
    </div>
  );
}
