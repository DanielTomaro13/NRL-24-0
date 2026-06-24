"use client";
import { useEffect, useMemo, useState } from "react";
import { BOOKS, type CompareData, type CompareRow } from "@/lib/model";
import { Th, useSort } from "@/components/model/sortable";

const BOOK_KEYS = Object.keys(BOOKS);

const cmpVal = (r: CompareRow, k: string): string | number | null => {
  if (k.startsWith("book:")) return r.books?.[k.slice(5)] ?? null;
  switch (k) {
    case "player": return r.player;
    case "market": return r.market;
    case "line": return r.line;
    case "myfair": return r.my_fair;
    default: return r.ev; // ev
  }
};

export default function CompareClient({ data }: { data: CompareData }) {
  const [match, setMatch] = useState("all");
  const [market, setMarket] = useState("all");
  const [evOnly, setEvOnly] = useState(false);
  const [hideLong, setHideLong] = useState(true);
  const [manual, setManual] = useState<Record<string, string>>({});

  // restore manual prices typed for books we can't pull live (e.g. Dabble)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("model-cmp-manual");
      if (raw) setManual(JSON.parse(raw));
    } catch {}
  }, []);
  const setPrice = (rk: string, v: string) => {
    setManual((m) => {
      const next = { ...m };
      if (v) next[rk] = v;
      else delete next[rk];
      try {
        localStorage.setItem("model-cmp-manual", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const rows = useMemo(() => {
    return data.rows.filter((r) => {
      if (match !== "all" && r.match !== match) return false;
      if (market !== "all" && r.market !== market) return false;
      if (evOnly && !(r.ev != null && r.ev > 0)) return false;
      if (hideLong && r.ev != null && (r.ev > 40 || r.ev < -95)) return false;
      return true;
    });
  }, [data.rows, match, market, evOnly, hideLong]);

  const { sorted, sortKey, dir, onSort } = useSort<CompareRow>(rows, cmpVal);
  const sp = { sortKey, dir, onSort };
  const rk = (r: CompareRow) => `${r.match}|${r.market}|${r.player}|${r.line}`;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="model-filters" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <select value={match} onChange={(e) => setMatch(e.target.value)} style={sel}>
          <option value="all">All matches</option>
          {data.matches.map((m) => <option key={m}>{m}</option>)}
        </select>
        <select value={market} onChange={(e) => setMarket(e.target.value)} style={sel}>
          <option value="all">All markets</option>
          {data.markets.map((m) => <option key={m}>{m}</option>)}
        </select>
        <label style={chk}><input type="checkbox" checked={evOnly} onChange={(e) => setEvOnly(e.target.checked)} /> +EV only</label>
        <label style={chk}><input type="checkbox" checked={hideLong} onChange={(e) => setHideLong(e.target.checked)} /> hide longshots</label>
        <span style={{ color: "var(--muted)", fontSize: ".8rem" }}>{rows.length} markets</span>
      </div>

      <div className="card scroll-x mtable" style={{ padding: ".4rem .6rem" }}>
        <table className="stat">
          <thead>
            <tr>
              <Th k="player" {...sp} style={{ textAlign: "left" }}>Player</Th>
              <Th k="market" {...sp}>Market</Th>
              <Th k="line" {...sp}>Line</Th>
              <Th k="myfair" {...sp}>My price</Th>
              {BOOK_KEYS.map((b) => <Th key={b} k={`book:${b}`} {...sp}>{BOOKS[b]}</Th>)}
              <Th k="ev" {...sp}>Best EV</Th>
              <th title="Type a price you see elsewhere (e.g. Dabble) to value it">Your price</th>
              <th>Your EV</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => {
              const key = rk(r);
              const yourP = parseFloat(manual[key] ?? "");
              const yourEv = r.my_p && yourP > 0 ? r.my_p * yourP - 1 : null;
              return (
                <tr key={key}>
                  <td style={{ textAlign: "left", whiteSpace: "nowrap" }}>
                    <b>{r.player}</b>
                    <span style={{ color: "var(--muted)", marginLeft: 6, fontSize: ".78rem" }}>{r.team}</span>
                  </td>
                  <td style={{ color: "var(--muted)" }}>{r.market}</td>
                  <td style={{ color: "var(--muted)" }}>{r.line ?? ""}</td>
                  <td><b>{r.my_fair ?? "–"}</b></td>
                  {BOOK_KEYS.map((b) => {
                    const v = r.books?.[b];
                    const best = r.best_book === b;
                    return (
                      <td key={b} style={{ color: v == null ? "var(--muted)" : best ? "var(--accent-2)" : "var(--text)", fontWeight: best ? 800 : 400 }}>
                        {v == null ? "–" : v.toFixed(2)}
                      </td>
                    );
                  })}
                  <td style={{ fontWeight: 700, color: r.ev == null ? "var(--muted)" : r.ev > 40 ? "var(--gold)" : r.ev > 0 ? "var(--accent-2)" : "var(--muted)" }}>
                    {r.ev == null ? "" : `${r.ev > 0 ? "+" : ""}${r.ev.toFixed(0)}%`}
                  </td>
                  <td>
                    <input
                      inputMode="decimal"
                      placeholder="$"
                      value={manual[key] ?? ""}
                      onChange={(e) => setPrice(key, e.target.value)}
                      style={{ ...sel, width: 62, padding: "3px 6px" }}
                    />
                  </td>
                  <td style={{ fontWeight: 700, color: yourEv == null ? "var(--muted)" : yourEv > 0 ? "var(--accent-2)" : "var(--muted)" }}>
                    {yourEv == null ? "" : `${yourEv >= 0 ? "+" : ""}${(yourEv * 100).toFixed(0)}%`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p style={{ color: "var(--muted)", fontSize: ".8rem", margin: 0 }}>
        “My price” is the model’s fair odds (no margin). <b>Your price</b>: for any book we can’t pull
        live (Dabble is iOS-only), type the decimal price you see and “Your EV” shows the model’s edge —
        green is +EV. Saved in your browser. Large EV usually means a team-list/name mismatch.
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
