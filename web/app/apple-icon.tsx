import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#060d0a",
          color: "#eef2ec",
          fontSize: 88,
          fontWeight: 800,
          letterSpacing: 2,
        }}
      >
        <div style={{ display: "flex" }}>24</div>
        <div style={{ width: 10, height: 10, borderRadius: 5, background: "#ff5436", marginTop: 6 }} />
      </div>
    ),
    { ...size }
  );
}
