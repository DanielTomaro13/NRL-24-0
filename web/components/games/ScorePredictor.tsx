"use client";

/**
 * Score Predictor — predict the scoreline of 10 real NRL matches.
 *
 * Exact scoreline = 5 pts, correct outcome (winner / draw) = 2 pts, else 0.
 * Best of 50. Scores are tracked locally and submitted to the leaderboard.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { recordScore, getScore } from "@/lib/progress";
import { submitScore } from "@/lib/leaderboard";
import { clubColors } from "@/lib/clubs";

const GAME = "score-predictor";
const ROUNDS = 10;
const MAX_SCORE = ROUNDS * 5;
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

interface Match {
  round: number;
  home: string;
  away: string;
  hs: number;
  as: number;
}

interface ResultsData {
  seasons: string[];
  bySeason: Record<string, Match[]>;
  laddersBySeason: Record<string, unknown>;
}

interface Fixture extends Match {
  /** Predicted home score. */
  ph: number;
  /** Predicted away score. */
  pa: number;
  locked: boolean;
  /** Points earned once locked (null while unlocked). */
  points: number | null;
}

/** Fisher–Yates shuffle returning the first `n` items, seeded by a number. */
function pickRandom<T>(arr: readonly T[], n: number, seed: number): T[] {
  const a = [...arr];
  let s = seed >>> 0 || 1;
  const rand = () => {
    // xorshift32 — deterministic per seed, good enough for shuffling.
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 1_000_000) / 1_000_000;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, Math.min(n, a.length));
}

function outcome(h: number, a: number): "home" | "away" | "draw" {
  if (h > a) return "home";
  if (a > h) return "away";
  return "draw";
}

/** Score a single prediction against the real result. */
function scoreFixture(f: Fixture): number {
  if (f.ph === f.hs && f.pa === f.as) return 5;
  if (outcome(f.ph, f.pa) === outcome(f.hs, f.as)) return 2;
  return 0;
}

function Dot({ club }: { club: string }) {
  const [primary, secondary] = clubColors(club);
  return (
    <span
      aria-hidden
      style={{
        display: "inline-block",
        width: 14,
        height: 14,
        borderRadius: "50%",
        background: primary,
        border: `2px solid ${secondary}`,
        flex: "0 0 auto",
      }}
    />
  );
}

function Stepper({
  value,
  onChange,
  disabled,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled: boolean;
  label: string;
}) {
  const btn: React.CSSProperties = {
    minWidth: 40,
    minHeight: 40,
    fontSize: 20,
    fontWeight: 700,
    lineHeight: 1,
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "var(--panel-2)",
    color: "var(--text)",
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.5 : 1,
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        style={btn}
        disabled={disabled || value <= 0}
        onClick={() => onChange(Math.max(0, value - 1))}
      >
        −
      </button>
      <span
        aria-label={`${label} prediction`}
        style={{
          minWidth: 40,
          textAlign: "center",
          fontSize: 24,
          fontWeight: 800,
          fontVariantNumeric: "tabular-nums",
          color: "var(--text)",
        }}
      >
        {value}
      </span>
      <button
        type="button"
        aria-label={`Increase ${label}`}
        style={btn}
        disabled={disabled}
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  );
}

