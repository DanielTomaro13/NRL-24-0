"use client";
import { useMemo, useState } from "react";
import type { PickemData, PickemRow } from "@/lib/model";
import { fair, MULTIPLIERS, pOver } from "@/lib/pickem-calc";
import { Th, sortBy, type Dir } from "@/components/model/sortable";

interface Leg { key: string; pl: string; st: string; ln: number; sd: "over" | "under"; p: number }
const rowKey = (r: PickemRow, i: number) => `${i}:${r.player}:${r.stat}`;

export default function PickemClient({ data }: { data: PickemData }) {
  const [match, setMatch] = useState("all");
  const [stat, setStat] = useState("all");
  const [strong, setStrong] = useState(false);
  const [lines, setLines] = useState<Record<string, string>>({});
  const [slip, setSlip] = useState<Leg[]>([]);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [dir, setDir] = useState<Dir>("desc");
  const onSort = (k: string) =>
    sortKey === k ? setDir((d) => (d === "asc" ? "desc" : "asc")) : (setSortKey(k), setDir("desc"));
  const sp = { sortKey, dir, onSort };

  const rows = useMemo(() => data.rows.map((r, i) => ({ r, i, key: rowKey(r, i) })), [data.rows]);

  const lineOf = (key: string, r: PickemRow) => {
    const v = lines[key];
    return v !== undefined ? parseFloat(v) : r.line;
  };

  const filtered = rows.filter(({ r, key }) => {
    if (match !== "all" && r.event !== match) return false;
    if (stat !== "all" && r.stat_label !== stat) return false;
    if (strong) {
      const po = pOver(r.dist, lineOf(key, r));
      if (po == null || Math.max(po, 1 - po) < 0.6) return false;
    }
    return true;
  });
  type Item = { r: PickemRow; i: number; key: string };
  const pkVal = (it: Item, k: string): string | number | null => {
    switch (k) {
      case "player": return it.r.player;
      case "stat": return it.r.stat_label;
      case "proj": return it.r.proj;
      case "line": return lineOf(it.key, it.r);
      case "over": return pOver(it.r.dist, lineOf(it.key, it.r)) ?? null;
      case "under": { const po = pOver(it.r.dist, lineOf(it.key, it.r)); return po == null ? null : 1 - po; }
      default: return it.r.dab_line;
    }
  };
  const shown = sortBy(filtered, pkVal, sortKey, dir);

  const addLeg = (r: PickemRow, key: string, sd: "over" | "under") => {
    const po = pOver(r.dist, lineOf(key, r));
    if (po == null) return;
    const p = sd === "over" ? po : 1 - po;
    const ln = lineOf(key, r);
    const legKey = `${key}:${sd}`;
    setSlip((s) => (s.find((l) => l.key === legKey) ? s : [...s, { key: legKey, pl: r.player, st: r.stat_label, ln, sd, p }]));
  };
  const rmLeg = (k: string) => setSlip((s) => s.filter((l) => l.key !== k));
  const clearSlip = () => setSlip([]);

  const prod = slip.reduce((a, l) => a * l.p, 1);
  const mult = MULTIPLIERS[slip.length];
  const ev = mult ? mult * prod - 1 : null;

  if (!data.rows.length)
    return <p style={{ color: "var(--muted)" }}>No Pick'em rows yet — projections fill this once team lists land.</p>;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <p style={{ color: "var(--muted)", fontSize: ".9rem", margin: 0, maxWidth: "70ch" }}>
        Dabble’s Pick’em is a multiplier game (min 2 legs), so there’s no single price to de-vig — the
        model judges the <b>line</b> instead. {data.n_dabble ? `${data.n_dabble} lines are prefilled from live Dabble data. ` : "Dabble is iOS-only, so "}
        type the line you see in <b>Your line</b> and the model returns P(over/under) and fair odds. A
        parlay is +EV when <code>multiplier × (product of win probabilities) &gt; 1</code>.
      </p>

      <div className="model-filters" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <select value={match} onChange={(e) => setMatch(e.target.value)} style={sel}>
          <option value="all">All matches</option>
          {data.matches.map((m) => <option key={m}>{m}</option>)}
        </select>
        <select value={stat} onChange={(e) => setStat(e.target.value)} style={sel}>
          <option value="all">All stats</option>
          {data.stats.map((s) => <option key={s}>{s}</option>)}
        </select>
        <label style={chk}><input type="checkbox" checked={strong} onChange={(e) => setStrong(e.target.checked)} /> strong leans only (≥60%)</label>
        <span style={{ color: "var(--muted)", fontSize: ".8rem" }}>{shown.length} rows</span>
      </div>

      {slip.length ? (
        <div className="card" style={{ padding: ".7rem .9rem", display: "grid", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <b>{slip.length}-leg parlay</b>
            <button className="btn" onClick={clearSlip} style={{ padding: ".2rem .6rem", fontSize: ".78rem" }}>Clear</button>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {slip.map((l) => (
              <span key={l.key} className="chip" style={{ gap: 6 }}>
                {l.pl} {l.sd.toUpperCase()} {l.ln} ({(l.p * 100).toFixed(0)}%)
                <button onClick={() => rmLeg(l.key)} style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer" }}>×</button>
              </span>
            ))}
          </div>
          <div style={{ fontSize: ".85rem" }}>
            {!mult ? (
              slip.length < 2 ? "Add at least 2 legs (minimum for a parlay)." : `No multiplier for ${slip.length} legs.`
            ) : (
              <>combined win prob <b>{(prod * 100).toFixed(1)}%</b> · multiplier <b>×{mult}</b> ·{" "}
                theoretical EV <b style={{ color: ev! > 0 ? "var(--accent-2)" : "var(--danger)" }}>{ev! >= 0 ? "+" : ""}{(ev! * 100).toFixed(0)}%</b></>
            )}
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: ".7rem .9rem", color: "var(--muted)", fontSize: ".85rem" }}>
          Slip empty — add legs (＋) to build a parlay.
        </div>
      )}

      <div className="card scroll-x mtable" style={{ padding: ".4rem .6rem" }}>
        <table className="stat">
          <thead>
            <tr>
              <Th k="player" {...sp} style={{ textAlign: "left" }}>Player</Th>
              <Th k="stat" {...sp}>Stat</Th>
              <Th k="proj" {...sp}>Proj</Th>
              <Th k="line" {...sp}>Your line</Th>
              <Th k="dab" {...sp}>Dabble</Th>
              <Th k="over" {...sp}>Over — P · price</Th>
              <Th k="under" {...sp}>Under — P · price</Th>
            </tr>
          </thead>
          <tbody>
            {shown.map(({ r, key }) => {
              const ln = lineOf(key, r);
              const po = pOver(r.dist, ln);
              const pu = po == null ? null : 1 - po;
              const sideCell = (p: number | null, sd: "over" | "under") => (
                <td style={{ color: p != null && p >= 0.6 ? "var(--accent-2)" : "var(--text)" }}>
                  {p == null ? "–" : <>
                    <b>{(p * 100).toFixed(0)}%</b>{" "}
                    <span style={{ color: "var(--muted)" }}>{fair(p)}</span>{" "}
                    <button onClick={() => addLeg(r, key, sd)} style={addBtn} title="Add to slip">+</button>
                  </>}
                </td>
              );
              return (
                <tr key={key}>
                  <td style={{ textAlign: "left", whiteSpace: "nowrap" }}>
                    <b>{r.player}</b>
                    <span style={{ color: "var(--muted)", marginLeft: 6, fontSize: ".78rem" }}>{r.team}</span>
                  </td>
                  <td style={{ color: "var(--muted)" }}>{r.stat_label}</td>
                  <td style={{ color: "var(--muted)" }}>{r.proj ?? "–"}</td>
                  <td>
                    <input
                      inputMode="decimal"
                      value={lines[key] ?? String(r.line)}
                      onChange={(e) => setLines((m) => ({ ...m, [key]: e.target.value }))}
                      style={{ ...sel, width: 56, padding: "3px 6px", textAlign: "center" }}
                    />
                  </td>
                  <td style={{ color: "var(--muted)", fontSize: ".8rem" }}>{r.dab_line ?? "–"}</td>
                  {sideCell(po, "over")}
                  {sideCell(pu, "under")}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p style={{ color: "var(--muted)", fontSize: ".8rem", margin: 0 }}>
        “Price” is the model’s fair odds (1 ÷ model probability) at the line you enter, from the same
        calibrated stat models as the rest of the site. Pick’em isn’t fixed odds, so this isn’t a
        single-bet EV — use it to find the strongest legs. Not betting advice.
      </p>
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
const chk: React.CSSProperties = { display: "flex", gap: 5, alignItems: "center", fontSize: ".82rem", color: "var(--muted)" };
const addBtn: React.CSSProperties = {
  background: "var(--panel-2)",
  border: "1px solid var(--border)",
  color: "var(--text)",
  borderRadius: 6,
  cursor: "pointer",
  padding: "0 6px",
  lineHeight: 1.4,
};
