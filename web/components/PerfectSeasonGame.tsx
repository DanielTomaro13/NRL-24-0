"use client";
/* =========================================================================
   PERFECT SEASON — the all-time NRL draft game.
   Spin for a random club + era, draft a player into their position, fill your
   side and chase a flawless 24–0. Ported from the original single-file app to
   read the static, build-time Champion Data pool and extended with AFL-style
   modes (Quick Nine, Full 13, Match-day 17, Salary Cap, Gauntlet, Wooden Spoon)
   and a Monte-Carlo season simulator.
   ========================================================================= */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadMeta, loadPool, loadStrengths } from "@/lib/data";
import {
  Mode, MODE_INFO, PoolPlayer, REROLLS, SQUADS, SALARY_CAP, salaryFor,
} from "@/lib/types";
import { seasonRecord, simulateSeason, verdict } from "@/lib/sim";
import { POS_LABEL, POS_CODES } from "@/lib/format";
import { clubColors } from "@/lib/clubs";
import { submitScore } from "@/lib/leaderboard";
import { getName, setName, todayKey } from "@/lib/progress";
import { tick, settle, fanfare, isMuted, toggleMuted } from "@/lib/sound";
import Confetti from "@/components/Confetti";
import ShareButtons from "@/components/ShareButtons";
import AdUnit from "@/components/AdUnit";
import { AD_SLOTS } from "@/lib/ads";

const rnd = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
const ORDER: Mode[] = ["quick", "classic", "full17", "cap", "gauntlet", "spoon"];

