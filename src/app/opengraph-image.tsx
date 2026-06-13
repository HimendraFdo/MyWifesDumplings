import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "My Wife's Dumplings — Handmade dumplings in Auckland, NZ";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#F5E6D3",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          border: "8px solid #C0392B",
        }}
      >
        <div style={{ fontSize: 80, color: "#C0392B" }}>🥟</div>
        <div
          style={{
            fontSize: 72,
            fontStyle: "italic",
            color: "#1A0A00",
            fontFamily: "serif",
          }}
        >
          My Wife&apos;s Dumplings
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#1A0A00",
            opacity: 0.6,
            fontFamily: "sans-serif",
          }}
        >
          Handmade with love. Auckland, NZ.
        </div>
      </div>
    ),
    { ...size }
  );
}
