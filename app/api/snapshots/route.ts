import { NextRequest, NextResponse } from "next/server";
import { getSnapshotYears } from "@/lib/wayback";

const CDX_TIMEOUT_MS = 15_000;
const MAX_URL_LENGTH = 2048;

// GET /api/snapshots?url=geocities.com
// One HTTP-200 capture per year, oldest first: { snapshots: [{ timestamp, year }] }
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")?.trim() ?? "";
  if (url === "" || url.length > MAX_URL_LENGTH) {
    return NextResponse.json(
      { error: `Query must include url (1 to ${MAX_URL_LENGTH} characters)` },
      { status: 400 }
    );
  }

  const result = await getSnapshotYears(url, CDX_TIMEOUT_MS);
  if (!result.ok) {
    return result.reason === "timeout"
      ? NextResponse.json({ error: "Timed out listing snapshots" }, { status: 504 })
      : NextResponse.json({ error: "Could not list snapshots" }, { status: 502 });
  }

  return NextResponse.json(
    { snapshots: result.snapshots },
    // Capture history changes slowly; let browsers and CDNs reuse it.
    { headers: { "Cache-Control": "public, max-age=3600" } }
  );
}
