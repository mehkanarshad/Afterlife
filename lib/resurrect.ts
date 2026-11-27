import * as cheerio from "cheerio";
import { extractContent } from "./extract";
import type { CouncilVerdict } from "./council";
import { inferDeathCause } from "./death-cause";
import type { DeathVerdict } from "./post-mortem";
import { THIN_THRESHOLD, qualityScore } from "./quality";
import { getSnapshot, snapshotUrlFor } from "./wayback";

const SNAPSHOT_TIMEOUT_MS = 10_000;
const THIN_SNAPSHOT_HINT =
  "This snapshot contains very little readable content. It may be a redirect or error page.";

export interface ResurrectPayload {
  originalUrl: string;
  snapshotTimestamp: string;
  snapshotUrl: string;
  extracted: { title: string; headings: string[]; paragraphs: string[]; images: string[] };
  postMortem: DeathVerdict;
  status: "ok" | "thin_snapshot";
  hint?: string;
  /** Present when Council Mode picked this snapshot. */
  council?: CouncilVerdict;
}

export type ResurrectOutcome =
  | { ok: true; payload: ResurrectPayload; html: string }
  | { ok: false; status: 404 | 500 | 502 | 504; error: string };

/**
 * Fetches one snapshot of `url` (the most recent, or the capture at
 * `timestamp`) and extracts its readable content.
 */
export async function resurrectSnapshot(url: string, timestamp?: string): Promise<ResurrectOutcome> {
  try {
    const snapshot =
      timestamp !== undefined
        ? { snapshotUrl: snapshotUrlFor(url, timestamp), timestamp, archivedStatus: null }
        : await getSnapshot(url);
    if (!snapshot) return { ok: false, status: 404, error: "No snapshot found" };

    const res = await fetch(snapshot.snapshotUrl, { signal: AbortSignal.timeout(SNAPSHOT_TIMEOUT_MS) });

    // A replayed capture carries Memento-Datetime. If it's present, a 404 or
    // 5xx is the dead site's own recorded response, not a Wayback failure.
    const archivedResponse = res.headers.has("memento-datetime");
    const archivedStatus = archivedResponse ? res.status : snapshot.archivedStatus;

    if (!res.ok && !archivedResponse) {
      return { ok: false, status: 502, error: `Snapshot fetch failed with status ${res.status}` };
    }

    const html = await res.text();
    const extracted = extractContent(html);
    const thin = qualityScore(extracted) < THIN_THRESHOLD;

    // After redirects, the final replay URL names the capture actually served.
    const servedTimestamp = /\/web\/(\d{14})/.exec(res.url)?.[1] ?? snapshot.timestamp;

    return {
      ok: true,
      html,
      payload: {
        originalUrl: url,
        snapshotTimestamp: servedTimestamp,
        snapshotUrl: res.url ? res.url.replace(/^http:\/\//, "https://") : snapshot.snapshotUrl,
        extracted,
        postMortem: inferDeathCause({ archivedStatus, html, thin }),
        status: thin ? "thin_snapshot" : "ok",
        ...(thin ? { hint: THIN_SNAPSHOT_HINT } : {}),
      },
    };
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      return { ok: false, status: 504, error: "Timed out fetching snapshot" };
    }
    return { ok: false, status: 500, error: "Failed to resurrect page" };
  }
}

/** Counts of <table> and <font> tags: markers of period-style layout. */
export function layoutMetrics(html: string): { tables: number; fonts: number } {
  const $ = cheerio.load(html);
  return { tables: $("table").length, fonts: $("font").length };
}

/** The `url` field of a request body, or null when missing or empty. */
export function readUrlField(body: unknown): string | null {
  const url = typeof body === "object" && body !== null ? (body as Record<string, unknown>).url : undefined;
  return typeof url === "string" && url.trim() !== "" ? url : null;
}
