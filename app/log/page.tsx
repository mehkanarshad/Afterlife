"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BUTTONS, LOG } from "../copy";
import { CrossIcon, GhostIcon } from "../icons";
import { Modal } from "../modal";
import { QualityBadge, formatDate } from "../quality-badge";
import { ResultView } from "../results-view";
import {
  ResurrectionRecord,
  clearLog,
  readLog,
  siteName,
} from "../resurrection-log";

const smallButton =
  "rounded-md border px-3 py-1.5 font-mono text-xs transition-colors focus-visible:outline-none";

function shareUrl(shareId: string): string {
  return `${window.location.origin}/r/${shareId}`;
}

function CopyShareLink({ shareId }: { shareId: string }) {
  const [state, setState] = useState<"idle" | "copied" | "manual">("idle");

  useEffect(() => {
    if (state !== "copied") return;
    const id = setTimeout(() => setState("idle"), 2000);
    return () => clearTimeout(id);
  }, [state]);

  async function copy() {
    try {
      // The Clipboard API needs a secure context (https or localhost).
      await navigator.clipboard.writeText(shareUrl(shareId));
      setState("copied");
    } catch {
      setState("manual");
    }
  }

  if (state === "manual") {
    return (
      <input
        readOnly
        autoFocus
        value={shareUrl(shareId)}
        onFocus={(e) => e.currentTarget.select()}
        aria-label={LOG.manualCopy}
        className="w-full rounded-md border border-neutral-700 bg-crypt px-2 py-1.5 font-mono text-xs text-neutral-300 focus:border-pumpkin focus:outline-none sm:w-64"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className={`${smallButton} border-neutral-700 text-neutral-300 hover:border-ghost/60 hover:text-ghost focus-visible:border-ghost`}
    >
      <span aria-live="polite">{state === "copied" ? BUTTONS.linkCopied : BUTTONS.copyLink}</span>
    </button>
  );
}

function TimelineEntry({
  record,
  onView,
}: {
  record: ResurrectionRecord;
  onView: (record: ResurrectionRecord) => void;
}) {
  return (
    <li className="relative pb-10 pl-10 last:pb-0">
      {/* Node on the timeline */}
      <span
        className="absolute left-0 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-neutral-700 bg-tomb text-ghost/80"
        aria-hidden="true"
      >
        <CrossIcon className="h-3.5 w-3.5" />
      </span>
      <article className="stone relative overflow-hidden rounded-b-md rounded-t-2xl border border-neutral-700/70 p-5">
        <span className="noise-overlay rounded-[inherit]" aria-hidden="true" />
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate font-display text-xl font-bold tracking-wide text-neutral-100">
              {siteName(record.url)}
            </h2>
            <p className="mt-1 text-xs text-neutral-500">
              Resurrected{" "}
              <time dateTime={record.timestamp}>{formatDate(new Date(record.timestamp))}</time>
              {record.deathYear !== null && (
                <>
                  {" · "}
                  <span className="text-ghost/70">† {record.deathYear}</span>
                </>
              )}
            </p>
          </div>
          <QualityBadge score={record.qualityScore} />
        </div>
        <div className="relative mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onView(record)}
            aria-label={`Open the grave of ${siteName(record.url)}`}
            className={`${smallButton} border-pumpkin/50 text-pumpkin hover:bg-pumpkin hover:text-black focus-visible:bg-pumpkin focus-visible:text-black`}
          >
            {BUTTONS.openGrave}
          </button>
          <CopyShareLink shareId={record.shareId} />
        </div>
      </article>
    </li>
  );
}

export default function LogPage() {
  // null until mounted: localStorage doesn't exist during server rendering.
  const [records, setRecords] = useState<ResurrectionRecord[] | null>(null);
  const [viewing, setViewing] = useState<ResurrectionRecord | null>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);

  useEffect(() => {
    setRecords(readLog());
  }, []);

  function handleClear() {
    clearLog();
    setRecords([]);
    setConfirmingClear(false);
  }

  return (
    <main className="relative min-h-screen bg-crypt px-6 pb-16 pt-28 font-mono text-neutral-200">
      <div className="moonlight pointer-events-none absolute inset-x-0 top-0 h-[28rem]" aria-hidden="true" />
      <div className="relative mx-auto w-full max-w-2xl">
        <header className="mb-12 text-center">
          <h1 className="font-display text-4xl font-bold tracking-wide text-pumpkin [text-shadow:0_0_24px_rgba(255,107,26,0.3)] sm:text-5xl">
            Resurrection Log
          </h1>
          <p className="mt-3 text-sm text-neutral-500">{LOG.subtitle}</p>
        </header>

        {records !== null && records.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <GhostIcon className="h-16 w-16 text-ghost/70" strokeWidth={1.25} />
            <p className="mt-6 text-ghost">{LOG.emptyTitle}</p>
            <p className="mt-2 text-sm text-neutral-500">{LOG.emptyHelp}</p>
            <Link
              href="/"
              className="mt-6 text-sm text-ghost underline underline-offset-4 hover:text-pumpkin"
            >
              {LOG.emptyLink}
            </Link>
          </div>
        )}

        {records !== null && records.length > 0 && (
          <>
            <ol className="relative">
              {/* The timeline's spine, behind the nodes */}
              <span
                className="absolute bottom-6 left-3 top-3 w-px bg-gradient-to-b from-neutral-700 via-neutral-800 to-transparent"
                aria-hidden="true"
              />
              {records.map((record) => (
                <TimelineEntry key={record.shareId} record={record} onView={setViewing} />
              ))}
            </ol>
            <div className="mt-14 flex justify-center">
              <button
                type="button"
                onClick={() => setConfirmingClear(true)}
                className={`${smallButton} border-neutral-700 text-neutral-400 hover:border-red-400/60 hover:text-red-300 focus-visible:border-red-400`}
              >
                {BUTTONS.clearLog}
              </button>
            </div>
          </>
        )}
      </div>

      <Modal
        open={viewing !== null}
        onClose={() => setViewing(null)}
        title={viewing ? siteName(viewing.url) : ""}
        wide
      >
        {viewing && <ResultView result={viewing.result} />}
      </Modal>

      <Modal open={confirmingClear} onClose={() => setConfirmingClear(false)} title={LOG.clearTitle}>
        <p className="text-sm leading-relaxed text-neutral-400">
          {LOG.clearBody(records?.length ?? 0)}
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            data-autofocus
            onClick={() => setConfirmingClear(false)}
            className="rounded-md border border-neutral-700 px-5 py-2 font-mono text-sm text-neutral-300 transition-colors hover:border-ghost/60 hover:text-ghost focus-visible:border-ghost focus-visible:outline-none"
          >
            {BUTTONS.keepLog}
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="rounded-md border border-red-400/60 bg-red-950/40 px-5 py-2 font-mono text-sm text-red-200 transition-colors hover:bg-red-900/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            {BUTTONS.clearLog}
          </button>
        </div>
      </Modal>
    </main>
  );
}
