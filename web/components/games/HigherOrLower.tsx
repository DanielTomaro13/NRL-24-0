"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  loadGamesData,
  rng,
  pickN,
  type GamePlayer,
} from "@/lib/games-data";
import { recordScore, getScore } from "@/lib/progress";
import { submitScore } from "@/lib/leaderboard";
import { clubColors } from "@/lib/clubs";

const GAME = "higher-or-lower";

type StatKey = "tries" | "runMetres" | "tackles" | "apps";
interface Stat {
  key: StatKey;
  label: string;
}
const STATS: Stat[] = [
  { key: "tries", label: "career tries" },
  { key: "runMetres", label: "run metres / game" },
  { key: "tackles", label: "tackles / game" },
  { key: "apps", label: "games played" },
];

/** A stat may be a fractional per-game number — show one decimal when needed. */
function fmtStat(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

type Phase = "loading" | "playing" | "revealing" | "over";
type Choice = "higher" | "lower";

interface Round {
  left: GamePlayer;
  right: GamePlayer;
  stat: Stat;
}

export default function HigherOrLower() {
  const poolRef = useRef<GamePlayer[]>([]);
  const randRef = useRef<() => number>(() => Math.random());

  const [phase, setPhase] = useState<Phase>("loading");
  const [round, setRound] = useState<Round | null>(null);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [reveal, setReveal] = useState<{ correct: boolean; value: number } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  /** Pick a stat + two distinct players whose values for that stat differ. */
  const makeMatchup = useCallback(
    (leftFixed?: GamePlayer): Round | null => {
      const pool = poolRef.current;
      const rand = randRef.current;
      if (pool.length < 2) return null;

      for (let attempt = 0; attempt < 40; attempt++) {
        const stat = STATS[Math.floor(rand() * STATS.length)];
        if (leftFixed) {
          // Find a challenger that differs on this stat from the fixed left card.
          const candidates = pickN(
            pool.filter(
              (p) => p.id !== leftFixed.id && p[stat.key] !== leftFixed[stat.key]
            ),
            1,
            rand
          );
          if (candidates.length === 1) {
            return { left: leftFixed, right: candidates[0], stat };
          }
        } else {
          const two = pickN(pool, 2, rand);
          if (two.length === 2 && two[0][stat.key] !== two[1][stat.key]) {
            return { left: two[0], right: two[1], stat };
          }
        }
      }
      return null;
    },
    []
  );

  const startRun = useCallback(() => {
    randRef.current = rng((Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0);
    setStreak(0);
    setReveal(null);
    const first = makeMatchup();
    if (!first) {
      setError("Not enough player data to play.");
      setPhase("over");
      return;
    }
    setRound(first);
    setPhase("playing");
  }, [makeMatchup]);

  // Load data once on mount.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await loadGamesData();
        if (!alive) return;
        const famous = data.players.filter((p) => p.fame > 30);
        poolRef.current = famous.length >= 2 ? famous : data.players;
        setBest(getScore(GAME).best);
        startRun();
      } catch {
        if (alive) {
          setError("Couldn't load the player data. Try again later.");
          setPhase("over");
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [startRun]);

  const endRun = useCallback(
    (finalStreak: number) => {
      const isBest = recordScore(GAME, finalStreak, true);
      if (isBest) setBest(finalStreak);
      else setBest(getScore(GAME).best);
      // Fire-and-forget; never block the UI on the network.
      void submitScore(GAME, finalStreak, true).catch(() => {});
    },
    []
  );

  const answer = useCallback(
    (choice: Choice) => {
      if (phase !== "playing" || !round) return;
      const { left, right, stat } = round;
      const rightVal = right[stat.key];
      const leftVal = left[stat.key];
      const correct =
        choice === "higher" ? rightVal > leftVal : rightVal < leftVal;

      setReveal({ correct, value: rightVal });
      setPhase("revealing");

      window.setTimeout(() => {
        if (correct) {
          const nextStreak = streak + 1;
          setStreak(nextStreak);
          // The challenger slides over to become the new "known" left card.
          const next = makeMatchup(right);
          if (!next) {
            // Ran out of fresh matchups — bank it as a win-cap game over.
            endRun(nextStreak);
            setReveal(null);
            setPhase("over");
            return;
          }
          setReveal(null);
          setRound(next);
          setPhase("playing");
        } else {
          endRun(streak);
          setReveal(null);
          setPhase("over");
        }
      }, 1050);
    },
    [phase, round, streak, makeMatchup, endRun]
  );

  return (
    <section style={{ display: "grid", gap: "1rem" }}>
      <Scoreboard streak={streak} best={best} />

      {phase === "loading" && (
        <div className="card" style={cardPad}>
          <p style={{ color: "var(--muted)", margin: 0 }}>Loading players…</p>
        </div>
      )}

      {phase === "over" && (
        <GameOver
          streak={streak}
          best={best}
          error={error}
          onPlayAgain={() => {
            setError(null);
            startRun();
          }}
        />
      )}

      {(phase === "playing" || phase === "revealing") && round && (
        <>
          <div
            style={{
              textAlign: "center",
              fontWeight: 700,
              color: "var(--muted)",
              fontSize: ".95rem",
              textTransform: "uppercase",
              letterSpacing: ".04em",
            }}
          >
            Who has more{" "}
            <span style={{ color: "var(--gold)" }}>{round.stat.label}</span>?
          </div>

          <div style={grid}>
            {/* LEFT — known card */}
            <PlayerCard
              player={round.left}
              statKey={round.stat.key}
              statLabel={round.stat.label}
              shown
              tone="known"
            />

            {/* RIGHT — challenger */}
            <PlayerCard
              key={round.right.id}
              player={round.right}
              statKey={round.stat.key}
              statLabel={round.stat.label}
              shown={reveal !== null}
              reveal={reveal}
              tone="challenger"
            />
          </div>

          <div style={btnRow}>
            <button
              className="btn btn-primary"
              style={tapBtn}
              disabled={phase !== "playing"}
              onClick={() => answer("higher")}
            >
              ▲ More
            </button>
            <button
              className="btn btn-primary"
              style={tapBtn}
              disabled={phase !== "playing"}
              onClick={() => answer("lower")}
            >
              ▼ Fewer
            </button>
          </div>
        </>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                       */
/* ------------------------------------------------------------------ */

function Scoreboard({ streak, best }: { streak: number; best: number }) {
  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
      <span className="chip">
        Streak <strong style={{ color: "var(--accent)" }}>{streak}</strong>
      </span>
      <span className="chip">
        Best <strong style={{ color: "var(--gold)" }}>{best}</strong>
      </span>
    </div>
  );
}

function PlayerCard({
  player,
  statKey,
  statLabel,
  shown,
  reveal,
  tone,
}: {
  player: GamePlayer;
  statKey: StatKey;
  statLabel: string;
  shown: boolean;
  reveal?: { correct: boolean; value: number } | null;
  tone: "known" | "challenger";
}) {
  const [primary, secondary] = clubColors(player.club);
  const value = player[statKey];

  let valueColor = "var(--text)";
  if (tone === "challenger" && reveal) {
    valueColor = reveal.correct ? "var(--accent-2)" : "var(--danger)";
  }

  return (
    <div
      className="card"
      style={{
        padding: "1.1rem 1rem",
        display: "grid",
        gap: 10,
        alignContent: "start",
        textAlign: "center",
        borderColor:
          tone === "challenger" ? "var(--accent)" : "var(--border)",
        transition: "border-color .25s ease",
      }}
    >
      <div style={{ display: "grid", gap: 4, justifyItems: "center" }}>
        <h3
          style={{
            margin: 0,
            fontSize: "1.15rem",
            fontWeight: 900,
            lineHeight: 1.15,
          }}
        >
          {player.name}
        </h3>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            color: "var(--muted)",
            fontSize: ".85rem",
          }}
        >
          <span
            aria-hidden
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: primary,
              border: `2px solid ${secondary}`,
              flex: "0 0 auto",
            }}
          />
          {player.club}
        </div>
        <div style={{ color: "var(--muted)", fontSize: ".8rem" }}>
          {player.posName} · {player.firstYear}–{player.lastYear}
        </div>
      </div>

      <div
        style={{
          marginTop: 4,
          padding: "0.75rem 0.5rem",
          background: "var(--panel-2)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          minHeight: 88,
          display: "grid",
          alignContent: "center",
          gap: 2,
        }}
      >
        <div
          style={{
            fontSize: "2.4rem",
            fontWeight: 900,
            lineHeight: 1,
            color: valueColor,
            transition: "color .2s ease",
          }}
        >
          {shown ? fmtStat(value) : "?"}
        </div>
        <div
          style={{
            fontSize: ".72rem",
            textTransform: "uppercase",
            letterSpacing: ".05em",
            color: "var(--muted)",
          }}
        >
          {statLabel}
        </div>
      </div>
    </div>
  );
}

function GameOver({
  streak,
  best,
  error,
  onPlayAgain,
}: {
  streak: number;
  best: number;
  error: string | null;
  onPlayAgain: () => void;
}) {
  return (
    <div
      className="card"
      style={{ ...cardPad, textAlign: "center", display: "grid", gap: 14 }}
    >
      {error ? (
        <p style={{ margin: 0, color: "var(--danger)", fontWeight: 700 }}>
          {error}
        </p>
      ) : (
        <>
          <div style={{ fontSize: "1.4rem", fontWeight: 900 }}>
            Game over — streak{" "}
            <span style={{ color: "var(--accent)" }}>{streak}</span>
          </div>
          <div style={{ color: "var(--muted)" }}>
            Best <strong style={{ color: "var(--gold)" }}>{best}</strong>
          </div>
        </>
      )}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <button className="btn btn-primary" style={tapBtn} onClick={onPlayAgain}>
          Play again
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Inline style helpers                                                 */
/* ------------------------------------------------------------------ */

const cardPad: React.CSSProperties = { padding: "1.5rem" };

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
  gap: "1rem",
  alignItems: "stretch",
};

const btnRow: React.CSSProperties = {
  display: "flex",
  gap: "1rem",
  justifyContent: "center",
  flexWrap: "wrap",
};

const tapBtn: React.CSSProperties = {
  minHeight: 48,
  minWidth: 140,
  fontSize: "1.05rem",
  fontWeight: 800,
};
