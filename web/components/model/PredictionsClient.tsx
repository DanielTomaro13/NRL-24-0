"use client";
import { useMemo, useState } from "react";
import type { PredMatch } from "@/lib/model";

const pct = (x: number | null) => (x == null ? "–" : `${(x * 100).toFixed(0)}%`);
const num = (x: number | null, d = 1) => (x == null ? "–" : x.toFixed(d));

export default function PredictionsClient({ matches }: { matches: PredMatch[] }) {
  const [match, setMatch] = useState("all");
  const [q, setQ] = useState("");
  const shown = useMemo(() => {
    return matches
      .filter((m) => match === "all" || m.event === match)
      .map((m) => ({
        ...m,
        players: m.players.filter((p) => !q || p.name?.toLowerCase().includes(q.toLowerCase())),
      }))
      .filter((m) => m.players.length);
  }, [matches, match, q]);

  if (!matches.length)
    return <p style={{ color: "var(--muted)" }}>No predictions available yet — team lists fill this closer to kickoff.</p>;

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div className="model-filters" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <select value={match} onChange={(e) => setMatch(e.target.value)} style={sel}>
          <option value="all">All matches</option>
          {matches.map((m) => (
            <option key={m.matchId} value={m.event}>{m.event}</option>
          ))}
        </select>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search player" style={sel} />
      </div>

      {shown.map((m) => (
        <div key={m.matchId} className="card scroll-x mtable" style={{ padding: ".4rem .6rem" }}>
          <div style={{ padding: ".4rem .3rem", fontWeight: 800, fontFamily: "var(--font-cond)", letterSpacing: ".02em" }}>
            {m.event}
          </div>
          <table className="stat">
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Player</th>
                <th>Pos</th>
                <th title="Anytime try probability">Try %</th>
                <th title="Expected tries">xTries</th>
                <th title="Expected player points">xPoints</th>
                <th title="Expected kicker points">xKick</th>
              </tr>
            </thead>
            <tbody>
              {m.players.map((p, i) => (
                <tr key={`${p.playerId}-${i}`}>
                  <td style={{ textAlign: "left", whiteSpace: "nowrap" }}>
                    <b>{p.name}</b>
                    <span style={{ color: "var(--muted)", marginLeft: 6, fontSize: ".78rem" }}>{p.team}</span>
                  </td>
                  <td style={{ color: "var(--muted)" }}>{p.pos ?? "–"}</td>
                  <td style={{ color: (p.p_anytime ?? 0) >= 0.4 ? "var(--accent-2)" : "var(--text)" }}>{pct(p.p_anytime)}</td>
                  <td>{num(p.exp_tries, 2)}</td>
                  <td style={{ fontWeight: 700 }}>{num(p.exp_points, 1)}</td>
                  <td style={{ color: "var(--muted)" }}>{num(p.exp_kicker, 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

const sel: React.CSSProperties = {
  padding: ".4rem .6rem",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--panel)",
  color: "var(--text)",
  fontSize: ".85rem",
};
