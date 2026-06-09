import React, { useState, useEffect, useCallback, useRef } from "react";

/* =========================================================================
   PERFECT SEASON — an all-time NRL draft game in the spirit of 23-0.com
   -------------------------------------------------------------------------
   Spin for a random club + era, pick a player, fill all 13 starting
   positions. Your squad's combined rating sets your win–loss record.
   Chase a perfect 24–0 home-and-away season.

   DATA: Live from Champion Data's match-centre CDN (mc.championdata.com),
   the same anonymous JSON feeds nrl.com reads. There is no roster-by-era
   endpoint, so the player pool is built by walking every competition's
   fixture, loading completed match files, and aggregating each player's
   real per-match stats into a rating. Club = the squad they played for;
   "era" = the competition season. If the feeds can't be reached, the app
   surfaces the error and retries rather than substituting any synthetic data.
   ========================================================================= */

// Champion Data match-centre host. If the hosted page is blocked by CORS,
// set VITE_API_BASE to a same-origin proxy path (e.g. "/cd") that forwards
// to https://mc.championdata.com — see netlify.toml / vercel.json in the repo.
const API =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE) ||
  "https://mc.championdata.com";

/* ---- palette: stadium night, chalk, signal flare -------------------- */
const C = {
  pitch: "#0b1411",
  pitchDeep: "#060d0a",
  line: "#1d2e27",
  chalk: "#eef2ec",
  chalkDim: "#9fb0a6",
  flare: "#ff5436",
  flareDim: "#b83a26",
  gold: "#e8c469",
  grass: "#2f5d3f",
  win: "#5fd08a",
  loss: "#ff5436",
};

const POSITIONS = [
  { code: "FB", name: "Fullback", n: 1 },
  { code: "WG", name: "Wing", n: 2 },
  { code: "CE", name: "Centre", n: 3 },
  { code: "CE", name: "Centre", n: 4 },
  { code: "WG", name: "Wing", n: 5 },
  { code: "FE", name: "Five-Eighth", n: 6 },
  { code: "HB", name: "Halfback", n: 7 },
  { code: "PR", name: "Prop", n: 8 },
  { code: "HK", name: "Hooker", n: 9 },
  { code: "PR", name: "Prop", n: 10 },
  { code: "2R", name: "Second Row", n: 11 },
  { code: "2R", name: "Second Row", n: 12 },
  { code: "LK", name: "Lock", n: 13 },
];



/* ---------- rating model from raw per-match averages ----------------- */
/* Weighted blend of attacking + workhorse output, mapped through a
   sigmoid so most players land in a believable 64–92 band and only
   genuine outliers push toward the high 90s.                            */
function rateFromStats(s) {
  const tries = s.tries || 0;
  const rm = s.runMetres || 0;
  const lb = s.lineBreaks || 0;
  const ta = s.tryAssists || 0;
  const tk = s.tackles || 0;
  const off = s.offloads || 0;
  const err = s.handlingErrors || 0;
  const raw =
    tries * 6 +
    rm * 0.14 +
    lb * 6 +
    ta * 7 +
    tk * 0.55 +
    off * 2 -
    err * 3;
  // sigmoid: center ~58 raw -> 0.5; spread 16 raw per logit
  const t = 1 / (1 + Math.exp(-(raw - 58) / 16));
  const r = 62 + t * 36; // 62..98
  return Math.round(Math.min(98, Math.max(60, r)));
}

function poolFetch(url) {
  return fetch(url, { headers: { Accept: "application/json, text/plain, */*" } })
    .then((r) => (r.ok ? r.text() : Promise.reject(new Error(r.status))))
    .then((t) => JSON.parse(t)); // CDN sometimes labels JSON as text/plain
}

function arr(x) {
  return Array.isArray(x) ? x : x == null ? [] : [x];
}

/* Walk the live feeds and aggregate a player pool. Bounded so it never
   hammers the CDN: a capped number of competitions, and a capped number
   of completed matches per competition. */
