import Link from "next/link";
import { SITE } from "@/lib/seo";

export default function SiteFooter() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--border)",
        marginTop: "4rem",
        padding: "2rem 0",
        paddingBottom: "calc(2rem + env(safe-area-inset-bottom))",
        color: "var(--muted)",
      }}
    >
      <div className="container-x" style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
        <div style={{ maxWidth: 320 }}>
          <strong style={{ color: "var(--text)" }}>{SITE.name}</strong>
          <p style={{ fontSize: ".85rem", marginTop: 6 }}>{SITE.tagline}</p>
          <p style={{ fontSize: ".78rem", marginTop: 10 }}>
            Part of the 0 Series ·{" "}
            <a href="https://afl23-0.com" style={{ color: "var(--accent)" }}>AFL 23-0</a> ·{" "}
            <a href="https://footballinvincibles.com" style={{ color: "var(--accent)" }}>Football Invincibles</a> ·{" "}
            <a href="https://grandtennisslam.com" style={{ color: "var(--accent)" }}>Tennis Slam</a>
          </p>
        </div>
        <div style={{ display: "flex", gap: "2.5rem", marginLeft: "auto", flexWrap: "wrap" }}>
          <nav style={{ display: "grid", gap: 6, fontSize: ".85rem" }}>
            <strong style={{ color: "var(--text)" }}>Play</strong>
            <Link href="/play">Perfect Season</Link>
            <Link href="/games">Mini-games</Link>
            <Link href="/leaderboard">Hall of Fame</Link>
          </nav>
          <nav style={{ display: "grid", gap: 6, fontSize: ".85rem" }}>
            <strong style={{ color: "var(--text)" }}>Stats</strong>
            <Link href="/ladder">Ladder</Link>
            <Link href="/players">Players</Link>
            <Link href="/fixtures">Fixtures</Link>
            <Link href="/stats">Leaders</Link>
          </nav>
          <nav style={{ display: "grid", gap: 6, fontSize: ".85rem" }}>
            <strong style={{ color: "var(--text)" }}>About</strong>
            <Link href="/about">How it works</Link>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/contact">Contact</Link>
            <a href="https://ko-fi.com/danieltomaro" target="_blank" rel="noopener" style={{ color: "var(--gold)" }}>☕ Support on Ko-fi</a>
          </nav>
        </div>
      </div>
      <div className="container-x" style={{ marginTop: "1.5rem", fontSize: ".78rem", opacity: 0.7 }}>
        © {new Date().getFullYear()} {SITE.name}. Unofficial. Not affiliated with the NRL or
        any club. Player ratings derived from real Champion Data match stats for entertainment use.
      </div>
    </footer>
  );
}
