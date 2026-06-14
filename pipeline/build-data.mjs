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

/* ---- main ----------------------------------------------------------------- */
async function main() {
  const t0 = Date.now();
  console.log("→ Fetching competition catalogue…");
  const cat = await poolFetch(`${API}/data/competitions.json`);
  let comps = arr(cat?.competitionDetails?.competition).filter((c) =>
    String(c.name || "").toLowerCase().includes("nrl premiership")
  );
  comps.sort((a, b) => (b.season || 0) - (a.season || 0));
  comps = comps.slice(0, MAX_SEASONS);
  console.log(`  ${comps.length} NRL Premiership seasons: ${comps.map((c) => c.season).join(", ")}`);

  const agg = new Map();             // playerKey -> per player-season aggregate
  const resultsBySeason = {};        // season -> [{round, home, away, hs, as}]
  const clubsBySeason = {};          // season -> Set(club)

  for (const comp of comps) {
    const season = String(comp.season || "");
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
      });

      const home = m.homeSquadName, away = m.awaySquadName;
      const hs = teamScore[m.homeSquadId] ?? 0, as = teamScore[m.awaySquadId] ?? 0;
      if (home && away) {
        resultsBySeason[season].push({
          round: Number(m.round || m.roundNumber || 0) || 0,
          home, away, hs, as,
        });
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
      g: rec.games,
      tries: +(avg.tries || 0).toFixed(2),
      runMetres: Math.round(avg.runMetres || avg.metresGained || 0),
      lineBreaks: +(avg.lineBreaks || 0).toFixed(2),
      tryAssists: +(avg.tryAssists || 0).toFixed(2),
      tackles: Math.round(avg.tackles || 0),
      tackleBreaks: +(avg.tackleBreaks || 0).toFixed(2),
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
    c.seasons.add(Number(p.era));
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
  const seasons = comps.map((c) => String(c.season)).filter((s) => resultsBySeason[s]?.length);
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
  await mkdir(OUT_DIR, { recursive: true });
  const generatedAt = new Date().toISOString();
  const clubsBySeasonObj = {};
  for (const [s, set] of Object.entries(clubsBySeason)) clubsBySeasonObj[s] = [...set].sort();
  const allClubs = [...new Set(Object.values(clubsBySeasonObj).flat())].sort();
  const latestSeason = seasons[0];

  const meta = { generatedAt, seasons, latestSeason, clubs: allClubs, clubsBySeason: clubsBySeasonObj };
  const games = { season: latestSeason, players: gamePlayers, strengthsBySeason };
  const results = { seasons, bySeason: resultsBySeason, laddersBySeason };
  const strengths = { bySeason: strengthsBySeason };

  await Promise.all([
    writeFile(join(OUT_DIR, "meta.json"), JSON.stringify(meta)),
    writeFile(join(OUT_DIR, "pool.json"), JSON.stringify(pool)),
    writeFile(join(OUT_DIR, "games.json"), JSON.stringify(games)),
    writeFile(join(OUT_DIR, "results.json"), JSON.stringify(results)),
    writeFile(join(OUT_DIR, "strengths.json"), JSON.stringify(strengths)),
  ]);

  console.log(
    `✓ wrote ${OUT_DIR} — ${pool.length} cards, ${gamePlayers.length} players, ` +
    `${seasons.length} seasons in ${((Date.now() - t0) / 1000).toFixed(1)}s`
  );
}

main().catch((e) => { console.error("✗ pipeline failed:", e); process.exit(1); });
