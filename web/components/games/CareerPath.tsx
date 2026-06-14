"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadGamesData, rng, pickN, type GamePlayer } from "@/lib/games-data";
import { recordScore, getScore } from "@/lib/progress";
import { submitScore } from "@/lib/leaderboard";
import { clubColors } from "@/lib/clubs";

interface Round {
  target: GamePlayer;
  options: GamePlayer[];
}

type Phase = "loading" | "playing" | "over";

function buildRound(pool: GamePlayer[], rand: () => number): Round | null {
  if (pool.length < 4) return null;
  const [target] = pickN(pool, 1, rand);
  if (!target) return null;

  // Prefer distractors sharing the same position for difficulty.
  const samePos = pool.filter((p) => p.id !== target.id && p.pos === target.pos);
  const others = pool.filter((p) => p.id !== target.id && p.pos !== target.pos);

  const distractors: GamePlayer[] = [];
  const seen = new Set<number>([target.id]);

  for (const p of pickN(samePos, samePos.length, rand)) {
    if (distractors.length >= 3) break;
    if (!seen.has(p.id)) {
      distractors.push(p);
      seen.add(p.id);
    }
  }
  if (distractors.length < 3) {
    for (const p of pickN(others, others.length, rand)) {
      if (distractors.length >= 3) break;
      if (!seen.has(p.id)) {
        distractors.push(p);
        seen.add(p.id);
      }
    }
  }
  if (distractors.length < 3) return null;

  const options = pickN([target, ...distractors], 4, rand);
  return { target, options };
}

