/**
 * NRL 24-0 data pipeline.
 * ---------------------------------------------------------------------------
 * Walks Champion Data's match-centre CDN (mc.championdata.com) — the same
 * anonymous JSON feeds nrl.com reads — and aggregates every completed NRL
 * Premiership match into a static dataset the web app consumes at build time.
 *
 * There is no roster-by-era endpoint, so the player pool is built by walking
 * each season's fixture, loading completed match files, and aggregating each
 * player's real per-match stats. Club = the squad they suited up for; "era" =
 * the competition season. Real team scores are summed from player scoring stats
 * (tries 4, goals 2, field goals 1) so the ladder/fixtures need no extra feed.
 *
 * Outputs → web/public/data/:
 *   meta.json        seasons, latest season, clubs, clubsBySeason
 *   pool.json        every player-season card (drives the /play draft)
 *   games.json       career-aggregated unique players + team strengths (mini-games)
 *   results.json     completed match results grouped by season (fixtures/ladder)
 *   strengths.json   per-season club strength distribution (the simulator)
 *
 * Env knobs (all optional):
 *   MAX_SEASONS=12   cap number of seasons (newest first)
 *   MAX_MATCHES=0    cap matches per season (0 = all)
 *   CONCURRENCY=16   in-flight match fetches
 */
import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const API = process.env.API_BASE || "https://mc.championdata.com";
const MAX_SEASONS = Number(process.env.MAX_SEASONS || 30);
const MAX_MATCHES = Number(process.env.MAX_MATCHES || 0); // 0 = all
const CONCURRENCY = Number(process.env.CONCURRENCY || 16);

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "web", "public", "data");

/* ---- rating model: official 2026 fantasy point scoring (ported from app) -- */
const STAT_KEYS = [
  "tries", "conversions", "penaltyGoals", "fieldGoals", "tryAssists",
  "lineBreaks", "lineBreakAssists", "tackles", "tackleBreaks", "missedTackles",
  "offloads", "errors", "fortyTwenty", "metresGained", "kickMetres",
  "penaltiesConceded", "sinBins", "sentOffs", "trySaves", "bombKicksCaught",
  "runMetres",
];

function scoreFantasy(s) {
  const g = (k) => Number(s[k]) || 0;
  return (
    g("tries") * 8 +
    (g("conversions") + g("penaltyGoals")) * 2 +
    g("fieldGoals") * 5 +
    g("tryAssists") * 5 +
    g("lineBreaks") * 4 +
    g("lineBreakAssists") * 2 +
    g("tackles") * 1 +
    g("tackleBreaks") * 2 +
    g("missedTackles") * -2 +
    g("offloads") * 3 +
    g("errors") * -2 +
    g("fortyTwenty") * 4 +
    Math.floor(g("metresGained") / 10) +
    Math.floor(g("kickMetres") / 30) +
    g("penaltiesConceded") * -2 +
    g("sinBins") * -5 +
    g("sentOffs") * -10 +
    g("trySaves") * 5 +
    g("bombKicksCaught") * 1
  );
}

function rateFromStats(s) {
  const fp = scoreFantasy(s);
  const t = 1 / (1 + Math.exp(-(fp - 30) / 17));
  const r = 62 + t * 37;
  return Math.round(Math.min(99, Math.max(60, r)));
}

/* real match points a player contributed: try 4, goal 2, field goal 1 */
function matchPoints(s) {
  const g = (k) => Number(s[k]) || 0;
  return g("tries") * 4 + (g("conversions") + g("penaltyGoals")) * 2 + g("fieldGoals") * 1;
}

/* a compact, display-ready box-score line for one player in one match */
function boxEntry(p, name) {
  const g = (k) => Number(p[k]) || 0;
  return {
    pid: p.playerId, name, pos: String(p.position || "").trim(),
    pts: matchPoints(p),
    t: g("tries"), g: g("conversions") + g("penaltyGoals"), fg: g("fieldGoals"),
    ta: g("tryAssists"), lb: g("lineBreaks"),
    rm: Math.round(g("runMetres") || g("metresGained")),
    tk: g("tackles"), tb: g("tackleBreaks"), mt: g("missedTackles"),
    off: g("offloads"), err: g("errors"),
  };
}

const POS_NAME_TO_CODE = {
  Fullback: "FB", Wing: "WG", Centre: "CE",
  "Five-Eighth": "FE", "Five-eighth": "FE", Halfback: "HB",
  Prop: "PR", Hooker: "HK", "Second Row": "2R", "Second-Row": "2R", Lock: "LK",
};
const POS_CODE_LABEL = {
  FB: "Fullback", WG: "Wing", CE: "Centre", FE: "Five-Eighth",
  HB: "Halfback", PR: "Prop", HK: "Hooker", "2R": "Second Row", LK: "Lock",
};

