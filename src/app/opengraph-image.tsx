import { ImageResponse } from "next/og";

export const alt = "RainShift - Risk of Rain 2 Save Editor";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background:
          "radial-gradient(circle at 20% 20%, #2a3345 0%, #131519 48%, #0d0f12 100%)",
        color: "#e3e0d6",
        display: "flex",
        flexDirection: "column",
        fontFamily: "monospace",
        height: "100%",
        justifyContent: "center",
        letterSpacing: "0.04em",
        padding: "72px",
        textAlign: "center",
        width: "100%",
      }}
    >
      <div
        style={{
          color: "#f2a95c",
          display: "flex",
          fontSize: 24,
          letterSpacing: "0.3em",
          marginBottom: 28,
          textTransform: "uppercase",
        }}
      >
        RainShift
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 68,
          fontWeight: 700,
          lineHeight: 1.08,
          maxWidth: 980,
        }}
      >
        Risk of Rain 2 Save Editor
      </div>
      <div
        style={{
          color: "#aeb7c4",
          display: "flex",
          fontSize: 26,
          marginTop: 30,
        }}
      >
        Edit your profile locally in your browser
      </div>
    </div>,
    size,
  );
}