async function buildLivePool({ maxComps = 6, matchesPerComp = 8, onProgress }) {
  const cat = await poolFetch(`${API}/data/competitions.json`);
  let comps = arr(cat?.competitionDetails?.competition).filter((c) =>
    String(c.name || "").toLowerCase().includes("nrl") ||
    String(c.name || "").toLowerCase().includes("premiership") ||
    String(c.name || "").toLowerCase().includes("origin")
  );
  if (!comps.length) comps = arr(cat?.competitionDetails?.competition);
  // newest seasons first, capped
  comps.sort((a, b) => (b.season || 0) - (a.season || 0));
  comps = comps.slice(0, maxComps);

  // aggregate: playerKey -> { name, club, era, sums, games }
  const agg = new Map();
  let done = 0;
  const total = comps.length;

  for (const comp of comps) {
    onProgress?.(`Reading ${comp.name} ${comp.season}…`, done / total);
    let fixture;
    try {
      fixture = await poolFetch(`${API}/data/${comp.id}/fixture.json`);
    } catch {
      done++;
      continue;
    }
    const matches = arr(fixture?.fixture?.match).filter(
      (m) => /full time|complete|final/i.test(m.matchStatus || "")
    );
    // sample across the season rather than only round 1
    const step = Math.max(1, Math.floor(matches.length / matchesPerComp));
    const sample = matches.filter((_, i) => i % step === 0).slice(0, matchesPerComp);

    for (const m of sample) {
      let mf;
      try {
        mf = await poolFetch(`${API}/data/${comp.id}/${m.matchId}.json`);
      } catch {
        continue;
      }
      const ms = mf?.matchStats || {};
      const squads = {};
      arr(ms?.teamInfo?.team).forEach((t) => {
        squads[t.squadId] = t.squadName;
      });
      const names = {};
      arr(ms?.playerInfo?.player).forEach((p) => {
        names[p.playerId] = [p.firstname, p.surname].filter(Boolean).join(" ").trim();
      });
      arr(ms?.playerStats?.player).forEach((p) => {
        const key = p.playerId;
        const club =
          squads[p.squadId] ||
          (p.squadId === m.homeSquadId ? m.homeSquadName : m.awaySquadName) ||
          "NRL";
        if (!agg.has(key)) {
          agg.set(key, {
            id: `live-${key}`,
            name: names[key] || `Player ${key}`,
            club,
            era: String(comp.season || ""),
            sums: {},
            games: 0,
          });
        }
        const rec = agg.get(key);
        rec.games += 1;
        ["tries", "runMetres", "lineBreaks", "tryAssists", "tackles", "offloads", "handlingErrors"].forEach(
          (k) => {
            rec.sums[k] = (rec.sums[k] || 0) + (Number(p[k]) || 0);
          }
        );
      });
    }
    done++;
    onProgress?.(`Reading ${comp.name} ${comp.season}…`, done / total);
  }

  const pool = [];
  for (const rec of agg.values()) {
    if (rec.games < 1) continue;
    const avg = {};
    Object.keys(rec.sums).forEach((k) => (avg[k] = rec.sums[k] / rec.games));
    pool.push({
      id: rec.id,
      name: rec.name,
      club: rec.club,
      era: rec.era,
      rating: rateFromStats(avg),
      tries: +(avg.tries || 0).toFixed(1),
      runMetres: Math.round(avg.runMetres || 0),
      lineBreaks: +(avg.lineBreaks || 0).toFixed(1),
      tryAssists: +(avg.tryAssists || 0).toFixed(1),
      tackles: Math.round(avg.tackles || 0),
    });
  }
  return pool;
}

/* ---------- helpers --------------------------------------------------- */
const rnd = (a) => a[Math.floor(Math.random() * a.length)];

function recordFromRating(avg) {
  // avg rating 60..99 -> wins out of 24 home-and-away rounds
  const t = (avg - 62) / (97 - 62); // 0..1
  const wins = Math.round(Math.max(0, Math.min(1, t)) * 24);
  return { wins, losses: 24 - wins };
}

function verdict(wins) {
  if (wins >= 24) return { t: "PERFECT SEASON", s: "24–0. Immortal. Nobody laid a glove on you.", tone: "perfect" };
  if (wins >= 22) return { t: "MINOR PREMIERS", s: "Top of the ladder and the clear flag favourite." };
  if (wins >= 18) return { t: "TOP-FOUR SIDE", s: "Genuine contender. A home final and a real shot." };
  if (wins >= 14) return { t: "FINALS BOUND", s: "You scrape into the eight. Anything can happen." };
  if (wins >= 9) return { t: "MID-TABLE", s: "Flashes of class, not enough on the bell." };
  return { t: "WOODEN SPOON", s: "Long season. The bunker can't save this one." };
}

