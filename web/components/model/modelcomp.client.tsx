"use client";
import { useEffect, useState } from "react";
import type { ModelMeta } from "@/lib/model";
import { MODEL_COMPS, isModelComp, type ModelComp } from "@/lib/modelcomp";

const KEY = "nrl240:modelcomp";

export function getModelComp(): ModelComp {
  if (typeof window === "undefined") return "nrl";
  const v = localStorage.getItem(KEY);
  return isModelComp(v ?? undefined) ? (v as ModelComp) : "nrl";
}

export function setModelComp(c: ModelComp) {
  if (typeof window === "undefined" || getModelComp() === c) return;
  localStorage.setItem(KEY, c);
  window.location.reload(); // every model page re-reads the selection on load
}

/** Selected model competition. Starts "nrl" on the server/first paint to match the
 * statically-rendered HTML, then resolves to the stored choice after mount. */
export function useModelComp(): ModelComp {
  const [c, setC] = useState<ModelComp>("nrl");
  useEffect(() => setC(getModelComp()), []);
  return c;
}

/** Comp switcher + the selected comp's round/updated chip, shown in the model layout. */
export function ModelHeaderBar({ metas }: { metas: Partial<Record<ModelComp, ModelMeta>> }) {
  const comp = useModelComp();
  const meta = metas[comp];
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }} aria-label="Competition">
        {MODEL_COMPS.map((c) => {
          const on = comp === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setModelComp(c.id)}
              className="chip"
              style={{
                cursor: "pointer",
                background: on ? "var(--gold)" : "var(--panel)",
                color: on ? "#1a0a06" : "var(--muted)",
                borderColor: on ? "var(--gold)" : "var(--border)",
                fontWeight: on ? 800 : 600,
              }}
            >
              {c.label}
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
        <span className="chip" style={{ color: "var(--gold)" }}>
          {meta?.round ? `Round ${meta.round}` : meta?.label ?? "—"}
        </span>
        {meta?.updated ? (
          <span style={{ color: "var(--muted)", fontSize: ".8rem" }}>updated {meta.updated}</span>
        ) : null}
      </div>
    </div>
  );
}

/** Wrapper for odds pages that only have men's data for now: shows the men's
 * content when NRL is selected, otherwise a short "not available yet" notice. */
export function NrlOnlyGate({ children }: { children: React.ReactNode }) {
  const comp = useModelComp();
  if (comp === "nrl") return <>{children}</>;
  const label = MODEL_COMPS.find((c) => c.id === comp)?.label ?? comp;
  return (
    <div className="panel" style={{ padding: 16, color: "var(--muted)", maxWidth: "65ch" }}>
      Live odds markets aren&apos;t available for <b style={{ color: "var(--text)" }}>{label}</b> yet —
      bookmakers post far fewer markets for it, and our live-odds feed currently covers men&apos;s NRL
      only. The model projections still work:{" "}
      <a href="/model/predictions" style={{ color: "var(--accent)" }}>Predictions</a>
      {comp === "nrlw" ? (
        <> and <a href="/model/markets" style={{ color: "var(--accent)" }}>Match markets</a></>
      ) : null}
      .
    </div>
  );
}
