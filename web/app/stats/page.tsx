import { pageMeta } from "@/lib/seo";
import { allPlayers } from "@/lib/playerdb";
import StatsBoards from "@/components/StatsBoards";

export const metadata = pageMeta({
  title: "NRL Stat Leaders — tries, metres, tackles & more",
  description: "Career stat leaders across the dataset: most tries, run metres, tackles, line breaks, games and the top-rated players, filterable by position. Built from real NRL match data.",
  path: "/stats",
  keywords: ["NRL stats", "NRL try scorers", "NRL stat leaders", "most NRL tries"],
});

export default function StatsPage() {
  const players = allPlayers();
  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <header>
        <h1 style={{ fontSize: "2rem", margin: 0, textTransform: "uppercase" }}>Stat Leaders</h1>
        <p style={{ color: "var(--muted)", marginTop: 6 }}>Career leaders across the dataset, from real NRL match stats. Filter by position.</p>
      </header>
      <StatsBoards players={players} />
    </div>
  );
}