/* ---- fetch helpers -------------------------------------------------------- */
function poolFetch(url) {
  return fetch(url, { headers: { Accept: "application/json, text/plain, */*" } })
    .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`${r.status} ${url}`))))
    .then((t) => JSON.parse(t));
}
const arr = (x) => (Array.isArray(x) ? x : x == null ? [] : [x]);

async function mapLimit(items, limit, fn, onEach) {
  const out = new Array(items.length);
  let i = 0, finished = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      try { out[idx] = await fn(items[idx], idx); }
      catch { out[idx] = null; }
      onEach?.(++finished, items.length);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

/* ---- competitions to build (NRL is the primary; NRLW mirrors it) ---------- */
const COMP_DEFS = [
  { label: "nrl", match: (n) => n.includes("nrl premiership") },
  // NRLW regular seasons are named e.g. "2024 NRLW" (Finals/Origin/All Stars excluded)
  { label: "nrlw", match: (n) => /\bnrlw\b/.test(n) && !/(final|origin|all stars|nines|pacific)/.test(n) },
];

/* ---- main ----------------------------------------------------------------- */
async function main() {
  console.log("→ Fetching competition catalogue…");
  const cat = await poolFetch(`${API}/data/competitions.json`);
  const all = arr(cat?.competitionDetails?.competition);
  for (const def of COMP_DEFS) {
    let comps = all.filter((c) => def.match(String(c.name || "").toLowerCase()));
    comps.sort((a, b) => (b.season || 0) - (a.season || 0));
    comps = comps.slice(0, MAX_SEASONS);
    console.log(`\n=== ${def.label.toUpperCase()} — ${comps.length} seasons: ${comps.map((c) => c.name).join(", ")} ===`);
    await buildComp(def.label, comps);
  }
}

async function buildComp(label, comps) {
  const t0 = Date.now();
  const outDir = join(OUT_DIR, label);

  const agg = new Map();             // playerKey -> per player-season aggregate
  const resultsBySeason = {};        // season -> [{id, round, home, away, hs, as}]
  const clubsBySeason = {};          // season -> Set(club)
  const boxscores = [];              // one self-contained box score per match

  for (const comp of comps) {
    // Use the leading token of the comp name as the era so two comps that share
    // a season year stay distinct (e.g. NRLW's "2022 NRLW" and "2022B NRLW").
    const season = String(comp.name || "").trim().split(/\s+/)[0] || String(comp.season || "");
    let fixture;
    try { fixture = await poolFetch(`${API}/data/${comp.id}/fixture.json`); }
    catch (e) { console.log(`  ! skip ${season}: ${e.message}`); continue; }

    const matches = arr(fixture?.fixture?.match).filter((m) =>
      /full time|complete|final/i.test(m.matchStatus || "")
    );
    const sample = MAX_MATCHES > 0 ? matches.slice(0, MAX_MATCHES) : matches;
    console.log(`→ ${season}: ${sample.length} completed matches`);

    const files = await mapLimit(sample, CONCURRENCY, (m) =>
      poolFetch(`${API}/data/${comp.id}/${m.matchId}.json`).then((mf) => ({ m, mf }))
    );

    resultsBySeason[season] ||= [];
    clubsBySeason[season] ||= new Set();

    for (const entry of files) {
      if (!entry) continue;
      const { m, mf } = entry;
      const ms = mf?.matchStats || {};
      const squads = {};
      arr(ms?.teamInfo?.team).forEach((t) => { squads[t.squadId] = t.squadName; });
      const names = {};
      arr(ms?.playerInfo?.player).forEach((p) => {
        names[p.playerId] = [p.firstname, p.surname].filter(Boolean).join(" ").trim();
      });

      const teamScore = {}; // squadId -> points (summed from player scoring)
      const homeLineup = [], awayLineup = [];
      arr(ms?.playerStats?.player).forEach((p) => {
        const key = `${p.playerId}-${season}`;
        const club =
          squads[p.squadId] ||
          (p.squadId === m.homeSquadId ? m.homeSquadName : m.awaySquadName) || "NRL";
        clubsBySeason[season].add(club);
        if (!agg.has(key)) {
          agg.set(key, {
            id: `cd-${key}`, pid: p.playerId,
            name: names[p.playerId] || `Player ${p.playerId}`,
            club, era: season, sums: {}, games: 0, posCounts: {},
          });
        }
        const rec = agg.get(key);
        rec.games += 1;
        const code = POS_NAME_TO_CODE[String(p.position || "").trim()];
        if (code) rec.posCounts[code] = (rec.posCounts[code] || 0) + 1;
        STAT_KEYS.forEach((k) => { rec.sums[k] = (rec.sums[k] || 0) + (Number(p[k]) || 0); });
        teamScore[p.squadId] = (teamScore[p.squadId] || 0) + matchPoints(p);

        const be = boxEntry(p, names[p.playerId] || `Player ${p.playerId}`);
        if (p.squadId === m.homeSquadId) homeLineup.push(be);
        else if (p.squadId === m.awaySquadId) awayLineup.push(be);
      });

      const home = m.homeSquadName, away = m.awaySquadName;
      const hs = teamScore[m.homeSquadId] ?? 0, as = teamScore[m.awaySquadId] ?? 0;
      const round = Number(m.round || m.roundNumber || 0) || 0;
      if (home && away) {
        const id = String(m.matchId);
        resultsBySeason[season].push({ id, round, home, away, hs, as });
        if (homeLineup.length && awayLineup.length) {
          boxscores.push({
            id, comp: label, season, round, home, away, hs, as,
            date: m.matchTime || m.localStartTime || null,
            venue: m.venueName || m.venue || null,
            homeLineup, awayLineup,
          });
        }
      }
    }
  }

  /* ---- build the per player-season pool ---------------------------------- */
  const pool = [];
  for (const rec of agg.values()) {
    if (rec.games < 1) continue;
    const avg = {};
    Object.keys(rec.sums).forEach((k) => (avg[k] = rec.sums[k] / rec.games));
    const counts = Object.entries(rec.posCounts).sort((a, b) => b[1] - a[1]);
    const pos = counts[0]?.[0] || "LK";
    // positions the player genuinely played this season (>=20% of games, min 2),
    // so a one-position player has a single eligible slot and never needs a choice
    const thresh = Math.max(2, rec.games * 0.2);
    const elig = counts.filter(([, c]) => c >= thresh).map(([code]) => code);
    if (!elig.includes(pos)) elig.unshift(pos);
    pool.push({
      id: rec.id, pid: rec.pid, name: rec.name, club: rec.club, era: rec.era,
      pos, posName: POS_CODE_LABEL[pos] || "Lock", elig, rating: rateFromStats(avg),
      // g + lineBreaks are needed by the career aggregator below but are NOT
      // shipped to the client — they're stripped from pool.json at write time
      // (POOL_SHIP) to keep the heaviest payload lean. tackleBreaks is unused.
      g: rec.games,
      lineBreaks: +(avg.lineBreaks || 0).toFixed(2),
      tries: +(avg.tries || 0).toFixed(2),
      runMetres: Math.round(avg.runMetres || avg.metresGained || 0),
      tryAssists: +(avg.tryAssists || 0).toFixed(2),
      tackles: Math.round(avg.tackles || 0),
    });
  }
  pool.sort((a, b) => b.rating - a.rating);
  console.log(`✓ pool: ${pool.length} player-season cards`);

  /* ---- career-aggregated unique players for the mini-games --------------- */
  const careers = new Map(); // pid -> aggregate across seasons
  for (const p of pool) {
    let c = careers.get(p.pid);
    if (!c) {
      c = {
        id: p.pid, name: p.name, clubCounts: {}, posCounts: {},
        seasons: new Set(), apps: 0, tries: 0, tryAssists: 0, lineBreaks: 0,
        runMetresSum: 0, tacklesSum: 0, bestRating: 0,
      };
      careers.set(p.pid, c);
    }
    c.clubCounts[p.club] = (c.clubCounts[p.club] || 0) + p.g;
    c.posCounts[p.pos] = (c.posCounts[p.pos] || 0) + p.g;
    c.seasons.add(parseInt(p.era, 10));
    c.apps += p.g;
    c.tries += p.tries * p.g;
    c.tryAssists += p.tryAssists * p.g;
    c.lineBreaks += p.lineBreaks * p.g;
    c.runMetresSum += p.runMetres * p.g;
    c.tacklesSum += p.tackles * p.g;
    c.bestRating = Math.max(c.bestRating, p.rating);
  }
  const gamePlayers = [];
  for (const c of careers.values()) {
    if (c.apps < 8) continue; // enough of a sample to be guessable
    const club = Object.entries(c.clubCounts).sort((a, b) => b[1] - a[1])[0][0];
    const pos = Object.entries(c.posCounts).sort((a, b) => b[1] - a[1])[0][0];
    const yrs = [...c.seasons].sort((a, b) => a - b);
    const fame = Math.round(c.bestRating + Math.min(20, c.apps / 10) + c.tries / 5);
    gamePlayers.push({
      id: c.id, name: c.name, club, pos, posName: POS_CODE_LABEL[pos] || "Lock",
      firstYear: yrs[0], lastYear: yrs[yrs.length - 1], apps: c.apps,
      tries: Math.round(c.tries), tryAssists: Math.round(c.tryAssists),
      lineBreaks: Math.round(c.lineBreaks),
      runMetres: Math.round(c.runMetresSum / c.apps),
      tackles: Math.round(c.tacklesSum / c.apps),
      rating: c.bestRating, fame,
    });
  }
  gamePlayers.sort((a, b) => b.fame - a.fame);
  console.log(`✓ games: ${gamePlayers.length} unique career players`);

  /* ---- per-season ladder + strength distribution ------------------------- */
  const seasons = Object.keys(resultsBySeason)
    .filter((s) => resultsBySeason[s].length)
    .sort((a, b) => parseInt(b, 10) - parseInt(a, 10));
  const strengthsBySeason = {};
  const laddersBySeason = {};
  for (const s of seasons) {
    const table = {}; // club -> {p,w,l,d,pf,pa}
    for (const r of resultsBySeason[s]) {
      table[r.home] ||= { club: r.home, p: 0, w: 0, l: 0, d: 0, pf: 0, pa: 0 };
      table[r.away] ||= { club: r.away, p: 0, w: 0, l: 0, d: 0, pf: 0, pa: 0 };
      const H = table[r.home], A = table[r.away];
      H.p++; A.p++; H.pf += r.hs; H.pa += r.as; A.pf += r.as; A.pa += r.hs;
      if (r.hs > r.as) { H.w++; A.l++; } else if (r.hs < r.as) { A.w++; H.l++; }
      else { H.d++; A.d++; }
    }
    const rows = Object.values(table).map((t) => ({
      ...t, pts: t.w * 2 + t.d, pd: t.pf - t.pa,
    }));
    rows.sort((a, b) => b.pts - a.pts || b.pd - a.pd || b.pf - a.pf);
    laddersBySeason[s] = rows;

    const totalPF = rows.reduce((a, b) => a + b.pf, 0) || 1;
    const strengths = rows
      .map((t) => 0.5 * (t.p ? t.w / t.p : 0) + 0.5 * ((t.pf / totalPF) * rows.length))
      .sort((a, b) => a - b);
    strengthsBySeason[s] = strengths.map((x) => +x.toFixed(3));
  }

  /* ---- write outputs ----------------------------------------------------- */
  await mkdir(outDir, { recursive: true });
  const generatedAt = new Date().toISOString();
  const clubsBySeasonObj = {};
  for (const [s, set] of Object.entries(clubsBySeason)) clubsBySeasonObj[s] = [...set].sort();
  const allClubs = [...new Set(Object.values(clubsBySeasonObj).flat())].sort();
  const latestSeason = seasons[0];

  const meta = { comp: label, generatedAt, seasons, latestSeason, clubs: allClubs, clubsBySeason: clubsBySeasonObj };
  const games = { comp: label, season: latestSeason, players: gamePlayers, strengthsBySeason };
  const results = { seasons, bySeason: resultsBySeason, laddersBySeason };
  const strengths = { bySeason: strengthsBySeason };

  // strip the career-only fields so the shipped pool stays lean (see pool.push)
  const poolShipped = pool.map(({ g, lineBreaks, ...rest }) => rest);

  await Promise.all([
    writeFile(join(outDir, "meta.json"), JSON.stringify(meta)),
    writeFile(join(outDir, "pool.json"), JSON.stringify(poolShipped)),
    writeFile(join(outDir, "games.json"), JSON.stringify(games)),
    writeFile(join(outDir, "results.json"), JSON.stringify(results)),
    writeFile(join(outDir, "strengths.json"), JSON.stringify(strengths)),
  ]);

  // one self-contained box-score file per match, lazy-loaded by the match page
  const matchesDir = join(outDir, "matches");
  await mkdir(matchesDir, { recursive: true });
  await mapLimit(boxscores, 64, (b) =>
    writeFile(join(matchesDir, `${b.id}.json`), JSON.stringify(b))
  );

  console.log(
    `✓ wrote ${outDir} — ${poolShipped.length} cards, ${gamePlayers.length} players, ` +
    `${seasons.length} seasons, ${boxscores.length} box scores in ${((Date.now() - t0) / 1000).toFixed(1)}s`
  );
}

main().catch((e) => { console.error("✗ pipeline failed:", e); process.exit(1); });
