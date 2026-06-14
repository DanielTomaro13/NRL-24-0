"use client";
import { useEffect, useRef, useState } from "react";
import { makeShareImage, type ShareInput } from "@/lib/shareCard";

const SITE = "https://nrl24-0.com";

/**
 * Social share for a drafted side: builds a team+score image and offers
 * Instagram (native sheet / save), X/Twitter, Facebook, a native share and a
 * download. Every path carries a link back to the site.
 */
export default function ShareButtons({ data, caption }: { data: ShareInput; caption: string }) {
  const [img, setImg] = useState<{ blob: Blob; url: string } | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const built = useRef(false);
  const url = `${SITE}/play`;

  useEffect(() => {
    if (built.current) return;
    built.current = true;
    makeShareImage(data).then(setImg);
    return () => { if (img?.url) URL.revokeObjectURL(img.url); }; // eslint-disable-line react-hooks/exhaustive-deps
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function file(): File | null {
    return img ? new File([img.blob], "nrl24-0.png", { type: "image/png" }) : null;
  }
  function canShareFiles(): boolean {
    const f = file();
    return !!f && typeof navigator !== "undefined" && !!navigator.canShare && navigator.canShare({ files: [f] });
  }

  async function nativeShare() {
    const f = file();
    try {
      if (f && canShareFiles()) await navigator.share({ files: [f], text: `${caption} ${url}` });
      else if (navigator.share) await navigator.share({ text: caption, url });
      else download();
    } catch { /* cancelled */ }
  }

  function download() {
    if (!img) return;
    const a = document.createElement("a");
    a.href = img.url; a.download = "nrl24-0.png"; a.click();
  }

  async function instagram() {
    // Instagram has no web post endpoint — share the image via the native sheet
    // (which lists Instagram on mobile), or save it so it can be posted manually.
    const f = file();
    if (f && canShareFiles()) { try { await navigator.share({ files: [f], text: `${caption} ${url}` }); return; } catch { /* fall through */ } }
    download();
    setHint("Image saved — open Instagram and post it to your story or feed.");
    window.open("https://instagram.com", "_blank", "noopener");
  }

  const twitter = `https://twitter.com/intent/tweet?text=${encodeURIComponent(caption)}&url=${encodeURIComponent(url)}`;
  const facebook = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(caption)}`;

  return (
    <div style={{ display: "grid", gap: 10, justifyItems: "center" }}>
      {img && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img.url} alt="Your team and score" width={150}
          style={{ borderRadius: 10, border: "1px solid var(--border)", maxWidth: 150 }} />
      )}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        <button onClick={instagram} className="btn" style={btn("#e1306c")}>📷 Instagram</button>
        <a href={twitter} target="_blank" rel="noopener" className="btn" style={btn("#1d9bf0")}>𝕏 / Twitter</a>
        <a href={facebook} target="_blank" rel="noopener" className="btn" style={btn("#1877f2")}>f Facebook</a>
        {typeof navigator !== "undefined" && "share" in navigator && (
          <button onClick={nativeShare} className="btn">📲 Share…</button>
        )}
        <button onClick={download} className="btn">⬇ Save image</button>
      </div>
      {hint && <p style={{ fontSize: ".74rem", color: "var(--muted)", margin: 0, textAlign: "center", maxWidth: 280 }}>{hint}</p>}
    </div>
  );
}

function btn(color: string): React.CSSProperties {
  return { borderColor: color, color: "var(--text)" };
}
