"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadGamesData, type GamePlayer } from "@/lib/games-data";
import { recordScore, getScore } from "@/lib/progress";
import { submitScore } from "@/lib/leaderboard";
import { slugify } from "@/lib/format";

const GAME = "beat-the-clock";
const TARGET_COUNT = 30;
const DURATION = 60;

type Phase = "idle" | "playing" | "over";

interface Target {
  player: GamePlayer;
  slug: string;
}

function fmtTime(secs: number): string {
  const s = Math.max(0, secs);
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

export default function BeatTheClock() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>("idle");
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [found, setFound] = useState<Set<number>>(new Set());
  const [value, setValue] = useState("");
  const [best, setBest] = useState(0);
  const [flash, setFlash] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load the dataset and compute the top-30 try-scorers once.
  useEffect(() => {
    let alive = true;
    loadGamesData()
      .then((data) => {
        if (!alive) return;
        const top = [...data.players]
          .sort((a, b) => b.tries - a.tries)
          .slice(0, TARGET_COUNT)
          .map<Target>((player) => ({ player, slug: slugify(player.name) }));
        setTargets(top);
        setBest(getScore(GAME).best);
        setLoading(false);
      })
      .catch(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Single interval, cleaned up on unmount.
  useEffect(() => clearTimer, [clearTimer]);

  const finish = useCallback(
    (finalFound: Set<number>) => {
      clearTimer();
      setPhase("over");
      const n = finalFound.size;
      recordScore(GAME, n);
      setBest((b) => Math.max(b, n));
      void submitScore(GAME, n);
    },
    [clearTimer]
  );

  const start = useCallback(() => {
    setFound(new Set());
    setValue("");
    setTimeLeft(DURATION);
    setPhase("playing");
    clearTimer();
    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearTimer();
          // Read the latest found set via the functional updater pattern.
          setFound((cur) => {
            finish(cur);
            return cur;
          });
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    // Focus after state flush.
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [clearTimer, finish]);

  const triggerFlash = useCallback(() => {
    setFlash(true);
    if (flashTimer.current !== null) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(false), 600);
  }, []);

  useEffect(() => {
    return () => {
      if (flashTimer.current !== null) clearTimeout(flashTimer.current);
    };
  }, []);

  const submitGuess = useCallback(() => {
    if (phase !== "playing") return;
    const guess = slugify(value);
    if (!guess) {
      setValue("");
      return;
    }
    const idx = targets.findIndex((t, i) => {
      if (found.has(i)) return false;
      if (t.slug === guess) return true;
      return guess.length >= 3 && t.slug.includes(guess);
    });
    if (idx >= 0) {
      const next = new Set(found);
      next.add(idx);
      setFound(next);
      triggerFlash();
      if (next.size >= TARGET_COUNT) finish(next);
    }
    setValue("");
  }, [phase, value, targets, found, triggerFlash, finish]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        submitGuess();
      }
    },
    [submitGuess]
  );

  const urgent = phase === "playing" && timeLeft <= 10;
  const timerColor = urgent ? "var(--danger)" : "var(--text)";

  const slots = useMemo(() => targets, [targets]);

  return (
    <div className="card" style={styles.card}>
      <style>{`@keyframes btc-pulse{0%,100%{opacity:1}50%{opacity:.55}}`}</style>
      <header style={styles.header}>
        <div>
          <h2 style={styles.title}>Beat the Clock</h2>
          <p style={styles.sub}>Name the all-time NRL try-scorers</p>
        </div>
        {phase === "playing" || phase === "over" ? (
          <div style={styles.scoreboard}>
            <div
              style={{
                ...styles.timer,
                color: timerColor,
                ...(urgent ? styles.timerPulse : null),
              }}
              aria-live="off"
            >
              {fmtTime(timeLeft)}
            </div>
            <div style={styles.count}>
              <span style={{ color: "var(--accent-2)" }}>{found.size}</span>
              <span style={{ color: "var(--muted)" }}> / {TARGET_COUNT}</span>
            </div>
          </div>
        ) : null}
      </header>

      {phase === "idle" ? (
        <div style={styles.startWrap}>
          <ul style={styles.rules}>
            <li>You have 60 seconds.</li>
            <li>
              Type the names of the <strong>top {TARGET_COUNT} career
              try-scorers</strong> in the dataset.
            </li>
            <li>Hit Enter after each name. Surnames usually work.</li>
            <li>Name as many as you can before the clock runs out.</li>
          </ul>
          <div style={styles.bestRow}>
            <span className="chip" style={styles.chip}>
              Best: <strong style={{ color: "var(--gold)" }}>{best}</strong> / {TARGET_COUNT}
            </span>
          </div>
          <button
            className="btn btn-primary"
            style={styles.startBtn}
            onClick={start}
            disabled={loading || targets.length === 0}
          >
            {loading ? "Loading…" : "Start"}
          </button>
        </div>
      ) : null}

      {phase === "playing" ? (
        <div style={styles.inputWrap}>
          <input
            ref={inputRef}
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type a try-scorer…"
            aria-label="Name a try-scorer"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            style={styles.input}
          />
          <span
            style={{
              ...styles.plusOne,
              opacity: flash ? 1 : 0,
              transform: flash ? "translateY(-6px)" : "translateY(0)",
            }}
            aria-hidden="true"
          >
            +1
          </span>
        </div>
      ) : null}

      <div style={styles.grid}>
        {slots.map((t, i) => {
          const isFound = found.has(i);
          const revealed = phase === "over" || isFound;
          const tone: "found" | "missed" | "locked" = isFound
            ? "found"
            : phase === "over"
              ? "missed"
              : "locked";
          return (
            <div key={t.player.id} style={{ ...styles.slot, ...slotTone[tone] }}>
              {revealed ? (
                <>
                  <span style={styles.slotName}>{t.player.name}</span>
                  <span style={styles.slotMeta}>{t.player.tries} tries</span>
                </>
              ) : (
                <span style={styles.slotLock}>{i + 1}</span>
              )}
            </div>
          );
        })}
      </div>

      {phase === "over" ? (
        <div style={styles.overWrap}>
          <p style={styles.overMsg}>
            Time! You named{" "}
            <strong style={{ color: "var(--accent-2)" }}>{found.size}</strong> /{" "}
            {TARGET_COUNT}
          </p>
          <p style={styles.overBest}>
            Best: <strong style={{ color: "var(--gold)" }}>{best}</strong> / {TARGET_COUNT}
          </p>
          <button className="btn btn-primary" style={styles.startBtn} onClick={start}>
            Play again
          </button>
        </div>
      ) : null}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    display: "flex",
    flexDirection: "column",
    gap: 18,
    padding: 20,
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
  },
  title: { margin: 0, fontSize: 22, color: "var(--text)" },
  sub: { margin: "4px 0 0", fontSize: 13, color: "var(--muted)" },
  scoreboard: {
    display: "flex",
    alignItems: "center",
    gap: 18,
    marginLeft: "auto",
  },
  timer: {
    fontSize: 40,
    fontWeight: 800,
    fontVariantNumeric: "tabular-nums",
    lineHeight: 1,
    letterSpacing: "0.02em",
    transition: "color 0.2s ease",
  },
  timerPulse: { animation: "btc-pulse 1s ease-in-out infinite" },
  count: { fontSize: 24, fontWeight: 700, fontVariantNumeric: "tabular-nums" },
  startWrap: { display: "flex", flexDirection: "column", gap: 16 },
  rules: {
    margin: 0,
    paddingLeft: 20,
    color: "var(--text)",
    fontSize: 15,
    lineHeight: 1.7,
  },
  bestRow: { display: "flex" },
  chip: { fontSize: 14 },
  startBtn: { alignSelf: "flex-start", fontSize: 16, padding: "10px 26px" },
  inputWrap: { position: "relative", display: "flex", alignItems: "center" },
  input: {
    width: "100%",
    fontSize: 16,
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid var(--border)",
    background: "var(--panel-2)",
    color: "var(--text)",
    outline: "none",
  },
  plusOne: {
    position: "absolute",
    right: 14,
    color: "var(--accent-2)",
    fontSize: 20,
    fontWeight: 800,
    pointerEvents: "none",
    transition: "opacity 0.2s ease, transform 0.2s ease",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
    gap: 8,
  },
  slot: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: 2,
    minHeight: 50,
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid var(--border)",
    overflow: "hidden",
  },
  slotName: {
    fontSize: 13,
    fontWeight: 700,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  slotMeta: { fontSize: 11, opacity: 0.85 },
  slotLock: { fontSize: 14, fontWeight: 700, color: "var(--muted)", opacity: 0.5 },
  overWrap: { display: "flex", flexDirection: "column", gap: 8 },
  overMsg: { margin: 0, fontSize: 20, fontWeight: 700, color: "var(--text)" },
  overBest: { margin: 0, fontSize: 14, color: "var(--muted)" },
};

const slotTone: Record<"found" | "missed" | "locked", React.CSSProperties> = {
  found: {
    background: "color-mix(in srgb, var(--accent-2) 18%, var(--panel))",
    borderColor: "var(--accent-2)",
    color: "var(--accent-2)",
  },
  missed: {
    background: "color-mix(in srgb, var(--danger) 14%, var(--panel))",
    borderColor: "var(--danger)",
    color: "var(--danger)",
  },
  locked: { background: "var(--panel)", color: "var(--muted)" },
};
