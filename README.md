# 24-0

Build an all-time **NRL** team and chase a perfect **24–0** home-and-away season. A rugby league take on the [23-0](https://23-0.com/) format.

Spin for a random club and era, draft a player from that roster into an open position, and fill your side. Your squad's average rating sets your win–loss record. You get **one club re-roll** and **one era re-roll** for the whole game — and once you spin you have to draft from that club, so spend them wisely.

- **Two modes:** *Quick Nine* (one player per position) or *Full Line-up* (the complete 1–13 team sheet).
- **Real data, no fakes.** Player ratings are built from real Champion Data match stats (`mc.championdata.com`) — the feeds that power nrl.com's match centre. Every completed match of every NRL season is aggregated on load.

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

Each player's points are averaged across all their games and mapped through a sigmoid into a **60–99** rating, calibrated so a median starter sits in the low 80s and only genuine stars reach the high 90s. A squad averaging the high 90s is what it takes to go 24–0. (A few scoring lines — 6-again, turnovers, escape-in-goal — have no dedicated feed field and are omitted.)

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build      # static files to dist/
npm run preview    # preview the production build
```

The build uses a relative base path, so `dist/` serves from a domain root (Netlify, Vercel, custom domain) or a GitHub Pages subpath unchanged. The workflow at `.github/workflows/deploy.yml` builds and publishes `dist/` to Pages on every push to `main`.

### CORS / the proxy

The browser fetches the Champion Data feeds directly; the CDN serves them with `Access-Control-Allow-Origin: *`, so **GitHub Pages works as-is**. A same-origin proxy is bundled as a fallback: `netlify.toml` / `vercel.json` forward `/cd/*` → `https://mc.championdata.com/*`. Set `VITE_API_BASE=/cd` to use it.

## Notes

Unofficial fan project. Not affiliated with or endorsed by the National Rugby League or Champion Data. Built against publicly accessible feeds for personal, non-commercial use; player data always comes from Champion Data and is never substituted with synthetic data.

`nrl` · `rugby-league` · `nrl-fantasy` · `fantasy-sports` · `sports-game` · `react` · `vite` · `champion-data` · `nrl-draft`
