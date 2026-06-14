"use client";
import { useEffect, useState } from "react";
import { topScores, isGlobal, type ScoreEntry } from "@/lib/leaderboard";
import { getName, setName, getDaily } from "@/lib/progress";
import { getComp, compLabel, type Comp } from "@/lib/comp";

const BOARDS = [
  { game: "perfect-classic", label: "Perfect Season — Full 13", high: true },
  { game: "perfect-quick", label: "Perfect Season — Quick Nine", high: true },
  { game: "invincibles", label: "Invincibles", high: true },
  { game: "higher-or-lower", label: "Higher or Lower", high: true },
  { game: "beat-the-clock", label: "Beat the Clock", high: true },
  { game: "career-path", label: "Career Path", high: true },
  { game: "score-predictor", label: "Score Predictor", high: true },
];
const DAILY = [
  { game: "footle", label: "Footle" },
  { game: "guess-the-player", label: "Guess the Player" },
];

export default function LeaderboardView() {
  const [boards, setBoards] = useState<Record<string, ScoreEntry[]>>({});
  const [name, setNm] = useState("");
  const [comp, setC] = useState<Comp>("nrl");
  const [streaks, setStreaks] = useState<Record<string, { cur: number; max: number }>>({});

  useEffect(() => {
    setNm(getName());
    setC(getComp());
    Promise.all(BOARDS.map((b) => topScores(b.game, true, 10).then((r) => [b.game, r] as const)))
      .then((pairs) => setBoards(Object.fromEntries(pairs)));
    const s: Record<string, { cur: number; max: number }> = {};
    for (const d of DAILY) { const x = getDaily(d.game); s[d.game] = { cur: x.cur, max: x.max }; }
    setStreaks(s);
  }, []);

  function save() { setName(name.trim()); }

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <div className="card" style={{ padding: ".7rem 1rem", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <span className="chip" style={{ color: "var(--gold)", fontWeight: 700 }}>{compLabel(comp)}</span>
        <span style={{ fontSize: ".85rem", color: "var(--muted)" }}>
          Showing the {compLabel(comp)} leaderboards — NRL and NRLW have separate boards. Switch competition in the header.
        </span>
      </div>
      <div className="card" style={{ padding: "1rem", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: ".85rem", color: "var(--muted)" }}>Your coach name</span>
        <input value={name} onChange={(e) => setNm(e.target.value)} maxLength={16} placeholder="Anonymous"
          style={{ padding: ".5rem .7rem", borderRadius: 8, border: "1px solid var(--border)", background: "var(--panel)", color: "var(--text)" }} />
        <button className="btn btn-primary" onClick={save}>Save</button>
        <span style={{ marginLeft: "auto", fontSize: ".72rem", color: "var(--muted)" }}>{isGlobal() ? "Global leaderboard" : "Saved on this device"}</span>
      </div>

      <div>
        <h2 style={{ marginBottom: 8 }}>Daily streaks</h2>
        <div className="grid-cards">
          {DAILY.map((d) => (
            <div key={d.game} className="card" style={{ padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>{d.label}</strong>
              <span style={{ color: "var(--muted)", fontSize: ".85rem" }}>
                streak <strong style={{ color: "var(--gold)" }}>{streaks[d.game]?.cur ?? 0}</strong> · best {streaks[d.game]?.max ?? 0}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid-cards" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))" }}>
        {BOARDS.map((b) => (
          <div key={b.game} className="card" style={{ padding: "1rem" }}>
            <h2 style={{ margin: "0 0 8px", fontSize: "1rem" }}>{b.label}</h2>
            {(boards[b.game]?.length ?? 0) === 0 ? (
              <p style={{ color: "var(--muted)", fontSize: ".82rem", margin: 0 }}>No scores yet.</p>
            ) : (
              <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 4 }}>
                {boards[b.game].map((r, i) => (
                  <li key={i} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: ".85rem" }}>
                    <span style={{ width: 16, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>{i + 1}</span>
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
                    <span style={{ fontFamily: "var(--font-cond)", color: "var(--gold)" }}>{r.score}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
