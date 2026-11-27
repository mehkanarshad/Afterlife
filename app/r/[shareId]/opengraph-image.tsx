import { ImageResponse } from "next/og";
import { decodeShareId, formatLongDate } from "@/lib/share";
import { normalizeUrl, siteName } from "@/lib/sites";

export const alt = "A website resurrected by Afterlife";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PUMPKIN = "#ff6b1a";
const GHOST = "#a8e6cf";

// The preview card for Twitter, Discord and Slack. Everything on it comes from
// the share id, so it renders instantly and never waits on the archive.
export default function Image({ params }: { params: { shareId: string } }) {
  const share = decodeShareId(params.shareId);
  const name = share ? siteName(share.url) : "A lost website";
  const domain = share ? normalizeUrl(share.url) : "";
  const line = share
    ? share.deathYear !== null
      ? `Died ${share.deathYear} · Resurrected ${formatLongDate(new Date(share.resurrectedAt))}`
      : `Resurrected ${formatLongDate(new Date(share.resurrectedAt))}`
    : "Resurrected by Afterlife";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "radial-gradient(ellipse at 50% 0%, #1d2622 0%, #0a0a0f 60%, #000 100%)",
          color: "#e6e6ea",
          border: `6px solid ${PUMPKIN}`,
        }}
      >
        <div style={{ display: "flex", fontSize: 34, letterSpacing: 6, color: GHOST }}>
          AFTERLIFE · THE DEAD WEB, RESURRECTED
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: name.length > 18 ? 84 : 124,
              fontWeight: 800,
              color: PUMPKIN,
              lineHeight: 1.05,
              wordBreak: "break-word",
            }}
          >
            {name.slice(0, 60)}
          </div>
          {domain && domain.toLowerCase() !== name.toLowerCase() && (
            <div style={{ display: "flex", marginTop: 16, fontSize: 38, color: "#9a9aa6" }}>
              {domain.slice(0, 80)}
            </div>
          )}
        </div>
        <div style={{ display: "flex", fontSize: 40, color: "#e6e6ea" }}>{line}</div>
      </div>
    ),
    size
  );
}
