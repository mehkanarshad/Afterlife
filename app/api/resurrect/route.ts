import { NextRequest, NextResponse } from "next/server";
import { getSnapshot, snapshotUrlFor } from "@/lib/wayback";
import { inferDeathCause } from "@/lib/post-mortem";
import { extractContent } from "@/lib/extract";
import { THIN_THRESHOLD, qualityScore } from "@/lib/quality";

const SNAPSHOT_TIMEOUT_MS = 10_000;
const THIN_SNAPSHOT_HINT =
  "This snapshot contains very little readable content. It may be a redirect or error page.";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const fields = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const url = fields.url;
  // Optional: resurrect a specific capture (from the post-mortem timeline).
  const requestedTimestamp = fields.timestamp;

  if (typeof url !== "string" || url.trim() === "") {
    return NextResponse.json(
      { error: "Body must include a non-empty string: url" },
      { status: 400 }
    );
  }

  if (
    requestedTimestamp !== undefined &&
    (typeof requestedTimestamp !== "string" || !/^\d{4,14}$/.test(requestedTimestamp))
  ) {
    return NextResponse.json(
      { error: "timestamp must be a Wayback timestamp of 4 to 14 digits" },
      { status: 400 }
    );
  }

  try {
    const snapshot =
      typeof requestedTimestamp === "string"
        ? {
            snapshotUrl: snapshotUrlFor(url, requestedTimestamp),
            timestamp: requestedTimestamp,
            archivedStatus: null,
          }
        : await getSnapshot(url);
    if (!snapshot) {
      return NextResponse.json({ error: "No snapshot found" }, { status: 404 });
    }

    const res = await fetch(snapshot.snapshotUrl, {
      signal: AbortSignal.timeout(SNAPSHOT_TIMEOUT_MS),
    });

    // A replayed capture carries Memento-Datetime. If it's present, a 404 or
    // 5xx is the dead site's own recorded response, not a Wayback failure.
    const archivedResponse = res.headers.has("memento-datetime");
    const archivedStatus = archivedResponse ? res.status : snapshot.archivedStatus;

    if (!res.ok && !archivedResponse) {
      return NextResponse.json(
        { error: `Snapshot fetch failed with status ${res.status}` },
        { status: 502 }
      );
    }

    const html = await res.text();
    const { title, headings, paragraphs, images } = extractContent(html);
    const thin = qualityScore({ title, headings, paragraphs, images }) < THIN_THRESHOLD;

    const quality = thin
      ? { status: "thin_snapshot" as const, hint: THIN_SNAPSHOT_HINT }
      : { status: "ok" as const };

    // After redirects, the final replay URL names the capture actually served.
    const servedTimestamp = /\/web\/(\d{14})/.exec(res.url)?.[1] ?? snapshot.timestamp;

    return NextResponse.json({
      originalUrl: url,
      snapshotTimestamp: servedTimestamp,
      snapshotUrl: res.url ? res.url.replace(/^http:\/\//, "https://") : snapshot.snapshotUrl,
      extracted: { title, headings, paragraphs, images },
      postMortem: inferDeathCause({ archivedStatus, html, thin }),
      ...quality,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      return NextResponse.json(
        { error: "Timed out fetching snapshot" },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: "Failed to resurrect page" },
      { status: 500 }
    );
  }
}
