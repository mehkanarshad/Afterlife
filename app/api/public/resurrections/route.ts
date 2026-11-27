import { NextRequest, NextResponse } from "next/server";
import { originFromHeaders } from "@/lib/origin";
import { listPublic, toPublicItem } from "@/lib/public-registry";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

// Open to any origin: this is a public, read-only API for people building on it.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
} as const;

function json(body: unknown, init: { status?: number; cache?: string } = {}) {
  return NextResponse.json(body, {
    status: init.status ?? 200,
    headers: { ...CORS, "Cache-Control": init.cache ?? "no-store" },
  });
}

/** An integer in [min, max], or null when the value isn't one. */
function intParam(value: string | null, fallback: number, min: number, max: number): number | null {
  if (value === null || value === "") return fallback;
  if (!/^\d{1,9}$/.test(value)) return null;
  const n = Number(value);
  return n >= min && n <= max ? n : null;
}

// CORS preflight, for callers that add custom headers.
export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

// GET /api/public/resurrections
//   ?limit=50        1 to 100 (default 50)
//   &offset=0        how many to skip, for paging
//   &site=geocities.com   only this site
//   &include=extracted    also return each page's extracted content
// Newest first. A resurrection is public once its share page has been opened.
export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const limit = intParam(params.get("limit"), DEFAULT_LIMIT, 1, MAX_LIMIT);
  const offset = intParam(params.get("offset"), 0, 0, 1_000_000);
  if (limit === null) return json({ error: `limit must be a whole number from 1 to ${MAX_LIMIT}` }, { status: 400 });
  if (offset === null) return json({ error: "offset must be a whole number, 0 or more" }, { status: 400 });

  const include = params.get("include");
  if (include !== null && include !== "" && include !== "extracted") {
    return json({ error: 'include only accepts "extracted"' }, { status: 400 });
  }

  const site = params.get("site")?.trim() || undefined;
  if (site !== undefined && site.length > 2048) {
    return json({ error: "site is too long" }, { status: 400 });
  }

  const origin = originFromHeaders((name) => request.headers.get(name));
  const { total, items } = listPublic({ site, limit, offset });

  return json(
    {
      schema: "afterlife.public-resurrections/1",
      total,
      limit,
      offset,
      // The registry lives in server memory: it resets when the server restarts.
      retention: "memory",
      items: items.map((entry) => toPublicItem(entry, origin, include === "extracted")),
    },
    { cache: "public, max-age=30" }
  );
}
