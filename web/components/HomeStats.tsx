"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { loadResults, type LadderRow } from "@/lib/data";
import { loadGamesData, type ProfilePlayer } from "@/lib/games-data";
import { getComp, compLabel, type Comp } from "@/lib/comp";
import { clubColors } from "@/lib/clubs";
import { slugify } from "@/lib/format";
import DailyLeaderboard from "@/components/DailyLeaderboard";
import HomeLeaderboard from "@/components/HomeLeaderboard";

export interface HomeInitial { season: string; ladder: LadderRow[]; featured: ProfilePlayer[] }

/** Home ladder + featured players. NRL renders server-side (SEO); NRLW swaps in
 *  client-side when the header toggle is set. */
export default function HomeStats({ initial }: { initial: HomeInitial }) {
  const [comp, setC] = useState<Comp>("nrl");
  const [season, setSeason] = useState(initial.season);
  const [ladder, setLadder] = useState<LadderRow[]>(initial.ladder);
  const [featured, setFeatured] = useState<ProfilePlayer[]>(initial.featured);

  useEffect(() => {
    const c = getComp(); setC(c);
    if (c === "nrlw") {
      loadResults().then((r) => { const s = r.seasons[0]; setSeason(s); setLadder(r.laddersBySeason[s]?.slice(0, 5) ?? []); });
      loadGamesData().then((d) => setFeatured(d.players.slice(0, 6).map((p) => ({ ...p, slug: slugify(p.name) }))));
    }
  }, []);

  const base = comp === "nrlw" ? "/w/players" : "/players";

  return (
    <>
      <section style={{ display: "grid", gap: "1rem", gridTemplateColumns: "minmax(0,1.4fr) minmax(0,1fr)" }} className="home-split">
        <style>{`@media (max-width: 760px){ .home-split { grid-template-columns: minmax(0,1fr) !important; } }`}</style>
        <div className="card" style={{ padding: "1.1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
            <h2 style={{ margin: 0, fontSize: "1.1rem" }}>{season} {compLabel(comp)} Ladder</h2>
            <Link href="/ladder" style={{ fontSize: ".8rem", color: "var(--accent)" }}>Full ladder →</Link>
          </div>
          <table className="stat">
            <thead><tr><th>#</th><th>Club</th><th>P</th><th>W</th><th>L</th><th>Pts</th></tr></thead>
            <tbody>
              {ladder.map((t, i) => {
                const [c1] = clubColors(t.club);
                return (
                  <tr key={t.club}>
                    <td style={{ color: "var(--muted)" }}>{i + 1}</td>
                    <td style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: c1 }} />{t.club}
                    </td>
                    <td>{t.p}</td><td>{t.w}</td><td>{t.l}</td><td style={{ fontWeight: 700 }}>{t.pts}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ display: "grid", gap: "1rem" }}>
          <DailyLeaderboard />
          <HomeLeaderboard />
        </div>
      </section>

      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Featured players</h2>
          <Link href="/players" style={{ fontSize: ".85rem", color: "var(--accent)" }}>All players →</Link>
        </div>
        <div className="grid-cards">
          {featured.map((p) => {
            const [c1] = clubColors(p.club);
            return (
              <Link key={p.id} href={`${base}/${p.id}/${p.slug}`} className="card" style={{ padding: "1rem", display: "grid", gap: 4 }}>
                <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong>{p.name}</strong>
                  <span style={{ fontFamily: "var(--font-cond)", fontSize: "1.3rem", color: p.rating >= 90 ? "var(--gold)" : "var(--text)" }}>{p.rating}</span>
                </span>
                <span style={{ display: "flex", gap: 8, alignItems: "center", fontSize: ".8rem", color: "var(--muted)" }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: c1 }} />{p.club} · {p.posName}
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: ".7rem", color: "var(--muted)" }}>{p.apps} games · {p.tries} tries · {p.firstYear}–{p.lastYear}</span>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
