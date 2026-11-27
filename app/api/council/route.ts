import { NextRequest, NextResponse } from "next/server";
import { CouncilCandidate, convene, pickCandidates } from "@/lib/council";
import { fragmentCount, qualityScore } from "@/lib/quality";
import { layoutMetrics, readUrlField, resurrectSnapshot } from "@/lib/resurrect";
import { getSnapshotYears } from "@/lib/wayback";

const CDX_TIMEOUT_MS = 15_000;

// POST /api/council { url }
// Pulls up to three real snapshots (earliest, middle, latest), lets four
// analysts vote on them, and returns the winner's result with the debate:
//   { result, council: { lines, verdict, votes } }
// When the archive can't list snapshots, it falls back to the latest one and
// returns { result, council: null }, so the caller still gets a resurrection.
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const url = readUrlField(body);
  if (url === null) {
    return NextResponse.json({ error: "Body must include a non-empty string: url" }, { status: 400 });
  }

  const listing = await getSnapshotYears(url, CDX_TIMEOUT_MS);
  if (!listing.ok || listing.snapshots.length === 0) {
    const fallback = await resurrectSnapshot(url);
    if (!fallback.ok) return NextResponse.json({ error: fallback.error }, { status: fallback.status });
    return NextResponse.json({ result: fallback.payload, council: null });
  }

  const picks = pickCandidates(listing.snapshots);
  const outcomes = await Promise.all(picks.map((s) => resurrectSnapshot(url, s.timestamp)));

  const candidates: CouncilCandidate[] = [];
  const retrieved = new Map<number, (typeof outcomes)[number] & { ok: true }>();
  const failedYears: number[] = [];
  picks.forEach((pick, i) => {
    const outcome = outcomes[i];
    if (!outcome.ok) {
      failedYears.push(pick.year);
      return;
    }
    const { extracted } = outcome.payload;
    candidates.push({
      year: pick.year,
      timestamp: pick.timestamp,
      thin: outcome.payload.status === "thin_snapshot",
      score: qualityScore(extracted),
      blocks: fragmentCount(extracted),
      htmlBytes: outcome.html.length,
      ...layoutMetrics(outcome.html),
      cause: outcome.payload.postMortem.cause,
    });
    retrieved.set(pick.year, outcome);
  });

  if (candidates.length === 0) {
    const first = outcomes.find((o) => !o.ok);
    const status = outcomes.every((o) => !o.ok && o.status === 504) ? 504 : 502;
    return NextResponse.json(
      { error: first && !first.ok ? first.error : "Could not retrieve any snapshots" },
      { status }
    );
  }

  const council = convene({ candidates, failedYears, totalSnapshots: listing.snapshots.length });
  const chosen = retrieved.get(council.verdict.year);
  if (!chosen) {
    return NextResponse.json({ error: "Failed to resurrect page" }, { status: 500 });
  }
  return NextResponse.json({ result: { ...chosen.payload, council: council.verdict }, council });
}
