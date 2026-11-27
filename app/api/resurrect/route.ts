import { NextRequest, NextResponse } from "next/server";
import { readUrlField, resurrectSnapshot } from "@/lib/resurrect";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const url = readUrlField(body);
  if (url === null) {
    return NextResponse.json(
      { error: "Body must include a non-empty string: url" },
      { status: 400 }
    );
  }

  // Optional: resurrect a specific capture (from the post-mortem timeline).
  const timestamp = (body as Record<string, unknown>).timestamp;
  if (timestamp !== undefined && (typeof timestamp !== "string" || !/^\d{4,14}$/.test(timestamp))) {
    return NextResponse.json(
      { error: "timestamp must be a Wayback timestamp of 4 to 14 digits" },
      { status: 400 }
    );
  }

  const outcome = await resurrectSnapshot(url, timestamp);
  if (!outcome.ok) {
    return NextResponse.json({ error: outcome.error }, { status: outcome.status });
  }
  return NextResponse.json(outcome.payload);
}
