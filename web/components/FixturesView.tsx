"use client";
import { useEffect, useState } from "react";
import { loadResults, type Results, type MatchResult } from "@/lib/data";
import { clubColors } from "@/lib/clubs";

export interface FixturesInitial { seasons: string[]; latestSeason: string; matches: MatchResult[] }

/** Latest NRL season is server-rendered (SEO); the full set + NRLW load client-side. */
export default function FixturesView({ initial }: { initial: FixturesInitial }) {
  const [data, setData] = useState<Results | null>(null);
  const [season, setSeason] = useState(initial.latestSeason);
  const [club, setClub] = useState("All clubs");
  useEffect(() => {
    // loadResults() is comp-aware; fetch the full set (all seasons) for the
    // dropdown — the server-rendered `initial` only carries the latest season.
    loadResults().then((r) => { setData(r); setSeason(r.seasons[0]); });
  }, []);
  const seasons = data?.seasons ?? initial.seasons;
  const all = data ? (data.bySeason[season] ?? []) : initial.matches;
  const clubs = ["All clubs", ...Array.from(new Set(all.flatMap((m) => [m.home, m.away]))).sort()];
  const matches = club === "All clubs" ? all : all.filter((m) => m.home === club || m.away === club);
  const byRound = new Map<number, MatchResult[]>();
  for (const m of matches) { const k = m.round || 0; if (!byRound.has(k)) byRound.set(k, []); byRound.get(k)!.push(m); }
  const rounds = [...byRound.keys()].sort((a, b) => b - a);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <label style={{ fontSize: ".82rem", color: "var(--muted)" }}>Season</label>
        <select value={season} onChange={(e) => { setSeason(e.target.value); setClub("All clubs"); }}
          style={{ padding: ".4rem .6rem", borderRadius: 8, border: "1px solid var(--border)", background: "var(--panel)", color: "var(--text)" }}>
          {seasons.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={club} onChange={(e) => setClub(e.target.value)}
          style={{ padding: ".4rem .6rem", borderRadius: 8, border: "1px solid var(--border)", background: "var(--panel)", color: "var(--text)" }}>
          {clubs.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      {rounds.map((rd) => (
        <div key={rd}>
          <div style={{ fontSize: ".74rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>
            {rd ? `Round ${rd}` : "Other"}
          </div>
          <div className="grid-cards">
            {byRound.get(rd)!.map((m, i) => <MatchCard key={i} m={m} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

function MatchCard({ m }: { m: MatchResult }) {
  const [h1] = clubColors(m.home), [a1] = clubColors(m.away);
  const homeWin = m.hs > m.as, awayWin = m.as > m.hs;
  return (
    <div className="card" style={{ padding: ".8rem 1rem", display: "grid", gap: 6 }}>
      <Row color={h1} name={m.home} score={m.hs} win={homeWin} />
      <Row color={a1} name={m.away} score={m.as} win={awayWin} />
    </div>
  );
}
function Row({ color, name, score, win }: { color: string; name: string; score: number; win: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: win ? 700 : 400, opacity: win ? 1 : 0.75 }}>
      <span style={{ width: 9, height: 9, borderRadius: 2, background: color, flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: ".88rem" }}>{name}</span>
      <span style={{ fontFamily: "var(--font-cond)", fontSize: "1.1rem" }}>{score}</span>
    </div>
  );
}
