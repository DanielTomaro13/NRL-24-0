# 24-0

Build an all-time **NRL** team across clubs and eras and chase a perfect **24-0** home-and-away season. A rugby league take on the [23-0](https://23-0.com/) format.

Spin for a random club and era, draft any player from that roster into any open position, and your squad's average rating sets your win–loss record. You get **one club re-roll** and **one era re-roll** for the whole game — spend them wisely.

## How it works

- **Live data.** On load the app reads Champion Data's public match-centre feeds (`mc.championdata.com`) — the same anonymous JSON that powers nrl.com's match centre. It walks each competition's fixture, loads completed match files, and aggregates every player's real per-match stats.
- **Ratings.** A player's rating is derived from their averaged output — tries, run metres, line breaks, try assists, tackles, offloads, minus handling errors — mapped through a sigmoid into a believable 60–98 band.
- **Eras & clubs.** A player's club is the squad they appeared for; their era is the competition season. The spin only lands on club/era combinations that still have undrafted players.
- **No fake data.** Players always come from Champion Data. If the feeds can't be reached (network or cross-origin block), the app says so and offers a retry rather than substituting synthetic players. The source indicator top-right shows live vs. unavailable.

## Run locally

```bash
npm install
npm run dev
```

## Build for hosting

```bash
npm run build      # outputs static files to dist/
npm run preview    # preview the production build
```

The build uses a relative base path, so `dist/` can be served from a domain root (Netlify, Vercel, a custom domain) or a GitHub Pages project subpath without changes.

### GitHub Pages

A workflow at `.github/workflows/deploy.yml` builds and publishes `dist/` to Pages on every push to `main`. After the first run, enable Pages in the repo settings (Source: GitHub Actions).

### CORS / the proxy

The browser fetches the Champion Data feeds directly. The CDN serves them with `Access-Control-Allow-Origin: *`, so **GitHub Pages works as-is — no proxy required.**

A same-origin proxy is included as a fallback in case that ever changes:

- `netlify.toml` / `vercel.json` forward `/cd/*` → `https://mc.championdata.com/*` server-side.
- Set the build env var `VITE_API_BASE=/cd` so the app calls the proxy instead of the CDN directly.

GitHub Pages is static-only and can't run a proxy, so if the CDN ever locks down CORS, host on Netlify/Vercel with `VITE_API_BASE=/cd`.

## Notes

Unofficial fan project. Not affiliated with or endorsed by the National Rugby League or Champion Data. Built against publicly accessible feeds for personal, non-commercial use. All player data comes from Champion Data; the app never substitutes synthetic players.

## Topics

`nrl` · `rugby-league` · `react` · `vite` · `sports-data` · `champion-data` · `fantasy-sports` · `game`
