# NRL 24-0

Build an all-time **NRL** team and chase a perfect **24–0** season — plus a vault of rugby-league mini-games, ladders, fixtures, stats and player profiles. The rugby league entry in the **0 Series**, alongside [AFL 23-0](https://afl23-0.com) and [Football Invincibles](https://footballinvincibles.com).

Live at **[nrl24-0.com](https://nrl24-0.com)**.

## What's inside

- **Perfect Season** (`/play`) — spin for a random club and era, draft a legend into every position, and chase a flawless 24–0. Six modes: *Quick Nine*, *Full 13*, *Match-day 17*, *Salary Cap 17*, *The Gauntlet* and *Wooden Spoon*. A Monte-Carlo simulator reports your odds of going 24–0 and how you rate against real premiership sides.
- **Seven mini-games** (`/games`) — **Footle** (daily player Wordle), **Higher or Lower**, **Guess the Player** (daily 7-clue), **Career Path**, **Beat the Clock**, **Score Predictor** and the **Invincibles** squad-builder.
- **Stats hub** — the **ladder** for every season, **fixtures & results**, career **stat leaders**, a searchable **players** database with a static profile page per player, and a **Hall of Fame** across every game.
- **Real data, no fakes.** Everything is built from real Champion Data match stats (`mc.championdata.com`) — the feeds that power nrl.com's match centre — aggregated at build time across every NRL Premiership season from 2014 on.

## Scoring

A player's rating comes from their **per-game fantasy points**, using the official 2026 NRL Fantasy point values across every stat the match feeds expose:

| Action | Points |
| --- | --- |
| Try | 8 |
| Goal (conversion / penalty) | 2 |
| Field goal | 5 |
| Try assist | 5 |
| Line break | 4 |
| Line break assist | 2 |
| Tackle | 1 |
| Tackle break | 2 |
| Missed tackle | −2 |
| Offload | 2–4 |
| Error | −2 |
| 40/20 or 20/40 | 4 |
| Run metres | total ÷ 10 |
| Kick metres | total ÷ 30 |
| Penalty conceded | −2 |
| Sin-bin / send-off | −5 / −10 |
| Try save | 5 |
| Kick defused | 1 |

Each player's points are averaged across their games and mapped through a sigmoid into a **60–99** rating, calibrated so a median starter sits in the low 80s and only genuine stars reach the high 90s. A squad averaging the high 90s is what it takes to go 24–0.

## Architecture

An npm-workspaces monorepo:

```
pipeline/   Node script that walks Champion Data → web/public/data/*.json
web/        Next.js 15 app (App Router, static export) — the whole site
worker/     Optional Cloudflare Worker + KV for the global leaderboard
```

The web app is a **static export** (`output: "export"`), so it deploys anywhere static. The committed JSON under `web/public/data` is the entire dataset, so the build needs no network.

## Run locally

```bash
npm install
npm run data     # (re)build the dataset from Champion Data — optional, JSON is committed
npm run dev      # Next.js dev server on :3000
```

## Build & deploy

```bash
npm run build    # static export to web/out/
```

Deployed to **Cloudflare Pages** (build `npm run build`, output `web/out`) on the domain `nrl24-0.com`. `.github/workflows/deploy.yml` builds and publishes on every push to `main`; `refresh.yml` re-runs the data pipeline weekly and commits the result.

### Global leaderboard (optional)

Scores save to per-browser `localStorage` out of the box. To make them global, deploy the Worker in `worker/`:

```bash
cd worker
npx wrangler kv namespace create BOARD   # paste the id into wrangler.toml
npx wrangler deploy
```

then set `NEXT_PUBLIC_LEADERBOARD_URL` to the Worker URL.

## Notes

Unofficial fan project. Not affiliated with or endorsed by the National Rugby League, any club, or Champion Data. Built against publicly accessible feeds for personal, non-commercial use; player data always comes from Champion Data and is never substituted with synthetic data.

`nrl` · `rugby-league` · `nrl-fantasy` · `sports-game` · `next-js` · `champion-data` · `nrl-draft` · `nrl-ladder` · `mini-games`
