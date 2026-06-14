import { pageMeta } from "@/lib/seo";
import LeaderboardView from "@/components/LeaderboardView";

export const metadata = pageMeta({
  title: "Hall of Fame — NRL 24-0 leaderboards",
  description: "The best Perfect Season records, Invincibles runs, daily streaks and high scores across every NRL 24-0 game.",
  path: "/leaderboard",
  keywords: ["NRL 24-0 leaderboard", "NRL game high scores", "hall of fame"],
});

export default function LeaderboardPage() {
  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <header>
        <h1 style={{ fontSize: "2rem", margin: 0, textTransform: "uppercase" }}>Hall of Fame</h1>
        <p style={{ color: "var(--muted)", marginTop: 6 }}>The best records, runs and streaks across every game.</p>
      </header>
      <LeaderboardView />
    </div>
  );
}
