/**
 * Draws a shareable square-ish card of a drafted side + record to a canvas and
 * returns it as a PNG blob (for the native share sheet / Instagram) plus an
 * object URL (for a preview and download). Pure client-side, no assets.
 */
export interface SharePlayer { n: string; pos: string; club: string; era: string; rating: number; }
export interface ShareInput {
  record: string;     // e.g. "21–0"
  verdict: string;    // e.g. "MINOR PREMIERS"
  avg: number;        // squad rating
  modeName: string;   // e.g. "Quick Nine"
  players: SharePlayer[];
}

export async function makeShareImage(d: ShareInput): Promise<{ blob: Blob; url: string } | null> {
  const W = 1080, H = 1350;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  if (!ctx) return null;

  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#060d0a"); g.addColorStop(0.55, "#0b1411"); g.addColorStop(1, "#0e1813");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#ff5436"; ctx.fillRect(0, 0, W, 12);

  const PAD = 72;
  ctx.textBaseline = "alphabetic";

  // wordmark
  ctx.fillStyle = "#9fb0a6";
  ctx.font = "700 30px system-ui, sans-serif";
  ctx.fillText(`NRL 24-0  ·  ${d.modeName.toUpperCase()}`, PAD, 96);

  // record
  const parts = d.record.split("–");
  ctx.font = "900 168px system-ui, sans-serif";
  const winsTxt = parts[0], dash = "–", lossTxt = parts[1] ?? "";
  let x = PAD; const recY = 280;
  ctx.fillStyle = "#5fd08a"; ctx.fillText(winsTxt, x, recY); x += ctx.measureText(winsTxt).width + 14;
  ctx.fillStyle = "#9fb0a6"; ctx.fillText(dash, x, recY); x += ctx.measureText(dash).width + 14;
  ctx.fillStyle = lossTxt === "0" ? "#5fd08a" : "#ff5436"; ctx.fillText(lossTxt, x, recY);

  // verdict + rating
  ctx.fillStyle = "#e8c469"; ctx.font = "800 52px system-ui, sans-serif";
  ctx.fillText(d.verdict, PAD, recY + 76);
  ctx.fillStyle = "#9fb0a6"; ctx.font = "500 30px system-ui, sans-serif";
  ctx.fillText(`Squad rating ${d.avg.toFixed(1)}`, PAD, recY + 122);

  // team list
  const listTop = recY + 180;
  const listBottom = H - 130;
  const n = d.players.length;
  const rowH = Math.min(70, (listBottom - listTop) / n);
  ctx.font = "600 30px system-ui, sans-serif";
  d.players.forEach((p, i) => {
    const y = listTop + i * rowH + rowH * 0.7;
    ctx.fillStyle = "#1d2e27"; ctx.fillRect(PAD, listTop + i * rowH + rowH * 0.15, W - PAD * 2, 1);
    ctx.fillStyle = "#9fb0a6"; ctx.font = "600 24px system-ui, sans-serif";
    ctx.fillText(p.pos.padEnd(2), PAD, y);
    ctx.fillStyle = "#eef2ec"; ctx.font = "600 30px system-ui, sans-serif";
    ctx.fillText(p.n, PAD + 70, y);
    ctx.fillStyle = "#9fb0a6"; ctx.font = "400 22px system-ui, sans-serif";
    const meta = `${p.era}`;
    ctx.fillText(meta, PAD + 70, y + 26);
    ctx.fillStyle = p.rating >= 90 ? "#e8c469" : "#eef2ec";
    ctx.font = "800 34px system-ui, sans-serif"; ctx.textAlign = "right";
    ctx.fillText(String(p.rating), W - PAD, y);
    ctx.textAlign = "left";
  });

  // footer
  ctx.fillStyle = "#ff5436"; ctx.font = "800 34px system-ui, sans-serif";
  ctx.fillText("nrl24-0.com", PAD, H - 56);
  ctx.fillStyle = "#9fb0a6"; ctx.font = "500 26px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("build your all-time side", W - PAD, H - 56);
  ctx.textAlign = "left";

  const blob: Blob | null = await new Promise((res) => c.toBlob((b) => res(b), "image/png", 0.92));
  if (!blob) return null;
  return { blob, url: URL.createObjectURL(blob) };
}
