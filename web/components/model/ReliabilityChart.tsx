/** Reliability diagram (SVG, no JS): predicted probability vs empirical frequency.
 * Points on the diagonal = perfectly calibrated. */
export default function ReliabilityChart({ pred, emp }: { pred: number[]; emp: number[] }) {
  const W = 320, H = 320, pad = 34;
  const max = Math.max(0.1, ...pred, ...emp) * 1.1;
  const x = (v: number) => pad + (v / max) * (W - pad * 2);
  const y = (v: number) => H - pad - (v / max) * (H - pad * 2);
  const pts = pred.map((p, i) => ({ px: x(p), py: y(emp[i] ?? 0) }));
  const path = pts.map((p, i) => `${i ? "L" : "M"}${p.px.toFixed(1)},${p.py.toFixed(1)}`).join(" ");
  const ticks = [0, 0.1, 0.2, 0.3, 0.4, 0.5].filter((t) => t <= max);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 360, height: "auto" }} role="img" aria-label="Try-scorer reliability diagram">
      {/* grid + ticks */}
      {ticks.map((t) => (
        <g key={t}>
          <line x1={x(t)} y1={pad} x2={x(t)} y2={H - pad} stroke="var(--border)" strokeWidth={1} />
          <line x1={pad} y1={y(t)} x2={W - pad} y2={y(t)} stroke="var(--border)" strokeWidth={1} />
          <text x={x(t)} y={H - pad + 14} fill="var(--muted)" fontSize={9} textAnchor="middle">{(t * 100).toFixed(0)}%</text>
          <text x={pad - 6} y={y(t) + 3} fill="var(--muted)" fontSize={9} textAnchor="end">{(t * 100).toFixed(0)}%</text>
        </g>
      ))}
      {/* perfect-calibration diagonal */}
      <line x1={x(0)} y1={y(0)} x2={x(max)} y2={y(max)} stroke="var(--muted)" strokeWidth={1} strokeDasharray="4 4" opacity={0.6} />
      {/* model curve */}
      <path d={path} fill="none" stroke="var(--accent-2)" strokeWidth={2.5} strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.px} cy={p.py} r={3.5} fill="var(--accent)" />
      ))}
      {/* axis labels */}
      <text x={W / 2} y={H - 4} fill="var(--muted)" fontSize={10} textAnchor="middle">Predicted try chance</text>
      <text x={12} y={H / 2} fill="var(--muted)" fontSize={10} textAnchor="middle" transform={`rotate(-90 12 ${H / 2})`}>Actual frequency</text>
    </svg>
  );
}
