"use client";
import { useEffect, useState } from "react";
import { getDaily, countdownString, type DailyStats } from "@/lib/progress";

/** Post-game panel for daily games: streaks, guess distribution, share + countdown. */
export default function DailyStatsPanel({ game, shareText }: { game: string; shareText: string }) {
  const [d, setD] = useState<DailyStats | null>(null);
  const [cd, setCd] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setD(getDaily(game));
    const t = setInterval(() => setCd(countdownString()), 1000);
    setCd(countdownString());
    return () => clearInterval(t);
  }, [game]);

  if (!d) return null;
  const maxDist = Math.max(1, ...Object.values(d.dist));

  async function share() {
    try {
      if (navigator.share) await navigator.share({ text: shareText });
      else { await navigator.clipboard.writeText(shareText); setCopied(true); setTimeout(() => setCopied(false), 1800); }
    } catch { /* cancelled */ }
  }

  return (
    <div className="card" style={{ padding: "1.1rem", display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 16, justifyContent: "space-around", textAlign: "center" }}>
        <Stat label="Played" value={d.played} />
        <Stat label="Win %" value={d.played ? Math.round((d.wins / d.played) * 100) : 0} />
        <Stat label="Streak" value={d.cur} />
        <Stat label="Best" value={d.max} />
      </div>
      {Object.keys(d.dist).length > 0 && (
        <div>
          <div style={{ fontSize: ".75rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>Guess distribution</div>
          <div style={{ display: "grid", gap: 4 }}>
            {Object.entries(d.dist).sort((a, b) => Number(a[0]) - Number(b[0])).map(([g, n]) => (
              <div key={g} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: ".8rem" }}>
                <span style={{ width: 14, color: "var(--muted)" }}>{g}</span>
                <span style={{ background: "var(--accent)", color: "#1a0a06", borderRadius: 4, padding: "2px 8px", minWidth: 24, textAlign: "right", width: `${(n / maxDist) * 100}%`, fontWeight: 700 }}>{n}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button className="btn btn-primary" onClick={share}>{copied ? "Copied!" : "Share result"}</button>
        <a className="btn" style={{ borderColor: "#1d9bf0" }} target="_blank" rel="noopener"
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`}>𝕏</a>
        <a className="btn" style={{ borderColor: "#1877f2" }} target="_blank" rel="noopener"
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent("https://nrl24-0.com")}`}>f</a>
        <span style={{ fontSize: ".8rem", color: "var(--muted)" }}>Next puzzle in {cd}</span>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div style={{ fontFamily: "var(--font-cond)", fontSize: "1.6rem" }}>{value}</div>
      <div style={{ fontSize: ".68rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>{label}</div>
    </div>
  );
}
