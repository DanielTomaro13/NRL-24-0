"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { ProfilePlayer } from "@/lib/games-data";
import type { Comp } from "@/lib/comp";
import { clubColors } from "@/lib/clubs";
import { POS_GROUP } from "@/lib/format";

const FILTERS = ["All", "Back", "Halves", "Forward"];

export default function PlayersBrowser({ players, comp = "nrl" }: { players: ProfilePlayer[]; comp?: Comp }) {
  const base = comp === "nrlw" ? "/w/players" : "/players";
  const [q, setQ] = useState("");
  // Seed the search box from ?q= so the site-wide SearchAction (sitelinks
  // search box) lands on a pre-filtered list.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("q");
    if (p) setQ(p);
  }, []);
  const [filter, setFilter] = useState("All");
  const [club, setClub] = useState("All clubs");
  const clubs = useMemo(() => ["All clubs", ...Array.from(new Set(players.map((p) => p.club))).sort()], [players]);
  const shown = useMemo(() => {
    const query = q.trim().toLowerCase();
    return players
      .filter((p) => filter === "All" || POS_GROUP[p.pos] === filter)
      .filter((p) => club === "All clubs" || p.club === club)
      .filter((p) => !query || p.name.toLowerCase().includes(query) || p.club.toLowerCase().includes(query))
      .slice(0, 150);
  }, [players, q, filter, club]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search players or clubs…"
        style={{ width: "100%", padding: ".7rem .9rem", borderRadius: 10, border: "1px solid var(--border)", background: "var(--panel)", color: "var(--text)" }} />
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className="chip"
            style={{ cursor: "pointer", borderColor: filter === f ? "var(--accent)" : "var(--border)", color: filter === f ? "var(--text)" : "var(--muted)" }}>
            {f}
          </button>
        ))}
        <select value={club} onChange={(e) => setClub(e.target.value)}
          style={{ marginLeft: "auto", padding: ".4rem .6rem", borderRadius: 999, border: "1px solid var(--border)", background: "var(--panel-2)", color: "var(--text)", fontSize: ".8rem" }}>
          {clubs.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="grid-cards">
        {shown.map((p) => {
          const [c1] = clubColors(p.club);
          return (
            <Link key={p.id} href={`${base}/${p.id}/${p.slug}`} className="card" style={{ padding: "1rem", display: "grid", gap: 4 }}>
              <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</strong>
                <span style={{ fontFamily: "var(--font-cond)", fontSize: "1.3rem", color: p.rating >= 90 ? "var(--gold)" : "var(--text)" }}>{p.rating}</span>
              </span>
              <span style={{ display: "flex", gap: 8, alignItems: "center", fontSize: ".8rem", color: "var(--muted)" }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: c1 }} />{p.club}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: ".7rem", color: "var(--muted)" }}>{p.posName} · {p.apps} games · {p.tries} tries</span>
            </Link>
          );
        })}
      </div>
      {shown.length === 0 && <p style={{ color: "var(--muted)" }}>No players match.</p>}
    </div>
  );
}
