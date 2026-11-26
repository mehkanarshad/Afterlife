"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { GhostIcon } from "../../icons";
import { QualityBadge, formatDate } from "../../quality-badge";
import { ResultView } from "../../results-view";
import {
  ResurrectionRecord,
  findRecord,
  parseWaybackTimestamp,
  siteName,
} from "../../resurrection-log";

type State = { kind: "loading" } | { kind: "missing" } | { kind: "found"; record: ResurrectionRecord };

// Read-only view of one logged resurrection. Records live in localStorage, so
// this only finds links created in the same browser.
export default function SharedResurrectionPage() {
  const params = useParams<{ shareId: string }>();
  const shareId = params?.shareId ?? "";
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    const record = findRecord(shareId);
    setState(record ? { kind: "found", record } : { kind: "missing" });
  }, [shareId]);

  return (
    <main className="relative min-h-screen bg-crypt px-6 pb-16 pt-28 font-mono text-neutral-200">
      <div className="moonlight pointer-events-none absolute inset-x-0 top-0 h-[28rem]" aria-hidden="true" />
      <div className="relative mx-auto w-full max-w-6xl">
        {state.kind === "missing" && (
          <div className="mx-auto flex max-w-md flex-col items-center py-20 text-center">
            <GhostIcon className="h-16 w-16 text-ghost/70" strokeWidth={1.25} />
            <h1 className="mt-6 font-display text-2xl font-bold text-neutral-100">
              This grave is empty
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-neutral-500">
              No resurrection with this link is stored in this browser. The log is kept on the
              device that made it, so share links only open there, and clearing the log removes
              them.
            </p>
            <Link
              href="/"
              className="mt-8 text-sm text-ghost underline underline-offset-4 hover:text-pumpkin"
            >
              Back to the graveyard
            </Link>
          </div>
        )}

        {state.kind === "found" && <SharedView record={state.record} />}
      </div>
    </main>
  );
}

function SharedView({ record }: { record: ResurrectionRecord }) {
  const snapshotDate = parseWaybackTimestamp(record.result.snapshotTimestamp);

  return (
    <>
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b border-neutral-800 pb-6">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500 [font-variant-caps:all-small-caps]">
            A resurrection
          </p>
          <h1 className="mt-2 truncate font-display text-4xl font-bold tracking-wide text-pumpkin">
            {siteName(record.url)}
          </h1>
          <p className="mt-2 text-xs text-neutral-500">
            {record.deathYear !== null && (
              <>
                <span className="text-ghost/70">† {record.deathYear}</span>
                {" · "}
              </>
            )}
            {snapshotDate && (
              <>
                Snapshot from{" "}
                <time dateTime={snapshotDate.toISOString()}>
                  {snapshotDate.toLocaleDateString(undefined, { dateStyle: "medium" })}
                </time>
                {" · "}
              </>
            )}
            Resurrected{" "}
            <time dateTime={record.timestamp}>{formatDate(new Date(record.timestamp))}</time>
          </p>
        </div>
        <QualityBadge score={record.qualityScore} />
      </header>
      <ResultView result={record.result} />
    </>
  );
}
