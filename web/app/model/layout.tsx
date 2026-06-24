import Link from "next/link";
import ModelNav from "@/components/model/ModelNav";
import { loadModelMeta } from "@/lib/model.server";

export default async function ModelLayout({ children }: { children: React.ReactNode }) {
  const meta = await loadModelMeta();
  return (
    <div style={{ display: "grid", gap: "1.25rem" }}>
      <header style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
          <h1 style={{ fontSize: "2rem", margin: 0, textTransform: "uppercase", fontFamily: "var(--font-cond)" }}>
            <Link href="/model" style={{ color: "var(--text)" }}>The Model</Link>
          </h1>
          <span className="chip" style={{ color: "var(--gold)" }}>
            {meta.round ? `Round ${meta.round}` : "NRL"}
          </span>
          {meta.updated ? (
            <span style={{ color: "var(--muted)", fontSize: ".8rem" }}>updated {meta.updated}</span>
          ) : null}
        </div>
        <p style={{ color: "var(--muted)", margin: 0, maxWidth: "60ch", fontSize: ".95rem" }}>
          A statistical NRL model: try-scorer, goal-kicking and player-points projections priced
          against live multi-bookmaker odds to surface value. Educational — not betting advice.
        </p>
        <ModelNav />
      </header>
      {children}
    </div>
  );
}
