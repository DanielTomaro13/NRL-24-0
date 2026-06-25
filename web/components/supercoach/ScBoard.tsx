"use client";
import { useMemo, useState } from "react";
import { useSort, Th } from "@/components/model/sortable";
import { PosBadge, AvailBadge, Sparkline } from "@/components/supercoach/bits";
import {
  type ScPlayer, SC_POS, money, signed, valuePer100k, formDelta, isPlaying,
} from "@/lib/supercoach";

type Preset = "all" | "playing" | "risers" | "fallers" | "cows" | "diff";
const applyPreset = (rows: ScPlayer[], p: Preset): ScPlayer[] => {
  switch (p) {
    case "playing": return rows.filter((r) => isPlaying(r) && r.games >= 3);
    case "risers": return rows.filter((r) => r.priceChange > 0);
    case "fallers": return rows.filter((r) => r.priceChange < 0);
    case "cows": return rows.filter((r) => r.price > 0 && r.price <= 250_000 && r.games >= 2);
    case "diff": return rows.filter((r) => isPlaying(r) && r.games >= 3 && r.owned > 0 && r.owned < 8 && r.proj >= 45);
    default: return rows.filter((r) => r.price > 0);
  }
};

const num = (x: number) => (x ? x : "–");
const sd = (v: number) => ({ color: v > 0 ? "var(--accent-2,#7bd88f)" : v < 0 ? "var(--danger)" : "var(--muted)" });

const val = (p: ScPlayer, k: string): string | number | null => ({
  name: p.name, pos: p.positions.join("/"), price: p.price, pc: p.priceChange, tpc: p.totalPriceChange,
  proj: p.proj, avg: p.avg, avg3: p.avg3, avg5: p.avg5, own: p.owned, gp: p.games, std: p.std,
  consist: p.consistency, form: formDelta(p), value: valuePer100k(p), opp: p.opp ?? "",
  oppavg: p.oppAvg, venavg: p.venAvg, spark: formDelta(p), next: 0,
}[k] ?? null);

function Cell({ p, k }: { p: ScPlayer; k: string }) {
  switch (k) {
    case "name": return (<td style={{ textAlign: "left", whiteSpace: "nowrap" }}><b>{p.name}</b><AvailBadge p={p} />
      <span style={{ color: "var(--muted)", marginLeft: 6, fontSize: ".74rem" }}>{p.teamAbbr} · <PosBadge positions={p.positions} /></span></td>);
    case "price": return <td style={{ fontWeight: 700 }}>{money(p.price)}</td>;
    case "pc": return <td style={sd(p.priceChange)}>{signed(p.priceChange)}</td>;
    case "tpc": return <td style={sd(p.totalPriceChange)}>{signed(p.totalPriceChange)}</td>;
    case "proj": return <td style={{ fontWeight: 800, color: "var(--gold)" }}>{num(p.proj)}</td>;
    case "avg": return <td>{num(p.avg)}</td>;
    case "avg3": return <td>{num(p.avg3)}</td>;
    case "avg5": return <td>{num(p.avg5)}</td>;
    case "own": return <td>{p.owned ? p.owned + "%" : "–"}</td>;
    case "gp": return <td style={{ color: "var(--muted)" }}>{p.games}</td>;
    case "std": return <td style={{ color: "var(--muted)" }}>{num(p.std)}</td>;
    case "consist": return <td>{p.consistency ? p.consistency + "%" : "–"}</td>;
    case "form": { const d = formDelta(p); return <td style={{ fontWeight: 700, ...sd(d) }}>{d > 0 ? "+" : ""}{d.toFixed(1)}</td>; }
    case "value": return <td style={{ fontWeight: 700, color: "var(--gold)" }}>{valuePer100k(p).toFixed(1)}</td>;
    case "opp": return <td style={{ textAlign: "left" }}>{p.opp ? (p.oppHome ? "vs " : "@ ") : ""}<b>{p.opp ?? "–"}</b></td>;
    case "oppavg": return <td style={{ color: p.oppAvg && p.avg ? (p.oppAvg >= p.avg ? "var(--accent-2,#7bd88f)" : "var(--danger)") : "var(--muted)" }}>{num(p.oppAvg)}</td>;
    case "venavg": return <td style={{ color: "var(--muted)" }}>{num(p.venAvg)}</td>;
    case "spark": return <td><Sparkline scores={p.scores} /></td>;
    case "next": return <td style={{ textAlign: "left", color: "var(--muted)", fontSize: ".74rem" }}>{p.next.map((n) => `${n.home ? "" : "@"}${n.opp}`).join(" · ") || "–"}</td>;
    default: return <td>–</td>;
  }
}

