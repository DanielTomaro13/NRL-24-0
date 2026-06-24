"use client";
import { useMemo, useState } from "react";
import type { PredMatch, PredPlayer } from "@/lib/model";
import { Th, sortBy, type Dir } from "@/components/model/sortable";

const pct = (x: number | null) => (x == null ? "–" : `${(x * 100).toFixed(0)}%`);
const num = (x: number | null, d = 1) => (x == null ? "–" : x.toFixed(d));

const predVal = (p: PredPlayer, k: string): string | number | null => {
  switch (k) {
    case "player": return p.name;
    case "pos": return p.pos;
    case "tryp": return p.p_anytime;
    case "xtries": return p.exp_tries;
    case "xkick": return p.exp_kicker;
    default: return p.exp_points;
  }
};

export default function PredictionsClient({ matches }: { matches: PredMatch[] }) {
  const [match, setMatch] = useState("all");
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<string | null>("xpoints");
  const [dir, setDir] = useState<Dir>("desc");
  const onSort = (k: string) =>
    sortKey === k ? setDir((d) => (d === "asc" ? "desc" : "asc")) : (setSortKey(k), setDir("desc"));
  const sp = { sortKey, dir, onSort };
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
                <Th k="player" {...sp} style={{ textAlign: "left" }}>Player</Th>
                <Th k="pos" {...sp}>Pos</Th>
                <Th k="tryp" {...sp} title="Anytime try probability">Try %</Th>
                <Th k="xtries" {...sp} title="Expected tries">xTries</Th>
                <Th k="xpoints" {...sp} title="Expected player points">xPoints</Th>
                <Th k="xkick" {...sp} title="Expected kicker points">xKick</Th>
              </tr>
            </thead>
            <tbody>
              {sortBy(m.players, predVal, sortKey, dir).map((p, i) => (
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
