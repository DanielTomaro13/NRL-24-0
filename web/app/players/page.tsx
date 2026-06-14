import { pageMeta } from "@/lib/seo";
import { allPlayers } from "@/lib/playerdb";
import PlayersClient from "@/components/PlayersClient";

export const metadata = pageMeta({
  title: "NRL & NRLW Players — search every player",
  description: "Search and filter every NRL and NRLW player in the dataset by name, club and position. Career games, tries and an all-time rating for each.",
  path: "/players",
  keywords: ["NRL players", "NRLW players", "NRL player ratings", "NRL player stats"],
});

export default function PlayersPage() {
  const initial = allPlayers("nrl").sort((a, b) => b.fame - a.fame);
  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <header>
        <h1 style={{ fontSize: "2rem", margin: 0, textTransform: "uppercase" }}>Players</h1>
      </header>
      <PlayersClient initial={initial} />
    </div>
  );
}
