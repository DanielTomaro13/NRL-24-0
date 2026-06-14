import Link from "next/link";
import HomeStats from "@/components/HomeStats";
import AdUnit from "@/components/AdUnit";
import { AD_SLOTS } from "@/lib/ads";
import { GAMES } from "@/lib/gamelist";

export default function Home() {
  return (
    <div style={{ display: "grid", gap: "2.5rem" }}>
      {/* hero */}
      <section style={{ display: "grid", gap: "1rem" }}>
        <span className="chip" style={{ width: "fit-content", color: "var(--gold)" }}>All-time NRL & NRLW draft · real match data</span>
        <h1 style={{ fontSize: "clamp(2.4rem, 7vw, 4rem)", margin: 0, lineHeight: 0.95, textTransform: "uppercase" }}>
          Build the perfect<br /><span style={{ color: "var(--accent)" }}>24–0</span> season
        </h1>
        <p style={{ color: "var(--muted)", maxWidth: 600, fontSize: "1.05rem" }}>
          Spin for a club and era, draft a legend into every position and chase a flawless
          home-and-away season. Switch between NRL and NRLW any time. Then take on a vault of
          rugby-league mini-games.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/play?quick=1" className="btn btn-primary">⚡ Quick Nine — spin now</Link>
          <Link href="/play" className="btn">All modes</Link>
          <Link href="/games" className="btn">Mini-games</Link>
          <Link href="/ladder" className="btn">Ladder</Link>
        </div>
      </section>

      {/* games grid */}
      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>The games</h2>
          <Link href="/games" style={{ fontSize: ".85rem", color: "var(--accent)" }}>All games →</Link>
        </div>
        <div className="grid-cards">
          {GAMES.map((g) => (
            <Link key={g.slug} href={`/games/${g.slug}`} className="card" style={{ padding: "1rem", display: "grid", gap: 4 }}>
              <span style={{ fontSize: "1.6rem" }}>{g.emoji}</span>
              <strong style={{ fontFamily: "var(--font-cond)", fontSize: "1.1rem", textTransform: "uppercase" }}>{g.title}</strong>
              <span style={{ fontSize: ".8rem", color: "var(--muted)" }}>{g.blurb}</span>
              <span className="chip" style={{ width: "fit-content", fontSize: ".64rem", marginTop: 4 }}>{g.tag}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* home ad — after the games grid, before stats; never over gameplay */}
      <AdUnit slot={AD_SLOTS.home} />

      {/* ladder + hall of fame + featured (comp-aware) */}
      <HomeStats />
    </div>
  );
}
