import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { serverMeta } from "@/lib/serverdata";

export const metadata = pageMeta({
  title: "How NRL 24-0 works — ratings, data & the simulator",
  description: "How NRL 24-0 builds player ratings from real Champion Data fantasy points, how the season simulator works, and where the data comes from.",
  path: "/about",
  keywords: ["NRL 24-0 ratings", "how NRL ratings work", "NRL fantasy points"],
});

const SCORING: [string, string][] = [
  ["Try", "8"], ["Goal (conversion / penalty)", "2"], ["Field goal", "5"],
  ["Try assist", "5"], ["Line break", "4"], ["Line break assist", "2"],
  ["Tackle", "1"], ["Tackle break", "2"], ["Missed tackle", "−2"],
  ["Offload", "3"], ["Error", "−2"], ["40/20", "4"],
  ["Run metres", "÷10"], ["Kick metres", "÷30"], ["Penalty conceded", "−2"],
  ["Sin-bin / send-off", "−5 / −10"], ["Try save", "5"], ["Kick defused", "1"],
];

export default function AboutPage() {
  const m = serverMeta();
  return (
    <div style={{ display: "grid", gap: "1.5rem", maxWidth: 760 }}>
      <header>
        <h1 style={{ fontSize: "2.2rem", margin: 0, textTransform: "uppercase" }}>How it works</h1>
        <p style={{ color: "var(--muted)", marginTop: 6 }}>
          NRL 24-0 is a rugby-league take on the perfect-season game. Every rating comes from real match data — no made-up numbers.
        </p>
      </header>

      <section className="card" style={{ padding: "1.25rem" }}>
        <h2 style={{ marginTop: 0 }}>The data</h2>
        <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>
          Player ratings are built from <strong style={{ color: "var(--text)" }}>Champion Data</strong> match-centre feeds
          (<code>mc.championdata.com</code>) — the same feeds that power nrl.com&apos;s match centre. Every completed match of
          every NRL Premiership season from <strong style={{ color: "var(--text)" }}>{m.seasons[m.seasons.length - 1]} to {m.latestSeason}</strong> is
          aggregated at build time. Each player-season is its own draftable card, so the 2018 and 2024 versions of a player are
          separate. Real scorelines (try 4, goal 2, field goal 1) are summed straight from player stats to build the ladder and fixtures.
        </p>
      </section>

      <section className="card" style={{ padding: "1.25rem" }}>
        <h2 style={{ marginTop: 0 }}>The rating</h2>
        <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>
          A player&apos;s rating comes from their <strong style={{ color: "var(--text)" }}>per-game fantasy points</strong>, using the
          official 2026 NRL Fantasy point values across every stat the feeds expose. Those averaged points are mapped through a sigmoid
          into a <strong style={{ color: "var(--text)" }}>60–99</strong> band — calibrated so a median starter sits in the low 80s and only
          genuine stars reach the high 90s. A squad averaging the high 90s is what it takes to go 24–0.
        </p>
        <div className="scroll-x">
          <table className="stat" style={{ marginTop: 8 }}>
            <thead><tr><th>Action</th><th>Points</th></tr></thead>
            <tbody>
              {SCORING.map(([a, p]) => <tr key={a}><td>{a}</td><td style={{ fontFamily: "var(--font-mono)" }}>{p}</td></tr>)}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card" style={{ padding: "1.25rem" }}>
        <h2 style={{ marginTop: 0 }}>The simulator</h2>
        <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>
          Your squad&apos;s average rating sets a deterministic win–loss record (high 90s ≈ 24–0). On top of that, a Monte-Carlo engine
          plays thousands of 24-game seasons against real per-season club strengths to show your odds of going 24–0, a win distribution,
          and where you&apos;d rank among real premiership sides.
        </p>
        <p style={{ marginBottom: 0 }}>
          <Link href="/play" className="btn btn-primary">Build your side →</Link>
        </p>
      </section>

      <p style={{ fontSize: ".8rem", color: "var(--muted)" }}>
        NRL 24-0 is unofficial and not affiliated with the NRL or any club. Part of the 0 Series alongside{" "}
        <a href="https://afl23-0.com" style={{ color: "var(--accent)" }}>AFL 23-0</a> and{" "}
        <a href="https://footballinvincibles.com" style={{ color: "var(--accent)" }}>Football Invincibles</a>.
      </p>
    </div>
  );
}
