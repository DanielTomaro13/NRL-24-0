"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { topScores, type ScoreEntry, isGlobal } from "@/lib/leaderboard";

export default function HomeLeaderboard() {
  const [rows, setRows] = useState<ScoreEntry[] | null>(null);
  useEffect(() => { topScores("perfect-classic", true, 5).then(setRows); }, []);
  return (
    <div className="card" style={{ padding: "1.1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Hall of Fame</h2>
        <Link href="/leaderboard" style={{ fontSize: ".8rem", color: "var(--accent)" }}>View all →</Link>
      </div>
      {rows === null ? (
        <p style={{ color: "var(--muted)", fontSize: ".85rem" }}>Loading…</p>
      ) : rows.length === 0 ? (
        <p style={{ color: "var(--muted)", fontSize: ".85rem" }}>
          No coaches yet — <Link href="/play" style={{ color: "var(--accent)" }}>be the first</Link> to post a record.
        </p>
      ) : (
        <ol style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "grid", gap: 6 }}>
          {rows.map((r, i) => (
            <li key={i} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: ".88rem" }}>
              <span style={{ width: 18, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>{i + 1}</span>
              <span style={{ flex: 1 }}>{r.name}</span>
              <span style={{ fontFamily: "var(--font-cond)", color: "var(--gold)" }}>{r.score} W</span>
            </li>
          ))}
        </ol>
      )}
      <p style={{ fontSize: ".7rem", color: "var(--muted)", marginTop: 10, marginBottom: 0 }}>
        {isGlobal() ? "Global leaderboard" : "Saved on this device"}
      </p>
    </div>
  );
}
