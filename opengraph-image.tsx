import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Castly — Where Talent Gets Cast";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
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
          background: "#1a1a1a",
          color: "#f5e6c8",
          fontFamily: "serif",
        }}
      >
        <div style={{ fontSize: 140, fontWeight: 700, letterSpacing: -4 }}>Castly</div>
        <div style={{ fontSize: 44, marginTop: 8, color: "#e8d5a8" }}>
          Where Talent Gets Cast
        </div>
        <div style={{ fontSize: 28, marginTop: 40, color: "#9a9a9a" }}>
          Actors · Models · Musicians · Dancers
        </div>
      </div>
    ),
    { ...size }
  );
}
