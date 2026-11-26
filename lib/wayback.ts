import { SnapshotEntry, parseCdxYears } from "./post-mortem";

const WAYBACK_API = "https://archive.org/wayback/available";
const CDX_API = "https://web.archive.org/cdx/search/cdx";

interface WaybackAvailableResponse {
  archived_snapshots?: {
    closest?: {
      available: boolean;
      url: string;
      timestamp: string;
      status: string;
    };
  };
}

/** The availability API times out for some https:// URLs (e.g. geocities.com)
 *  but resolves the same bare host, so look up without the protocol. */
function bareUrl(url: string): string {
  return url.trim().replace(/^https?:\/\//i, "");
}

export async function getSnapshot(url: string): Promise<{
  snapshotUrl: string;
  timestamp: string;
  /** HTTP status the archive recorded for this capture, or null if unknown. */
  archivedStatus: number | null;
} | null> {
  try {
    const endpoint = `${WAYBACK_API}?url=${encodeURIComponent(bareUrl(url))}`;
    const res = await fetch(endpoint);

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as WaybackAvailableResponse;
    const closest = data?.archived_snapshots?.closest;

    if (!closest || !closest.available) {
      return null;
    }

    const snapshotUrl = closest.url.replace(/^http:\/\//, "https://");
    const status = Number(closest.status);

    return {
      snapshotUrl,
      timestamp: closest.timestamp,
      archivedStatus: Number.isInteger(status) && status > 0 ? status : null,
    };
  } catch {
    return null;
  }
}

/** Replay URL for an exact capture; Wayback redirects to the nearest one if needed. */
export function snapshotUrlFor(url: string, timestamp: string): string {
  return `https://web.archive.org/web/${timestamp}/${bareUrl(url)}`;
}

export type SnapshotYearsResult =
  | { ok: true; snapshots: SnapshotEntry[] }
  | { ok: false; reason: "timeout" | "upstream" };

/**
 * Lists one successful (HTTP 200) capture per year for a URL, oldest first,
 * using the Wayback CDX API.
 */
export async function getSnapshotYears(url: string, timeoutMs: number): Promise<SnapshotYearsResult> {
  const params = new URLSearchParams({
    url: bareUrl(url),
    output: "json",
    fl: "timestamp",
    filter: "statuscode:200",
    // First capture of each year; keeps the response small for busy sites.
    collapse: "timestamp:4",
    limit: "60",
  });
  try {
    const res = await fetch(`${CDX_API}?${params}`, { signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) return { ok: false, reason: "upstream" };
    // CDX returns an empty body (not "[]") when there are no captures.
    const text = await res.text();
    return { ok: true, snapshots: text.trim() ? parseCdxYears(JSON.parse(text)) : [] };
  } catch (err) {
    const timedOut = err instanceof Error && err.name === "TimeoutError";
    return { ok: false, reason: timedOut ? "timeout" : "upstream" };
  }
}
