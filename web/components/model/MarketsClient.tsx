"use client";
import { useState } from "react";
import { MODEL_COMPS, modelCompLabel, type ModelComp, type TeamMarket } from "@/lib/modelcomp";

const odd = (x: number | null) => (x == null ? "–" : x.toFixed(2));
const sgn = (x: number | null) => (x == null ? "–" : `${x > 0 ? "+" : ""}${x.toFixed(1)}`);
const pct = (x: number | null) => (x == null ? "–" : `${(x * 100).toFixed(0)}%`);

function MarketTable({ rows }: { rows: TeamMarket[] }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".9rem" }}>
        <thead>
          <tr style={{ textAlign: "left", color: "var(--muted)" }}>
            <th style={{ padding: "8px 10px" }}>Match</th>
            <th style={{ padding: "8px 10px" }}>Margin</th>
            <th style={{ padding: "8px 10px" }}>Head&nbsp;to&nbsp;head (fair)</th>
            <th style={{ padding: "8px 10px" }}>Line</th>
            <th style={{ padding: "8px 10px" }}>Total</th>
            <th style={{ padding: "8px 10px" }}>O / U (fair)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((m) => {
            const homeFav = (m.p_home ?? 0) >= 0.5;
            return (
              <tr key={m.matchId} style={{ borderTop: "1px solid var(--border)" }}>
                <td style={{ padding: "8px 10px" }}>
                  <div style={{ fontWeight: 700, color: homeFav ? "var(--text)" : "var(--muted)" }}>
                    {m.home} <span style={{ color: "var(--muted)", fontWeight: 400 }}>{pct(m.p_home)}</span>
                  </div>
                  <div style={{ color: !homeFav ? "var(--text)" : "var(--muted)" }}>
                    {m.away} <span style={{ color: "var(--muted)" }}>{pct(m.p_away)}</span>
                  </div>
                </td>
                <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>
                  {homeFav ? m.home.split(" ").pop() : m.away.split(" ").pop()} by{" "}
                  {Math.abs(m.pred_margin ?? 0).toFixed(1)}
                </td>
                <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>
                  <span style={{ color: "var(--accent)", fontWeight: 700 }}>{odd(m.fair_home)}</span>
                  {" / "}
                  <span style={{ color: "var(--accent)", fontWeight: 700 }}>{odd(m.fair_away)}</span>
                </td>
                <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>{m.home.split(" ").pop()} {sgn(m.line_home)}</td>
                <td style={{ padding: "8px 10px" }}>{m.total_line?.toFixed(1) ?? "–"}</td>
                <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>
                  {odd(m.fair_over)} / {odd(m.fair_under)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function MarketsClient({ byComp }: { byComp: Record<ModelComp, TeamMarket[]> }) {
  // default to the first comp that actually has match markets (NRLW)
  const withData = MODEL_COMPS.find((c) => (byComp[c.id]?.length ?? 0) > 0)?.id ?? "nrlw";
  const [comp, setComp] = useState<ModelComp>(withData);
  const rows = byComp[comp] ?? [];
  const meta = MODEL_COMPS.find((c) => c.id === comp);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <p style={{ color: "var(--muted)", margin: 0, maxWidth: "65ch", fontSize: ".95rem" }}>
        Model-fair head-to-head, line and total prices from the match-outcome model
        (margin-informed Elo + form). These are the model&apos;s own fair odds — live
        bookmaker prices and value are layered in when available.
      </p>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {MODEL_COMPS.map((c) => {
          const has = (byComp[c.id]?.length ?? 0) > 0;
          const on = comp === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setComp(c.id)}
              className="chip"
              disabled={!has}
              title={has ? "" : "No match markets for this competition — player markets only"}
              style={{
                cursor: has ? "pointer" : "not-allowed",
                opacity: has ? 1 : 0.45,
                background: on ? "var(--accent)" : "var(--panel)",
                color: on ? "#1a0a06" : "var(--muted)",
                borderColor: on ? "var(--accent)" : "var(--border)",
                fontWeight: on ? 800 : 600,
              }}
            >
              {c.short}
            </button>
          );
        })}
      </div>

      {rows.length ? (
        <MarketTable rows={rows} />
      ) : (
        <div className="panel" style={{ padding: 16, color: "var(--muted)" }}>
          {meta?.label} has no match-outcome markets — only player markets
          (try-scorer, run metres, tackles, points) are modelled for this competition.
          See <a href="/model/predictions" style={{ color: "var(--accent)" }}>Predictions</a>.
        </div>
      )}

      {comp === "nrlw" && rows.length ? (
        <p style={{ color: "var(--muted)", fontSize: ".8rem", margin: 0 }}>
          Note: NRLW totals carry little predictable signal (the model barely beats the
          league-average total), so over/under prices sit near even money by design.
          Head-to-head and line are the stronger markets.
        </p>
      ) : null}
    </div>
  );
}
