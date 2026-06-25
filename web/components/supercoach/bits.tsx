"use client";
import { type ScPlayer, availability, posColor } from "@/lib/supercoach";

export const PosBadge = ({ positions }: { positions: string[] }) => (
  <span style={{ whiteSpace: "nowrap" }}>
    {positions.map((p) => (
      <span key={p} style={{ color: posColor(p), fontWeight: 800, fontSize: ".72rem", marginRight: 4 }}>{p}</span>
    ))}
  </span>
);

export function AvailBadge({ p }: { p: ScPlayer }) {
  const a = availability(p);
  if (!a) return null;
  return (
    <span className="chip" style={{ marginLeft: 6, padding: "0 6px", fontSize: ".62rem", fontWeight: 800, color: a.color, borderColor: a.color }}>
      {a.label}
    </span>
  );
}

/** Tiny round-by-round SuperCoach score sparkline. */
export function Sparkline({ scores, w = 96, h = 22 }: { scores: Array<{ round: number; pts: number }>; w?: number; h?: number }) {
  if (!scores.length) return <span style={{ color: "var(--muted)" }}>–</span>;
  const pts = scores.map((s) => s.pts);
  const max = Math.max(...pts, 1), min = Math.min(...pts, 0), span = max - min || 1;
  const step = scores.length > 1 ? w / (scores.length - 1) : 0;
  const d = scores.map((s, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${(h - ((s.pts - min) / span) * h).toFixed(1)}`).join(" ");
  const lx = (step * (scores.length - 1)).toFixed(1), ly = (h - ((pts[pts.length - 1] - min) / span) * h).toFixed(1);
  return (
    <svg width={w} height={h} style={{ verticalAlign: "middle", overflow: "visible" }}>
      <path d={d} fill="none" stroke="var(--gold)" strokeOpacity="0.7" strokeWidth="1.5" />
      <circle cx={lx} cy={ly} r="2" fill="var(--gold)" />
    </svg>
  );
}
