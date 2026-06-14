/**
 * NRL 24-0 global leaderboard — a tiny Cloudflare Worker backed by KV.
 *
 * Matches the client in web/lib/leaderboard.ts:
 *   POST /score            { game, score, name, dir: "high"|"low" }
 *   GET  /leaderboard?game=<g>&limit=<n>   -> ScoreEntry[]
 *
 * One KV key per game holds the top 100 entries as JSON. Light per-IP rate
 * limiting keeps it honest. If no Worker is deployed the web app falls back to
 * a per-browser localStorage board, so this is entirely optional.
 */
export interface Env {
  BOARD: KVNamespace;
}

interface ScoreEntry { name: string; score: number; at: number }

const ALLOWED_ORIGINS = [
  "https://nrl24-0.com",
  "https://www.nrl24-0.com",
  "http://localhost:3000",
];
const MAX_PER_BOARD = 100;
const RATE_LIMIT = 8;       // posts per IP per window
const RATE_WINDOW = 60;     // seconds

function cors(origin: string | null): Record<string, string> {
  const allow = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Max-Age": "86400",
  };
}

const json = (data: unknown, origin: string | null, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", ...cors(origin) },
  });

const clean = (s: unknown, max: number) => String(s ?? "").replace(/[^\w \-'.]/g, "").trim().slice(0, max);

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const origin = req.headers.get("Origin");
    const url = new URL(req.url);

    if (req.method === "OPTIONS") return new Response(null, { headers: cors(origin) });

    if (url.pathname === "/leaderboard" && req.method === "GET") {
      const game = clean(url.searchParams.get("game"), 40);
      const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 10));
      if (!game) return json([], origin);
      const list: ScoreEntry[] = JSON.parse((await env.BOARD.get(`board:${game}`)) || "[]");
      return json(list.slice(0, limit), origin);
    }

    if (url.pathname === "/score" && req.method === "POST") {
      const ip = req.headers.get("CF-Connecting-IP") || "anon";
      const rlKey = `rl:${ip}`;
      const count = Number((await env.BOARD.get(rlKey)) || 0);
      if (count >= RATE_LIMIT) return json({ error: "rate limited" }, origin, 429);

      let body: { game?: string; score?: number; name?: string; dir?: string };
      try { body = await req.json(); } catch { return json({ error: "bad json" }, origin, 400); }

      const game = clean(body.game, 40);
      const name = clean(body.name, 16) || "Anonymous";
      const score = Number(body.score);
      const high = body.dir !== "low";
      if (!game || !Number.isFinite(score)) return json({ error: "bad input" }, origin, 400);

      const key = `board:${game}`;
      const list: ScoreEntry[] = JSON.parse((await env.BOARD.get(key)) || "[]");
      list.push({ name, score, at: Date.now() });
      list.sort((a, b) => (high ? b.score - a.score : a.score - b.score));
      const top = list.slice(0, MAX_PER_BOARD);
      await env.BOARD.put(key, JSON.stringify(top));
      await env.BOARD.put(rlKey, String(count + 1), { expirationTtl: RATE_WINDOW });
      return json({ ok: true }, origin);
    }

    return json({ error: "not found" }, origin, 404);
  },
};