export default function ScorePredictor() {
  const [season, setSeason] = useState<string>("");
  const [pool, setPool] = useState<Match[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [seed, setSeed] = useState<number>(() => Date.now());
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [best, setBest] = useState<number>(0);
  const [submitted, setSubmitted] = useState(false);

  // Fetch real results once.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${BASE}/data/results.json`, { cache: "force-cache" });
        const data: ResultsData = await res.json();
        if (!alive) return;
        const s = data.seasons[0];
        const matches = (data.bySeason[s] ?? []).filter(
          (m) => Number.isFinite(m.hs) && Number.isFinite(m.as)
        );
        setSeason(s);
        setPool(matches);
        setStatus("ready");
      } catch {
        if (alive) setStatus("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    setBest(getScore(GAME).best);
  }, []);

  // (Re)build the 10 fixtures whenever the pool or seed changes.
  useEffect(() => {
    if (!pool.length) return;
    const chosen = pickRandom(pool, ROUNDS, seed);
    setFixtures(
      chosen.map((m) => ({ ...m, ph: 0, pa: 0, locked: false, points: null }))
    );
    setSubmitted(false);
  }, [pool, seed]);

  const lockedCount = fixtures.filter((f) => f.locked).length;
  const allLocked = fixtures.length > 0 && lockedCount === fixtures.length;
  const total = useMemo(
    () => fixtures.reduce((sum, f) => sum + (f.points ?? 0), 0),
    [fixtures]
  );

  const setPred = useCallback(
    (idx: number, key: "ph" | "pa", v: number) => {
      setFixtures((prev) =>
        prev.map((f, i) => (i === idx && !f.locked ? { ...f, [key]: v } : f))
      );
    },
    []
  );

  const lockOne = useCallback((idx: number) => {
    setFixtures((prev) =>
      prev.map((f, i) =>
        i === idx && !f.locked ? { ...f, locked: true, points: scoreFixture(f) } : f
      )
    );
  }, []);

  const revealAll = useCallback(() => {
    setFixtures((prev) =>
      prev.map((f) =>
        f.locked ? f : { ...f, locked: true, points: scoreFixture(f) }
      )
    );
  }, []);

  // When every match is locked, record + submit the total once.
  useEffect(() => {
    if (!allLocked || submitted) return;
    setSubmitted(true);
    recordScore(GAME, total);
    void submitScore(GAME, total);
    setBest(getScore(GAME).best);
  }, [allLocked, submitted, total]);

  const playAgain = useCallback(() => setSeed(Date.now()), []);

  if (status === "loading") {
    return (
      <div className="card" style={{ padding: 24, color: "var(--muted)" }}>
        Loading fixtures…
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="card" style={{ padding: 24, color: "var(--danger)" }}>
        Couldn’t load match results. Please try again later.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header / running total */}
      <header
        className="card"
        style={{
          padding: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          position: "sticky",
          top: 8,
          zIndex: 5,
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 20, color: "var(--text)" }}>
            Score Predictor
          </h2>
          <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 13 }}>
            {season} season · exact = 5 · outcome = 2
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span className="chip">{lockedCount}/{fixtures.length} locked</span>
          <span className="chip">Best {best}</span>
          <span
            className="chip"
            style={{
              background: "var(--accent)",
              color: "#10100f",
              fontWeight: 800,
              borderColor: "transparent",
            }}
          >
            {total} pts
          </span>
        </div>
      </header>

      {/* Reveal all */}
      {!allLocked && (
        <button
          type="button"
          className="btn"
          onClick={revealAll}
          disabled={lockedCount === fixtures.length}
          style={{ alignSelf: "flex-start" }}
        >
          Reveal all remaining
        </button>
      )}

      {/* Fixtures */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {fixtures.map((f, i) => {
          const pts = f.points;
          const ptsColor =
            pts === 5 ? "var(--gold)" : pts === 2 ? "var(--accent-2)" : "var(--danger)";
          return (
            <div
              key={`${f.round}-${f.home}-${f.away}-${i}`}
              className="card"
              style={{
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 14,
                borderColor: f.locked ? ptsColor : "var(--border)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 12, color: "var(--muted)" }}>
                  Round {f.round}
                </span>
                {f.locked && (
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: ptsColor,
                      whiteSpace: "nowrap",
                    }}
                  >
                    +{pts} pts
                  </span>
                )}
              </div>

              {/* Teams + steppers */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <Dot club={f.home} />
                  <span
                    style={{
                      color: "var(--text)",
                      fontWeight: 600,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {f.home}
                  </span>
                </div>
                <Stepper
                  value={f.ph}
                  disabled={f.locked}
                  label={`${f.home} home score`}
                  onChange={(v) => setPred(i, "ph", v)}
                />

                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <Dot club={f.away} />
                  <span
                    style={{
                      color: "var(--text)",
                      fontWeight: 600,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {f.away}
                  </span>
                </div>
                <Stepper
                  value={f.pa}
                  disabled={f.locked}
                  label={`${f.away} away score`}
                  onChange={(v) => setPred(i, "pa", v)}
                />
              </div>

              {/* Action / result */}
              {f.locked ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    flexWrap: "wrap",
                    paddingTop: 4,
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  <span style={{ color: "var(--muted)", fontSize: 13 }}>
                    You: {f.ph}–{f.pa}
                  </span>
                  <span style={{ color: "var(--text)", fontSize: 15, fontWeight: 700 }}>
                    Real: {f.hs}–{f.as}
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => lockOne(i)}
                  style={{ minHeight: 40 }}
                >
                  Lock in
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      {allLocked && (
        <div
          className="card"
          style={{
            padding: 24,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            background: "var(--panel-2)",
            borderColor: "var(--accent)",
          }}
        >
          <h3 style={{ margin: 0, color: "var(--text)", fontSize: 18 }}>
            Full time!
          </h3>
          <div
            style={{
              fontSize: 44,
              fontWeight: 900,
              color: "var(--accent)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {total}
            <span style={{ fontSize: 22, color: "var(--muted)" }}> / {MAX_SCORE}</span>
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14 }}>
            {total > best
              ? "New personal best!"
              : `Personal best: ${best}`}
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={playAgain}
            style={{ alignSelf: "center", minHeight: 44, paddingInline: 28 }}
          >
            Play again
          </button>
        </div>
      )}
    </div>
  );
}
