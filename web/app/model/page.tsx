import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { loadCompare, loadPickem, loadPredictions, loadTeamMarkets } from "@/lib/model.server";
import { MODEL_COMPS, type ModelComp } from "@/lib/modelcomp";
import OverviewStats, { type OverviewStat } from "@/components/model/OverviewStats";

export const metadata = pageMeta({
  title: "NRL Model — predictions, odds value & Pick'em edges",
  description:
    "A statistical NRL model: try-scorer, goal-kicking and player-points projections priced against live multi-bookmaker odds. Find value markets and judge Pick'em lines.",
  path: "/model",
  keywords: ["NRL model", "NRL predictions", "NRL odds value", "NRL Pick'em", "NRL betting model"],
});

const CARDS = [
  { href: "/model/lineups", title: "Lineups", blurb: "Confirmed team lists for every game this round, with each side's goal kicker flagged." },
  { href: "/model/predictions", title: "Predictions", blurb: "Per-player projected tries, points and kicker points for every game this round." },
  { href: "/model/markets", title: "Match markets", blurb: "Model-fair head-to-head, line and total for every NRL & NRLW match, with best-book EV when live odds land." },
  { href: "/model/compare", title: "Compare odds", blurb: "Model fair price next to live Sportsbet, Ladbrokes, TAB, PointsBet & Dabble prices — best highlighted." },
  { href: "/model/ev", title: "Value bets", blurb: "Every +EV market ranked by edge, with the book offering it and a suggested Kelly stake." },
  { href: "/model/pickem", title: "Pick'em", blurb: "Type any Dabble line and the model returns P(over), fair odds and a lean — build a parlay slip." },
  { href: "/model/scoring", title: "Scoring", blurb: "Player-points and try-scorer leaders with the model's price versus the best book." },
  { href: "/model/accuracy", title: "Accuracy", blurb: "Out-of-sample backtest: try-scorer AUC, calibration curve and per-stat error vs a form baseline." },
];

const STEPS = [
  { title: "Form features", body: "From Champion Data match stats + the confirmed team lists, we build each player’s recent-form features — <b>shifted one game</b> so a prediction never sees the game it’s predicting." },
  { title: "The models", body: "Gradient-boosted trees predict a try-scorer’s expected tries (Poisson rate), a team’s goal-kicker output (anchored to the named kicker), and stat means for tackles, metres and performance points." },
  { title: "Distributions", body: "A projection isn’t a bet — we turn it into a distribution: Poisson for tries, a <b>convolution</b> of 4×tries + 2×goals for points, and Normal(mean, σ) for the rest, with σ calibrated from out-of-sample error." },
  { title: "Fair price", body: "Summing the distribution above/below a line gives the win probability for that market; <b>fair odds = 1 ÷ probability</b>, with no bookmaker margin." },
  { title: "Find value", body: "Live odds from 5 books are de-vigged to their true probability. <b>EV = model prob × best price − 1</b>; a Kelly stake sizes the bet to the edge." },
  { title: "Backtested", body: "Every figure is out-of-sample — trained on earlier seasons, scored on 2023–25: try-model <b>AUC ≈ 0.73</b>, calibrated, and 25–45% lower error than a recent-form baseline." },
];

export default async function ModelOverview() {
  // per-comp stats; odds-fed numbers (compare/pick'em) exist for the men's NRL only
  const [cmp, pk] = await Promise.all([loadCompare(), loadPickem()]);
  const byComp = {} as Record<ModelComp, OverviewStat[]>;
  for (const c of MODEL_COMPS) {
    const [preds, tm] = await Promise.all([loadPredictions(c.id), loadTeamMarkets(c.id)]);
    byComp[c.id] = [
      { k: "Matches", v: preds.matches.length },
      { k: "Match markets", v: tm.matches.length },
      ...(c.id === "nrl"
        ? [{ k: "Priced markets", v: cmp.rows.length }, { k: "Pick'em rows", v: pk.rows.length }]
        : []),
    ];
  }
  return (
    <div style={{ display: "grid", gap: "1.25rem" }}>
      <OverviewStats byComp={byComp} />
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))" }}>
        {CARDS.map((c) => (
          <Link key={c.href} href={c.href} className="card" style={{ padding: "1rem", display: "grid", gap: 6 }}>
            <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--text)" }}>{c.title} →</div>
            <div style={{ color: "var(--muted)", fontSize: ".88rem", lineHeight: 1.45 }}>{c.blurb}</div>
          </Link>
        ))}
      </div>
      <section style={{ display: "grid", gap: 12 }}>
        <h2 style={{ margin: "8px 0 0", fontFamily: "var(--font-cond)", textTransform: "uppercase", fontSize: "1.5rem" }}>
          How it works
        </h2>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))" }}>
          {STEPS.map((s, i) => (
            <div key={i} className="card" style={{ padding: "1rem", display: "grid", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ display: "grid", placeItems: "center", width: 24, height: 24, borderRadius: 999, background: "var(--accent)", color: "#1a0a06", fontWeight: 800, fontSize: ".8rem", flexShrink: 0 }}>{i + 1}</span>
                <b style={{ fontFamily: "var(--font-cond)", textTransform: "uppercase", letterSpacing: ".02em" }}>{s.title}</b>
              </div>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: ".86rem", lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: s.body }} />
            </div>
          ))}
        </div>
        <p style={{ color: "var(--muted)", fontSize: ".82rem", margin: 0 }}>
          The short version: trees predict each player’s <b>rate or mean</b> → that becomes a <b>probability
          distribution</b> → distributions price every market line → compared against de-vigged book odds to
          surface <b style={{ color: "var(--accent-2)" }}>+EV</b>. See the{" "}
          <a href="/model/accuracy" style={{ color: "var(--accent)" }}>backtest</a> for how it actually performs.
        </p>
      </section>

      <p style={{ color: "var(--muted)", fontSize: ".8rem", margin: 0 }}>
        The model runs in a separate pipeline and refreshes through the day. Figures are for
        information and entertainment only — not betting advice. Gamble responsibly.
      </p>
    </div>
  );
}
