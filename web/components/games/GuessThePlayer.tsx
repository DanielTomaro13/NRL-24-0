"use client";

import { useEffect, useMemo, useState } from "react";
import {
  loadGamesData,
  dailySeed,
  rng,
  dayNumber,
  type GamePlayer,
} from "@/lib/games-data";
import { recordDaily, todaysResult } from "@/lib/progress";
import { initials } from "@/lib/format";
import DailyStatsPanel from "@/components/games/DailyStats";
import Confetti from "@/components/Confetti";

const GAME = "guess-the-player";
const MAX_SCORE = 100;
const TOTAL_CLUES = 7;
const REVEAL_COST = 14;
const WRONG_COST = 8;

type Status = "playing" | "won" | "lost";

function posGroup(pos: string): string {
  if (pos === "FB" || pos === "WG" || pos === "CE") return "a back";
  if (pos === "FE" || pos === "HB") return "in the halves";
  return "a forward";
}

function buildClues(p: GamePlayer): string[] {
  return [
    `${posGroup(p.pos)}`,
    `debuted around ${p.firstYear}`,
    `${p.apps} NRL games`,
    `${p.tries} career tries`,
    p.posName,
    `played for ${p.club}`,
    initials(p.name),
  ];
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const surname = (name: string) => {
  const parts = norm(name).split(" ");
  return parts[parts.length - 1] ?? "";
};

export default function GuessThePlayer() {
  const [pool, setPool] = useState<GamePlayer[]>([]);
  const [target, setTarget] = useState<GamePlayer | null>(null);
  const [loaded, setLoaded] = useState(false);

  const [revealed, setRevealed] = useState(1);
  const [score, setScore] = useState(MAX_SCORE);
  const [status, setStatus] = useState<Status>("playing");
  const [guess, setGuess] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [freshWin, setFreshWin] = useState(false);
  const [resumed, setResumed] = useState(false);

  useEffect(() => {
    let alive = true;
    loadGamesData().then((data) => {
      if (!alive) return;
      const p = data.players.filter((x) => x.fame > 45).slice(0, 200);
      const rand = rng(dailySeed("guess"));
      const pick = p.length ? p[Math.floor(rand() * p.length)] : null;
      setPool(p);
      setTarget(pick);

      const prior = todaysResult(GAME);
      if (prior) {
        setResumed(true);
        setStatus(prior.won ? "won" : "lost");
        setRevealed(TOTAL_CLUES);
        if (prior.won) setScore(Math.max(0, MAX_SCORE - (prior.guesses - 1) * REVEAL_COST));
      }
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const clues = useMemo(() => (target ? buildClues(target) : []), [target]);

  // Pool names: unique surnames help us tolerate surname-only guesses.
  const surnameCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of pool) {
      const s = surname(p.name);
      m.set(s, (m.get(s) ?? 0) + 1);
    }
    return m;
  }, [pool]);

  function isMatch(input: string): boolean {
    if (!target) return false;
    const g = norm(input);
    if (!g) return false;
    if (g === norm(target.name)) return true;
    const ts = surname(target.name);
    // Surname-only match, but only when that surname is unique in the pool.
    if (g === ts && (surnameCounts.get(ts) ?? 0) <= 1) return true;
    return false;
  }

  function revealNext() {
    if (status !== "playing") return;
    setScore((s) => Math.max(0, s - REVEAL_COST));
    setRevealed((r) => Math.min(TOTAL_CLUES, r + 1));
  }

  function submitGuess(e: React.FormEvent) {
    e.preventDefault();
    if (status !== "playing" || !target) return;
    const value = guess.trim();
    if (!value) return;

    if (isMatch(value)) {
      setStatus("won");
      setFreshWin(true);
      setFeedback(null);
      recordDaily(GAME, true, revealed);
      return;
    }

    // Wrong guess: penalise and reveal the next clue.
    setScore((s) => Math.max(0, s - WRONG_COST));
    setGuess("");

    if (revealed >= TOTAL_CLUES) {
      setStatus("lost");
      setFeedback(null);
      recordDaily(GAME, false, 0);
      return;
    }
    setRevealed((r) => Math.min(TOTAL_CLUES, r + 1));
    setFeedback(`Not quite — here's another clue.`);
  }

  const finished = status !== "playing";

  const shareText = `NRL Guess the Player #${dayNumber()} — ${
    status === "won" ? `${score} pts` : "missed"
  }\nnrl24-0.com/games/guess-the-player`;

  if (!loaded) {
    return (
      <div className="card" style={{ padding: "1.25rem", color: "var(--muted)" }}>
        Loading today&apos;s player…
      </div>
    );
  }

  if (!target) {
    return (
      <div className="card" style={{ padding: "1.25rem", color: "var(--muted)" }}>
        No players available today.
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {status === "won" && freshWin && <Confetti />}

      {/* Scoreboard */}
      <div
        className="card"
        style={{
          padding: "1rem 1.1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              fontSize: ".7rem",
              textTransform: "uppercase",
              letterSpacing: ".06em",
              color: "var(--muted)",
            }}
          >
            Guess the Player · #{dayNumber()}
          </div>
          <div style={{ fontSize: ".82rem", color: "var(--muted)", marginTop: 2 }}>
            {finished
              ? "Done for today"
              : `Clue ${revealed} of ${TOTAL_CLUES}`}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontFamily: "var(--font-cond)",
              fontSize: "2rem",
              lineHeight: 1,
              color:
                status === "lost"
                  ? "var(--danger)"
                  : status === "won"
                  ? "var(--accent-2)"
                  : "var(--text)",
            }}
          >
            {status === "lost" ? 0 : score}
          </div>
          <div
            style={{
              fontSize: ".66rem",
              textTransform: "uppercase",
              letterSpacing: ".06em",
              color: "var(--muted)",
            }}
          >
            points
          </div>
        </div>
      </div>

      {/* Clue list */}
      <div className="card" style={{ padding: "1.1rem", display: "grid", gap: 8 }}>
        {clues.slice(0, revealed).map((clue, i) => {
          const newest = i === revealed - 1 && !finished;
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "0.6rem 0.75rem",
                borderRadius: 10,
                background: newest ? "var(--panel-2)" : "var(--panel)",
                border: `1px solid ${newest ? "var(--accent)" : "var(--border)"}`,
              }}
            >
              <span
                className="chip"
                style={{
                  minWidth: 24,
                  textAlign: "center",
                  background: newest ? "var(--accent)" : "var(--panel-2)",
                  color: newest ? "#1a0a06" : "var(--muted)",
                  fontWeight: 700,
                }}
              >
                {i + 1}
              </span>
              <span
                style={{
                  fontSize: "1rem",
                  color: newest ? "var(--text)" : "var(--muted)",
                }}
              >
                {clue}
              </span>
            </div>
          );
        })}
      </div>

      {/* Play controls */}
      {!finished && (
        <div className="card" style={{ padding: "1.1rem", display: "grid", gap: 12 }}>
          <form onSubmit={submitGuess} style={{ display: "grid", gap: 10 }}>
            <input
              list="gtp-players"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder="Name the player…"
              autoComplete="off"
              spellCheck={false}
              style={{
                width: "100%",
                fontSize: 16,
                padding: "0.7rem 0.85rem",
                borderRadius: 10,
                background: "var(--panel-2)",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}
            />
            <datalist id="gtp-players">
              {pool.map((p) => (
                <option key={p.id} value={p.name} />
              ))}
            </datalist>

            {feedback && (
              <div style={{ fontSize: ".85rem", color: "var(--gold)" }}>{feedback}</div>
            )}

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn btn-primary" type="submit" disabled={!guess.trim()}>
                Guess (−{WRONG_COST} if wrong)
              </button>
              <button
                className="btn"
                type="button"
                onClick={revealNext}
                disabled={revealed >= TOTAL_CLUES}
              >
                {revealed >= TOTAL_CLUES
                  ? "All clues shown"
                  : `Reveal next clue (−${REVEAL_COST})`}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Result card */}
      {finished && (
        <div
          className="card"
          style={{
            padding: "1.25rem",
            display: "grid",
            gap: 8,
            textAlign: "center",
            borderColor: status === "won" ? "var(--accent-2)" : "var(--danger)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-cond)",
              fontSize: "1.7rem",
              color: status === "won" ? "var(--accent-2)" : "var(--danger)",
            }}
          >
            {status === "won" ? "Got it!" : "Out of clues"}
          </div>
          {status === "won" ? (
            <div style={{ color: "var(--text)" }}>
              <strong>{target.name}</strong> — {score} pts
              {resumed && (
                <span style={{ color: "var(--muted)" }}> (already played today)</span>
              )}
            </div>
          ) : (
            <div style={{ color: "var(--text)" }}>
              Today&apos;s player was <strong>{target.name}</strong>
              <span style={{ color: "var(--muted)" }}>
                {" "}
                — {target.posName}, {target.club}
              </span>
            </div>
          )}
        </div>
      )}

      {finished && <DailyStatsPanel game={GAME} shareText={shareText} />}
    </div>
  );
}
