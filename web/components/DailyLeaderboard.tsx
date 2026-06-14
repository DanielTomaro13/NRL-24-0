"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { topScores, type ScoreEntry, isGlobal } from "@/lib/leaderboard";
import { todayKey } from "@/lib/progress";
import { getComp, compLabel, type Comp } from "@/lib/comp";

/** Today's top perfect-season records — a rolling daily board on the home page. */
export default function DailyLeaderboard() {
  const [rows, setRows] = useState<ScoreEntry[] | null>(null);
  const [comp, setC] = useState<Comp>("nrl");
  const today = todayKey();
  useEffect(() => { setC(getComp()); topScores(`daily-${today}`, true, 5).then(setRows); }, [today]);
  const nice = new Date(today).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" });

  return (
    <div className="card" style={{ padding: "1.1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Today&apos;s Top {compLabel(comp)} Sides</h2>
        <span className="chip" style={{ fontSize: ".64rem", color: "var(--gold)" }}>{nice}</span>
      </div>
      {rows === null ? (
        <p style={{ color: "var(--muted)", fontSize: ".85rem", margin: 0 }}>Loading…</p>
      ) : rows.length === 0 ? (
        <p style={{ color: "var(--muted)", fontSize: ".85rem", margin: 0 }}>
          No records yet today — <Link href="/play?quick=1" style={{ color: "var(--accent)" }}>post the first</Link>.
        </p>
      ) : (
        <ol style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "grid", gap: 6 }}>
          {rows.map((r, i) => (
            <li key={i} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: ".88rem" }}>
              <span style={{ width: 18, color: i === 0 ? "var(--gold)" : "var(--muted)", fontFamily: "var(--font-mono)" }}>{i + 1}</span>
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
              <span style={{ fontFamily: "var(--font-cond)", color: "var(--accent-2)" }}>{r.score}–{24 - r.score}</span>
            </li>
          ))}
        </ol>
      )}
      <p style={{ fontSize: ".7rem", color: "var(--muted)", marginTop: 10, marginBottom: 0 }}>
        {isGlobal() ? "Resets every day · global" : "Resets every day · saved on this device"}
      </p>
    </div>
  );
}
