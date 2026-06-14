"use client";
import { useEffect, useState } from "react";
import { COMPS, getComp, setComp, type Comp } from "@/lib/comp";

/** NRL / NRLW switch shown in the header on every page. NRL is the default. */
export default function CompToggle() {
  const [comp, setC] = useState<Comp>("nrl");
  useEffect(() => { setC(getComp()); }, []);
  return (
    <div role="group" aria-label="Competition"
      style={{ display: "inline-flex", border: "1px solid var(--border)", borderRadius: 999, padding: 2, background: "var(--bg)", flexShrink: 0 }}>
      {COMPS.map((c) => {
        const active = comp === c.id;
        return (
          <button key={c.id} onClick={() => setComp(c.id)} aria-pressed={active}
            style={{
              border: "none", cursor: "pointer", borderRadius: 999, padding: "8px 13px", minHeight: 36,
              fontFamily: "var(--font-cond)", fontSize: ".82rem", letterSpacing: ".04em",
              background: active ? "var(--accent)" : "transparent",
              color: active ? "#1a0a06" : "var(--muted)", fontWeight: 700,
              touchAction: "manipulation",
            }}>
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
