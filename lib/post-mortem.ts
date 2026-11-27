export type DeathCause =
  | "Redirect stub"
  | "Domain expired"
  | "404"
  | "Server gone"
  | "Undetermined";

export interface DeathVerdict {
  cause: DeathCause;
  /** Plain-language reason for the verdict, shown next to it. */
  evidence: string;
}

export type Era = "90s" | "2000s" | "2010s" | "2020s";

export interface SnapshotEntry {
  /** 14-digit Wayback timestamp, e.g. "20190613084634". */
  timestamp: string;
  year: number;
}

export function eraOf(year: number): Era {
  if (year < 2000) return "90s";
  if (year < 2010) return "2000s";
  if (year < 2020) return "2010s";
  return "2020s";
}

/** Year from a Wayback timestamp, or null if it isn't one. */
export function yearOf(timestamp: string): number | null {
  const m = /^(\d{4})\d{0,10}$/.exec(timestamp);
  return m ? Number(m[1]) : null;
}

/**
 * Parses the CDX API's JSON output (`output=json&fl=timestamp,...`), whose
 * first row is the header. Returns one entry per year, oldest first.
 */
export function parseCdxYears(rows: unknown): SnapshotEntry[] {
  if (!Array.isArray(rows) || rows.length < 2) return [];
  const header = rows[0];
  if (!Array.isArray(header)) return [];
  const col = header.indexOf("timestamp");
  if (col < 0) return [];

  const byYear = new Map<number, SnapshotEntry>();
  for (const row of rows.slice(1)) {
    if (!Array.isArray(row) || typeof row[col] !== "string") continue;
    const timestamp = row[col] as string;
    if (!/^\d{14}$/.test(timestamp)) continue;
    const year = Number(timestamp.slice(0, 4));
    if (!byYear.has(year)) byYear.set(year, { timestamp, year });
  }
  return Array.from(byYear.values()).sort((a, b) => a.year - b.year);
}
