"use client";
import { useState } from "react";
import { BOOKS, type ScoringData } from "@/lib/model";

const pct = (x: number | null) => (x == null ? "–" : `${(x * 100).toFixed(0)}%`);
const book = (k: string | null) => (k ? BOOKS[k] ?? k : "–");

export default function ScoringClient({ data }: { data: ScoringData }) {
  const [tab, setTab] = useState<"points" | "tries">("points");
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 6 }}>
        {(["points", "tries"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="chip"
            style={{
              cursor: "pointer",
              background: tab === t ? "var(--accent)" : "var(--panel)",
              color: tab === t ? "#1a0a06" : "var(--muted)",
              borderColor: tab === t ? "var(--accent)" : "var(--border)",
              fontWeight: tab === t ? 800 : 600,
            }}
          >
            {t === "points" ? "Player points" : "Try scorers"}
          </button>
        ))}
      </div>

      {tab === "points" ? (
        <div className="card scroll-x mtable" style={{ padding: ".4rem .6rem" }}>
          <table className="stat">
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Player</th>
                <th>Line</th>
                <th title="Model expected points">xPts</th>
                <th>My price</th>
                <th>Best book</th>
                <th>Best price</th>
                <th>EV</th>
              </tr>
            </thead>
            <tbody>
              {data.points.map((p, i) => (
                <tr key={`${p.player}-${i}`}>
                  <td style={{ textAlign: "left", whiteSpace: "nowrap" }}>
                    <b>{p.player}</b>
                    <span style={{ color: "var(--muted)", marginLeft: 6, fontSize: ".78rem" }}>{p.team}</span>
                  </td>
                  <td style={{ color: "var(--muted)" }}>{p.line ?? "–"}</td>
                  <td>{p.model_mean ?? "–"}</td>
                  <td><b>{p.my_price ?? "–"}</b></td>
                  <td style={{ color: "var(--muted)" }}>{book(p.book)}</td>
                  <td style={{ color: "var(--accent-2)" }}>{p.best_price ?? "–"}</td>
                  <td style={{ fontWeight: 700, color: p.ev == null ? "var(--muted)" : p.ev > 0 ? "var(--accent-2)" : "var(--muted)" }}>
                    {p.ev == null ? "" : `${p.ev > 0 ? "+" : ""}${p.ev.toFixed(0)}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.points.length && <p style={{ color: "var(--muted)", padding: ".5rem" }}>No priced player-points markets yet.</p>}
        </div>
      ) : (
        <div className="card scroll-x mtable" style={{ padding: ".4rem .6rem" }}>
          <table className="stat">
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Player</th>
                <th title="Anytime try probability">Try %</th>
                <th title="Expected tries">xTries</th>
              </tr>
            </thead>
            <tbody>
              {data.tries.map((t, i) => (
                <tr key={`${t.player}-${i}`}>
                  <td style={{ textAlign: "left", whiteSpace: "nowrap" }}>
                    <b>{t.player}</b>
                    <span style={{ color: "var(--muted)", marginLeft: 6, fontSize: ".78rem" }}>{t.team}</span>
                  </td>
                  <td style={{ color: (t.p_anytime ?? 0) >= 0.4 ? "var(--accent-2)" : "var(--text)" }}>{pct(t.p_anytime)}</td>
                  <td>{t.exp_tries == null ? "–" : t.exp_tries.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p style={{ color: "var(--muted)", fontSize: ".8rem", margin: 0 }}>
        “My price” is the model’s fair odds; EV compares it to the best book price. Educational only —
        not betting advice.
      </p>
    </div>
  );
}
