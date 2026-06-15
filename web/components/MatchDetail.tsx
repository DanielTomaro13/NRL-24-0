import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { clubColors } from "@/lib/clubs";
import { compLabel, type Comp } from "@/lib/comp";
import { slugify } from "@/lib/format";
import { SITE } from "@/lib/seo";
import type { BoxScore, BoxPlayer } from "@/lib/matchdb";

const COLS: { key: keyof BoxPlayer; label: string; title: string }[] = [
  { key: "pts", label: "Pts", title: "Points" },
  { key: "t", label: "T", title: "Tries" },
  { key: "g", label: "G", title: "Goals" },
  { key: "ta", label: "TA", title: "Try assists" },
  { key: "lb", label: "LB", title: "Line breaks" },
  { key: "rm", label: "Run m", title: "Run metres" },
  { key: "tk", label: "Tk", title: "Tackles" },
  { key: "tb", label: "TB", title: "Tackle breaks" },
  { key: "mt", label: "MT", title: "Missed tackles" },
  { key: "off", label: "Off", title: "Offloads" },
  { key: "err", label: "Err", title: "Errors" },
];

const fmtDate = (iso: string | null) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
};

/** Server-rendered match box score: score header + both lineups with per-player
 *  match stats. */
export default function MatchDetail({ box, comp }: { box: BoxScore; comp: Comp }) {
  const playerBase = comp === "nrlw" ? "/w/players" : "/players";
  const teamBase = comp === "nrlw" ? "/w/teams" : "/teams";
  const matchBase = comp === "nrlw" ? "/w/matches" : "/matches";
  const L = compLabel(comp);
  const date = fmtDate(box.date);
  const homeWin = box.hs > box.as, awayWin = box.as > box.hs;

  const ld = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: `${box.home} v ${box.away} — ${L} ${box.season} Round ${box.round}`,
    sport: "Rugby league",
    startDate: box.date || undefined,
    location: box.venue ? { "@type": "Place", name: box.venue } : undefined,
    url: `${SITE.url}${matchBase}/${box.id}/`,
    competitor: [box.home, box.away].map((name) => ({ "@type": "SportsTeam", name })),
  };

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <JsonLd data={ld} />
      <nav style={{ fontSize: ".82rem", color: "var(--muted)" }}>
        <Link href="/fixtures" style={{ color: "var(--accent)" }}>← All fixtures</Link>
      </nav>

      <header className="card" style={{ padding: "1.25rem" }}>
        <div style={{ fontSize: ".74rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 12 }}>
          {L} {box.season} · Round {box.round}{date ? ` · ${date}` : ""}{box.venue ? ` · ${box.venue}` : ""}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 12 }}>
          <TeamSide club={box.home} score={box.hs} win={homeWin} teamBase={teamBase} align="start" />
          <span style={{ fontFamily: "var(--font-cond)", fontSize: "1rem", color: "var(--muted)" }}>FT</span>
          <TeamSide club={box.away} score={box.as} win={awayWin} teamBase={teamBase} align="end" />
        </div>
      </header>

      <Lineup title={box.home} players={box.homeLineup} base={playerBase} />
      <Lineup title={box.away} players={box.awayLineup} base={playerBase} />

      <p style={{ fontSize: ".75rem", color: "var(--muted)" }}>
        Box score from real {L} match data. Scores are reconstructed from player scoring (tries, goals, field goals).
      </p>
    </div>
  );
}

function TeamSide({ club, score, win, teamBase, align }: { club: string; score: number; win: boolean; teamBase: string; align: "start" | "end" }) {
  const [c1] = clubColors(club);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: align === "end" ? "flex-end" : "flex-start", gap: 6 }}>
      <Link href={`${teamBase}/${slugify(club)}`} style={{ display: "flex", gap: 8, alignItems: "center", color: "var(--text)", textAlign: align === "end" ? "right" : "left" }}>
        <span style={{ width: 12, height: 12, borderRadius: 3, background: c1, flexShrink: 0, order: align === "end" ? 2 : 0 }} />
        <strong style={{ fontSize: "1.05rem" }}>{club}</strong>
      </Link>
      <span style={{ fontFamily: "var(--font-cond)", fontSize: "2.6rem", lineHeight: 1, color: win ? "var(--gold)" : "var(--text)" }}>{score}</span>
    </div>
  );
}

function Lineup({ title, players, base }: { title: string; players: BoxPlayer[]; base: string }) {
  const totals = COLS.reduce((acc, c) => { acc[c.key] = players.reduce((s, p) => s + (p[c.key] as number), 0); return acc; }, {} as Record<string, number>);
  return (
    <section>
      <h2 style={{ fontSize: "1.1rem", marginBottom: 8 }}>{title}</h2>
      <div className="card scroll-x" style={{ padding: ".4rem .6rem" }}>
        <table className="stat">
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Player</th>
              <th style={{ textAlign: "left" }}>Pos</th>
              {COLS.map((c) => <th key={c.key} title={c.title}>{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr key={p.pid}>
                <td style={{ textAlign: "left", whiteSpace: "nowrap" }}>
                  <Link href={`${base}/${p.pid}/${slugify(p.name)}`} style={{ color: "var(--text)" }}>{p.name}</Link>
                </td>
                <td style={{ textAlign: "left", color: "var(--muted)", whiteSpace: "nowrap", fontSize: ".78rem" }}>{p.pos}</td>
                {COLS.map((c) => (
                  <td key={c.key} style={c.key === "pts" && (p[c.key] as number) > 0 ? { fontWeight: 700 } : undefined}>{p[c.key] as number}</td>
                ))}
              </tr>
            ))}
            <tr style={{ borderTop: "2px solid var(--border)" }}>
              <td style={{ textAlign: "left", fontWeight: 700 }}>Total</td>
              <td />
              {COLS.map((c) => <td key={c.key} style={{ fontWeight: 700 }}>{totals[c.key]}</td>)}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
