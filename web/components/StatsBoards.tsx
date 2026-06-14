"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { ProfilePlayer } from "@/lib/playerdb";
import { clubColors } from "@/lib/clubs";
import { POS_GROUP } from "@/lib/format";

const BOARDS: { key: keyof ProfilePlayer; label: string }[] = [
  { key: "tries", label: "Most Tries" },
  { key: "runMetres", label: "Run Metres / game" },
  { key: "tackles", label: "Tackles / game" },
  { key: "lineBreaks", label: "Line Breaks" },
  { key: "apps", label: "Most Games" },
  { key: "rating", label: "Top Rated" },
];
const GROUPS = ["All", "Back", "Halves", "Forward"];

export default function StatsBoards({ players }: { players: ProfilePlayer[] }) {
  const [group, setGroup] = useState("All");
  const pool = useMemo(
    () => players.filter((p) => group === "All" || POS_GROUP[p.pos] === group),
    [players, group]
  );
  return (
    <div style={{ display: "grid", gap: "1.25rem" }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {GROUPS.map((g) => (
          <button key={g} onClick={() => setGroup(g)} className="chip"
            style={{ cursor: "pointer", borderColor: group === g ? "var(--accent)" : "var(--border)", color: group === g ? "var(--text)" : "var(--muted)" }}>
            {g === "Back" ? "Backs" : g === "Forward" ? "Forwards" : g}
          </button>
        ))}
      </div>
      <div className="grid-cards" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))" }}>
        {BOARDS.map((b) => {
          const top = [...pool].sort((x, y) => (y[b.key] as number) - (x[b.key] as number)).slice(0, 10);
          return (
            <div key={b.key} className="card" style={{ padding: "1rem" }}>
              <h2 style={{ margin: "0 0 8px", fontSize: "1rem" }}>{b.label}</h2>
              <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 4 }}>
                {top.map((p, i) => {
                  const [c1] = clubColors(p.club);
                  return (
                    <li key={p.id} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: ".86rem" }}>
                      <span style={{ width: 16, color: "var(--muted)", fontFamily: "var(--font-mono)", fontSize: ".75rem" }}>{i + 1}</span>
                      <span style={{ width: 7, height: 7, borderRadius: 2, background: c1, flexShrink: 0 }} />
                      <Link href={`/players/${p.id}/${p.slug}`} style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</Link>
                      <span style={{ fontFamily: "var(--font-cond)", color: "var(--gold)" }}>{p[b.key] as number}</span>
                    </li>
                  );
                })}
              </ol>
            </div>
          );
        })}
      </div>
    </div>
  );
}
