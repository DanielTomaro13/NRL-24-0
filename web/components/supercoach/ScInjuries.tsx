"use client";
import { useMemo, useState } from "react";
import { PosBadge, AvailBadge } from "@/components/supercoach/bits";
import { type ScPlayer, availability } from "@/lib/supercoach";

export default function ScInjuries({ players }: { players: ScPlayer[] }) {
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const rank = (p: ScPlayer) => { const l = availability(p)?.label; return l === "OUT" ? 0 : l === "SUSP" ? 1 : l === "TEST" ? 2 : 3; };
    return players
      .filter((p) => availability(p) || p.statusText || (p.status && p.status !== "pre" && p.status !== "played"))
      .filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()) || p.teamAbbr.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => rank(a) - rank(b) || (b.noteDate || "").localeCompare(a.noteDate || ""));
  }, [players, q]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search player / team"
        style={{ background: "var(--panel)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 8, padding: ".5rem .7rem", maxWidth: 360 }} />
      <div style={{ display: "grid", gap: 8 }}>
        {rows.map((p) => (
          <div key={p.id} className="card" style={{ padding: ".6rem .8rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <b>{p.name}</b><AvailBadge p={p} />
              <span style={{ color: "var(--muted)", fontSize: ".76rem" }}>{p.teamAbbr} · <PosBadge positions={p.positions} /></span>
              <span style={{ marginLeft: "auto", color: "var(--muted)", fontSize: ".78rem" }}>avg {p.avg || "–"} · {p.owned}% owned</span>
            </div>
            {p.statusText && <p style={{ color: "var(--gold)", margin: "4px 0 0", fontSize: ".88rem" }}>{p.statusText}</p>}
            {p.note && <p style={{ color: "var(--muted)", margin: "4px 0 0", fontSize: ".8rem" }}>“{p.note}”
              {p.noteDate && <span style={{ opacity: 0.7 }}> — {new Date(p.noteDate).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}</span>}</p>}
          </div>
        ))}
        {!rows.length && <p style={{ color: "var(--muted)" }}>No flagged players right now.</p>}
      </div>
    </div>
  );
}
