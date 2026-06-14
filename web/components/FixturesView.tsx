"use client";
import { useEffect, useState } from "react";
import { loadResults, type Results, type MatchResult } from "@/lib/data";
import { clubColors } from "@/lib/clubs";

export default function FixturesView() {
  const [data, setData] = useState<Results | null>(null);
  const [season, setSeason] = useState("");
  useEffect(() => { loadResults().then((r) => { setData(r); setSeason(r.seasons[0]); }); }, []);
  if (!data) return <p style={{ color: "var(--muted)" }}>Loading fixtures…</p>;
  const matches = data.bySeason[season] ?? [];
  const byRound = new Map<number, MatchResult[]>();
  for (const m of matches) { const k = m.round || 0; if (!byRound.has(k)) byRound.set(k, []); byRound.get(k)!.push(m); }
  const rounds = [...byRound.keys()].sort((a, b) => b - a);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <label style={{ fontSize: ".82rem", color: "var(--muted)" }}>Season</label>
        <select value={season} onChange={(e) => setSeason(e.target.value)}
          style={{ padding: ".4rem .6rem", borderRadius: 8, border: "1px solid var(--border)", background: "var(--panel)", color: "var(--text)" }}>
          {data.seasons.map((s) => <option key={s} value={s}>{s}</option>)}
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
