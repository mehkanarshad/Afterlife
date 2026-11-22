import { NextRequest, NextResponse } from "next/server";
import { getSnapshot } from "@/lib/wayback";
import { extractContent } from "@/lib/extract";

const SNAPSHOT_TIMEOUT_MS = 10_000;

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const url =
    typeof body === "object" && body !== null && "url" in body
      ? (body as { url: unknown }).url
      : undefined;

  if (typeof url !== "string" || url.trim() === "") {
    return NextResponse.json(
      { error: "Body must include a non-empty string: url" },
      { status: 400 }
    );
  }

  try {
    const snapshot = await getSnapshot(url);
    if (!snapshot) {
      return NextResponse.json({ error: "No snapshot found" }, { status: 404 });
    }

    const res = await fetch(snapshot.snapshotUrl, {
      signal: AbortSignal.timeout(SNAPSHOT_TIMEOUT_MS),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Snapshot fetch failed with status ${res.status}` },
        { status: 502 }
      );
    }

    const html = await res.text();
    const { title, headings, paragraphs, images } = extractContent(html);

    return NextResponse.json({
      originalUrl: url,
      snapshotTimestamp: snapshot.timestamp,
      extracted: { title, headings, paragraphs, images },
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
