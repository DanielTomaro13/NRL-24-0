import GameShell from "@/components/games/GameShell";
import Footle from "@/components/games/Footle";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Footle — the daily NRL player Wordle",
  description: "Guess the mystery NRL player in eight tries. A new player every day, the same for everyone. Clues on club, position, era and career stats.",
  path: "/games/footle",
  keywords: ["Footle", "NRL Wordle", "NRL player guessing game", "daily NRL game"],
});

export default function Page() {
  return (
    <GameShell
      slug="footle"
      title="Footle"
      emoji="🟩"
      intro="Guess today's mystery NRL player in eight tries. Each guess reveals how close you are on club, position, era and career stats. One new player a day — the same for everyone."
      howTo={[
        "Type any NRL player's name and submit a guess.",
        "A filled cell means an exact match; amber means close (era ±2 years, tries within range) with ▲/▼ pointing you toward the answer.",
        "Use the clues to narrow it down within eight guesses.",
        "Come back tomorrow for a new player and keep your streak alive.",
      ]}
    >
      <Footle />
    </GameShell>
  );
}
