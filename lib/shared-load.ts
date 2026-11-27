import { ResurrectPayload, resurrectSnapshot } from "./resurrect";
import { fragmentCount, qualityBadge, qualityScore } from "./quality";
import { ShareRef, parseWaybackTimestamp } from "./share";
import { normalizeUrl, siteName } from "./sites";

// Server-only: fetches the archived content behind a share link. Kept apart
// from lib/share.ts so the browser bundle never pulls in the extraction code.

// ---- Loading the content (in memory only, per the project's no-database rule) ----

export type SharedLoad =
  | { ok: true; payload: ResurrectPayload }
  | { ok: false; status: number; error: string };

const TTL_MS = 60 * 60 * 1000;
const MAX_ENTRIES = 200;
const cache = new Map<string, { expires: number; payload: ResurrectPayload }>();
const inflight = new Map<string, Promise<SharedLoad>>();

/**
 * Fetches and extracts the shared capture. Successful results are kept for an
 * hour (oldest evicted past 200), and concurrent requests for the same capture
 * share one fetch. Failures aren't cached, so a retry can succeed.
 */
export function loadShared(ref: ShareRef): Promise<SharedLoad> {
  const key = `${normalizeUrl(ref.url)}|${ref.timestamp}`;

  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return Promise.resolve({ ok: true, payload: hit.payload });

  const pending = inflight.get(key);
  if (pending) return pending;

  const request = resurrectSnapshot(ref.url, ref.timestamp)
    .then((outcome): SharedLoad => {
      if (!outcome.ok) return { ok: false, status: outcome.status, error: outcome.error };
      cache.set(key, { expires: Date.now() + TTL_MS, payload: outcome.payload });
      while (cache.size > MAX_ENTRIES) cache.delete(cache.keys().next().value as string);
      return { ok: true, payload: outcome.payload };
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, request);
  return request;
}

// ---- Raw data for researchers and archivists ----

export function buildRawRecord(ref: ShareRef, payload: ResurrectPayload) {
  const score = qualityScore(payload.extracted);
  return {
    schema: "afterlife.resurrection/1",
    site: { url: ref.url, name: siteName(ref.url), diedYear: ref.deathYear },
    resurrectedAt: ref.resurrectedAt,
    snapshot: {
      source: "Internet Archive Wayback Machine",
      timestamp: payload.snapshotTimestamp,
      capturedAt: parseWaybackTimestamp(payload.snapshotTimestamp)?.toISOString() ?? null,
      url: payload.snapshotUrl,
    },
    quality: {
      score,
      badge: qualityBadge(score),
      fragments: fragmentCount(payload.extracted),
    },
    postMortem: payload.postMortem,
    extracted: payload.extracted,
  };
}
