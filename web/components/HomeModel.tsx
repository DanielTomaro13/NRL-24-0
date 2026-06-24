import Link from "next/link";
import { BOOKS } from "@/lib/model";
import { loadCompare, loadModelMeta, loadPickem } from "@/lib/model.server";

/** Featured homepage panel for the statistical model — a point of focus, with a few
 * live numbers (round, market count, top value picks) pulled from the model bundle. */
export default async function HomeModel() {
  const [meta, cmp, pk] = await Promise.all([loadModelMeta(), loadCompare(), loadPickem()]);

  // top value markets: real edges only (filter out longshot/mismatch noise)
  const picks = cmp.rows
    .filter((r) => r.ev != null && r.ev > 0 && r.ev <= 25 && r.best != null)
    .sort((a, b) => (b.ev ?? 0) - (a.ev ?? 0))
    .slice(0, 3);

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

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {stats.map((s) => (
            <span key={s} className="chip" style={{ color: "var(--gold)" }}>{s}</span>
          ))}
        </div>

        {picks.length ? (
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ fontSize: ".72rem", textTransform: "uppercase", letterSpacing: ".08em", color: "var(--muted)" }}>
              Top value right now
            </div>
            <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))" }}>
              {picks.map((p, i) => (
                <Link
                  key={i}
                  href="/model/compare"
                  className="card"
                  style={{ padding: ".7rem .9rem", display: "grid", gap: 2 }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                    <b style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.player}</b>
                    <span style={{ color: "var(--accent-2)", fontWeight: 800, fontSize: ".95rem" }}>+{p.ev!.toFixed(0)}%</span>
                  </div>
                  <div style={{ color: "var(--muted)", fontSize: ".78rem" }}>
                    {p.market}{p.line != null ? ` ${p.line}` : ""} · {p.best} @ {p.best_book ? BOOKS[p.best_book] ?? p.best_book : "–"}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/model" className="btn btn-primary">Explore the model</Link>
          <Link href="/model/pickem" className="btn">Pick&apos;em calculator</Link>
          <Link href="/model/compare" className="btn">Compare odds</Link>
        </div>
        <span style={{ color: "var(--muted)", fontSize: ".72rem" }}>Educational only — not betting advice. 18+. Gamble responsibly.</span>
      </div>
    </section>
  );
}
