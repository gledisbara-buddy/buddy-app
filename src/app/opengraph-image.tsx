import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Rotfilens opengraph-image gäller för alla sidor som inte har en egen —
// alltså i praktiken hela marknadssidan. next/og:s Satori-renderare stödjer
// inte CSS-variabler, så färgerna hårdkodas här (samma värden som
// globals.css --color-forest/--color-ink/--color-frost).
export default function Image() {
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
          background: "#f5f7fa",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 36 }}>
          <svg width="72" height="72" viewBox="0 0 30 30" fill="none">
            <circle cx="15" cy="15" r="14" stroke="#5b8def" strokeWidth="2" />
            <path
              d="M9 16.5 L13 20 L21 10"
              stroke="#5b8def"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div style={{ fontSize: 64, fontWeight: 700, color: "#33465c" }}>Buddy</div>
        </div>
        <div style={{ fontSize: 40, fontWeight: 700, color: "#33465c", textAlign: "center", padding: "0 80px" }}>
          Allt du betalar för, på ett ställe.
        </div>
        <div style={{ fontSize: 24, color: "#7c8896", marginTop: 20 }}>
          Försäkring · Mobil & bredband · Kreditkort · El
        </div>
      </div>
    ),
    { ...size }
  );
}
