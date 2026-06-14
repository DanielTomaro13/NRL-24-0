import type { PoolPlayer } from "@/lib/types";
import type { Slot } from "@/lib/types";
import { clubColors } from "@/lib/clubs";

/* On-field coordinates (left%, top%) keyed by position code, so the layout is
   correct whatever order the slots come in. Wide positions list both spots
   (left, right). The pack sits near the bottom (the ruck); the fullback sweeps
   at the back (top). */
const SPOTS_13: Record<string, [number, number][]> = {
  FB: [[50, 9]],
  WG: [[13, 27], [87, 27]],
  CE: [[34, 31], [66, 31]],
  FE: [[39, 48]],
  HB: [[61, 48]],
  PR: [[39, 73], [61, 73]],
  HK: [[50, 63]],
  "2R": [[20, 72], [80, 72]],
  LK: [[50, 86]],
};
const SPOTS_9: Record<string, [number, number][]> = {
  FB: [[50, 10]],
  WG: [[15, 27]],
  CE: [[37, 31]],
  FE: [[62, 44]],
  HB: [[41, 45]],
  HK: [[50, 62]],
  PR: [[62, 73]],
  "2R": [[22, 71]],
  LK: [[50, 86]],
};

export default function TeamPitch({ slots, squad, mode }: { slots: Slot[]; squad: (PoolPlayer | null)[]; mode?: string | null }) {
  const fieldSlots = slots.filter((s) => s.code !== "INT");
  const spots = mode === "quick" || fieldSlots.length <= 9 ? SPOTS_9 : SPOTS_13;
  const field: { slot: Slot; p: PoolPlayer | null; xy: [number, number] }[] = [];
  const bench: { slot: Slot; p: PoolPlayer | null }[] = [];
  const occ: Record<string, number> = {};
  slots.forEach((s, i) => {
    if (s.code === "INT") { bench.push({ slot: s, p: squad[i] }); return; }
    const k = occ[s.code] ?? 0; occ[s.code] = k + 1;
    const list = spots[s.code] ?? [[50, 50]];
    field.push({ slot: s, p: squad[i], xy: list[k % list.length] });
  });

  return (
    <div>
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "3 / 4",
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid var(--border)",
          // mowed-pitch stripes
          background:
            "repeating-linear-gradient(0deg, #11321f 0 12.5%, #143a25 12.5% 25%)",
          boxShadow: "inset 0 0 60px rgba(0,0,0,0.45)",
        }}
      >
        {/* field markings */}
        <Markings />
        {field.map(({ slot, p, xy }, i) => (
          <Marker key={i} num={slot.n} code={slot.code} p={p} x={xy[0]} y={xy[1]} />
        ))}
      </div>

      {bench.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: ".6rem", letterSpacing: ".12em", color: "var(--muted)", textTransform: "uppercase", marginBottom: 6 }}>Interchange</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
            {bench.map(({ slot, p }, i) => {
              const [c1] = p ? clubColors(p.club) : ["var(--border)"];
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "6px 2px", borderRadius: 8, background: "var(--panel-2)", border: "1px solid var(--border)" }}>
                  <span style={{ width: 22, height: 22, borderRadius: "50%", display: "grid", placeItems: "center", background: p ? c1 : "transparent", border: p ? "none" : "1px dashed var(--border)", fontFamily: "var(--font-cond)", fontSize: ".8rem", color: p ? "#fff" : "var(--muted)", fontWeight: 700 }}>{slot.n}</span>
                  <span style={{ fontSize: ".62rem", textAlign: "center", lineHeight: 1.1, color: p ? "var(--text)" : "var(--border)", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>{p ? surname(p.name) : "—"}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Marker({ num, code, p, x, y }: { num: number; code: string; p: PoolPlayer | null; x: number; y: number }) {
  const [c1, c2] = p ? clubColors(p.club) : ["transparent", "var(--border)"];
  return (
    <div style={{ position: "absolute", left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, width: "21%" }}>
      <span
        title={p ? `${num}. ${p.name}` : code}
        style={{
          width: 30, height: 30, borderRadius: "50%", display: "grid", placeItems: "center",
          background: p ? c1 : "rgba(255,255,255,0.06)",
          border: p ? `2px solid ${c2}` : "1px dashed rgba(255,255,255,0.4)",
          fontFamily: "var(--font-cond)", fontSize: ".95rem", fontWeight: 700,
          color: p ? "#fff" : "rgba(255,255,255,0.65)", flexShrink: 0,
          boxShadow: p ? "0 2px 6px rgba(0,0,0,0.5)" : "none",
        }}
      >
        {p ? num : code}
      </span>
      <span style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.05, maxWidth: "100%" }}>
        <span style={{ fontSize: ".6rem", fontWeight: 600, color: "#eef2ec", textShadow: "0 1px 2px rgba(0,0,0,0.8)", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {p ? surname(p.name) : code}
        </span>
        {p && <span style={{ fontFamily: "var(--font-cond)", fontSize: ".68rem", color: p.rating >= 90 ? "#e8c469" : "#cdd8d0", textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>{p.rating}</span>}
      </span>
    </div>
  );
}

/* white field markings: in-goal bands, try lines, halfway line, goal posts */
function Markings() {
  const line = "rgba(255,255,255,0.55)";
  return (
    <>
      {/* in-goal areas */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "8%", background: "rgba(255,255,255,0.05)" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "8%", background: "rgba(255,255,255,0.05)" }} />
      {/* try lines */}
      <div style={{ position: "absolute", top: "8%", left: 0, right: 0, height: 2, background: line }} />
      <div style={{ position: "absolute", bottom: "8%", left: 0, right: 0, height: 2, background: line }} />
      {/* 20m lines */}
      <div style={{ position: "absolute", top: "28%", left: 0, right: 0, height: 1, background: "rgba(255,255,255,0.22)" }} />
      <div style={{ position: "absolute", bottom: "28%", left: 0, right: 0, height: 1, background: "rgba(255,255,255,0.22)" }} />
      {/* halfway */}
      <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: "rgba(255,255,255,0.3)" }} />
      {/* goal posts */}
      <Posts top="8%" />
      <Posts top="92%" />
      {/* touch lines */}
      <div style={{ position: "absolute", top: 0, bottom: 0, left: 3, width: 1, background: "rgba(255,255,255,0.18)" }} />
      <div style={{ position: "absolute", top: 0, bottom: 0, right: 3, width: 1, background: "rgba(255,255,255,0.18)" }} />
    </>
  );
}
function Posts({ top }: { top: string }) {
  return (
    <div style={{ position: "absolute", top, left: "50%", transform: "translate(-50%,-50%)", width: 22, height: 10, borderTop: "2px solid rgba(255,255,255,0.5)", borderLeft: "2px solid rgba(255,255,255,0.5)", borderRight: "2px solid rgba(255,255,255,0.5)", borderTopLeftRadius: 2, borderTopRightRadius: 2 }} />
  );
}

function surname(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1] : name;
}
