# 🏉 NRL 24-0

> NRL stats, ladders & addictive rugby-league mini-games. Build an all-time side and chase a perfect 24-0 season.
> Live at **[nrl24-0.com](https://nrl24-0.com)**.

The rugby-league entry in the **0 Series**, alongside [AFL 23-0](https://afl23-0.com) and [Football Invincibles](https://footballinvincibles.com).

## What's inside

**Stats & data (SEO-optimised, static-rendered)**
- The **ladder** for every season, computed from real results
- **Stat leaders** — tries, run metres, tackles, line breaks, games
- **Player profiles** with career stats + a static page per player
- **Fixtures & results**

**Perfect Season**
Spin a club and era, draft a legend into every position, chase a flawless 24-0. Six modes — Quick Nine, Full 13, Match-day 17, Salary Cap, The Gauntlet and Wooden Spoon — with a Monte-Carlo season simulator.

**The Games Vault**
| Game | What it is |
|------|-----------|
| 🏆 **Invincibles** | Draft a side, simulate a season, chase an undefeated record |
| 🟩 **Footle** | The NRL Wordle — daily mystery player in 8 guesses |
| 📈 **Higher or Lower** | More or fewer tries/metres/tackles? Build a streak |
| 🕵️ **Guess the Player** | Clues revealed one at a time; fewer = more points |
| 🧭 **Career Path** | Name the player from their profile |
| ⏱️ **Beat the Clock** | Name the top try-scorers in 60 seconds |
| 🔮 **Score Predictor** | Call the scoreline on real fixtures |

Ratings are built from real Champion Data match stats. The full method is on the [About page](https://nrl24-0.com/about).

## Tech

- **Next.js (App Router) + TypeScript + React 19**, exported as a **static site** for GitHub Pages
- **Tailwind v4** + a small CSS design system
- **SEO**: per-page metadata, Open Graph/Twitter, `sitemap.ts`, `robots.ts`, `manifest.ts`, JSON-LD
- A **pipeline** snapshots the Champion Data feeds into JSON the pages read at build time; a global leaderboard runs on a Cloudflare Worker

## Project layout

```
pipeline/        # data pipeline (Champion Data → datasets, ratings)
web/app/         # routes (pages, games, sitemap/robots/manifest)
web/components/  # UI + games/ (client game components)
web/lib/         # game engine, simulator, SEO helpers
web/public/data/ # generated JSON (pool, games, ladders, fixtures)
worker/          # Cloudflare Worker + KV leaderboard (optional)
```

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # static export to web/out
npm run data     # regenerate the dataset from Champion Data
```

## Deploy (GitHub Pages)

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds the static export and publishes it to GitHub Pages. One-time setup: **Settings → Pages → Source: GitHub Actions**, add the custom domain `nrl24-0.com`, and point Cloudflare DNS at GitHub Pages.

---

Independent project. Not affiliated with or endorsed by the NRL, any club, or Champion Data. Data is for informational and entertainment use.
