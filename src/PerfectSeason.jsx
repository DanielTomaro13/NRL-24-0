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

// Full 1–13 starting line-up: two wings, two centres, two props, two
// second-rowers, exactly as a real team sheet reads.
const POSITIONS_FULL = [
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

// Quick game: one player for each of the nine distinct positions.
const POSITIONS_QUICK = [
  { code: "FB", name: "Fullback", n: 1 },
  { code: "WG", name: "Wing", n: 2 },
  { code: "CE", name: "Centre", n: 3 },
  { code: "FE", name: "Five-Eighth", n: 4 },
  { code: "HB", name: "Halfback", n: 5 },
  { code: "HK", name: "Hooker", n: 6 },
  { code: "PR", name: "Prop", n: 7 },
  { code: "2R", name: "Second Row", n: 8 },
  { code: "LK", name: "Lock", n: 9 },
];

const MODES = {
  quick: { positions: POSITIONS_QUICK, label: "Quick Nine", count: 9 },
  full: { positions: POSITIONS_FULL, label: "Full Line-up", count: 13 },
};

// Champion Data's `position` string → our team-sheet code. "Interchange"
// has no fixed slot, so it's resolved to a player's most common starting
// position elsewhere; a pure-bench player falls back to Lock (utility fwd).
const POS_NAME_TO_CODE = {
  Fullback: "FB",
  Wing: "WG",
  Centre: "CE",
  "Five-Eighth": "FE",
  "Five-eighth": "FE",
  Halfback: "HB",
  Prop: "PR",
  Hooker: "HK",
  "Second Row": "2R",
  "Second-Row": "2R",
  Lock: "LK",
};
const POS_CODE_LABEL = {
  FB: "Fullback", WG: "Wing", CE: "Centre", FE: "Five-Eighth",
  HB: "Halfback", PR: "Prop", HK: "Hooker", "2R": "Second Row", LK: "Lock",
};



/* ---------- rating model: official 2026 fantasy point scoring --------- */
/* Every stat the match-centre exposes is folded in using the published
   "8.3 THE POINTS" values, so a rating reflects a player's real per-game
   fantasy output rather than a handful of cherry-picked categories. The
   averaged points are then mapped through a sigmoid into a 60–99 band.
   (A few scoring lines — 6-again, turnovers, escape-in-goal — have no
   dedicated feed field and are simply omitted.)                          */

// every player-stat field we sum so the average is available to scoreFantasy
const STAT_KEYS = [
  "tries", "conversions", "penaltyGoals", "fieldGoals", "tryAssists",
  "lineBreaks", "lineBreakAssists", "tackles", "tackleBreaks", "missedTackles",
  "offloads", "errors", "fortyTwenty", "metresGained", "kickMetres",
  "penaltiesConceded", "sinBins", "sentOffs", "trySaves", "bombKicksCaught",
  "runMetres", // kept for the candidate-card stat line
];

// per-game fantasy points from averaged stats (linear, so averaging is exact
// apart from the metre divisors, where rounding the average is close enough)
function scoreFantasy(s) {
  const g = (k) => Number(s[k]) || 0;
  return (
    g("tries") * 8 +
    (g("conversions") + g("penaltyGoals")) * 2 + // goals
    g("fieldGoals") * 5 +
    g("tryAssists") * 5 +
    g("lineBreaks") * 4 +
    g("lineBreakAssists") * 2 +
    g("tackles") * 1 +
    g("tackleBreaks") * 2 +
    g("missedTackles") * -2 +
    g("offloads") * 3 + // feed doesn't split to-hand (4) vs to-ground (2)
    g("errors") * -2 +
    g("fortyTwenty") * 4 +
    Math.floor(g("metresGained") / 10) +
    Math.floor(g("kickMetres") / 30) +
    g("penaltiesConceded") * -2 +
    g("sinBins") * -5 +
    g("sentOffs") * -10 +
    g("trySaves") * 5 +
    g("bombKicksCaught") * 1 // kicks defused
  );
}

function rateFromStats(s) {
  const fp = scoreFantasy(s);
  // calibrated on live data: median starter ~32 fp/game, p90 ~58.
  // center 30, spread 17 -> median ~82, p90 ~93, elite -> high 90s.
  const t = 1 / (1 + Math.exp(-(fp - 30) / 17));
  const r = 62 + t * 37; // 62..99
  return Math.round(Math.min(99, Math.max(60, r)));
}

function poolFetch(url) {
  return fetch(url, { headers: { Accept: "application/json, text/plain, */*" } })
    .then((r) => (r.ok ? r.text() : Promise.reject(new Error(r.status))))
    .then((t) => JSON.parse(t)); // CDN sometimes labels JSON as text/plain
}

function arr(x) {
  return Array.isArray(x) ? x : x == null ? [] : [x];
}

// run async `fn` over `items` with a bounded number in flight, reporting
// progress as each settles. Lets us pull *every* match without opening
// hundreds of sockets at once.
async function mapLimit(items, limit, fn, onEach) {
  const out = new Array(items.length);
  let i = 0;
  let finished = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx], idx);
      finished++;
      onEach?.(finished, items.length);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

