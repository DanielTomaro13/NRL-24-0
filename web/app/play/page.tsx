import { pageMeta } from "@/lib/seo";
import PerfectSeasonGame from "@/components/PerfectSeasonGame";

export const metadata = pageMeta({
  title: "Play Perfect Season — draft an all-time NRL side",
  description:
    "Spin for an NRL club and era, draft a legend into every position and chase a flawless 24-0 season. Five modes: Quick Nine, Full 13, Match-day 17, Salary Cap, Gauntlet and Wooden Spoon.",
  path: "/play",
  keywords: ["NRL draft game", "perfect season", "NRL team builder", "24-0 game"],
});

export default function PlayPage() {
  return (
    <>
      <header style={{ marginBottom: "1.25rem" }}>
        <h1 style={{ fontSize: "2rem", margin: 0, textTransform: "uppercase" }}>
          Perfect Season — the all-time NRL draft
        </h1>
        <p style={{ color: "var(--muted)", marginTop: 6, maxWidth: 640 }}>
          Spin for a random NRL or NRLW club and era, draft a legend into every position and chase a
          flawless 24–0 season. Six modes — Quick Nine, Full 13, Match-day 17, Salary Cap, the Gauntlet
          and Wooden Spoon — with a real-stats season simulator.
        </p>
      </header>
      <PerfectSeasonGame />
    </>
  );
}
