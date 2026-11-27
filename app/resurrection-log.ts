import { DEAD_SITES } from "@/lib/sites";
import { qualityScore } from "@/lib/quality";
import type { ResurrectResult } from "./use-resurrect";

// The log lives in this browser's localStorage only. Nothing is sent to the
// server, so a share link (/r/{shareId}) opens only in the browser that
// recorded it.

const STORAGE_KEY = "afterlife:log";
const MAX_RECORDS = 50;

export interface ResurrectionRecord {
  /** What was resurrected, as submitted (e.g. "geocities.com"). */
  url: string;
  /** When it was resurrected, ISO 8601. */
  timestamp: string;
  /** From the graveyard list; null for custom URLs not in it. */
  deathYear: number | null;
  qualityScore: number;
  shareId: string;
  /** The extracted result, so "View" and share links work without refetching. */
  result: ResurrectResult;
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

function isCouncilVerdict(v: unknown): boolean {
  if (typeof v !== "object" || v === null) return false;
  const c = v as Record<string, unknown>;
  return typeof c.year === "number" && typeof c.agreed === "number" && typeof c.total === "number";
}

function isVerdict(v: unknown): boolean {
  if (typeof v !== "object" || v === null) return false;
  const p = v as Record<string, unknown>;
  return typeof p.cause === "string" && typeof p.evidence === "string";
}

// localStorage is user-editable and may hold data from an older version, so
// every record is checked before use. Invalid entries are dropped.
function isRecord(v: unknown): v is ResurrectionRecord {
  if (typeof v !== "object" || v === null) return false;
  const r = v as Record<string, unknown>;
  const result = r.result as Record<string, unknown> | undefined;
  const extracted = result?.extracted as Record<string, unknown> | undefined;
  return (
    typeof r.url === "string" &&
    typeof r.timestamp === "string" &&
    !Number.isNaN(Date.parse(r.timestamp)) &&
    (r.deathYear === null || typeof r.deathYear === "number") &&
    typeof r.qualityScore === "number" &&
    typeof r.shareId === "string" &&
    typeof result === "object" &&
    result !== null &&
    typeof result.snapshotUrl === "string" &&
    typeof result.snapshotTimestamp === "string" &&
    (result.postMortem === undefined || isVerdict(result.postMortem)) &&
    (result.council === undefined || isCouncilVerdict(result.council)) &&
    typeof extracted === "object" &&
    extracted !== null &&
    typeof extracted.title === "string" &&
    isStringArray(extracted.headings) &&
    isStringArray(extracted.paragraphs) &&
    isStringArray(extracted.images)
  );
}

/** Newest first. Returns [] when storage is empty, unavailable or corrupt. */
export function readLog(): ResurrectionRecord[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isRecord) : [];
  } catch {
    return [];
  }
}

function writeLog(records: ResurrectionRecord[]): void {
  // On a full quota, drop the oldest records and try again.
  for (let keep = records.length; keep > 0; keep = Math.floor(keep / 2)) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, keep)));
      return;
    } catch {
      // QuotaExceededError, or storage disabled: retry smaller, then give up.
    }
  }
}

export function findRecord(shareId: string): ResurrectionRecord | undefined {
  return readLog().find((r) => r.shareId === shareId);
}

export function clearLog(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage unavailable: nothing to clear.
  }
}

/** URL-safe random id, 12 characters. */
function newShareId(): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

/** "https://www.MySpace.com/tom/" -> "myspace.com/tom" */
export function normalizeUrl(url: string): string {
  return url
    .trim()
    .toLowerCase()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/+$/, "");
}

/** The graveyard name for a URL if it's one of ours, else the normalized URL. */
export function siteName(url: string): string {
  const key = normalizeUrl(url);
  return DEAD_SITES.find((s) => s.domain === key)?.name ?? key;
}

export function addRecord(result: ResurrectResult): ResurrectionRecord {
  const key = normalizeUrl(result.originalUrl);
  const record: ResurrectionRecord = {
    url: result.originalUrl,
    timestamp: new Date().toISOString(),
    deathYear: DEAD_SITES.find((s) => s.domain === key)?.diedYear ?? null,
    qualityScore: qualityScore(result.extracted),
    shareId: newShareId(),
    result,
  };
  writeLog([record, ...readLog()].slice(0, MAX_RECORDS));
  return record;
}

/** "20190613084634" -> Date, or null if malformed. */
export function parseWaybackTimestamp(ts: string): Date | null {
  const m = /^(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?/.exec(ts);
  if (!m) return null;
  const [, y, mo, d, h = "0", mi = "0", s = "0"] = m;
  const date = new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s));
  return Number.isNaN(date.getTime()) ? null : date;
}
