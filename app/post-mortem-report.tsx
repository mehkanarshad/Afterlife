"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SnapshotEntry, eraOf, yearOf } from "@/lib/post-mortem";
import { qualityBadge, qualityScore } from "@/lib/quality";
import type { ResurrectResult } from "./use-resurrect";

type Timeline =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; snapshots: SnapshotEntry[] };

// Capture lists change slowly; reuse them for the rest of the session.
const timelineCache = new Map<string, SnapshotEntry[]>();

// Text colors chosen for contrast on the parchment (all at least 4.5:1).
const INK = "text-[#3a2a18]";
const FADED_INK = "text-[#6b5233]";
const RUST = "text-[#a3400c]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-dashed border-[#b89b6e] py-3 last:border-b-0 sm:grid sm:grid-cols-[11rem_1fr] sm:gap-4">
      <dt className={`text-[0.7rem] uppercase tracking-[0.2em] ${FADED_INK}`}>{label}</dt>
      <dd className={`mt-1 sm:mt-0 ${INK}`}>{children}</dd>
    </div>
  );
}

export function PostMortemReport({
  result,
  onResurrectSnapshot,
}: {
  result: ResurrectResult;
  /** When given, each year resurrects that capture. Without it (read-only
   *  views), years link to the capture on the Wayback Machine. */
  onResurrectSnapshot?: (timestamp: string) => void;
}) {
  const [timeline, setTimeline] = useState<Timeline>({ kind: "idle" });
  const abort = useRef<AbortController | null>(null);

  const year = yearOf(result.snapshotTimestamp);
  const score = qualityScore(result.extracted);
  const verdict = result.postMortem;

  const loadTimeline = useCallback(async () => {
    const key = result.originalUrl;
    const cached = timelineCache.get(key);
    if (cached) {
      setTimeline({ kind: "ready", snapshots: cached });
      return;
    }
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setTimeline({ kind: "loading" });
    try {
      const res = await fetch(`/api/snapshots?url=${encodeURIComponent(key)}`, {
        signal: controller.signal,
      });
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        setTimeline({
          kind: "error",
          message:
            res.status === 504
              ? "The Wayback Machine took too long to list snapshots."
              : "Couldn't list snapshots from the Wayback Machine.",
        });
        return;
      }
      const snapshots =
        typeof data === "object" && data !== null && Array.isArray((data as { snapshots?: unknown }).snapshots)
          ? ((data as { snapshots: SnapshotEntry[] }).snapshots)
          : [];
      timelineCache.set(key, snapshots);
      setTimeline({ kind: "ready", snapshots });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setTimeline({ kind: "error", message: "Couldn't reach the server." });
    }
  }, [result.originalUrl]);

  useEffect(() => () => abort.current?.abort(), []);

  return (
    <details
      className="group parchment relative mt-8 overflow-hidden rounded-sm border-2 border-pumpkin/80 font-mono shadow-[0_10px_30px_-10px_rgba(0,0,0,0.9)]"
      onToggle={(e) => {
        if (e.currentTarget.open && timeline.kind === "idle") void loadTimeline();
      }}
    >
      <summary
        className={`flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#a3400c] sm:px-7 [&::-webkit-details-marker]:hidden ${INK}`}
      >
        <span className="min-w-0">
          <span className={`block text-[0.65rem] uppercase tracking-[0.35em] ${FADED_INK}`}>
            Case file · {result.snapshotTimestamp}
          </span>
          <span className="mt-1 block font-display text-xl font-bold tracking-wide">
            Post-Mortem Report
          </span>
          {/* Key findings stay visible while collapsed. */}
          <span className={`mt-1 block truncate text-xs ${FADED_INK}`}>
            {verdict?.cause ?? "Cause not recorded"} · {qualityBadge(score)}
            {year !== null && ` · ${eraOf(year)}`}
          </span>
        </span>
        <span
          className={`shrink-0 text-sm transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none ${RUST}`}
          aria-hidden="true"
        >
          ▼
        </span>
      </summary>

      <div className="relative border-t-2 border-dashed border-pumpkin/60 px-5 pb-6 pt-2 text-sm sm:px-7">
        {/* Rubber stamp */}
        <span
          className="pointer-events-none absolute right-5 top-4 rotate-[-8deg] rounded-sm border-2 border-[#a3400c]/70 px-2 py-0.5 text-xs font-bold uppercase tracking-[0.3em] text-[#a3400c]/70 sm:right-7"
          aria-hidden="true"
        >
          Deceased
        </span>

        <dl>
          <Field label="Death cause">
            {verdict ? (
              <>
                <span className="font-bold">{verdict.cause}</span>
                <span className={`ml-2 text-[0.7rem] uppercase tracking-wider ${FADED_INK}`}>
                  (inferred)
                </span>
                <p className={`mt-1 text-xs leading-relaxed ${FADED_INK}`}>{verdict.evidence}</p>
              </>
            ) : (
              <span className={FADED_INK}>
                Not recorded for this resurrection. Resurrect the site again to analyze it.
              </span>
            )}
          </Field>

          <Field label="Snapshot quality">
            <span className="font-bold">{qualityBadge(score)}</span>
            <span className={`ml-2 text-xs ${FADED_INK}`}>score {score}</span>
          </Field>

          <Field label="Era detected">
            {year !== null ? (
              <>
                <span className="font-bold">{eraOf(year)}</span>
                <span className={`ml-2 text-xs ${FADED_INK}`}>captured {year}</span>
              </>
            ) : (
              <span className={FADED_INK}>Unknown</span>
            )}
          </Field>

          <Field label="Available snapshots">
            {timeline.kind === "loading" && (
              <p role="status" className={FADED_INK}>
                Searching the archive…
              </p>
            )}
            {timeline.kind === "error" && (
              <p role="alert">
                <span className={FADED_INK}>{timeline.message}</span>{" "}
                <button
                  type="button"
                  onClick={() => void loadTimeline()}
                  className={`underline underline-offset-4 hover:no-underline ${RUST}`}
                >
                  Try again
                </button>
              </p>
            )}
            {timeline.kind === "ready" && timeline.snapshots.length === 0 && (
              <p className={FADED_INK}>The archive lists no successful captures for this URL.</p>
            )}
            {timeline.kind === "ready" && timeline.snapshots.length > 0 && (
              <>
                <p className={`mb-3 text-xs ${FADED_INK}`}>
                  {timeline.snapshots.length} years on record, one capture each.{" "}
                  {onResurrectSnapshot ? "Pick a year to resurrect it." : "Open a year in the archive."}
                </p>
                <ol className="flex flex-wrap gap-2">
                  {timeline.snapshots.map((s) => {
                    const current = s.year === year;
                    const base = `inline-block rounded-sm border px-2.5 py-1 text-xs tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a3400c] ${
                      current
                        ? "border-[#a3400c] bg-[#a3400c] text-[#f3ead6]"
                        : "border-[#a3400c]/60 text-[#a3400c] hover:bg-[#a3400c]/10"
                    }`;
                    const label = `${s.year}${current ? " (showing)" : ""}`;
                    return (
                      <li key={s.timestamp}>
                        {onResurrectSnapshot ? (
                          <button
                            type="button"
                            onClick={() => onResurrectSnapshot(s.timestamp)}
                            disabled={current}
                            aria-current={current ? "true" : undefined}
                            aria-label={current ? `${s.year}, currently shown` : `Resurrect the ${s.year} snapshot`}
                            className={`${base} disabled:cursor-default`}
                          >
                            {s.year}
                          </button>
                        ) : (
                          <a
                            href={`https://web.archive.org/web/${s.timestamp}/${result.originalUrl.replace(/^https?:\/\//i, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Open the ${label} snapshot on the Wayback Machine`}
                            className={base}
                          >
                            {s.year}
                          </a>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </>
            )}
          </Field>
        </dl>
      </div>
    </details>
  );
}
