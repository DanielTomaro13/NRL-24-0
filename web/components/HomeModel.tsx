import Link from "next/link";
import { BOOKS } from "@/lib/model";
import {
  loadBacktest,
  loadCompare,
  loadModelMeta,
  loadPickem,
  loadPredictions,
} from "@/lib/model.server";

/** Featured homepage panel for the statistical model — a point of focus, with live
 * numbers: top value picks, most-likely try scorers, this round's games, accuracy. */
export default async function HomeModel() {
  const [meta, cmp, pk, preds, bt] = await Promise.all([
    loadModelMeta(),
    loadCompare(),
    loadPickem(),
    loadPredictions(),
    loadBacktest(),
  ]);

  // top value markets: real edges only (filter out longshot/mismatch noise)
  const picks = cmp.rows
    .filter((r) => r.ev != null && r.ev > 0 && r.ev <= 25 && r.best != null)
    .sort((a, b) => (b.ev ?? 0) - (a.ev ?? 0))
    .slice(0, 4);

  // most likely try scorers this round (across all games)
  const tryScorers = preds.matches
    .flatMap((m) => m.players)
    .filter((p) => p.p_anytime != null)
    .sort((a, b) => (b.p_anytime ?? 0) - (a.p_anytime ?? 0))
    .slice(0, 4);

  const stats = [
    meta.round ? `Round ${meta.round}` : "NRL",
    `${cmp.rows.length} priced markets`,
    `${pk.rows.length} Pick'em lines`,
  ];

  return (
    <section
      style={{
        position: "relative",
        borderRadius: 16,
        padding: "1.5rem",
        background: "linear-gradient(135deg, rgba(255,84,54,0.10), rgba(95,208,138,0.06))",
        border: "1px solid var(--border)",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden
        style={{ position: "absolute", inset: 0, borderRadius: 16, padding: 1, background: "linear-gradient(135deg, var(--accent), transparent 40%, transparent 60%, var(--accent-2))", WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)", WebkitMaskComposite: "xor", maskComposite: "exclude", pointerEvents: "none" }}
      />
      <div style={{ display: "grid", gap: "1rem", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span className="chip" style={{ background: "var(--accent)", color: "#1a0a06", borderColor: "var(--accent)", fontWeight: 800 }}>
            NEW
          </span>
          <h2 style={{ margin: 0, fontFamily: "var(--font-cond)", textTransform: "uppercase", fontSize: "1.7rem", letterSpacing: ".02em" }}>
            The NRL Model
          </h2>
          {meta.updated ? (
            <span style={{ color: "var(--muted)", fontSize: ".78rem" }}>updated {meta.updated}</span>
          ) : null}
        </div>

        <p style={{ color: "var(--muted)", margin: 0, maxWidth: "70ch", fontSize: ".98rem", lineHeight: 1.5 }}>
          A statistical engine for try-scorers, player points and kicker points — priced against live
          Sportsbet, Ladbrokes, TAB, PointsBet and Dabble odds to surface <b style={{ color: "var(--text)" }}>value the market is missing</b>.
        </p>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {stats.map((s) => (
            <span key={s} className="chip" style={{ color: "var(--gold)" }}>{s}</span>
          ))}
          {bt.tries?.auc ? (
            <Link href="/model/accuracy" style={{ color: "var(--muted)", fontSize: ".8rem", textDecoration: "none" }}>
              · backtested: <b style={{ color: "var(--accent-2)" }}>{bt.tries.auc.toFixed(2)} AUC</b>
              {bt.n_test ? ` over ${bt.n_test.toLocaleString()} player-games` : ""} →
            </Link>
          ) : null}
        </div>

        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
          {picks.length ? (
            <div style={{ display: "grid", gap: 6, alignContent: "start" }}>
              <div style={{ fontSize: ".72rem", textTransform: "uppercase", letterSpacing: ".08em", color: "var(--muted)" }}>
                Top value right now
              </div>
              {picks.map((p, i) => (
                <Link key={i} href="/model/compare" className="card" style={{ padding: ".55rem .8rem", display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <b>{p.player}</b>{" "}
                    <span style={{ color: "var(--muted)", fontSize: ".8rem" }}>{p.market}{p.line != null ? ` ${p.line}` : ""}</span>
                  </span>
                  <span style={{ whiteSpace: "nowrap" }}>
                    <span style={{ color: "var(--accent-2)", fontWeight: 800 }}>+{p.ev!.toFixed(0)}%</span>{" "}
                    <span style={{ color: "var(--muted)", fontSize: ".78rem" }}>{p.best}@{p.best_book ? BOOKS[p.best_book] ?? p.best_book : "–"}</span>
                  </span>
                </Link>
              ))}
            </div>
          ) : null}

          {tryScorers.length ? (
            <div style={{ display: "grid", gap: 6, alignContent: "start" }}>
              <div style={{ fontSize: ".72rem", textTransform: "uppercase", letterSpacing: ".08em", color: "var(--muted)" }}>
                Most likely try scorers
              </div>
              {tryScorers.map((p, i) => (
                <Link key={i} href="/model/predictions" className="card" style={{ padding: ".55rem .8rem", display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <b>{p.name}</b>{" "}
                    <span style={{ color: "var(--muted)", fontSize: ".8rem" }}>{p.team}</span>
                  </span>
                  <span style={{ color: "var(--accent-2)", fontWeight: 800, whiteSpace: "nowrap" }}>{((p.p_anytime ?? 0) * 100).toFixed(0)}%</span>
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        {preds.matches.length ? (
          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: ".72rem", textTransform: "uppercase", letterSpacing: ".08em", color: "var(--muted)" }}>
              This round
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {preds.matches.map((m) => (
                <Link key={m.matchId} href="/model/lineups" className="chip" style={{ color: "var(--muted)", textDecoration: "none" }}>
                  {m.event}
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/model" className="btn btn-primary">Explore the model</Link>
          <Link href="/model/lineups" className="btn">Team lists</Link>
          <Link href="/model/pickem" className="btn">Pick&apos;em calculator</Link>
        </div>
        <span style={{ color: "var(--muted)", fontSize: ".72rem" }}>Educational only — not betting advice. 18+. Gamble responsibly.</span>
      </div>
    </section>
  );
}