export default function CareerPath() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [pool, setPool] = useState<GamePlayer[]>([]);
  const [round, setRound] = useState<Round | null>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [chosenId, setChosenId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const randRef = useRef<() => number>(rng(Date.now()));
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const nextRound = useCallback((src: GamePlayer[]) => {
    setChosenId(null);
    const r = buildRound(src, randRef.current);
    setRound(r);
  }, []);

  useEffect(() => {
    let alive = true;
    randRef.current = rng(Date.now());
    setBest(getScore("career-path").best);
    loadGamesData()
      .then((data) => {
        if (!alive) return;
        const famous = data.players.filter((p) => p.fame > 30);
        if (famous.length < 4) {
          setError("Not enough players to play.");
          setPhase("over");
          return;
        }
        setPool(famous);
        nextRound(famous);
        setPhase("playing");
      })
      .catch(() => {
        if (!alive) return;
        setError("Could not load player data.");
        setPhase("over");
      });
    return () => {
      alive = false;
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, [nextRound]);

  const endRun = useCallback((finalScore: number) => {
    recordScore("career-path", finalScore);
    void submitScore("career-path", finalScore);
    setBest(getScore("career-path").best);
    setPhase("over");
  }, []);

  const onPick = useCallback(
    (player: GamePlayer) => {
      if (!round || chosenId !== null) return;
      setChosenId(player.id);

      if (player.id === round.target.id) {
        const newScore = score + 1;
        setScore(newScore);
        advanceTimer.current = setTimeout(() => {
          nextRound(pool);
        }, 700);
      } else {
        // End run on first wrong answer; score is the streak so far.
        endRun(score);
      }
    },
    [round, chosenId, score, pool, nextRound, endRun]
  );

  const playAgain = useCallback(() => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    randRef.current = rng(Date.now());
    setScore(0);
    setChosenId(null);
    setError(null);
    if (pool.length >= 4) {
      nextRound(pool);
      setPhase("playing");
    }
  }, [pool, nextRound]);

  const target = round?.target;
  const dotColor = target ? clubColors(target.club)[0] : "var(--muted)";
  const correctId = round?.target.id ?? null;

  return (
    <div style={styles.wrap}>
      <style>{css}</style>

      <header style={styles.header}>
        <div style={styles.scoreBox}>
          <span style={styles.scoreLabel}>Streak</span>
          <span style={styles.scoreValue}>{score}</span>
        </div>
        <div style={styles.title}>Career Path</div>
        <div style={styles.scoreBox}>
          <span style={styles.scoreLabel}>Best</span>
          <span style={{ ...styles.scoreValue, color: "var(--gold)" }}>{best}</span>
        </div>
      </header>

      {phase === "loading" && (
        <div className="card" style={styles.centerCard}>
          <span style={{ color: "var(--muted)" }}>Loading players…</span>
        </div>
      )}

      {phase === "playing" && target && round && (
        <>
          <div className="card" style={styles.profile}>
            <div style={styles.profileTop}>
              <span style={{ ...styles.dot, background: dotColor }} aria-hidden />
              <span style={styles.club}>{target.club}</span>
              <span className="chip">{target.posName}</span>
            </div>
            <div style={styles.era}>
              {target.firstYear}&ndash;{target.lastYear}
            </div>
            <div style={styles.statLine}>
              {target.apps} games &middot; {target.tries} tries &middot; peak rating{" "}
              <strong style={{ color: "var(--accent)" }}>{target.rating}</strong>
            </div>
            <div style={styles.prompt}>Who is this player?</div>
          </div>

          <div className="answer-grid">
            {round.options.map((opt) => {
              const isChosen = chosenId === opt.id;
              const isCorrect = opt.id === correctId;
              const reveal = chosenId !== null;
              let cls = "btn answer";
              if (reveal && isCorrect) cls += " correct";
              else if (reveal && isChosen && !isCorrect) cls += " wrong";
              return (
                <button
                  key={opt.id}
                  className={cls}
                  onClick={() => onPick(opt)}
                  disabled={reveal}
                >
                  {opt.name}
                </button>
              );
            })}
          </div>
        </>
      )}

      {phase === "over" && (
        <div className="card" style={styles.centerCard}>
          {error ? (
            <div style={styles.overMsg}>{error}</div>
          ) : (
            <>
              <div style={styles.overTitle}>Run over</div>
              <div style={styles.overMsg}>
                {score} correct <span style={{ color: "var(--muted)" }}>(best {best})</span>
              </div>
            </>
          )}
          <button
            className="btn play-again"
            onClick={playAgain}
            disabled={pool.length < 4}
          >
            Play again
          </button>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    maxWidth: 560,
    margin: "0 auto",
    width: "100%",
    color: "var(--text)",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    fontWeight: 700,
    fontSize: 18,
    letterSpacing: 0.2,
    color: "var(--text)",
  },
  scoreBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minWidth: 54,
  },
  scoreLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: "var(--muted)",
  },
  scoreValue: { fontSize: 22, fontWeight: 800, lineHeight: 1.1 },
  profile: { display: "flex", flexDirection: "column", gap: 10 },
  profileTop: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
  dot: {
    width: 14,
    height: 14,
    borderRadius: "50%",
    display: "inline-block",
    boxShadow: "0 0 0 2px var(--border)",
    flexShrink: 0,
  },
  club: { fontWeight: 700, fontSize: 16 },
  era: { fontSize: 14, color: "var(--muted)", letterSpacing: 0.4 },
  statLine: { fontSize: 15, color: "var(--text)" },
  prompt: {
    marginTop: 4,
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: "var(--muted)",
  },
  centerCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 14,
    textAlign: "center",
    padding: "28px 20px",
  },
  overTitle: { fontSize: 22, fontWeight: 800 },
  overMsg: { fontSize: 17 },
};

const css = `
.card {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 16px;
}
.chip {
  background: var(--panel-2);
  border: 1px solid var(--border);
  color: var(--text);
  font-size: 12px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 999px;
  letter-spacing: 0.3px;
}
.btn {
  font: inherit;
  cursor: pointer;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--panel-2);
  color: var(--text);
  font-weight: 600;
  transition: background 0.12s ease, border-color 0.12s ease, transform 0.06s ease;
}
.btn:active { transform: translateY(1px); }
.btn:disabled { cursor: default; }
.answer {
  min-height: 44px;
  padding: 12px 14px;
  font-size: 15px;
  line-height: 1.25;
  text-align: center;
}
.answer:not(:disabled):hover {
  border-color: var(--accent);
  background: var(--panel);
}
.answer.correct {
  background: color-mix(in srgb, var(--accent-2) 22%, var(--panel-2));
  border-color: var(--accent-2);
  color: var(--text);
}
.answer.wrong {
  background: color-mix(in srgb, var(--danger) 22%, var(--panel-2));
  border-color: var(--danger);
  color: var(--text);
}
.play-again {
  min-height: 44px;
  padding: 12px 22px;
  font-size: 15px;
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}
.play-again:not(:disabled):hover { filter: brightness(1.08); }
.answer-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
@media (max-width: 480px) {
  .answer-grid { grid-template-columns: 1fr; }
}
`;
