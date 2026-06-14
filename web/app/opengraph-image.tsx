import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const alt = "NRL 24-0 — build the perfect all-time NRL team";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "70px 80px",
          background: "linear-gradient(135deg,#060d0a,#0b1411 55%,#0e1813)",
          color: "#eef2ec",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 30, color: "#9fb0a6", letterSpacing: 6 }}>
          ALL-TIME NRL DRAFT
        </div>
        <div style={{ display: "flex", fontSize: 128, fontWeight: 800, lineHeight: 1, marginTop: 12 }}>
          BUILD THE PERFECT
        </div>
        <div style={{ display: "flex", fontSize: 128, fontWeight: 800, lineHeight: 1 }}>
          <span style={{ color: "#ff5436" }}>24–0</span>
          <span style={{ marginLeft: 24 }}>SEASON</span>
        </div>
        <div style={{ display: "flex", fontSize: 34, color: "#9fb0a6", marginTop: 28 }}>
          nrl24-0.com · spin · draft · go undefeated
        </div>
      </div>
    ),
    { ...size }
  );
}
