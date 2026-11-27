"use client";

import { ResurrectionCeremony } from "./ceremony";
import { CouncilVerdictBadge } from "./council-debate";
import { GhostIcon, SkullIcon, WarningIcon } from "./icons";
import { PostMortemReport } from "./post-mortem-report";
import {
  ERROR_COPY,
  ErrorKind,
  ResurrectResult,
  isEmptyResult,
} from "./use-resurrect";

// Placeholder line for the loading skeleton (pale gray gradient sweep).
function ShimmerLine({ width }: { width: string }) {
  return (
    <div
      className={`h-4 animate-shimmer rounded bg-[linear-gradient(90deg,rgba(200,200,210,0.05)_0%,rgba(200,200,210,0.18)_50%,rgba(200,200,210,0.05)_100%)] bg-[length:200%_100%] motion-reduce:animate-none ${width}`}
    />
  );
}

// The snapshot link, styled as a tombstone card.
function TombstoneLink({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block overflow-hidden rounded-b-md rounded-t-[2rem] border border-neutral-700/80 bg-crypt px-6 pb-6 pt-7 font-mono transition-[border-color,box-shadow] hover:border-pumpkin/60 hover:shadow-[0_0_24px_rgba(255,107,26,0.12)] focus-visible:border-pumpkin focus-visible:outline-none"
    >
      <span className="noise-overlay" aria-hidden="true" />
      <SkullIcon className="relative h-8 w-8 text-neutral-500 transition-colors group-hover:text-ghost" />
      <p className="relative mt-4 truncate text-xs text-neutral-400" title={url}>
        {url}
      </p>
      <span className="relative mt-4 inline-block text-sm text-pumpkin">
        View original snapshot →
      </span>
    </a>
  );
}

// Horizontal on mobile (between the stacked columns), vertical from md up.
// On desktop the icon sits near the top: the divider stretches to the height
// of the resurrected content, so centring it would push it out of view.
function ColumnDivider() {
  const line =
    "flex-1 bg-gradient-to-r from-transparent via-neutral-700 to-transparent h-px md:h-auto md:w-px md:bg-gradient-to-b";
  return (
    <div
      className="flex items-center justify-center gap-3 md:flex-col md:justify-start md:pt-7"
      aria-hidden="true"
    >
      <span className={`${line} md:h-16 md:flex-none md:from-transparent md:to-neutral-700`} />
      <GhostIcon className="h-5 w-5 shrink-0 text-ghost/60" />
      <span className={line} />
    </div>
  );
}

function ColumnLabel({ tone, children }: { tone: "ghost" | "pumpkin"; children: string }) {
  return (
    <h3
      className={`mb-2 text-sm uppercase tracking-widest [font-variant-caps:all-small-caps] ${
        tone === "ghost" ? "text-ghost" : "text-pumpkin"
      }`}
    >
      {children}
    </h3>
  );
}

function TwoColumns({ ghost, resurrected }: { ghost: React.ReactNode; resurrected: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1.6fr)]">
      {ghost}
      <ColumnDivider />
      {resurrected}
    </div>
  );
}

export function ErrorAlert({ kind }: { kind: ErrorKind }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-md border border-pumpkin/40 border-l-4 border-l-pumpkin bg-crypt px-4 py-3 text-left"
    >
      <WarningIcon className="mt-0.5 h-5 w-5 shrink-0 text-pumpkin" />
      <div>
        <p className="text-sm text-white">{ERROR_COPY[kind].message}</p>
        <p className="mt-1 text-xs text-neutral-400">{ERROR_COPY[kind].hint}</p>
      </div>
    </div>
  );
}

export function LoadingView({ council = false }: { council?: boolean }) {
  return (
    <TwoColumns
      ghost={
        <section className="flex flex-col">
          <ColumnLabel tone="ghost">Ghost</ColumnLabel>
          <div
            className="h-32 animate-pulse rounded-b-md rounded-t-[2rem] border border-neutral-800 bg-crypt motion-reduce:animate-none"
            aria-hidden="true"
          />
        </section>
      }
      resurrected={
        <section className="flex flex-col">
          <ColumnLabel tone="pumpkin">Resurrected</ColumnLabel>
          <div className="flex min-h-[20rem] flex-col rounded-md border border-neutral-800 bg-crypt p-8">
            <div className="space-y-4" aria-hidden="true">
              <ShimmerLine width="w-3/4" />
              <ShimmerLine width="w-full" />
              <ShimmerLine width="w-3/5" />
            </div>
            <ResurrectionCeremony council={council} />
          </div>
        </section>
      }
    />
  );
}