/* Walk the live feeds and aggregate a player pool. Bounded so it never
   hammers the CDN: a capped number of competitions, and a capped number
   of completed matches per competition. */
async function buildLivePool({ maxComps = 30, matchesPerComp = Infinity, concurrency = 12, onProgress }) {
  const cat = await poolFetch(`${API}/data/competitions.json`);
  // Men's NRL Premiership only — every season is named ".. NRL Premiership"
  // (e.g. "2026 Telstra NRL Premiership", "2014 NRL Premiership"). Matching
  // the phrase "nrl premiership" gives exactly one comp per season 2014→now
  // and cleanly excludes NRLW, State of Origin, Women's, and the shared
  // catalogue's other sports (e.g. the netball ANZ Premiership). No fallback
  // to the full catalogue — if this matches nothing, the caller surfaces it.
  let comps = arr(cat?.competitionDetails?.competition).filter((c) =>
    String(c.name || "").toLowerCase().includes("nrl premiership")
  );
  // newest seasons first, capped (the cap is generous — all NRL seasons fit)
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
    // pull every completed match in the season (capped only by matchesPerComp,
    // which defaults to Infinity) so each player's rating uses their full sample
    const sample =
      matches.length > matchesPerComp ? matches.slice(0, matchesPerComp) : matches;

    // fetch the season's match files with bounded concurrency, folding each in
    const files = await mapLimit(
      sample,
      concurrency,
      (m) =>
        poolFetch(`${API}/data/${comp.id}/${m.matchId}.json`)
          .then((mf) => ({ m, mf }))
          .catch(() => null),
      (fin, tot) => {
        const frac = (done + fin / tot) / total;
        onProgress?.(`Reading ${comp.name} — ${fin}/${tot} matches…`, frac);
      }
    );

    for (const entry of files) {
      if (!entry) continue;
      const { m, mf } = entry;
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
        // key per player-SEASON so each era is its own draftable card:
        // 2016 and 2020 of the same player are distinct entries, and the
        // club is whoever they suited up for that season.
        const key = `${p.playerId}-${comp.season}`;
        const club =
          squads[p.squadId] ||
          (p.squadId === m.homeSquadId ? m.homeSquadName : m.awaySquadName) ||
          "NRL";
        if (!agg.has(key)) {
          agg.set(key, {
            id: `live-${key}`,
            name: names[key] || names[p.playerId] || `Player ${p.playerId}`,
            club,
            era: String(comp.season || ""),
            sums: {},
            games: 0,
            posCounts: {}, // tally of named starting positions across games
          });
        }
        const rec = agg.get(key);
        rec.games += 1;
        const code = POS_NAME_TO_CODE[String(p.position || "").trim()];
        if (code) rec.posCounts[code] = (rec.posCounts[code] || 0) + 1;
        STAT_KEYS.forEach((k) => {
          rec.sums[k] = (rec.sums[k] || 0) + (Number(p[k]) || 0);
        });
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
    // primary position = most-played named position; pure bench → Lock
    const pos =
      Object.entries(rec.posCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "LK";
    pool.push({
      id: rec.id,
      name: rec.name,
      club: rec.club,
      era: rec.era,
      pos,
      posName: POS_CODE_LABEL[pos] || "Lock",
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

  const [mode, setMode] = useState(null); // null until the player picks quick/full
  const [squad, setSquad] = useState([]);
  const [reels, setReels] = useState({ club: null, era: null });
  const [spinning, setSpinning] = useState(false);
  const [clubReroll, setClubReroll] = useState(true); // 1 per game
  const [eraReroll, setEraReroll] = useState(true); // 1 per game
  const [notice, setNotice] = useState(null); // transient "position full" message
  const reelTimer = useRef(null);

  // the slot layout for the chosen mode (defaults to full so derived values
  // are safe before a mode is picked; the game UI is gated on `mode` anyway)
  const positions = MODES[mode]?.positions || POSITIONS_FULL;
  const total = positions.length;
  const firstEmpty = squad.findIndex((s) => !s);
  const done = squad.length > 0 && firstEmpty === -1;
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
          // keep the whole pool — every season/club combo stays spinnable
          // (each player-season is one entry, so this is a few thousand max)
          setPool(p.slice(0, 8000));
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

  // clubs that still field an undrafted player in a given era — used so a
  // club re-roll can keep the current era fixed (only swap the club).
  const clubsForEra = useCallback(
    (era) => {
      if (!pool) return [];
      return Array.from(
        new Set(pool.filter((p) => p.era === era && undrafted(p)).map((p) => p.club))
      );
    },
    [pool, undrafted]
  );

  // animate the reels, then settle on `target` (which is guaranteed valid).
  // lockClub / lockEra hold that reel steady through the flicker.
  const animateTo = useCallback(
    (target, { lockClub = false, lockEra = false } = {}) => {
      setSpinning(true);
      let ticks = 0;
      const maxTicks = 14 + Math.floor(Math.random() * 8);
      clearInterval(reelTimer.current);
      const allClubs = clubsWithPlayers();
      reelTimer.current = setInterval(() => {
        ticks++;
        const flickClub = lockClub ? target.club : rnd(allClubs.length ? allClubs : [target.club]);
        let flickEra;
        if (lockEra) {
          flickEra = target.era;
        } else {
          const subEras = erasForClub(flickClub);
          flickEra = subEras.length ? rnd(subEras) : null;
        }
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
    animateTo({ club, era: es.length ? rnd(es) : null });
  }

  // reroll just the club, holding the era fixed where possible; 1/game
  function rerollClub() {
    if (!pool || spinning || done || !clubReroll || !reels.club) return;
    // prefer other clubs that still have players in the SAME era so only the
    // club reel changes; fall back to any club (era follows) if none remain.
    const sameEra = clubsForEra(reels.era).filter((c) => c !== reels.club);
    if (sameEra.length) {
      setClubReroll(false);
      animateTo({ club: rnd(sameEra), era: reels.era }, { lockEra: true });
      return;
    }
    const cs = clubsWithPlayers().filter((c) => c !== reels.club);
    const pickFrom = cs.length ? cs : clubsWithPlayers();
    if (!pickFrom.length) return;
    setClubReroll(false);
    const club = rnd(pickFrom);
    const es = erasForClub(club);
    animateTo({ club, era: es.length ? rnd(es) : null });
  }

  // reroll just the era, keep the club fixed; 1/game
  function rerollEra() {
    if (!pool || spinning || done || !eraReroll || !reels.club) return;
    const es = erasForClub(reels.club).filter((e) => e !== reels.era);
    if (!es.length) return; // no other era available for this club
    setEraReroll(false);
    animateTo({ club: reels.club, era: rnd(es) }, { lockClub: true });
  }

  // is a player's natural position full? (counts every slot of that code)
  const positionFull = useCallback(
    (code) => !positions.some((pos, i) => pos.code === code && !squad[i]),
    [positions, squad]
  );

  // drafting a player drops them into their own position; if every slot for
  // that position is taken, the pick is blocked and the user picks another.
  function draft(player) {
    if (spinning || done) return;
    const slot = positions.findIndex(
      (pos, i) => pos.code === player.pos && !squad[i]
    );
    if (slot === -1) {
      setNotice(
        `${POS_CODE_LABEL[player.pos] || "That position"} is full — draft a different player.`
      );
      return;
    }
    setSquad((sq) => {
      const next = sq.slice();
      next[slot] = { ...player };
      return next;
    });
    setNotice(null);
    setReels({ club: null, era: null });
  }

  // start a fresh game in the given mode
  function startGame(m) {
    setMode(m);
    setSquad(MODES[m].positions.map(() => null));
    setReels({ club: null, era: null });
    setClubReroll(true);
    setEraReroll(true);
    setNotice(null);
  }

  // draft a new side in the same mode
  function reset() {
    setSquad(positions.map(() => null));
    setReels({ club: null, era: null });
    setClubReroll(true);
    setEraReroll(true);
    setNotice(null);
  }

  // back to the mode picker
  function changeMode() {
    setMode(null);
    setSquad([]);
    setReels({ club: null, era: null });
    setNotice(null);
  }

  const filled = squad.filter(Boolean);
  const avg =
    filled.length > 0 ? filled.reduce((a, b) => a + b.rating, 0) / filled.length : 0;
  const rec = recordFromRating(avg);
  const v = verdict(rec.wins);

  // when the spun club genuinely has nobody draftable for an open slot, the
  // player can't be forced to pick — allow a free re-spin in that case only.
  const noDraftable =
    !!reels.club &&
    !spinning &&
    (candidates.length === 0 || candidates.every((c) => positionFull(c.pos)));

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
          Spin for a club and era. Draft the player. Fill your side and chase a flawless 24–0.
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

      {/* mode picker — choose the game length before drafting */}
      {pool && !mode && (
        <div style={S.modeWrap}>
          <div style={S.modeIntro}>Choose your game</div>
          <div style={S.modeRow}>
            <button style={S.modeCard} onClick={() => startGame("quick")}>
              <div style={S.modeCount}>9</div>
              <div style={S.modeName}>QUICK NINE</div>
              <div style={S.modeDesc}>
                One player for each of the nine positions. A fast all-time
                spine — fullback through lock.
              </div>
            </button>
            <button style={S.modeCard} onClick={() => startGame("full")}>
              <div style={S.modeCount}>13</div>
              <div style={S.modeName}>FULL LINE-UP</div>
              <div style={S.modeDesc}>
                The complete 1–13 team sheet: two wings, two centres, two
                props and two second-rowers.
              </div>
            </button>
          </div>
        </div>
      )}

      {pool && mode && (
        <div className="ps-grid" style={S.grid}>
          {/* LEFT: the reel + full roster */}
          <section style={S.panel}>
            {!done ? (
              <>
                <div style={S.panelHead}>
                  <span style={S.pill}>{picksMade} / {total} DRAFTED</span>
                  <span style={S.posBig}>SPIN &amp; DRAFT</span>
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

                {notice && (
                  <div style={S.noticeBar}>
                    <span style={S.noticeText}>{notice}</span>
                    <button style={S.pendingCancel} onClick={() => setNotice(null)}>
                      ✕
                    </button>
                  </div>
                )}

                {reels.club && !spinning && (
                  <div style={S.candWrap}>
                    <div style={S.candHead}>
                      <b style={{ color: C.chalk }}>{reels.club}</b>
                      {reels.era ? <span style={{ color: C.gold }}> · {reels.era}</span> : null}
                      <span style={S.candCount}>{candidates.length} available</span>
                    </div>
                    {candidates.length === 0 ? (
                      <div style={S.empty}>
                        No players left from this draw.
                      </div>
                    ) : (
                      <div style={S.candScroll}>
                        <div style={S.candList}>
                          {candidates.map((p) => {
                            const full = positionFull(p.pos);
                            return (
                              <button
                                key={p.id}
                                style={{ ...S.cand, ...(full ? S.candFull : null) }}
                                onClick={() => draft(p)}
                                disabled={full}
                                title={full ? `${p.posName} is already full` : ""}
                              >
                                <span style={S.candRating(p.rating)}>{p.rating}</span>
                                <span style={S.candMain}>
                                  <span style={S.candName}>
                                    {p.name}
                                    <span style={S.candPos}>{p.pos}</span>
                                  </span>
                                  <span style={S.candStats}>
                                    {p.tries}T · {p.runMetres}m · {p.tryAssists}TA · {p.tackles}tk
                                  </span>
                                </span>
                                <span style={S.candPick}>
                                  {full ? `${p.pos} FULL` : `DRAFT · ${p.pos} →`}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {noDraftable && (
                      <button style={{ ...S.btn, ...S.btnPrimary, marginTop: 12 }} onClick={spinFresh}>
                        SPIN AGAIN
                      </button>
                    )}
                  </div>
                )}

                {!reels.club && (
                  <div style={S.hint}>
                    Hit <b>SPIN</b> to roll a random club and era, then draft a player —
                    they slot straight into their own position. Once you spin you have to
                    draft from that club, so spend your <b>one club re-roll</b> and{" "}
                    <b>one era re-roll</b> wisely.
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
              {positions.map((pos, i) => {
                const p = squad[i];
                return (
                  <li key={i} style={S.row}>
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
                      ) : (
                        <span style={{ color: C.line }}>—</span>
                      )}
                    </span>
                    {/* drafted players are locked in — record stands as picked */}
                    <span style={p ? S.rowRating(p.rating) : S.rowRatingEmpty}>
                      {p ? p.rating : ""}
                    </span>
                  </li>
                );
              })}
            </ol>
            <div style={S.sheetFoot}>
              {filled.length > 0 && !done && (
                <button style={S.resetMini} onClick={reset}>
                  start over
                </button>
              )}
              <button style={S.resetMini} onClick={changeMode}>
                change mode
              </button>
            </div>
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

  modeWrap: { position: "relative", maxWidth: 720, margin: "30px auto 0", textAlign: "center" },
  modeIntro: {
    fontFamily: mono,
    fontSize: 12,
    letterSpacing: "0.24em",
    color: C.chalkDim,
    textTransform: "uppercase",
    marginBottom: 18,
  },
  modeRow: { display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" },
  modeCard: {
    flex: "1 1 260px",
    maxWidth: 320,
    textAlign: "left",
    background: "rgba(255,255,255,0.025)",
    border: `1px solid ${C.line}`,
    borderRadius: 8,
    padding: "22px 22px 24px",
    cursor: "pointer",
    color: C.chalk,
    transition: "border-color 0.15s, background 0.15s",
  },
  modeCount: { fontFamily: cond, fontSize: 52, lineHeight: 1, color: C.flare },
  modeName: {
    fontFamily: cond,
    fontSize: 22,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    margin: "8px 0 8px",
  },
  modeDesc: { fontSize: 13, color: C.chalkDim, lineHeight: 1.55 },
  sheetFoot: { display: "flex", gap: 18, marginTop: 14, alignItems: "center" },

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
  noticeBar: {
    marginTop: 16,
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: `${C.flare}12`,
    border: `1px solid ${C.flare}55`,
    borderRadius: 5,
    padding: "12px 14px",
  },
  noticeText: { flex: 1, fontSize: 13, color: C.chalk, lineHeight: 1.45 },
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
  candName: { fontSize: 14.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 7, minWidth: 0 },
  candPos: {
    fontFamily: mono,
    fontSize: 9.5,
    letterSpacing: "0.1em",
    color: C.gold,
    border: `1px solid ${C.gold}55`,
    borderRadius: 3,
    padding: "1px 5px",
    flexShrink: 0,
  },
  candStats: { fontFamily: mono, fontSize: 10.5, color: C.chalkDim, marginTop: 2 },
  candPick: { fontFamily: mono, fontSize: 10, letterSpacing: "0.14em", color: C.flare, whiteSpace: "nowrap" },
  candFull: { opacity: 0.4, cursor: "not-allowed", filter: "grayscale(0.6)" },

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
