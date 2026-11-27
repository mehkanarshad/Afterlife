import type { ResurrectPayload } from "./resurrect";
import { fragmentCount, qualityBadge, qualityScore } from "./quality";
import { parseWaybackTimestamp } from "./share";
import { DEAD_SITES, normalizeUrl, siteName } from "./sites";

// Resurrections that have been made public, held in memory only (the project
// has no database), newest first. A resurrection becomes public when its share
// page is opened. Nothing is added from a visitor's private log.
//
// Only data the server can vouch for is exposed. A share link's own resurrection
// date and death year are editable by anyone, so they are ignored: the date is
// when this server first saw the capture, and the death year comes from the
// graveyard list. The content comes from the Wayback Machine.

const MAX_ENTRIES = 200;

export interface PublicEntry {
  /** The share id of the first link that made this capture public. */
  id: string;
  site: { url: string; name: string; diedYear: number | null };
  /** When this server first saw the capture. ISO 8601 UTC. */
  firstSeenAt: string;
  payload: ResurrectPayload;
}

// Insertion order is oldest first; a Map keeps it and makes eviction cheap.
// Held on globalThis because Next.js may bundle the share page and the API
// route separately, and each bundle would otherwise get its own empty copy.
const store = globalThis as unknown as { __afterlifePublic?: Map<string, PublicEntry> };
const entries = (store.__afterlifePublic ??= new Map<string, PublicEntry>());

function keyOf(url: string, timestamp: string): string {
  return `${normalizeUrl(url)}|${timestamp}`;
}

/** Records a capture as public. Seen again later, it keeps its first-seen time. */
export function registerPublic(id: string, url: string, payload: ResurrectPayload): void {
  const key = keyOf(url, payload.snapshotTimestamp);
  if (entries.has(key)) return;
  const domain = normalizeUrl(url);
  entries.set(key, {
    id,
    site: {
      url: domain,
      name: siteName(url),
      diedYear: DEAD_SITES.find((s) => s.domain === domain)?.diedYear ?? null,
    },
    firstSeenAt: new Date().toISOString(),
    payload,
  });
  while (entries.size > MAX_ENTRIES) entries.delete(entries.keys().next().value as string);
}

export interface ListOptions {
  /** Only this site, matched after normalizing (e.g. "geocities.com"). */
  site?: string;
  limit: number;
  offset: number;
}

/** Newest first. `total` counts every match, before limit and offset. */
export function listPublic({ site, limit, offset }: ListOptions): { total: number; items: PublicEntry[] } {
  const wanted = site ? normalizeUrl(site) : null;
  const all = Array.from(entries.values())
    .filter((e) => wanted === null || e.site.url === wanted)
    .reverse();
  return { total: all.length, items: all.slice(offset, offset + limit) };
}

/** The JSON shape of one entry in the public API. */
export function toPublicItem(entry: PublicEntry, origin: string, includeContent: boolean) {
  const { payload } = entry;
  const score = qualityScore(payload.extracted);
  return {
    id: entry.id,
    page: `${origin}/r/${entry.id}`,
    raw: `${origin}/r/${entry.id}/raw`,
    site: entry.site,
    firstSeenAt: entry.firstSeenAt,
    snapshot: {
      source: "Internet Archive Wayback Machine",
      timestamp: payload.snapshotTimestamp,
      capturedAt: parseWaybackTimestamp(payload.snapshotTimestamp)?.toISOString() ?? null,
      url: payload.snapshotUrl,
    },
    quality: { score, badge: qualityBadge(score), fragments: fragmentCount(payload.extracted) },
    postMortem: payload.postMortem,
    ...(includeContent ? { extracted: payload.extracted } : {}),
  };
}

/** Test hook: empties the registry. */
export function clearPublic(): void {
  entries.clear();
}
