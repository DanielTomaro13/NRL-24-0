import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { loadCompare, loadPickem, loadPredictions } from "@/lib/model.server";

export const metadata = pageMeta({
  title: "NRL Model — predictions, odds value & Pick'em edges",
  description:
    "A statistical NRL model: try-scorer, goal-kicking and player-points projections priced against live multi-bookmaker odds. Find value markets and judge Pick'em lines.",
  path: "/model",
  keywords: ["NRL model", "NRL predictions", "NRL odds value", "NRL Pick'em", "NRL betting model"],
});

const CARDS = [
  { href: "/model/predictions", title: "Predictions", blurb: "Per-player projected tries, points and kicker points for every game this round." },
  { href: "/model/compare", title: "Compare odds", blurb: "Model fair price next to live Sportsbet, Ladbrokes, TAB, PointsBet & Dabble prices — best highlighted." },
  { href: "/model/pickem", title: "Pick'em", blurb: "Type any Dabble line and the model returns P(over), fair odds and a lean — build a parlay slip." },
  { href: "/model/scoring", title: "Scoring", blurb: "Player-points and try-scorer leaders with the model's price versus the best book." },
  { href: "/model/accuracy", title: "Accuracy", blurb: "Out-of-sample backtest: try-scorer AUC, calibration curve and per-stat error vs a form baseline." },
];

export default async function ModelOverview() {
  const [preds, cmp, pk] = await Promise.all([loadPredictions(), loadCompare(), loadPickem()]);
  const stats = [
    { k: "Matches", v: preds.matches.length },
    { k: "Priced markets", v: cmp.rows.length },
    { k: "Pick'em rows", v: pk.rows.length },
  ];
  return (
    <div style={{ display: "grid", gap: "1.25rem" }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {stats.map((s) => (
          <div key={s.k} className="card" style={{ padding: ".7rem 1rem", minWidth: 130 }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, fontFamily: "var(--font-cond)" }}>{s.v}</div>
            <div style={{ color: "var(--muted)", fontSize: ".8rem" }}>{s.k}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))" }}>
        {CARDS.map((c) => (
          <Link key={c.href} href={c.href} className="card" style={{ padding: "1rem", display: "grid", gap: 6 }}>
            <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--text)" }}>{c.title} →</div>
            <div style={{ color: "var(--muted)", fontSize: ".88rem", lineHeight: 1.45 }}>{c.blurb}</div>
          </Link>
        ))}
      </div>
      <p style={{ color: "var(--muted)", fontSize: ".8rem", margin: 0 }}>
        The model runs in a separate pipeline and refreshes through the day. Figures are for
        information and entertainment only — not betting advice. Gamble responsibly.
      </p>
    </div>
  );
}