// Reveal order after the ceremony: title, then headings, then paragraphs,
// then images, 200ms apart. Staggered by group rather than by item, so a long
// page doesn't take seconds to appear.
const REVEAL = "animate-rise-in motion-reduce:animate-none";
const DELAY = {
  title: "",
  headings: "[animation-delay:200ms]",
  paragraphs: "[animation-delay:400ms]",
  images: "[animation-delay:600ms]",
};

export function ResultView({
  result,
  onResurrectSnapshot,
}: {
  result: ResurrectResult;
  /** Lets the post-mortem's year list resurrect a capture. Omit for read-only views. */
  onResurrectSnapshot?: (timestamp: string) => void;
}) {
  const empty = isEmptyResult(result);
  const { title, headings, paragraphs, images } = result.extracted;

  return (
    <div>
      {result.council && <CouncilVerdictBadge verdict={result.council} />}
      <TwoColumns
        ghost={
          <section id="ghost" className={`flex scroll-mt-4 flex-col ${REVEAL}`}>
            <ColumnLabel tone="ghost">Ghost</ColumnLabel>
            <TombstoneLink url={result.snapshotUrl} />
          </section>
        }
        resurrected={
          <section className="flex flex-col">
            <ColumnLabel tone="pumpkin">Resurrected</ColumnLabel>
            <article className="rounded-md border border-neutral-800 bg-crypt p-6 font-sans sm:p-8">
              {empty ? (
                <div className={`flex min-h-[18rem] flex-col items-center justify-center text-center ${REVEAL}`}>
                  <GhostIcon
                    className="h-20 w-20 text-ghost/90 drop-shadow-[0_0_14px_rgba(255,107,26,0.55)]"
                    strokeWidth={1.25}
                  />
                  <p className="mt-6 text-base text-ghost">
                    Nothing readable survived in this snapshot.
                  </p>
                  <p className="mt-2 max-w-sm text-sm text-neutral-500">
                    The archive only captured a redirect stub. Try another URL,
                    or view the original snapshot below.
                  </p>
                  <div className="mt-8 w-full max-w-sm text-left">
                    <TombstoneLink url={result.snapshotUrl} />
                  </div>
                </div>
              ) : (
                <>
                  {title && (
                    <h4 className={`${REVEAL} ${DELAY.title} mb-6 font-display text-2xl font-bold leading-tight text-neutral-50 sm:text-3xl`}>
                      {title}
                    </h4>
                  )}
                  {headings.map((heading, i) => (
                    <h5
                      key={`h-${i}`}
                      className={`${REVEAL} ${DELAY.headings} mb-3 mt-8 font-display text-lg font-semibold text-neutral-100 sm:text-xl`}
                    >
                      {heading}
                    </h5>
                  ))}
                  {paragraphs.map((paragraph, i) => (
                    <p
                      key={`p-${i}`}
                      className={`${REVEAL} ${DELAY.paragraphs} mb-5 text-base leading-7 text-neutral-300`}
                    >
                      {paragraph}
                    </p>
                  ))}
                  {images.map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={`i-${i}`}
                      src={src}
                      alt=""
                      className={`${REVEAL} ${DELAY.images} mb-5 max-w-full rounded-sm border border-pumpkin/60 saturate-50 transition-[filter] duration-300 hover:saturate-100`}
                    />
                  ))}
                  <a
                    href="#ghost"
                    onClick={(e) => {
                      e.preventDefault();
                      const reduce = window.matchMedia(
                        "(prefers-reduced-motion: reduce)"
                      ).matches;
                      document.getElementById("ghost")?.scrollIntoView({
                        behavior: reduce ? "auto" : "smooth",
                        block: "start",
                      });
                    }}
                    className={`${REVEAL} ${DELAY.images} mt-6 inline-block font-mono text-sm text-ghost underline underline-offset-4 hover:text-pumpkin`}
                  >
                    ← Back to ghost
                  </a>
                </>
              )}
            </article>
          </section>
        }
      />
      <PostMortemReport result={result} onResurrectSnapshot={onResurrectSnapshot} />
    </div>
  );
}
