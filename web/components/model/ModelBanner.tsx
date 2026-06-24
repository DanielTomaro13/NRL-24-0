"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BOOKS, type ValuePick } from "@/lib/model";

/** Slim, dismissible site-wide banner promoting the model's current best edge.
 * Re-appears when the top pick changes (the dismiss key encodes the pick). */
export default function ModelBanner({ pick }: { pick: ValuePick | null }) {
  const sig = pick ? `${pick.player}|${pick.market}|${pick.line}|${pick.ev}` : "";
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (!pick) return;
    try {
      setHidden(localStorage.getItem("model-banner-dismissed") === sig);
    } catch {
      setHidden(false);
    }
  }, [pick, sig]);

  if (!pick || hidden) return null;
  const dismiss = () => {
    try {
      localStorage.setItem("model-banner-dismissed", sig);
    } catch {}
    setHidden(true);
  };

  return (
    <div
      style={{
        background: "linear-gradient(90deg, rgba(255,84,54,0.16), rgba(95,208,138,0.10))",
        borderBottom: "1px solid var(--border)",
        fontSize: ".84rem",
      }}
    >
      <div className="container-x" style={{ display: "flex", alignItems: "center", gap: 10, padding: ".45rem 0", minHeight: 38 }}>
        <span aria-hidden style={{ fontSize: "1rem" }}>🔥</span>
        <Link href="/model/compare" style={{ color: "var(--text)", display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap", flex: 1, minWidth: 0 }}>
          <b style={{ color: "var(--accent)" }}>Model edge</b>
          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {pick.player} — {pick.market}{pick.line != null ? ` ${pick.line}` : ""}
          </span>
          <span style={{ color: "var(--accent-2)", fontWeight: 800 }}>+{pick.ev.toFixed(0)}%</span>
          <span style={{ color: "var(--muted)" }}>
            {pick.best} @ {pick.book ? BOOKS[pick.book] ?? pick.book : "–"} →
          </span>
        </Link>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "1.1rem", lineHeight: 1, padding: "0 4px", flexShrink: 0 }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
