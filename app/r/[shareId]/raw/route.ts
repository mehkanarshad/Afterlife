import { NextRequest, NextResponse } from "next/server";
import { decodeShareId } from "@/lib/share";
import { buildRawRecord, loadShared } from "@/lib/shared-load";

// GET /r/{shareId}/raw
// The extracted data behind a shared resurrection, as JSON, for researchers
// and archivists. Public and read-only.
export async function GET(_request: NextRequest, { params }: { params: { shareId: string } }) {
  const share = decodeShareId(params.shareId);
  if (!share) {
    return NextResponse.json({ error: "Unknown or malformed share id" }, { status: 404 });
  }

  const loaded = await loadShared(share);
  if (!loaded.ok) {
    return NextResponse.json({ error: loaded.error }, { status: loaded.status });
  }

  return new NextResponse(`${JSON.stringify(buildRawRecord(share, loaded.payload), null, 2)}\n`, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
