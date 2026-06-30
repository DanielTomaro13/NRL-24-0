"use client";
import { useModelComp } from "@/components/model/modelcomp.client";
import ReliabilityChart from "@/components/model/ReliabilityChart";
import type { BacktestData } from "@/lib/model";
import type { ModelComp } from "@/lib/modelcomp";

const pc = (x: number | null) => (x == null ? "–" : `${(x * 100).toFixed(1)}%`);
const n3 = (x: number | null) => (x == null ? "–" : x.toFixed(3));

export default function AccuracyComp({ byComp }: { byComp: Partial<Record<ModelComp, BacktestData>> }) {
  const comp = useModelComp();
  const bt = byComp[comp];
  const t = bt?.tries ?? null;

  if (!bt || (!t && !bt.regression.length))
    return <p style={{ color: "var(--muted)" }}>Backtest data isn’t available for this competition yet.</p>;

  const headline = t
    ? [
        { k: "Try-scorer AUC", v: n3(t.auc), sub: `vs ${n3(t.auc_baseline)} recent-form` },
        { k: "Calibration error", v: pc(t.calibration_error), sub: "mean |pred − actual|" },
        { k: "Brier score", v: n3(t.brier), sub: "lower is better" },
        { k: "Test sample", v: t.n_test ? t.n_test.toLocaleString() : "–", sub: "player-games" },
      ]
    : [];

  return (
    <div style={{ display: "grid", gap: "1.25rem" }}>
      <p style={{ color: "var(--muted)", margin: 0, maxWidth: "72ch", fontSize: ".95rem", lineHeight: 1.5 }}>
        Every figure here is <b style={{ color: "var(--text)" }}>out-of-sample</b>: the model is trained on
        earlier seasons and scored on{" "}
        {bt.holdouts.length ? bt.holdouts.join(", ") : "held-out seasons"} it never saw. Numbers it
        hasn’t earned aren’t shown — see how it performs before trusting it.
      </p>

      {headline.length ? (
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))" }}>
          {headline.map((h) => (
            <div key={h.k} className="card" style={{ padding: ".8rem 1rem" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, fontFamily: "var(--font-cond)" }}>{h.v}</div>
              <div style={{ fontWeight: 700, fontSize: ".82rem" }}>{h.k}</div>
              <div style={{ color: "var(--muted)", fontSize: ".74rem" }}>{h.sub}</div>
            </div>
          ))}
        </div>
      ) : null}

      {t && t.reliability.pred.length ? (
        <div className="card" style={{ padding: "1rem", display: "grid", gap: 8 }}>
          <div style={{ fontWeight: 800, fontFamily: "var(--font-cond)", textTransform: "uppercase" }}>
            Try-scorer calibration
          </div>
          <p style={{ color: "var(--muted)", margin: 0, fontSize: ".85rem" }}>
            Each point bins players by predicted anytime-try chance (x) against how often they actually
            scored (y). On the diagonal = perfectly calibrated.
          </p>
          <ReliabilityChart pred={t.reliability.pred} emp={t.reliability.emp} />
        </div>
      ) : null}

      {bt.regression.length ? (
        <div className="card scroll-x mtable" style={{ padding: ".4rem .6rem" }}>
          <div style={{ padding: ".5rem .3rem", fontWeight: 800, fontFamily: "var(--font-cond)", textTransform: "uppercase" }}>
            Per-stat error (mean absolute error)
          </div>
          <table className="stat">
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Stat</th>
                <th title="Model mean absolute error">Model MAE</th>
                <th title="Recent-form (last 5) baseline">Baseline</th>
                <th title="Improvement over baseline">Better by</th>
                <th>Sample</th>
              </tr>
            </thead>
            <tbody>
              {bt.regression.map((r) => (
                <tr key={r.target}>
                  <td style={{ textAlign: "left" }}>{r.label}</td>
                  <td><b>{r.mae_model ?? "–"}</b></td>
                  <td style={{ color: "var(--muted)" }}>{r.mae_base ?? "–"}</td>
                  <td style={{ color: (r.gain_pct ?? 0) > 0 ? "var(--accent-2)" : "var(--muted)", fontWeight: 700 }}>
                    {r.gain_pct == null ? "–" : `${r.gain_pct.toFixed(0)}%`}
                  </td>
                  <td style={{ color: "var(--muted)" }}>{r.n ? r.n.toLocaleString() : "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <p style={{ color: "var(--muted)", fontSize: ".8rem", margin: 0 }}>
        “Better by” is the reduction in mean absolute error versus predicting each player’s last-5-game
        average. Lower MAE = closer to the real result. Educational only — not betting advice.
      </p>
    </div>
  );
}