export default function PerfectSeasonGame() {
  const [pool, setPool] = useState<PoolPlayer[] | null>(null);
  const [strengths, setStrengths] = useState<Record<string, number[]>>({});
  const [err, setErr] = useState<string | null>(null);

  const [mode, setMode] = useState<Mode | null>(null);
  const [squad, setSquad] = useState<(PoolPlayer | null)[]>([]);
  const [reels, setReels] = useState<{ club: string | null; era: string | null }>({ club: null, era: null });
  const [spinning, setSpinning] = useState(false);
  const [rerolls, setRerolls] = useState({ club: 0, era: 0 });
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingPick, setPendingPick] = useState<{ player: PoolPlayer; codes: string[] } | null>(null);
  const [posFilter, setPosFilter] = useState("All");
  const [muted, setMuted] = useState(false);
  const spinningRef = useRef(false);
  const flickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const settleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSpin = useRef(false);
  useEffect(() => () => {
    if (flickRef.current) clearInterval(flickRef.current);
    if (settleRef.current) clearTimeout(settleRef.current);
  }, []);

  useEffect(() => {
    Promise.all([loadPool(), loadMeta(), loadStrengths()])
      .then(([p, , s]) => { setPool(p); setStrengths(s.bySeason); })
      .catch(() => setErr("Couldn't load the player pool. Try refreshing."));
    setMuted(isMuted());
    // Quick Nine shortcut: /play?quick=1 jumps straight in and auto-spins.
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("quick")) {
      autoSpin.current = true;
      start("quick");
    }
  }, []);

  const slots = mode ? SQUADS[mode] : [];
  const total = slots.length;
  const picksMade = squad.filter(Boolean).length;
  const firstEmpty = squad.findIndex((s) => !s);
  const done = squad.length > 0 && firstEmpty === -1;
  const maxReroll = mode ? REROLLS[mode] : { club: 0, era: 0 };

  const filled = squad.filter(Boolean) as PoolPlayer[];
  const avg = filled.length ? filled.reduce((a, b) => a + b.rating, 0) / filled.length : 0;
  const salary = filled.reduce((a, b) => a + salaryFor(b.rating), 0);

  const undrafted = useCallback((p: PoolPlayer) => !squad.some((s) => s && s.id === p.id), [squad]);

  const candidates = useMemo(() => {
    if (!pool || !reels.club) return [];
    return pool
      .filter((p) => p.club === reels.club && (!reels.era || p.era === reels.era) && undrafted(p))
      .sort((a, b) => (mode === "spoon" ? a.rating - b.rating : b.rating - a.rating));
  }, [pool, reels, undrafted, mode]);

  const clubsWithPlayers = useCallback(() => {
    if (!pool) return [];
    return Array.from(new Set(pool.filter(undrafted).map((p) => p.club)));
  }, [pool, undrafted]);
  const erasForClub = useCallback((club: string) => {
    if (!pool) return [];
    return Array.from(new Set(pool.filter((p) => p.club === club && undrafted(p)).map((p) => p.era)));
  }, [pool, undrafted]);
  const clubsForEra = useCallback((era: string | null) => {
    if (!pool || !era) return [];
    return Array.from(new Set(pool.filter((p) => p.era === era && undrafted(p)).map((p) => p.club)));
  }, [pool, undrafted]);

  const animateTo = useCallback((target: { club: string; era: string | null }, lock: { club?: boolean; era?: boolean } = {}) => {
    if (spinningRef.current) return;
    spinningRef.current = true;
    setSpinning(true);
    setPendingPick(null);
    setPosFilter("All");
    const allClubs = clubsWithPlayers();
    const finalize = () => {
      if (flickRef.current) clearInterval(flickRef.current);
      if (settleRef.current) clearTimeout(settleRef.current);
      flickRef.current = null; settleRef.current = null;
      setReels(target);
      setSpinning(false);
      spinningRef.current = false;
      settle();
    };
    let ticks = 0;
    const max = 13 + Math.floor(Math.random() * 7);
    if (flickRef.current) clearInterval(flickRef.current);
    flickRef.current = setInterval(() => {
      ticks++;
      tick();
      const fc = lock.club ? target.club : rnd(allClubs.length ? allClubs : [target.club]);
      let fe: string | null;
      if (lock.era) fe = target.era;
      else { const es = erasForClub(fc); fe = es.length ? rnd(es) : null; }
      setReels({ club: fc, era: fe });
      if (ticks >= max) finalize();
    }, 70);
    // backstop: always settle within 2.5s even if the interval is throttled
    settleRef.current = setTimeout(finalize, 2500);
  }, [clubsWithPlayers, erasForClub]);

  function spinFresh() {
    if (!pool || spinningRef.current || done) return;
    const cs = clubsWithPlayers();
    if (!cs.length) return;
    const club = rnd(cs);
    const es = erasForClub(club);
    animateTo({ club, era: es.length ? rnd(es) : null });
  }
  function rerollClub() {
    if (!pool || spinningRef.current || done || rerolls.club >= maxReroll.club || !reels.club) return;
    const sameEra = clubsForEra(reels.era).filter((c) => c !== reels.club);
    setRerolls((r) => ({ ...r, club: r.club + 1 }));
    if (sameEra.length) { animateTo({ club: rnd(sameEra), era: reels.era }, { era: true }); return; }
    const cs = clubsWithPlayers().filter((c) => c !== reels.club);
    const pick = cs.length ? cs : clubsWithPlayers();
    const club = rnd(pick);
    const es = erasForClub(club);
    animateTo({ club, era: es.length ? rnd(es) : null });
  }
  function rerollEra() {
    if (!pool || spinningRef.current || done || rerolls.era >= maxReroll.era || !reels.club) return;
    const es = erasForClub(reels.club).filter((e) => e !== reels.era);
    if (!es.length) return;
    setRerolls((r) => ({ ...r, era: r.era + 1 }));
    animateTo({ club: reels.club, era: rnd(es) }, { club: true });
  }

  // can this player still be slotted somewhere? (any eligible position or bench)
  const playerPlaceable = useCallback((p: PoolPlayer) => {
    const elig = p.elig?.length ? p.elig : [p.pos];
    return slots.some((s, i) => !squad[i] && (s.code === "INT" || elig.includes(s.code)));
  }, [slots, squad]);

  function placeInSlot(p: PoolPlayer, code: string) {
    const slot = slots.findIndex((s, i) => s.code === code && !squad[i]);
    if (slot === -1) return;
    setSquad((sq) => { const next = sq.slice(); next[slot] = { ...p, pos: code, posName: POS_LABEL[code] || p.posName }; return next; });
    setNotice(null);
    setPendingPick(null);
    setReels({ club: null, era: null });
  }

  function draft(p: PoolPlayer) {
    if (spinningRef.current || done) return;
    if (mode === "cap" && salary + salaryFor(p.rating) > SALARY_CAP) {
      setNotice(`Over the cap — ${p.name} would blow your salary cap. Draft someone cheaper.`);
      return;
    }
    const elig = p.elig?.length ? p.elig : [p.pos];
    // distinct eligible positions that still have an open slot
    const openCodes = elig.filter((c) => slots.some((s, i) => s.code === c && !squad[i]));
    if (openCodes.length >= 2) {
      // genuinely multi-position with a real choice — ask which slot
      setPendingPick({ player: p, codes: openCodes });
      return;
    }
    if (openCodes.length === 1) { placeInSlot(p, openCodes[0]); return; }
    // none of their positions open — drop onto the bench if this mode has one
    if (slots.some((s, i) => s.code === "INT" && !squad[i])) { placeInSlot(p, "INT"); return; }
    setNotice(`${POS_LABEL[p.pos] || "That position"} is full — draft a different player.`);
  }

  function start(m: Mode) {
    setMode(m);
    setSquad(SQUADS[m].map(() => null));
    setReels({ club: null, era: null });
    setRerolls({ club: 0, era: 0 });
    setNotice(null);
    setPendingPick(null);
  }
  function reset() {
    if (!mode) return;
    setSquad(SQUADS[mode].map(() => null));
    setReels({ club: null, era: null });
    setRerolls({ club: 0, era: 0 });
    setNotice(null);
    setPendingPick(null);
  }

  // positions that still have an open slot (for highlighting the filters)
  const openPosCodes = useMemo(() => {
    const set = new Set<string>();
    slots.forEach((s, i) => { if (!squad[i] && s.code !== "INT") set.add(s.code); });
    return set;
  }, [slots, squad]);

  const shownCandidates = useMemo(() => {
    if (posFilter === "All") return candidates;
    return candidates.filter((p) => (p.elig?.length ? p.elig : [p.pos]).includes(posFilter));
  }, [candidates, posFilter]);

  const noDraftable = !!reels.club && !spinning &&
    (candidates.length === 0 || candidates.every((c) =>
      !playerPlaceable(c) || (mode === "cap" && salary + salaryFor(c.rating) > SALARY_CAP)));

  // Auto-spin once when arriving via the Quick Nine shortcut (/play?quick=1).
  useEffect(() => {
    if (autoSpin.current && mode === "quick" && pool && !reels.club && !spinningRef.current && picksMade === 0) {
      autoSpin.current = false;
      spinFresh();
    }
  }, [mode, pool]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleSound() { setMuted(toggleMuted()); }

  /* ----- render ----- */
  if (err) return <p style={{ color: "var(--danger)" }}>{err}</p>;
  if (!pool) return <p style={{ color: "var(--muted)" }}>Loading the all-time pool…</p>;

  if (!mode) {
    return (
      <div style={{ display: "grid", gap: "1.25rem" }}>
        <header>
          <h1 style={{ fontSize: "2.4rem", margin: 0, textTransform: "uppercase" }}>
            Perfect <span style={{ color: "var(--accent)" }}>Season</span>
          </h1>
          <p style={{ color: "var(--muted)", maxWidth: 640, marginTop: 6 }}>
            Spin for a club and era, draft the player, fill your side and chase a flawless 24–0.
            Choose your game.
          </p>
        </header>
        <div className="grid-cards">
          {ORDER.map((m) => {
            const info = MODE_INFO[m];
            return (
              <button key={m} className="card" onClick={() => start(m)}
                style={{ padding: "1.1rem", textAlign: "left", cursor: "pointer", color: "var(--text)", display: "grid", gap: 6 }}>
                <span style={{ fontSize: ".7rem", letterSpacing: ".12em", textTransform: "uppercase", color: "var(--gold)" }}>{info.tag}</span>
                <strong style={{ fontFamily: "var(--font-cond)", fontSize: "1.3rem", textTransform: "uppercase" }}>{info.name}</strong>
                <span style={{ fontSize: ".85rem", color: "var(--muted)", lineHeight: 1.45 }}>{info.desc}</span>
                <span style={{ fontSize: ".72rem", color: "var(--muted)" }}>{SQUADS[m].length} picks · {REROLLS[m].club}+{REROLLS[m].era} re-rolls</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "minmax(0,1.1fr) minmax(0,0.9fr)" }} className="ps-grid">
      <style>{`@media (max-width: 800px){ .ps-grid { grid-template-columns: 1fr !important; } }`}</style>

      {/* LEFT: spin + roster */}
      <section className="card" style={{ padding: "1.25rem", minHeight: 420 }}>
        {!done ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 8 }}>
              <span className="chip">{picksMade} / {total} drafted</span>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button onClick={toggleSound} aria-label={muted ? "Unmute" : "Mute"} title={muted ? "Unmute" : "Mute"}
                  style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "1rem", lineHeight: 1, padding: 2 }}>
                  {muted ? "🔇" : "🔊"}
                </button>
                <span style={{ fontFamily: "var(--font-cond)", fontSize: "1.2rem", textTransform: "uppercase", color: "var(--gold)" }}>{MODE_INFO[mode].name}</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <Reel label="Club" value={reels.club} spinning={spinning} big />
              <Reel label="Era" value={reels.era} spinning={spinning} />
            </div>

            {(!reels.club || spinning) ? (
              <button className="btn btn-primary" style={{ width: "100%" }} onClick={spinFresh} disabled={spinning}>
                {spinning ? "Spinning…" : "Spin"}
              </button>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn" style={{ flex: 1 }} onClick={rerollClub} disabled={rerolls.club >= maxReroll.club}>
                  ↻ Club{rerolls.club >= maxReroll.club ? " · used" : ` (${maxReroll.club - rerolls.club})`}
                </button>
                <button className="btn" style={{ flex: 1 }} onClick={rerollEra} disabled={rerolls.era >= maxReroll.era || erasForClub(reels.club).length <= 1}>
                  ↻ Era{rerolls.era >= maxReroll.era ? " · used" : ` (${maxReroll.era - rerolls.era})`}
                </button>
              </div>
            )}

            {mode === "cap" && (
              <div style={{ marginTop: 12, fontSize: ".82rem", color: salary > SALARY_CAP ? "var(--danger)" : "var(--muted)" }}>
                Salary used <strong style={{ color: "var(--text)" }}>${(salary / 1e6).toFixed(2)}M</strong> / ${(SALARY_CAP / 1e6).toFixed(1)}M cap
              </div>
            )}

            {notice && (
              <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 8, background: "rgba(255,84,54,0.1)", border: "1px solid rgba(255,84,54,0.4)", fontSize: ".85rem" }}>
                {notice}
              </div>
            )}

            {pendingPick && (
              <div style={{ marginTop: 12, padding: "12px", borderRadius: 8, background: "rgba(232,196,105,0.1)", border: "1px solid var(--gold)" }}>
                <div style={{ fontSize: ".85rem", marginBottom: 8 }}>
                  <strong>{pendingPick.player.name}</strong> can play a few spots — where do they slot?
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {pendingPick.codes.map((c) => (
                    <button key={c} className="btn" style={{ minHeight: 38 }} onClick={() => placeInSlot(pendingPick.player, c)}>
                      {POS_LABEL[c] || c}
                    </button>
                  ))}
                  <button className="btn" style={{ minHeight: 38, color: "var(--muted)" }} onClick={() => setPendingPick(null)}>Cancel</button>
                </div>
              </div>
            )}

            {reels.club && !spinning && (
              <div style={{ marginTop: 16, borderTop: "1px dashed var(--border)", paddingTop: 14 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                  <strong>{reels.club}</strong>
                  {reels.era && <span style={{ color: "var(--gold)" }}>· {reels.era}</span>}
                  <span className="chip" style={{ marginLeft: "auto" }}>{shownCandidates.length} of {candidates.length}</span>
                </div>

                {/* filter the spun roster by position — open slots are highlighted */}
                <div className="scroll-x" style={{ display: "flex", gap: 5, marginBottom: 10, paddingBottom: 2 }}>
                  {["All", ...POS_CODES].map((code) => {
                    const open = code === "All" || openPosCodes.has(code);
                    const active = posFilter === code;
                    return (
                      <button key={code} onClick={() => setPosFilter(code)} className="chip"
                        style={{ cursor: "pointer", flexShrink: 0, fontSize: ".68rem",
                          borderColor: active ? "var(--accent)" : open ? "var(--border)" : "transparent",
                          color: active ? "var(--text)" : open ? "var(--gold)" : "var(--muted)",
                          opacity: open ? 1 : 0.5 }}
                        title={code === "All" ? "All positions" : POS_LABEL[code]}>
                        {code}
                      </button>
                    );
                  })}
                </div>

                {shownCandidates.length === 0 ? (
                  <p style={{ color: "var(--muted)", fontStyle: "italic" }}>
                    {candidates.length === 0 ? "No players left from this draw." : `No ${POS_LABEL[posFilter] || posFilter} in this draw.`}
                  </p>
                ) : (
                  <div className="scroll-x" style={{ maxHeight: 340, overflowY: "auto", display: "grid", gap: 6 }}>
                    {shownCandidates.slice(0, 60).map((p) => {
                      const full = !playerPlaceable(p);
                      const posLabel = p.elig?.length > 1 ? p.elig.join("/") : p.pos;
                      return (
                        <button key={p.id} onClick={() => draft(p)} disabled={full}
                          style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--panel-2)", color: "var(--text)", cursor: full ? "not-allowed" : "pointer", opacity: full ? 0.4 : 1, textAlign: "left", width: "100%" }}>
                          <span style={{ fontFamily: "var(--font-cond)", fontSize: "1.4rem", minWidth: 32, textAlign: "center", color: p.rating >= 90 ? "var(--gold)" : "var(--text)" }}>{p.rating}</span>
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ display: "flex", gap: 7, alignItems: "center", fontWeight: 600, fontSize: ".92rem" }}>
                              {p.name}
                              <span className="chip" style={{ fontSize: ".62rem", padding: "1px 6px", color: "var(--gold)" }}>{posLabel}</span>
                            </span>
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: ".68rem", color: "var(--muted)" }}>
                              {p.tries}T · {p.runMetres}m · {p.tryAssists}TA · {p.tackles}tk
                            </span>
                          </span>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: ".62rem", color: "var(--accent)", whiteSpace: "nowrap" }}>
                            {full ? "FULL" : mode === "cap" ? `$${(salaryFor(p.rating) / 1e6).toFixed(2)}M` : "DRAFT →"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
                {noDraftable && (
                  <button className="btn btn-primary" style={{ width: "100%", marginTop: 10 }} onClick={spinFresh}>Spin again</button>
                )}
              </div>
            )}

            {!reels.club && (
              <p style={{ marginTop: 18, fontSize: ".85rem", color: "var(--muted)", lineHeight: 1.6 }}>
                Hit <b>Spin</b> to roll a random club and era, then draft a player — they slot
                straight into their position. Once you spin you must draft from that club, so spend
                your re-rolls wisely.
              </p>
            )}
          </>
        ) : (
          <ResultView mode={mode} squad={filled} avg={avg} strengths={strengths} onReset={reset} onMode={() => setMode(null)} />
        )}
      </section>

      {/* RIGHT: team sheet */}
      <section className="card" style={{ padding: "1rem 1rem 1.1rem", alignSelf: "start" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: ".7rem", letterSpacing: ".12em", color: "var(--muted)", textTransform: "uppercase", paddingBottom: 10, borderBottom: "1px solid var(--border)" }}>
          <span>Team sheet</span>
          <span style={{ color: "var(--gold)" }}>{filled.length ? `AVG ${avg.toFixed(1)}` : "—"}</span>
        </div>
        <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {slots.map((s, i) => {
            const p = squad[i];
            const [c1] = p ? clubColors(p.club) : ["var(--border)"];
            return (
              <li key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 2px", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontFamily: "var(--font-cond)", fontSize: "1rem", color: "var(--muted)", minWidth: 18, textAlign: "center" }}>{s.n}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: ".62rem", color: "var(--muted)", minWidth: 22 }}>{s.code}</span>
                <span style={{ flex: 1, minWidth: 0, fontSize: ".85rem", display: "flex", flexDirection: "column" }}>
                  {p ? (
                    <>
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: c1, flexShrink: 0 }} />
                        {p.name}
                      </span>
                      <span style={{ fontSize: ".66rem", color: "var(--muted)" }}>{p.club} · {p.era}</span>
                    </>
                  ) : <span style={{ color: "var(--border)" }}>—</span>}
                </span>
                <span style={{ fontFamily: "var(--font-cond)", fontSize: "1.1rem", color: p && p.rating >= 90 ? "var(--gold)" : "var(--text)", minWidth: 26, textAlign: "right" }}>{p ? p.rating : ""}</span>
              </li>
            );
          })}
        </ol>
        <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
          {filled.length > 0 && !done && (
            <button onClick={reset} style={linkBtn}>start over</button>
          )}
          <button onClick={() => setMode(null)} style={linkBtn}>change mode</button>
        </div>
      </section>
    </div>
  );
}

