"use client";
import { useEffect, useMemo, useState } from "react";
import { BOOKS, type CompareData, type CompareRow } from "@/lib/model";
import { Th, useSort } from "@/components/model/sortable";

type EvRow = CompareRow & { _ev: number; _kelly: number };
const evVal = (r: EvRow, k: string): string | number | null => {
  switch (k) {
    case "player": return r.player;
    case "market": return r.market;
    case "line": return r.line;
    case "model": return r.my_p;
    case "fair": return r.my_fair;
    case "best": return r.best;
    case "book": return r.best_book;
    case "kelly": return r._kelly;
    default: return r._ev; // ev / stake
  }
};

/** Expected value of backing the best price: model prob p at decimal price d -> p*d - 1.
 *  Kelly fraction of bankroll: (p*d - 1) / (d - 1), capped/half-Kelly for sanity. */
function evAndKelly(p: number | null, price: number | null) {
  if (p == null || price == null || price <= 1) return null;
  const ev = p * price - 1;
  const kelly = ev / (price - 1);
  return { ev, kelly };
}

export default function EvClient({ data }: { data: CompareData }) {
  const [market, setMarket] = useState("all");
  const [minEv, setMinEv] = useState(0);
  const [half, setHalf] = useState(true);
  const [bankroll, setBankroll] = useState("");

  useEffect(() => {
    try {
      const b = localStorage.getItem("model-bankroll");
      if (b) setBankroll(b);
    } catch {}
  }, []);
  const setBank = (v: string) => {
    setBankroll(v);
    try {
      v ? localStorage.setItem("model-bankroll", v) : localStorage.removeItem("model-bankroll");
    } catch {}
  };
  const bank = parseFloat(bankroll) || 0;

  const rows = useMemo(() => {
    const out: Array<CompareRow & { _ev: number; _kelly: number }> = [];
    for (const r of data.rows) {
      const e = evAndKelly(r.my_p, r.best);
      if (!e) continue;
      const evPct = e.ev * 100;
      // real edges only: positive, not implausible-longshot/mismatch territory
      if (evPct <= 0 || evPct > 30) continue;
      if (evPct < minEv) continue;
      if (market !== "all" && r.market !== market) continue;
      out.push({ ...r, _ev: e.ev, _kelly: e.kelly });
    }
    return out;
  }, [data.rows, market, minEv]);

  const { sorted, sortKey, dir, onSort } = useSort<EvRow>(rows, evVal, { key: "ev", dir: "desc" });

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <p style={{ color: "var(--muted)", margin: 0, maxWidth: "72ch", fontSize: ".95rem", lineHeight: 1.5 }}>
        Every market where the model rates the <b style={{ color: "var(--text)" }}>best available price</b> as
        value, ranked by expected value. <b>EV</b> = model win probability × price − 1. <b>Kelly</b> is the
        fraction of bankroll that maximises long-run growth at that edge ({half ? "shown halved — safer" : "full"}).
        Set your <b>bankroll</b> and the <b>Stake</b> column shows the dollar amount.
      </p>

      <div className="model-filters" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <select value={market} onChange={(e) => setMarket(e.target.value)} style={sel}>
          <option value="all">All markets</option>
          {data.markets.map((m) => <option key={m}>{m}</option>)}
        </select>
        <label style={chk}>min EV
          <select value={minEv} onChange={(e) => setMinEv(Number(e.target.value))} style={{ ...sel, marginLeft: 6 }}>
            {[0, 2, 5, 10].map((v) => <option key={v} value={v}>{v}%</option>)}
          </select>
        </label>
        <label style={chk}><input type="checkbox" checked={half} onChange={(e) => setHalf(e.target.checked)} /> half Kelly</label>
        <label style={chk}>bankroll $
          <input inputMode="decimal" value={bankroll} onChange={(e) => setBank(e.target.value)} placeholder="0"
            style={{ ...sel, width: 90, marginLeft: 6 }} />
        </label>
        <span style={{ color: "var(--muted)", fontSize: ".8rem" }}>{rows.length} value bets</span>
      </div>

      <div className="card scroll-x mtable" style={{ padding: ".4rem .6rem" }}>
        <table className="stat">
          <thead>
            <tr>
              {(() => { const sp = { sortKey, dir, onSort }; return (<>
                <Th k="player" {...sp} style={{ textAlign: "left" }}>Player</Th>
                <Th k="market" {...sp}>Market</Th>
                <Th k="line" {...sp}>Line</Th>
                <Th k="model" {...sp} title="Model win probability">Model</Th>
                <Th k="fair" {...sp} title="Model fair odds">Fair</Th>
                <Th k="best" {...sp}>Best price</Th>
                <Th k="book" {...sp}>Book</Th>
                <Th k="ev" {...sp}>EV</Th>
                <Th k="kelly" {...sp} title="Suggested stake (fraction of bankroll)">Kelly</Th>
                <Th k="stake" {...sp} title="Kelly fraction × your bankroll">Stake</Th>
              </>); })()}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => {
              const frac = half ? r._kelly / 2 : r._kelly;
              const k = frac * 100;
              const stake = bank > 0 ? bank * frac : null;
              return (
                <tr key={`${r.match}-${r.player}-${r.market}-${r.line}-${i}`}>
                  <td style={{ textAlign: "left", whiteSpace: "nowrap" }}>
                    <b>{r.player}</b>
                    <span style={{ color: "var(--muted)", marginLeft: 6, fontSize: ".78rem" }}>{r.team}</span>
                  </td>
                  <td style={{ color: "var(--muted)" }}>{r.market}</td>
                  <td style={{ color: "var(--muted)" }}>{r.line ?? ""}</td>
                  <td>{r.my_p != null ? `${(r.my_p * 100).toFixed(0)}%` : "–"}</td>
                  <td style={{ color: "var(--muted)" }}>{r.my_fair ?? "–"}</td>
                  <td style={{ color: "var(--accent-2)", fontWeight: 700 }}>{r.best}</td>
                  <td style={{ color: "var(--muted)" }}>{r.best_book ? BOOKS[r.best_book] ?? r.best_book : "–"}</td>
                  <td style={{ fontWeight: 800, color: "var(--accent-2)" }}>+{(r._ev * 100).toFixed(0)}%</td>
                  <td style={{ color: "var(--gold)", fontWeight: 700 }}>{k.toFixed(1)}%</td>
                  <td style={{ fontWeight: 800 }}>{stake != null ? `$${stake.toFixed(2)}` : "–"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!sorted.length && <p style={{ color: "var(--muted)", padding: ".5rem" }}>No value bets clear the filters right now.</p>}
      </div>

      <p style={{ color: "var(--muted)", fontSize: ".8rem", margin: 0 }}>
        Edges this large usually shrink as kickoff nears and the market sharpens. Very large EV can also
        signal a team-list or name mismatch — sanity-check the lineup. Educational only, not betting
        advice. 18+. Gamble responsibly.
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
