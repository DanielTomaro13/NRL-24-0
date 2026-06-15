import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { clubColors, clubAbbr } from "@/lib/clubs";
import { compLabel, type Comp } from "@/lib/comp";
import { SITE } from "@/lib/seo";
import type { TeamSummary } from "@/lib/teamdb";
import type { ProfilePlayer } from "@/lib/playerdb";

const ord = (n: number) => {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

/** Server-rendered club page: all-time record, season-by-season ladder
 *  finishes, and the club's top-rated players. */
export default function TeamProfile({ team, comp }: { team: TeamSummary; comp: Comp }) {
  const [c1, c2] = clubColors(team.club);
  const playerBase = comp === "nrlw" ? "/w/players" : "/players";
  const teamBase = comp === "nrlw" ? "/w/teams" : "/teams";
  const L = compLabel(comp);
  const { totals } = team;
  const winPct = totals.games ? Math.round((totals.wins / totals.games) * 100) : 0;
  const legends = team.roster.slice(0, 12);
  const topTries = [...team.roster].sort((a, b) => b.tries - a.tries).slice(0, 5);
  const topGames = [...team.roster].sort((a, b) => b.apps - a.apps).slice(0, 5);

  const ld = {
    "@context": "https://schema.org",
    "@type": "SportsTeam",
    name: team.club,
    sport: "Rugby league",
    url: `${SITE.url}${teamBase}/${team.slug}/`,
    memberOf: { "@type": "SportsOrganization", name: `${L} (Australia)` },
  };

  return (
    <div style={{ display: "grid", gap: "1.75rem" }}>
      <JsonLd data={ld} />
      <nav style={{ fontSize: ".82rem", color: "var(--muted)" }}>
        <Link href={teamBase} style={{ color: "var(--accent)" }}>← All {L} clubs</Link>
      </nav>

      <header className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ height: 8, background: `linear-gradient(90deg, ${c1}, ${c2})` }} />
        <div style={{ padding: "1.25rem", display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <div aria-hidden style={{
            width: 56, height: 56, borderRadius: 12, flexShrink: 0, display: "grid", placeItems: "center",
            background: c1, color: "#fff", fontFamily: "var(--font-cond)", fontSize: "1.2rem", fontWeight: 800,
            boxShadow: `inset 0 0 0 2px ${c2}`,
          }}>{clubAbbr(team.club)}</div>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ margin: 0, fontSize: "1.9rem", textTransform: "uppercase", lineHeight: 1 }}>{team.club}</h1>
            <p style={{ margin: "6px 0 0", color: "var(--muted)", fontSize: ".9rem" }}>
              {team.seasons.length} {L} seasons in the dataset
              {team.titles > 0 && <> · <strong style={{ color: "var(--gold)" }}>{team.titles}× minor premiers</strong></>}
            </p>
          </div>
        </div>
      </header>

      <section style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))" }}>
        <Stat label="All-time record" value={`${totals.wins}–${totals.losses}${totals.draws ? `–${totals.draws}` : ""}`} />
        <Stat label="Win %" value={`${winPct}%`} />
        <Stat label="Points for" value={totals.pf.toLocaleString()} />
        <Stat label="Points against" value={totals.pa.toLocaleString()} />
      </section>

      <section>
        <h2 style={{ fontSize: "1.1rem", marginBottom: 8 }}>Season by season</h2>
        <div className="card" style={{ padding: "0.5rem 0.9rem" }}>
          <table className="stat">
            <thead><tr><th>Season</th><th>Finish</th><th>P</th><th>W</th><th>L</th><th>D</th><th>PF</th><th>PA</th><th>Pts</th></tr></thead>
            <tbody>
              {team.seasons.map((s) => (
                <tr key={s.season}>
                  <td style={{ fontWeight: 700 }}>{s.season}</td>
                  <td style={{ color: s.finish === 1 ? "var(--gold)" : "var(--text)" }}>
                    {ord(s.finish)}<span style={{ color: "var(--muted)" }}> / {s.teams}</span>
                  </td>
                  <td>{s.p}</td><td>{s.w}</td><td>{s.l}</td><td>{s.d}</td>
                  <td>{s.pf}</td><td>{s.pa}</td><td style={{ fontWeight: 700 }}>{s.pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {legends.length > 0 && (
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
            <h2 style={{ fontSize: "1.1rem", margin: 0 }}>Top-rated players</h2>
            <Link href={playerBase} style={{ fontSize: ".82rem", color: "var(--accent)" }}>All players →</Link>
          </div>
          <div className="grid-cards">
            {legends.map((p) => (
              <Link key={p.id} href={`${playerBase}/${p.id}/${p.slug}`} className="card" style={{ padding: "1rem", display: "grid", gap: 4 }}>
                <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</strong>
                  <span style={{ fontFamily: "var(--font-cond)", fontSize: "1.3rem", color: p.rating >= 90 ? "var(--gold)" : "var(--text)" }}>{p.rating}</span>
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: ".7rem", color: "var(--muted)" }}>
                  {p.posName} · {p.apps} games · {p.tries} tries · {p.firstYear}–{p.lastYear}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        <Leaders title="Most tries" players={topTries} stat={(p) => `${p.tries}`} base={playerBase} />
        <Leaders title="Most games" players={topGames} stat={(p) => `${p.apps}`} base={playerBase} />
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card" style={{ padding: "0.9rem 1rem", textAlign: "center" }}>
      <div style={{ fontFamily: "var(--font-cond)", fontSize: "1.6rem", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: ".64rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em", marginTop: 4 }}>{label}</div>
    </div>
  );
}

function Leaders({ title, players, stat, base }: { title: string; players: ProfilePlayer[]; stat: (p: ProfilePlayer) => string; base: string }) {
  return (
    <div className="card" style={{ padding: "1rem" }}>
      <h3 style={{ fontSize: ".82rem", textTransform: "uppercase", letterSpacing: ".06em", color: "var(--muted)", margin: "0 0 10px" }}>{title}</h3>
      <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
        {players.map((p, i) => (
          <li key={p.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "var(--muted)", fontFamily: "var(--font-mono)", fontSize: ".8rem", width: 16 }}>{i + 1}</span>
            <Link href={`${base}/${p.id}/${p.slug}`} style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</Link>
            <span style={{ fontFamily: "var(--font-cond)", fontSize: "1.1rem" }}>{stat(p)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