/* ===================================================================== */
export default function PerfectSeason() {
  const [pool, setPool] = useState(null);
  const [source, setSource] = useState("loading"); // loading | live | error
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [progress, setProgress] = useState({ msg: "Connecting to the match centre…", p: 0 });

  const [squad, setSquad] = useState(() => POSITIONS.map(() => null));
  const [reels, setReels] = useState({ club: null, era: null });
  const [spinning, setSpinning] = useState(false);
  const [clubReroll, setClubReroll] = useState(true); // 1 per game
  const [eraReroll, setEraReroll] = useState(true); // 1 per game
  const [pending, setPending] = useState(null); // player chosen, awaiting a slot
  const reelTimer = useRef(null);

  const firstEmpty = squad.findIndex((s) => !s);
  const done = firstEmpty === -1;
  const picksMade = squad.filter(Boolean).length;

  /* ---- load pool: always from Champion Data, no synthetic fallback ---- */
  useEffect(() => {
    let live = true;
    setPool(null);
    setError(null);
    setSource("loading");
    setProgress({ msg: "Connecting to the match centre…", p: 0 });
    (async () => {
      try {
        const p = await buildLivePool({
          onProgress: (msg, frac) => live && setProgress({ msg, p: frac }),
        });
        if (!live) return;
        if (p && p.length >= 26) {
          p.sort((a, b) => b.rating - a.rating);
          setPool(p.slice(0, 600));
          setSource("live");
        } else {
          // reached the CDN but couldn't assemble a usable pool
          setError(
            p && p.length
              ? `Only ${p.length} players came back from the match centre — not enough to draft a season. The feed may be partially available right now.`
              : "No player data came back from the match centre. The feeds may be temporarily unavailable."
          );
          setSource("error");
        }
      } catch (e) {
        if (!live) return;
        const msg = String(e && e.message ? e.message : e);
        setError(
          /Failed to fetch|NetworkError|TypeError/i.test(msg)
            ? "Couldn't reach the Champion Data match centre. This is usually a network or cross-origin (CORS) block — if you're hosting this, route the feeds through a small same-origin proxy."
            : `Couldn't load player data from the match centre (${msg}).`
        );
        setSource("error");
      }
    })();
    return () => {
      live = false;
    };
  }, [reloadKey]);

  /* full roster for the current reel result */
  const candidates =
    pool && reels.club
      ? pool
          .filter(
            (p) =>
              p.club === reels.club &&
              (!reels.era || p.era === reels.era) &&
              !squad.some((s) => s && s.id === p.id)
          )
          .sort((a, b) => b.rating - a.rating)
      : [];

  // clubs that still have at least one undrafted player
  const undrafted = useCallback(
    (p) => !squad.some((s) => s && s.id === p.id),
    [squad]
  );
  const clubsWithPlayers = useCallback(() => {
    if (!pool) return [];
    return Array.from(new Set(pool.filter(undrafted).map((p) => p.club)));
  }, [pool, undrafted]);
  const erasForClub = useCallback(
    (club) => {
      if (!pool) return [];
      return Array.from(
        new Set(pool.filter((p) => p.club === club && undrafted(p)).map((p) => p.era).filter(Boolean))
      );
    },
    [pool, undrafted]
  );

  // animate the reels, then settle on `target` (which is guaranteed valid)
  const animateTo = useCallback(
    (target, lockClub) => {
      setSpinning(true);
      setPending(null);
      let ticks = 0;
      const maxTicks = 14 + Math.floor(Math.random() * 8);
      clearInterval(reelTimer.current);
      const allClubs = clubsWithPlayers();
      reelTimer.current = setInterval(() => {
        ticks++;
        const flickClub = lockClub ? target.club : rnd(allClubs.length ? allClubs : [target.club]);
        const subEras = erasForClub(flickClub);
        const flickEra = subEras.length ? rnd(subEras) : null;
        setReels({ club: flickClub, era: flickEra });
        if (ticks >= maxTicks) {
          clearInterval(reelTimer.current);
          setReels(target);
          setSpinning(false);
        }
      }, 70);
    },
    [clubsWithPlayers, erasForClub]
  );

  // full spin: new random club AND era
  function spinFresh() {
    if (!pool || spinning || done) return;
    const cs = clubsWithPlayers();
    if (!cs.length) return;
    const club = rnd(cs);
    const es = erasForClub(club);
    animateTo({ club, era: es.length ? rnd(es) : null }, false);
  }

  // reroll just the club, keep nothing fixed (era follows new club); 1/game
  function rerollClub() {
    if (!pool || spinning || done || !clubReroll || !reels.club) return;
    const cs = clubsWithPlayers().filter((c) => c !== reels.club);
    const pickFrom = cs.length ? cs : clubsWithPlayers();
    if (!pickFrom.length) return;
    setClubReroll(false);
    const club = rnd(pickFrom);
    const es = erasForClub(club);
    animateTo({ club, era: es.length ? rnd(es) : null }, false);
  }

  // reroll just the era, keep the club fixed; 1/game
  function rerollEra() {
    if (!pool || spinning || done || !eraReroll || !reels.club) return;
    const es = erasForClub(reels.club).filter((e) => e !== reels.era);
    if (!es.length) return; // no other era available for this club
    setEraReroll(false);
    animateTo({ club: reels.club, era: rnd(es) }, true);
  }

  // tapping a player stages them; the user then chooses any empty slot
  function choose(player) {
    setPending(player);
  }

  function assign(slotIndex) {
    if (!pending || squad[slotIndex]) return;
    setSquad((sq) => {
      const next = sq.slice();
      next[slotIndex] = { ...pending, pos: POSITIONS[slotIndex] };
      return next;
    });
    setPending(null);
    setReels({ club: null, era: null });
  }

  function cancelPending() {
    setPending(null);
  }

  function clearSlot(slotIndex) {
    setSquad((sq) => {
      const next = sq.slice();
      next[slotIndex] = null;
      return next;
    });
  }

  function reset() {
    setSquad(POSITIONS.map(() => null));
    setReels({ club: null, era: null });
    setClubReroll(true);
    setEraReroll(true);
    setPending(null);
  }

  const filled = squad.filter(Boolean);
  const avg =
    filled.length > 0 ? filled.reduce((a, b) => a + b.rating, 0) / filled.length : 0;
  const rec = recordFromRating(avg);
  const v = verdict(rec.wins);

  /* ===================== render ===================== */
  return (
    <div style={S.root}>
      <style>{KEYFRAMES}</style>

      {/* turf glow */}
      <div style={S.glow} aria-hidden />

      <header style={S.header}>
        <div style={S.eyebrow}>
          ALL-TIME NRL DRAFT
          <span style={S.sourceTag(source)}>
            {source === "live"
              ? "● LIVE DATA"
              : source === "error"
              ? "✕ FEED UNAVAILABLE"
              : "… LOADING"}
          </span>
        </div>
        <h1 style={S.title}>
          PERFECT<span style={{ color: C.flare }}>·</span>SEASON
        </h1>
        <p style={S.sub}>
          Spin for a club and era. Draft the player. Fill all thirteen and chase a flawless 24–0.
        </p>
      </header>

      {/* loading state */}
      {!pool && source !== "error" && (
        <div style={S.loadCard}>
          <div style={S.loadMsg}>{progress.msg}</div>
          <div style={S.loadTrack}>
            <div style={{ ...S.loadFill, width: `${Math.max(6, progress.p * 100)}%` }} />
          </div>
          <div style={S.loadHint}>
            Aggregating real per-player stats from the Champion Data match centre.
          </div>
        </div>
      )}

      {/* error state — no synthetic data, surface the failure honestly */}
      {!pool && source === "error" && (
        <div style={S.loadCard}>
          <div style={S.errTitle}>Couldn't load the match centre</div>
          <p style={S.errBody}>{error}</p>
          <button
            style={{ ...S.btn, ...S.btnPrimary, marginTop: 18, maxWidth: 220 }}
            onClick={() => setReloadKey((k) => k + 1)}
          >
            TRY AGAIN
          </button>
        </div>
      )}

      {pool && (
        <div className="ps-grid" style={S.grid}>
          {/* LEFT: the reel + full roster */}
          <section style={S.panel}>
            {!done ? (
              <>
                <div style={S.panelHead}>
                  <span style={S.pill}>{picksMade} / 13 DRAFTED</span>
                  <span style={S.posBig}>
                    {pending ? (
                      <span style={{ color: C.flare }}>choose a slot →</span>
                    ) : (
                      "SPIN & DRAFT"
                    )}
                  </span>
                </div>

                <div style={S.reelWrap}>
                  <Reel label="CLUB" value={reels.club} spinning={spinning} big />
                  <Reel label="ERA" value={reels.era} spinning={spinning} />
                </div>

                <div style={S.controls}>
                  {!reels.club || spinning ? (
                    <button
                      style={{ ...S.btn, ...S.btnPrimary, opacity: spinning ? 0.7 : 1 }}
                      onClick={spinFresh}
                      disabled={spinning}
                    >
                      {spinning ? "SPINNING…" : "SPIN"}
                    </button>
                  ) : (
                    <div style={S.rerollRow}>
                      <button
                        style={{ ...S.btn, ...S.btnGhost, opacity: clubReroll ? 1 : 0.35 }}
                        onClick={rerollClub}
                        disabled={!clubReroll}
                      >
                        ↻ CLUB{clubReroll ? "" : " · used"}
                      </button>
                      <button
                        style={{
                          ...S.btn,
                          ...S.btnGhost,
                          opacity: eraReroll && erasForClub(reels.club).length > 1 ? 1 : 0.35,
                        }}
                        onClick={rerollEra}
                        disabled={!eraReroll || erasForClub(reels.club).length <= 1}
                      >
                        ↻ ERA{eraReroll ? "" : " · used"}
                      </button>
                    </div>
                  )}
                </div>

                {pending && (
                  <div style={S.pendingBar}>
                    <span style={S.candRating(pending.rating)}>{pending.rating}</span>
                    <span style={S.pendingText}>
                      <b>{pending.name}</b> is ready — tap an empty position on the team
                      sheet to slot them in.
                    </span>
                    <button style={S.pendingCancel} onClick={cancelPending}>
                      ✕
                    </button>
                  </div>
                )}

                {reels.club && !spinning && !pending && (
                  <div style={S.candWrap}>
                    <div style={S.candHead}>
                      <b style={{ color: C.chalk }}>{reels.club}</b>
                      {reels.era ? <span style={{ color: C.gold }}> · {reels.era}</span> : null}
                      <span style={S.candCount}>{candidates.length} available</span>
                    </div>
                    {candidates.length === 0 ? (
                      <div style={S.empty}>
                        No players left from this draw — spin again for another club.
                      </div>
                    ) : (
                      <div style={S.candScroll}>
                        <div style={S.candList}>
                          {candidates.map((p) => (
                            <button key={p.id} style={S.cand} onClick={() => choose(p)}>
                              <span style={S.candRating(p.rating)}>{p.rating}</span>
                              <span style={S.candMain}>
                                <span style={S.candName}>{p.name}</span>
                                <span style={S.candStats}>
                                  {p.tries}T · {p.runMetres}m · {p.tryAssists}TA · {p.tackles}tk
                                </span>
                              </span>
                              <span style={S.candPick}>SELECT →</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <button style={S.spinAgain} onClick={spinFresh}>
                      ↻ spin again (free)
                    </button>
                  </div>
                )}

                {!reels.club && !pending && (
                  <div style={S.hint}>
                    Hit <b>SPIN</b> to roll a random club and era, then draft any player
                    from their list into any open position. You get one club re-roll and
                    one era re-roll for the whole game.
                  </div>
                )}
              </>
            ) : (
              <ResultCard rec={rec} v={v} avg={avg} onReset={reset} />
            )}
          </section>

          {/* RIGHT: the team sheet */}
          <section style={S.sheet}>
            <div style={S.sheetHead}>
              <span>TEAM SHEET</span>
              <span style={S.sheetAvg}>
                {filled.length ? `AVG ${avg.toFixed(1)}` : "—"}
              </span>
            </div>
            <ol style={S.sheetList}>
              {POSITIONS.map((pos, i) => {
                const p = squad[i];
                const slottable = pending && !p && !done;
                return (
                  <li
                    key={i}
                    onClick={() => slottable && assign(i)}
                    style={{
                      ...S.row,
                      ...(slottable ? S.rowSlottable : null),
                      cursor: slottable ? "pointer" : "default",
                    }}
                  >
                    <span style={S.rowNum}>{pos.n}</span>
                    <span style={S.rowPos}>{pos.code}</span>
                    <span style={S.rowName}>
                      {p ? (
                        <>
                          {p.name}
                          <span style={S.rowMeta}>
                            {p.club}
                            {p.era ? ` · ${p.era}` : ""}
                          </span>
                        </>
                      ) : slottable ? (
                        <span style={{ color: C.flare }}>tap to slot {pending.name}</span>
                      ) : (
                        <span style={{ color: C.line }}>—</span>
                      )}
                    </span>
                    {p && !done ? (
                      <button
                        style={S.rowClear}
                        title="Remove"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearSlot(i);
                        }}
                      >
                        ✕
                      </button>
                    ) : (
                      <span style={p ? S.rowRating(p.rating) : S.rowRatingEmpty}>
                        {p ? p.rating : ""}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
            {filled.length > 0 && !done && (
              <button style={S.resetMini} onClick={reset}>
                start over
              </button>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

/* ---------- reel component ------------------------------------------- */
function Reel({ label, value, spinning, big }) {
  return (
    <div style={{ ...S.reel, ...(big ? S.reelBig : null) }}>
      <div style={S.reelLabel}>{label}</div>
      <div
        style={{
          ...S.reelValue,
          ...(big ? S.reelValueBig : null),
          ...(spinning ? S.reelBlur : null),
          color: value ? (big ? C.chalk : C.gold) : C.line,
        }}
      >
        {value || (label === "ERA" ? "—" : "?")}
      </div>
    </div>
  );
}

/* ---------- result card ---------------------------------------------- */
function ResultCard({ rec, v, avg, onReset }) {
  const perfect = v.tone === "perfect";
  return (
    <div style={{ ...S.result, ...(perfect ? S.resultPerfect : null) }}>
      {perfect && <div style={S.confetti} aria-hidden />}
      <div style={S.resultRec}>
        <span style={{ color: C.win }}>{rec.wins}</span>
        <span style={S.resultDash}>–</span>
        <span style={{ color: rec.losses ? C.loss : C.win }}>{rec.losses}</span>
      </div>
      <div style={S.resultTitle}>{v.t}</div>
      <p style={S.resultSub}>{v.s}</p>
      <div style={S.resultBar}>
        {Array.from({ length: 24 }).map((_, i) => (
          <span
            key={i}
            style={{
              ...S.tick,
              background: i < rec.wins ? C.win : C.line,
            }}
          />
        ))}
      </div>
      <div style={S.resultAvg}>Squad rating {avg.toFixed(1)}</div>
      <button style={{ ...S.btn, ...S.btnPrimary, marginTop: 22 }} onClick={onReset}>
        DRAFT A NEW SIDE
      </button>
    </div>
  );
}

/* =========================== styles ================================== */
const mono = "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace";
const cond =
  "'Oswald', 'Bebas Neue', 'Arial Narrow', system-ui, sans-serif";
const body = "'Inter', system-ui, -apple-system, sans-serif";

const S = {
  root: {
    position: "relative",
    minHeight: "100%",
    background: `radial-gradient(120% 80% at 50% -10%, ${C.grass}22, ${C.pitch} 45%, ${C.pitchDeep})`,
    color: C.chalk,
    fontFamily: body,
    padding: "30px 20px 60px",
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    inset: 0,
    background:
      "repeating-linear-gradient(180deg, transparent 0 38px, rgba(255,255,255,0.012) 38px 76px)",
    pointerEvents: "none",
  },
  header: { position: "relative", maxWidth: 980, margin: "0 auto 26px", textAlign: "center" },
  eyebrow: {
    fontFamily: mono,
    fontSize: 11,
    letterSpacing: "0.32em",
    color: C.chalkDim,
    display: "flex",
    gap: 14,
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
  },
  sourceTag: (s) => ({
    fontSize: 9.5,
    letterSpacing: "0.18em",
    padding: "2px 8px",
    borderRadius: 2,
    border: `1px solid ${s === "live" ? C.grass : C.line}`,
    color: s === "live" ? C.win : C.chalkDim,
  }),
  title: {
    fontFamily: cond,
    fontWeight: 700,
    fontSize: "clamp(48px, 9vw, 104px)",
    lineHeight: 0.86,
    letterSpacing: "0.01em",
    margin: "14px 0 12px",
    textTransform: "uppercase",
  },
  sub: { color: C.chalkDim, maxWidth: 520, margin: "0 auto", fontSize: 15, lineHeight: 1.5 },

  loadCard: {
    position: "relative",
    maxWidth: 460,
    margin: "60px auto",
    textAlign: "center",
  },
  loadMsg: { fontFamily: mono, fontSize: 13, color: C.gold, marginBottom: 14, minHeight: 18 },
  loadTrack: {
    height: 4,
    background: C.line,
    borderRadius: 4,
    overflow: "hidden",
  },
  loadFill: {
    height: "100%",
    background: `linear-gradient(90deg, ${C.flareDim}, ${C.flare})`,
    transition: "width 0.4s ease",
  },
  loadHint: { marginTop: 16, fontSize: 12.5, color: C.chalkDim, lineHeight: 1.5 },
  errTitle: {
    fontFamily: cond,
    fontSize: 24,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    color: C.flare,
    marginBottom: 12,
  },
  errBody: { fontSize: 13.5, color: C.chalkDim, lineHeight: 1.6, margin: 0 },

  grid: {
    position: "relative",
    maxWidth: 980,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "minmax(0,1.1fr) minmax(0,0.9fr)",
    gap: 22,
  },

  panel: {
    background: "rgba(255,255,255,0.025)",
    border: `1px solid ${C.line}`,
    borderRadius: 6,
    padding: 24,
    minHeight: 420,
  },
  panelHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 20,
  },
  pill: {
    fontFamily: mono,
    fontSize: 11,
    letterSpacing: "0.18em",
    color: C.chalkDim,
    border: `1px solid ${C.line}`,
    padding: "4px 9px",
    borderRadius: 3,
  },
  posBig: { fontFamily: cond, fontSize: 22, letterSpacing: "0.04em", textTransform: "uppercase" },

  reelWrap: { display: "flex", gap: 12, marginBottom: 18 },
  reel: {
    flex: 1,
    background: C.pitchDeep,
    border: `1px solid ${C.line}`,
    borderRadius: 5,
    padding: "16px 14px",
    overflow: "hidden",
    position: "relative",
  },
  reelBig: { flex: 1.7 },
  reelLabel: {
    fontFamily: mono,
    fontSize: 10,
    letterSpacing: "0.26em",
    color: C.chalkDim,
    marginBottom: 8,
  },
  reelValue: {
    fontFamily: cond,
    fontSize: 26,
    letterSpacing: "0.02em",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  reelValueBig: { fontSize: 34 },
  reelBlur: { filter: "blur(0.6px)", animation: "flick 0.07s steps(2) infinite", opacity: 0.85 },

  controls: { marginBottom: 8 },
  rerollRow: { display: "flex", gap: 10 },
  spinAgain: {
    marginTop: 12,
    background: "none",
    border: "none",
    color: C.chalkDim,
    fontFamily: mono,
    fontSize: 11,
    letterSpacing: "0.12em",
    cursor: "pointer",
    textDecoration: "underline",
    textUnderlineOffset: 3,
    display: "block",
    width: "100%",
    textAlign: "center",
    padding: "4px 0",
  },
  btn: {
    fontFamily: cond,
    fontSize: 17,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    border: "none",
    borderRadius: 4,
    padding: "13px 22px",
    cursor: "pointer",
    width: "100%",
  },
  btnPrimary: { background: C.flare, color: "#1a0a06", fontWeight: 700 },
  btnGhost: { background: "transparent", color: C.gold, border: `1px solid ${C.gold}66` },

  candWrap: { marginTop: 18, borderTop: `1px dashed ${C.line}`, paddingTop: 16 },
  candHead: { fontSize: 13, color: C.chalkDim, marginBottom: 12, display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" },
  candCount: { fontFamily: mono, fontSize: 10, letterSpacing: "0.14em", color: C.grass, marginLeft: "auto" },
  candScroll: { maxHeight: 340, overflowY: "auto", paddingRight: 4, marginRight: -4 },
  empty: { fontSize: 13, color: C.chalkDim, fontStyle: "italic", padding: "10px 0" },
  hint: { marginTop: 22, fontSize: 13, color: C.chalkDim, lineHeight: 1.6, textAlign: "center", padding: "0 10px" },
  pendingBar: {
    marginTop: 16,
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: `${C.flare}12`,
    border: `1px solid ${C.flare}55`,
    borderRadius: 5,
    padding: "12px 14px",
  },
  pendingText: { flex: 1, fontSize: 13, color: C.chalk, lineHeight: 1.45 },
  pendingCancel: {
    background: "none",
    border: "none",
    color: C.chalkDim,
    fontSize: 16,
    cursor: "pointer",
    lineHeight: 1,
    padding: 4,
  },
  candList: { display: "flex", flexDirection: "column", gap: 7 },
  cand: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "rgba(255,255,255,0.02)",
    border: `1px solid ${C.line}`,
    borderRadius: 4,
    padding: "9px 12px",
    cursor: "pointer",
    textAlign: "left",
    width: "100%",
    color: C.chalk,
    transition: "border-color 0.15s, background 0.15s",
  },
  candRating: (r) => ({
    fontFamily: cond,
    fontSize: 24,
    minWidth: 34,
    textAlign: "center",
    color: r >= 90 ? C.gold : r >= 80 ? C.chalk : C.chalkDim,
  }),
  candMain: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0 },
  candName: { fontSize: 14.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  candStats: { fontFamily: mono, fontSize: 10.5, color: C.chalkDim, marginTop: 2 },
  candPick: { fontFamily: mono, fontSize: 10, letterSpacing: "0.14em", color: C.flare },

  sheet: {
    background: "rgba(255,255,255,0.025)",
    border: `1px solid ${C.line}`,
    borderRadius: 6,
    padding: "20px 20px 22px",
    alignSelf: "start",
  },
  sheetHead: {
    display: "flex",
    justifyContent: "space-between",
    fontFamily: mono,
    fontSize: 11,
    letterSpacing: "0.2em",
    color: C.chalkDim,
    paddingBottom: 12,
    borderBottom: `1px solid ${C.line}`,
  },
  sheetAvg: { color: C.gold },
  sheetList: { listStyle: "none", margin: 0, padding: 0 },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 4px",
    borderBottom: `1px solid ${C.line}55`,
  },
  rowSlottable: {
    background: `${C.flare}12`,
    boxShadow: `inset 3px 0 0 ${C.flare}`,
    borderRadius: 2,
  },
  rowClear: {
    background: "none",
    border: "none",
    color: C.flareDim,
    fontSize: 13,
    cursor: "pointer",
    minWidth: 28,
    textAlign: "right",
    padding: 0,
    lineHeight: 1,
  },
  rowNum: {
    fontFamily: cond,
    fontSize: 16,
    color: C.chalkDim,
    minWidth: 18,
    textAlign: "center",
  },
  rowPos: {
    fontFamily: mono,
    fontSize: 10,
    color: C.chalkDim,
    minWidth: 22,
    letterSpacing: "0.08em",
  },
  rowName: { flex: 1, fontSize: 13.5, display: "flex", flexDirection: "column", minWidth: 0 },
  rowMeta: { fontSize: 10.5, color: C.chalkDim, marginTop: 1 },
  rowRating: (r) => ({
    fontFamily: cond,
    fontSize: 20,
    color: r >= 90 ? C.gold : C.chalk,
    minWidth: 28,
    textAlign: "right",
  }),
  rowRatingEmpty: { minWidth: 28 },
  resetMini: {
    marginTop: 14,
    background: "none",
    border: "none",
    color: C.chalkDim,
    fontFamily: mono,
    fontSize: 11,
    letterSpacing: "0.12em",
    cursor: "pointer",
    textDecoration: "underline",
    textUnderlineOffset: 3,
  },

  result: { textAlign: "center", padding: "20px 6px", position: "relative" },
  resultPerfect: {},
  confetti: {
    position: "absolute",
    inset: -24,
    background:
      `radial-gradient(circle at 20% 10%, ${C.gold}33, transparent 12%),` +
      `radial-gradient(circle at 80% 20%, ${C.flare}33, transparent 12%),` +
      `radial-gradient(circle at 60% 80%, ${C.win}33, transparent 12%)`,
    animation: "pulse 2.4s ease-in-out infinite",
    pointerEvents: "none",
  },
  resultRec: {
    fontFamily: cond,
    fontSize: "clamp(64px, 14vw, 120px)",
    lineHeight: 1,
    display: "flex",
    justifyContent: "center",
    gap: 8,
    alignItems: "baseline",
  },
  resultDash: { color: C.chalkDim, fontSize: "0.6em" },
  resultTitle: {
    fontFamily: cond,
    fontSize: 30,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: C.gold,
    marginTop: 6,
  },
  resultSub: { color: C.chalkDim, fontSize: 14.5, maxWidth: 340, margin: "10px auto 0", lineHeight: 1.5 },
  resultBar: { display: "flex", gap: 3, justifyContent: "center", marginTop: 22, flexWrap: "wrap", maxWidth: 320, marginLeft: "auto", marginRight: "auto" },
  tick: { width: 8, height: 16, borderRadius: 1 },
  resultAvg: { fontFamily: mono, fontSize: 12, color: C.chalkDim, letterSpacing: "0.14em", marginTop: 16 },

};

const KEYFRAMES = `
@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
@keyframes flick { 0%{transform:translateY(0)} 100%{transform:translateY(-1px)} }
@keyframes pulse { 0%,100%{opacity:0.5} 50%{opacity:1} }
@media (max-width: 760px){
  .ps-grid { grid-template-columns: 1fr !important; }
}
`;