const HEAD: Record<string, { label: string; title?: string; left?: boolean }> = {
  name: { label: "Player", left: true }, pos: { label: "Pos", left: true }, price: { label: "Price" },
  pc: { label: "Rd $" }, tpc: { label: "Szn $" }, proj: { label: "Proj", title: "SuperCoach projection" },
  avg: { label: "Avg" }, avg3: { label: "L3" }, avg5: { label: "L5" }, own: { label: "Own%" },
  gp: { label: "GP" }, std: { label: "SD" }, consist: { label: "Consist" }, form: { label: "Form", title: "L3 − season avg" },
  value: { label: "Value", title: "Proj per $100k" }, opp: { label: "Opp", left: true },
  oppavg: { label: "v Opp" }, venavg: { label: "@ Ven" }, spark: { label: "By round" }, next: { label: "Next 3", left: true },
};

export default function ScBoard({
  players, columns, initialSort, tabs, defaultPreset = "all", search = false, posFilter = false, max = 600,
}: {
  players: ScPlayer[]; columns: string[]; initialSort: string;
  tabs?: { key: Preset; label: string }[]; defaultPreset?: Preset;
  search?: boolean; posFilter?: boolean; max?: number;
}) {
  const [preset, setPreset] = useState<Preset>(defaultPreset);
  const [q, setQ] = useState("");
  const [pos, setPos] = useState("ALL");

  const filtered = useMemo(() => {
    let r = applyPreset(players, preset);
    if (pos !== "ALL") r = r.filter((p) => p.positions.includes(pos));
    if (q) r = r.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) || p.teamAbbr.toLowerCase().includes(q.toLowerCase()));
    return r;
  }, [players, preset, pos, q]);

  const { sorted, sortKey, dir, onSort } = useSort(filtered, val, { key: initialSort, dir: "desc" });
  const rows = sorted.slice(0, max);
  const sp = { sortKey, dir, onSort };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {(tabs || search || posFilter) && (
        <div className="model-filters" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {tabs?.map((t) => (
            <button key={t.key} onClick={() => setPreset(t.key)} className="chip" style={{
              cursor: "pointer", background: preset === t.key ? "var(--gold)" : "var(--panel)",
              color: preset === t.key ? "#1a0a06" : "var(--muted)", borderColor: preset === t.key ? "var(--gold)" : "var(--border)", fontWeight: preset === t.key ? 800 : 600,
            }}>{t.label}</button>
          ))}
          {posFilter && (
            <select value={pos} onChange={(e) => setPos(e.target.value)} style={selStyle}>
              <option value="ALL">All positions</option>
              {Object.keys(SC_POS).map((c) => <option key={c} value={c}>{c} — {SC_POS[c].label}</option>)}
            </select>
          )}
          {search && <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search player / team" style={selStyle} />}
          <span style={{ color: "var(--muted)", fontSize: ".8rem" }}>{filtered.length} players</span>
        </div>
      )}
      <div className="card scroll-x mtable" style={{ padding: ".4rem .6rem" }}>
        <table className="stat">
          <thead><tr>{columns.map((k) => (
            <Th key={k} k={k} {...sp} title={HEAD[k]?.title} style={HEAD[k]?.left ? { textAlign: "left" } : undefined}>{HEAD[k]?.label ?? k}</Th>
          ))}</tr></thead>
          <tbody>
            {rows.map((p) => <tr key={p.id}>{columns.map((k) => <Cell key={k} p={p} k={k} />)}</tr>)}
          </tbody>
        </table>
        {!rows.length && <p style={{ color: "var(--muted)", padding: "1rem .3rem" }}>No players match.</p>}
      </div>
    </div>
  );
}

const selStyle: React.CSSProperties = {
  background: "var(--panel)", color: "var(--text)", border: "1px solid var(--border)",
  borderRadius: 8, padding: ".4rem .6rem", fontSize: ".9rem",
};
