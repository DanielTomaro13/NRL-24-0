"use client";
import { useModelComp } from "@/components/model/modelcomp.client";
import type { ModelComp } from "@/lib/modelcomp";

export interface OverviewStat { k: string; v: number | string }

/** Comp-aware stat chips for the /model overview: the server page loads every
 *  comp's numbers; this picks the slice for the selected comp tab. */
export default function OverviewStats({ byComp }: { byComp: Record<ModelComp, OverviewStat[]> }) {
  const comp = useModelComp();
  const stats = byComp[comp] ?? byComp.nrl ?? [];
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      {stats.map((s) => (
        <div key={s.k} className="card" style={{ padding: ".7rem 1rem", minWidth: 130 }}>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, fontFamily: "var(--font-cond)" }}>{s.v}</div>
          <div style={{ color: "var(--muted)", fontSize: ".8rem" }}>{s.k}</div>
        </div>
      ))}
    </div>
  );
}