const linkBtn: React.CSSProperties = {
  background: "none", border: "none", color: "var(--muted)", fontFamily: "var(--font-mono)",
  fontSize: ".7rem", letterSpacing: ".1em", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3,
};

function Reel({ label, value, spinning, big }: { label: string; value: string | null; spinning?: boolean; big?: boolean }) {
  return (
    <div style={{ flex: big ? 1.7 : 1, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 12px", overflow: "hidden" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: ".6rem", letterSpacing: ".24em", color: "var(--muted)", marginBottom: 6, textTransform: "uppercase" }}>{label}</div>
      <div style={{
        fontFamily: "var(--font-cond)", fontSize: big ? "1.7rem" : "1.3rem", textTransform: "uppercase",
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        color: value ? (big ? "var(--text)" : "var(--gold)") : "var(--border)",
        filter: spinning ? "blur(0.6px)" : undefined, opacity: spinning ? 0.85 : 1,
        animation: spinning ? "flick 0.07s steps(2) infinite" : undefined,
      }}>
        {value || (label === "Era" ? "—" : "?")}
      </div>
    </div>
  );
}

function ResultView({ mode, squad, avg, strengths, onReset, onMode }: {
  mode: Mode; squad: PoolPlayer[]; avg: number; strengths: Record<string, number[]>;
  onReset: () => void; onMode: () => void;
}) {
  const [name, setNm] = useState("");
  const [saved, setSaved] = useState(false);

  // deterministic seed from the actual players so a given side always plays
  // out the same season — 24–0 is a genuine ~5% event for a near-perfect squad
  const seed = useMemo(() => squad.reduce((h, p) => (Math.imul(h, 31) + p.pid) >>> 0, 7), [squad]);
  const sim = useMemo(() => {
    const eras = Array.from(new Set(squad.map((p) => p.era)));
    const pool = eras.flatMap((e) => strengths[e] || []);
    return simulateSeason(avg, pool.length ? pool : Object.values(strengths).flat(), seed);
  }, [squad, avg, strengths, seed]);
  const rec = { wins: sim.wins, losses: sim.losses };
  const v = verdict(rec.wins);
  const perfect = mode === "spoon" ? rec.wins === 0 : rec.wins === 24;
  const goalPct = mode === "spoon" ? sim.spoonPct : sim.perfectPct;

  useEffect(() => { setNm(getName()); if (perfect) fanfare(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function save() {
    if (name.trim()) setName(name.trim());
    const score = mode === "spoon" ? 24 - rec.wins : rec.wins;
    submitScore(`perfect-${mode}`, score, true);
    // the rolling daily "Top Sides" board is win-based; Wooden Spoon (which
    // optimises for losses) must not pollute it with inverted scores.
    if (mode !== "spoon") submitScore(`daily-${todayKey()}`, rec.wins, true);
    setSaved(true);
  }

  return (
    <div style={{ textAlign: "center", padding: "0.5rem 0.25rem", position: "relative" }}>
      {perfect && <Confetti />}
      <div style={{ fontFamily: "var(--font-cond)", fontSize: "clamp(56px,12vw,104px)", lineHeight: 1, display: "flex", justifyContent: "center", gap: 8, alignItems: "baseline" }}>
        <span style={{ color: "var(--accent-2)" }}>{rec.wins}</span>
        <span style={{ color: "var(--muted)", fontSize: ".6em" }}>–</span>
        <span style={{ color: rec.losses ? "var(--danger)" : "var(--accent-2)" }}>{rec.losses}</span>
      </div>
      <div style={{ fontFamily: "var(--font-cond)", fontSize: "1.6rem", textTransform: "uppercase", color: "var(--gold)", marginTop: 4 }}>{v.t}</div>
      <p style={{ color: "var(--muted)", maxWidth: 340, margin: "8px auto 0", lineHeight: 1.5 }}>{v.s}</p>

      <div style={{ display: "flex", gap: 3, justifyContent: "center", marginTop: 18, flexWrap: "wrap", maxWidth: 320, marginInline: "auto" }}>
        {Array.from({ length: 24 }).map((_, i) => (
          <span key={i} style={{ width: 8, height: 16, borderRadius: 1, background: i < rec.wins ? "var(--accent-2)" : "var(--border)" }} />
        ))}
      </div>

      <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 18, fontSize: ".8rem", color: "var(--muted)", flexWrap: "wrap" }}>
        <span>Squad rating <strong style={{ color: "var(--text)" }}>{avg.toFixed(1)}</strong></span>
        <span>{mode === "spoon" ? "0–24" : "24–0"} odds <strong style={{ color: "var(--text)" }}>{goalPct < 0.1 ? "<0.1" : goalPct.toFixed(1)}%</strong></span>
        <span>Stronger than <strong style={{ color: "var(--text)" }}>{sim.realPercentile}%</strong> of real sides</span>
      </div>

      <div style={{ marginTop: 18, display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
        {!saved ? (
          <>
            <input value={name} onChange={(e) => setNm(e.target.value)} placeholder="Coach name" maxLength={16}
              style={{ padding: ".5rem .7rem", borderRadius: 8, border: "1px solid var(--border)", background: "var(--panel)", color: "var(--text)", maxWidth: 160 }} />
            <button className="btn btn-primary" onClick={save}>Save to Hall of Fame</button>
          </>
        ) : <span className="chip" style={{ color: "var(--accent-2)" }}>✓ Saved to the Hall of Fame</span>}
      </div>

      <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px dashed var(--border)" }}>
        <div style={{ fontSize: ".72rem", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 12 }}>
          Share your side
        </div>
        <ShareButtons
          data={{
            record: `${rec.wins}–${rec.losses}`,
            verdict: v.t,
            avg,
            modeName: MODE_INFO[mode].name,
            players: squad.map((p) => ({ n: p.name, pos: p.pos, club: p.club, era: p.era, rating: p.rating })),
          }}
          caption={`I built a ${rec.wins}–${rec.losses} all-time NRL side (${v.t}) in NRL 24-0!`}
        />
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 16, justifyContent: "center" }}>
        <button onClick={onReset} style={linkBtn}>draft a new side</button>
        <button onClick={onMode} style={linkBtn}>change mode</button>
      </div>

      <AdUnit slot={AD_SLOTS.result} />
    </div>
  );
}
