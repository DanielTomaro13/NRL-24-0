import Link from "next/link";
import ModelNav from "@/components/model/ModelNav";
import { ModelHeaderBar } from "@/components/model/modelcomp.client";
import { loadModelMeta } from "@/lib/model.server";
import { MODEL_COMPS, type ModelComp } from "@/lib/modelcomp";
import type { ModelMeta } from "@/lib/model";

export default async function ModelLayout({ children }: { children: React.ReactNode }) {
  const entries = await Promise.all(
    MODEL_COMPS.map(async (c) => [c.id, await loadModelMeta(c.id)] as const)
  );
  const metas = Object.fromEntries(entries) as Partial<Record<ModelComp, ModelMeta>>;
  return (
    <div style={{ display: "grid", gap: "1.25rem" }}>
      <header style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
          <h1 style={{ fontSize: "2rem", margin: 0, textTransform: "uppercase", fontFamily: "var(--font-cond)" }}>
            <Link href="/model" style={{ color: "var(--text)" }}>The Model</Link>
          </h1>
        </div>
        <p style={{ color: "var(--muted)", margin: 0, maxWidth: "60ch", fontSize: ".95rem" }}>
          A statistical rugby-league model — NRL, NRLW and State of Origin: try-scorer, goal-kicking
          and player-points projections (plus NRLW match markets) priced to surface value.
          Educational — not betting advice.
        </p>
        <ModelHeaderBar metas={metas} />
        <ModelNav />
      </header>
      {children}
    </div>
  );
}
