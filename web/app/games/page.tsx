import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { GAMES } from "@/lib/gamelist";
import JsonLd from "@/components/JsonLd";
import { SITE } from "@/lib/seo";

export const metadata = pageMeta({
  title: "NRL Mini-Games — Footle, Higher or Lower, Guess the Player & more",
  description: "A vault of free rugby-league mini-games built on real NRL stats: Footle, Higher or Lower, Guess the Player, Career Path, Beat the Clock, Score Predictor and the Invincibles squad-builder.",
  path: "/games",
  keywords: ["NRL games", "rugby league games", "Footle NRL", "NRL quiz", "NRL trivia"],
});

const ld = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: GAMES.map((g, i) => ({
    "@type": "ListItem", position: i + 1, name: g.title, url: `${SITE.url}/games/${g.slug}`,
  })),
};

export default function GamesHub() {
  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <JsonLd data={ld} />
      <header>
        <h1 style={{ fontSize: "2.2rem", margin: 0, textTransform: "uppercase" }}>The games</h1>
        <p style={{ color: "var(--muted)", maxWidth: 620, marginTop: 6 }}>
          Free rugby-league mini-games, all built on real NRL Champion Data. Daily puzzles,
          endless streaks and the squad-builder simulator.
        </p>
      </header>
      <div className="grid-cards">
        {GAMES.map((g) => (
          <Link key={g.slug} href={`/games/${g.slug}`} className="card" style={{ padding: "1.1rem", display: "grid", gap: 6 }}>
            <span style={{ fontSize: "1.8rem" }}>{g.emoji}</span>
            <strong style={{ fontFamily: "var(--font-cond)", fontSize: "1.2rem", textTransform: "uppercase" }}>{g.title}</strong>
            <span style={{ fontSize: ".85rem", color: "var(--muted)" }}>{g.blurb}</span>
            <span className="chip" style={{ width: "fit-content", fontSize: ".64rem" }}>{g.tag}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
