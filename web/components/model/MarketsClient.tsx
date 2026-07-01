"use client";
import { useState } from "react";
import { MODEL_COMPS, modelCompLabel, type ModelComp, type TeamMarket } from "@/lib/modelcomp";

const odd = (x: number | null) => (x == null ? "–" : x.toFixed(2));
const sgn = (x: number | null) => (x == null ? "–" : `${x > 0 ? "+" : ""}${x.toFixed(1)}`);
const pct = (x: number | null) => (x == null ? "–" : `${(x * 100).toFixed(0)}%`);

/** Best positive-EV bet across the match's priced markets, if any book odds landed. */
function bestEdge(m: TeamMarket): { label: string; ev: number } | null {
  const short = (s: string) => s.split(" ").pop();
  const cands: Array<{ label: string; ev: number | undefined }> = [
    { ev: m.ev_home, label: `${short(m.home)} H2H @${odd(m.book_home_price ?? null)} (${m.book_home})` },
    { ev: m.ev_away, label: `${short(m.away)} H2H @${odd(m.book_away_price ?? null)} (${m.book_away})` },
    { ev: m.ev_over, label: `Over ${m.book_total_line} @${odd(m.book_over_price ?? null)} (${m.book_over})` },
    { ev: m.ev_under, label: `Under ${m.book_total_line} @${odd(m.book_under_price ?? null)} (${m.book_under})` },
    { ev: m.ev_line, label: `${m.book_line_side === "home" ? short(m.home) : short(m.away)} ${sgn(m.book_line_hcap ?? null)} @${odd(m.book_line_price ?? null)} (${m.book_line})` },
  ];
  const best = cands.filter((c): c is { label: string; ev: number } => c.ev != null)
    .sort((a, b) => b.ev - a.ev)[0];
  return best ?? null;
}

function MarketTable({ rows }: { rows: TeamMarket[] }) {
  const anyBooks = rows.some((m) => m.ev_home != null || m.ev_away != null);
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
            {anyBooks ? <th style={{ padding: "8px 10px" }}>Best edge (live books)</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((m) => {
            const homeFav = (m.p_home ?? 0) >= 0.5;
            const edge = anyBooks ? bestEdge(m) : null;
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
                  {m.book_home_price != null || m.book_away_price != null ? (
                    <div style={{ color: "var(--muted)", fontSize: ".78rem" }}>
                      book {odd(m.book_home_price ?? null)} / {odd(m.book_away_price ?? null)}
                    </div>
                  ) : null}
                </td>
                <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>{m.home.split(" ").pop()} {sgn(m.line_home)}</td>
                <td style={{ padding: "8px 10px" }}>{m.total_line?.toFixed(1) ?? "–"}</td>
                <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>
                  {odd(m.fair_over)} / {odd(m.fair_under)}
                </td>
                {anyBooks ? (
                  <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>
                    {edge ? (
                      <span style={{ color: edge.ev > 0 ? "var(--accent)" : "var(--muted)", fontWeight: edge.ev > 0 ? 700 : 400 }}>
                        {edge.label} <span>{edge.ev > 0 ? `+${edge.ev.toFixed(1)}%` : `${edge.ev.toFixed(1)}%`}</span>
                      </span>
                    ) : (
                      <span style={{ color: "var(--muted)" }}>–</span>
                    )}
                  </td>
                ) : null}
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

      {rows.length ? (
        <p style={{ color: "var(--muted)", fontSize: ".8rem", margin: 0 }}>
          Note: match totals carry little predictable signal in both comps (the model
          barely beats the league-average total), so over/under prices sit near even
          money by design. Head-to-head and line are the stronger markets.
        </p>
      ) : null}
    </div>
  );
}
