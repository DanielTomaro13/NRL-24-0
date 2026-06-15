"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { loadResults, type LadderRow } from "@/lib/data";
import { clubColors } from "@/lib/clubs";
import { getComp, compLabel, type Comp } from "@/lib/comp";
import { slugify } from "@/lib/format";

export interface LadderData { seasons: string[]; laddersBySeason: Record<string, LadderRow[]> }

/** NRL ladder is server-rendered (SEO); swaps to NRLW client-side on toggle. */
export default function LadderView({ initial }: { initial: LadderData }) {
  const [data, setData] = useState<LadderData>(initial);
  const [season, setSeason] = useState<string>(initial.seasons[0] ?? "");
  const [comp, setC] = useState<Comp>("nrl");
  useEffect(() => {
    const c = getComp(); setC(c);
    if (c === "nrlw") loadResults().then((r) => { setData({ seasons: r.seasons, laddersBySeason: r.laddersBySeason }); setSeason(r.seasons[0]); });
  }, []);
  const rows = data.laddersBySeason[season] ?? [];
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span className="chip" style={{ color: "var(--gold)" }}>{compLabel(comp)}</span>
        <label style={{ fontSize: ".82rem", color: "var(--muted)" }}>Season</label>
        <select value={season} onChange={(e) => setSeason(e.target.value)}
          style={{ padding: ".4rem .6rem", borderRadius: 8, border: "1px solid var(--border)", background: "var(--panel)", color: "var(--text)" }}>
          {data.seasons.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="card scroll-x" style={{ padding: ".4rem .6rem" }}>
        <table className="stat">
          <thead><tr><th>#</th><th>Club</th><th>P</th><th>W</th><th>D</th><th>L</th><th>PF</th><th>PA</th><th>PD</th><th>Pts</th></tr></thead>
          <tbody>
            {rows.map((t, i) => {
              const [c1] = clubColors(t.club);
              return (
                <tr key={t.club} style={i < 8 ? { background: "rgba(95,208,138,0.05)" } : undefined}>
                  <td style={{ color: i < 8 ? "var(--accent-2)" : "var(--muted)", fontWeight: 700 }}>{i + 1}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <Link href={`${comp === "nrlw" ? "/w/teams" : "/teams"}/${slugify(t.club)}`}
                      title={t.club} style={{ display: "flex", gap: 8, alignItems: "center", color: "var(--text)" }}>
                      <span style={{ width: 9, height: 9, borderRadius: 2, background: c1, flexShrink: 0 }} />
                      <span>{t.club}</span>
                    </Link>
                  </td>
                  <td>{t.p}</td><td>{t.w}</td><td>{t.d}</td><td>{t.l}</td>
                  <td>{t.pf}</td><td>{t.pa}</td>
                  <td style={{ color: t.pd > 0 ? "var(--accent-2)" : t.pd < 0 ? "var(--danger)" : "var(--muted)" }}>{t.pd > 0 ? "+" : ""}{t.pd}</td>
                  <td style={{ fontWeight: 800 }}>{t.pts}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: ".75rem", color: "var(--muted)" }}>
        Top 8 make the finals (shaded). Points: 2 per win, 1 per draw. Computed from real match results.
        {" "}<Link href="/fixtures" style={{ color: "var(--accent)" }}>See fixtures →</Link>
      </p>
    </div>
  );
}
