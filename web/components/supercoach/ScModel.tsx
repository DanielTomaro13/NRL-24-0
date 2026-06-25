"use client";
import { useMemo } from "react";
import { useSort, Th } from "@/components/model/sortable";
import type { PredMatch } from "@/lib/model";
import { type ScPlayer, playerKey } from "@/lib/supercoach";

interface Row { id: number; name: string; team: string; modelSc: number; scProj: number; scAvg: number; edge: number; }

export default function ScModel({ matches, players }: { matches: PredMatch[]; players: ScPlayer[] }) {
  const { rows, fit } = useMemo(() => {
    const idx = new Map<string, ScPlayer>();
    for (const p of players) if (!idx.has(playerKey(p.name))) idx.set(playerKey(p.name), p);
    const pairs: Array<{ name: string; scp: ScPlayer; perf: number }> = [];
    for (const m of matches) for (const pl of m.players) {
      const scp = idx.get(playerKey(pl.name)); const perf = pl.exp_perf ?? 0;
      if (scp && scp.proj > 3 && perf > 3) pairs.push({ name: pl.name, scp, perf });
    }
    const n = pairs.length;
    if (!n) return { rows: [] as Row[], fit: null as null | { a: number; b: number; r: number; n: number } };
    const mx = pairs.reduce((s, p) => s + p.perf, 0) / n, my = pairs.reduce((s, p) => s + p.scp.proj, 0) / n;
    let sxy = 0, sxx = 0, syy = 0;
    for (const p of pairs) { sxy += (p.perf - mx) * (p.scp.proj - my); sxx += (p.perf - mx) ** 2; syy += (p.scp.proj - my) ** 2; }
    const b = sxx ? sxy / sxx : 1, a = my - b * mx, r = sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0;
    const rows: Row[] = pairs.map(({ name, scp, perf }) => {
      const modelSc = a + b * perf;
      return { id: scp.id, name, team: scp.teamAbbr, modelSc: Math.round(modelSc), scProj: Math.round(scp.proj), scAvg: Math.round(scp.avg), edge: Math.round(modelSc - scp.proj) };
    });
    return { rows, fit: { a, b, r, n } };
  }, [matches, players]);

  const val = (r: Row, k: string) => (r as unknown as Record<string, number | string>)[k] ?? null;
  const { sorted, sortKey, dir, onSort } = useSort(rows, val, { key: "edge", dir: "desc" });
  const sp = { sortKey, dir, onSort };

  if (!fit) return <p style={{ color: "var(--muted)" }}>Predictions or SuperCoach data not available yet.</p>;
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="card" style={{ padding: ".6rem .8rem", color: "var(--muted)", fontSize: ".8rem" }}>
        <b style={{ color: "var(--text)" }}>How “Model SC” is built:</b> we map our model&apos;s expected performance
        points onto the SuperCoach scale (SC ≈ {fit.a.toFixed(1)} + {fit.b.toFixed(2)} × xPerf, correlation
        <b style={{ color: "var(--text)" }}> r = {fit.r.toFixed(2)}</b> on {fit.n} players). Sort the
        <b style={{ color: "var(--gold)" }}> Edge</b> column to find players our model rates higher (positive) or
        lower (negative) than SuperCoach.
      </div>
      <div className="card scroll-x mtable" style={{ padding: ".4rem .6rem" }}>
        <table className="stat">
          <thead><tr>
            <Th k="name" {...sp} style={{ textAlign: "left" }}>Player</Th>
            <Th k="modelSc" {...sp} title="Model's xPerf mapped to the SuperCoach scale">Model SC</Th>
            <Th k="scProj" {...sp} title="SuperCoach's own projection">SC proj</Th>
            <Th k="scAvg" {...sp}>SC avg</Th>
            <Th k="edge" {...sp} title="Model SC − SC proj">Edge</Th>
          </tr></thead>
          <tbody>
            {sorted.slice(0, 600).map((r) => (
              <tr key={r.id}>
                <td style={{ textAlign: "left", whiteSpace: "nowrap" }}><b>{r.name}</b><span style={{ color: "var(--muted)", marginLeft: 6, fontSize: ".76rem" }}>{r.team}</span></td>
                <td style={{ color: "var(--accent-2,#6cf)", fontWeight: 700 }}>{r.modelSc}</td>
                <td style={{ color: "var(--gold)", fontWeight: 700 }}>{r.scProj}</td>
                <td style={{ color: "var(--muted)" }}>{r.scAvg}</td>
                <td style={{ fontWeight: 800, color: r.edge > 0 ? "var(--accent-2,#7bd88f)" : r.edge < 0 ? "var(--danger)" : "var(--muted)" }}>{r.edge > 0 ? "+" : ""}{r.edge}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ color: "var(--muted)", fontSize: ".8rem" }}>
        Both are forward-looking for the upcoming round. Big gaps are usually a form call — SuperCoach leans harder
        on recent weeks, our model is more season-anchored.
      </p>
    </div>
  );
}
