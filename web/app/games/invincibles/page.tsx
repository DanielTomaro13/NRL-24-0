import GameShell from "@/components/games/GameShell";
import InvinciblesGame from "@/components/games/InvinciblesGame";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Invincibles — draft a squad and simulate a season",
  description: "Spin clubs and seasons, draft a starting side and simulate a full 24-game NRL season thousands of times. Can you go undefeated?",
  path: "/games/invincibles",
  keywords: ["NRL squad builder", "NRL season simulator", "invincibles NRL"],
});

export default function Page() {
  return (
    <GameShell
      slug="invincibles"
      title="Invincibles"
      emoji="🏆"
      intro="Draft a starting side from across NRL history, then simulate a full season thousands of times. See your win distribution, your odds of going 24–0 and how you stack up against real premiership sides."
      howTo={[
        "Spin for a random club and season, then draft a player into each position.",
        "Fill all nine positions to build your spine.",
        "Hit simulate to run thousands of 24-game seasons.",
        "Chase a perfect record and post it to the Hall of Fame.",
      ]}
    >
      <InvinciblesGame />
    </GameShell>
  );
}
