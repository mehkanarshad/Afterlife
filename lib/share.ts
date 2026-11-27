// A share link carries everything needed to rebuild the page: the site, the
// archived capture, when it was resurrected, and its death year. The server
// re-fetches the content from the Wayback Machine, so links work for anyone,
// need no database, and can't be used to host arbitrary content.

export interface ShareRef {
  /** The site as originally entered, e.g. "geocities.com". */
  url: string;
  /** 14-digit Wayback timestamp of the capture. */
  timestamp: string;
  /** When the visitor resurrected it, ISO 8601 UTC. */
  resurrectedAt: string;
  /** From the graveyard list; null for custom URLs not in it. */
  deathYear: number | null;
}

const MAX_URL_LENGTH = 2048;
const MAX_ID_LENGTH = 4096;
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const b of Array.from(bytes)) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(id: string): string {
  const padded = id.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

export function encodeShareId(ref: ShareRef): string {
  return toBase64Url(JSON.stringify({ u: ref.url, t: ref.timestamp, r: ref.resurrectedAt, d: ref.deathYear }));
}

/** Returns null for anything that isn't a well-formed share id. */
export function decodeShareId(id: string): ShareRef | null {
  if (id.length === 0 || id.length > MAX_ID_LENGTH || !/^[A-Za-z0-9_-]+$/.test(id)) return null;
  try {
    const data: unknown = JSON.parse(fromBase64Url(id));
    if (typeof data !== "object" || data === null) return null;
    const { u, t, r, d } = data as Record<string, unknown>;
    if (typeof u !== "string" || u.trim() === "" || u.length > MAX_URL_LENGTH) return null;
    if (typeof t !== "string" || !/^\d{14}$/.test(t) || !parseWaybackTimestamp(t)) return null;
    if (typeof r !== "string" || !ISO_UTC.test(r) || Number.isNaN(Date.parse(r))) return null;
    if (d !== null && !(typeof d === "number" && Number.isInteger(d) && d >= 1990 && d <= 2100)) return null;
    return { url: u, timestamp: t, resurrectedAt: r, deathYear: d };
  } catch {
    return null;
  }
}

/** "20190613084634" -> Date, or null if malformed. */
export function parseWaybackTimestamp(ts: string): Date | null {
  const m = /^(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?/.exec(ts);
  if (!m) return null;
  const [, y, mo, d, h = "0", mi = "0", s = "0"] = m;
  const date = new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s));
  // Date.UTC rolls month 13 or day 40 over into a valid date. Reject those:
  // every component must survive the round trip unchanged.
  const exact =
    date.getUTCFullYear() === +y &&
    date.getUTCMonth() === +mo - 1 &&
    date.getUTCDate() === +d &&
    date.getUTCHours() === +h &&
    date.getUTCMinutes() === +mi &&
    date.getUTCSeconds() === +s;
  return exact ? date : null;
}

/** "November 27, 2026". UTC, so server and browser always agree. */
export function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(date);
}
