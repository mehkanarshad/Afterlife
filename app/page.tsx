"use client";

import { FormEvent, useEffect, useState } from "react";

interface ResurrectResult {
  originalUrl: string;
  snapshotTimestamp: string;
  snapshotUrl: string;
  extracted: {
    title: string;
    headings: string[];
    paragraphs: string[];
    images: string[];
  };
}

type ErrorKind = "not_found" | "timeout" | "network" | "unknown";

// Each error has a headline (shown in white) and a hint (muted).
const ERROR_COPY: Record<ErrorKind, { message: string; hint: string }> = {
  not_found: {
    message: "No archive exists for this URL.",
    hint: "It may never have been crawled, or the URL is misspelled.",
  },
  timeout: {
    message: "Wayback Machine took too long to respond.",
    hint: "Try again in a moment.",
  },
  network: {
    message: "Couldn't reach the archive.",
    hint: "Check your connection.",
  },
  unknown: {
    message: "Something went wrong while digging.",
    hint: "Try a different URL.",
  },
};

function errorKindFromStatus(status: number): ErrorKind {
  if (status === 404) return "not_found";
  if (status === 504) return "timeout";
  return "unknown";
}

function WarningIcon({ className }: { className: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}

function Cobweb() {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      className="pointer-events-none absolute right-0 top-0 z-0 h-40 w-40 text-ghost opacity-[0.12] sm:h-64 sm:w-64"
      aria-hidden="true"
    >
      {/* radial threads from the top-right corner */}
      <path d="M200 0L0 0M200 0L0 40M200 0L0 90M200 0L30 170M200 0L90 200M200 0L150 200M200 0L200 200" />
      {/* sagging concentric strands */}
      <path d="M170 0Q165 28 200 30" />
      <path d="M130 0Q125 55 200 60" />
      <path d="M85 0Q80 85 200 95" />
      <path d="M40 0Q40 125 200 135" />
      <path d="M0 40Q10 160 130 200" />
    </svg>
  );
}

function BatSilhouette() {
  return (
    <svg
      viewBox="0 0 120 60"
      fill="currentColor"
      className="pointer-events-none fixed bottom-4 left-4 z-0 h-16 w-32 text-pumpkin opacity-[0.07] sm:h-24 sm:w-48"
      aria-hidden="true"
    >
      <path d="M60 18c-3 0-5 3-6 6-4-3-9-6-16-6C28 18 18 10 4 6c4 8 5 16 4 22 6-3 12-3 17 0-2 4-2 8 0 12 5-4 10-5 16-3 3 3 6 11 19 17 13-6 16-14 19-17 6-2 11-1 16 3 2-4 2-8 0-12 5-3 11-3 17 0-1-6 0-14 4-22-14 4-24 12-34 12-7 0-12 3-16 6-1-3-3-6-6-6z" />
    </svg>
  );
}

const LOADING_PHRASES = [
  "Digging up the archive…",
  "Reading the bones…",
  "Stitching the fragments…",
];

// Cycles through LOADING_PHRASES every 1.5s. Mounted only while a request is
// in flight, so the sequence restarts on each new request.
function LoadingGhost() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % LOADING_PHRASES.length);
    }, 1500);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-1 flex-col items-center justify-center text-center"
    >
      <GhostIcon
        className="h-20 w-20 animate-spin-slow text-ghost/80 motion-reduce:animate-none"
        strokeWidth={1.25}
      />
      <p
        key={index}
        className="mt-6 animate-fade-in font-display text-sm tracking-widest text-ghost/80 motion-reduce:animate-none"
      >
        {LOADING_PHRASES[index]}
      </p>
    </div>
  );
}

const GHOST_PATH =
  "M12 3a7 7 0 0 0-7 7v10l2.33-2 2.34 2 2.33-2 2.33 2 2.34-2L19 20V10a7 7 0 0 0-7-7z";

function GhostIcon({
  className,
  strokeWidth = 1.5,
}: {
  className: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={GHOST_PATH} />
      <circle cx="9.5" cy="10" r="1" fill="currentColor" />
      <circle cx="14.5" cy="10" r="1" fill="currentColor" />
    </svg>
  );
}

function SkullIcon({ className }: { className: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 3C7.6 3 5 6 5 9.8c0 2.2 1 3.7 2.5 4.7V18h9v-3.5c1.5-1 2.5-2.5 2.5-4.7C19 6 16.4 3 12 3z" />
      <circle cx="9" cy="10.5" r="1.4" fill="currentColor" />
      <circle cx="15" cy="10.5" r="1.4" fill="currentColor" />
      <path d="M12 13l-1 2h2zM10 18v2.5M12 18v2.5M14 18v2.5" />
    </svg>
  );
}

function GravestoneIcon({ className }: { className: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 28"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 25V11a7 7 0 0 1 14 0v14z" />
      <path d="M12 9v8M9 12h6" />
      <path d="M2 25h20" />
    </svg>
  );
}

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
      className="group relative block overflow-hidden rounded-b-md rounded-t-[2rem] border border-neutral-700/80 bg-tomb px-6 pb-6 pt-7 font-mono transition-[border-color,box-shadow] hover:border-pumpkin/60 hover:shadow-[0_0_24px_rgba(255,107,26,0.12)] focus-visible:border-pumpkin focus-visible:outline-none"
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
function ColumnDivider() {
  const line =
    "flex-1 bg-gradient-to-r from-transparent via-neutral-700 to-transparent h-px md:h-auto md:w-px md:bg-gradient-to-b";
  return (
    <div
      className="flex items-center justify-center gap-3 md:flex-col"
      aria-hidden="true"
    >
      <span className={line} />
      <GhostIcon className="h-5 w-5 shrink-0 text-ghost/60" />
      <span className={line} />
    </div>
  );
}

function ResultsLayout({
  ghost,
  resurrected,
  className = "",
  id,
}: {
  ghost: React.ReactNode;
  resurrected: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div
      id={id}
      className={`relative z-10 mx-auto mt-10 grid w-full max-w-7xl scroll-mt-6 grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] ${className}`}
    >
      {ghost}
      <ColumnDivider />
      {resurrected}
    </div>
  );
}

function scrollToGhost() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document
    .getElementById("ghost")
    ?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}

const HAS_PROTOCOL = /^[a-z][a-z0-9+.-]*:\/\//i;
const EXAMPLES = ["geocities.com", "altavista.com", "myspace.com/tom"];

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorKind | null>(null);
  const [result, setResult] = useState<ResurrectResult | null>(null);
  const [barPhase, setBarPhase] = useState<"idle" | "running" | "done">("idle");
  const [focused, setFocused] = useState(false);

  // The helper text is visible while the input has focus or holds a value.
  const helperVisible = focused || url.trim() !== "";

  // Scroll the results into view as soon as they appear.
  useEffect(() => {
    if (!result) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document
      .getElementById("results")
      ?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }, [result]);

  // Top progress bar: creeps toward 90% while loading, then fills and fades.
  useEffect(() => {
    if (loading) {
      setBarPhase("running");
      return;
    }
    setBarPhase((phase) => (phase === "running" ? "done" : phase));
    const id = setTimeout(
      () => setBarPhase((phase) => (phase === "done" ? "idle" : phase)),
      500
    );
    return () => clearTimeout(id);
  }, [loading]);

  function handleBlur() {
    setFocused(false);
    const trimmed = url.trim();
    if (trimmed && !HAS_PROTOCOL.test(trimmed)) {
      setUrl(`https://${trimmed}`);
    }
  }

  function handleExampleClick(example: string) {
    if (loading) return;
    setUrl(example);
    void resurrect(example);
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void resurrect(url);
  }

  async function resurrect(rawUrl: string) {
    const trimmed = rawUrl.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setResult(null);

    let res: Response;
    try {
      res = await fetch("/api/resurrect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
    } catch {
      // fetch only rejects when the request never got a response.
      setError("network");
      setLoading(false);
      return;
    }

    try {
      if (!res.ok) {
        setError(errorKindFromStatus(res.status));
        return;
      }
      setResult((await res.json()) as ResurrectResult);
    } catch {
      // A 200 with an unparseable body.
      setError("unknown");
    } finally {
      setLoading(false);
    }
  }

  const isEmpty =
    result !== null &&
    result.extracted.title === "" &&
    result.extracted.headings.length === 0 &&
    result.extracted.paragraphs.length === 0 &&
    result.extracted.images.length === 0;

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-crypt px-6 py-12 font-mono text-neutral-200">
      {barPhase !== "idle" && (
        <div
          className="pointer-events-none fixed left-0 top-0 z-50 h-0.5 w-full"
          aria-hidden="true"
        >
          <div
            className={`h-full bg-pumpkin shadow-[0_0_10px_rgba(255,107,26,0.8)] ${
              barPhase === "running"
                ? "animate-progress motion-reduce:animate-none"
                : "w-full opacity-0 transition-opacity duration-500"
            }`}
          />
        </div>
      )}
      <Cobweb />
      <BatSilhouette />
      <div className="relative z-10 mx-auto w-full max-w-md text-center">
        <h1 className="animate-flicker font-display text-5xl font-bold tracking-wide text-pumpkin [text-shadow:0_0_24px_rgba(255,107,26,0.35)] motion-reduce:animate-none sm:text-6xl">
          Afterlife
        </h1>
        <p className="mt-2 font-display text-sm tracking-[0.25em] text-ghost/80">
          Resurrect the dead web.
        </p>
        <form onSubmit={handleSubmit} className="mt-8 flex gap-2">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={handleBlur}
            aria-describedby="url-helper"
            placeholder="Enter a dead website URL, e.g. geocities.com"
            aria-label="Website URL"
            className="min-w-0 flex-1 rounded-md border border-neutral-800 bg-tomb px-3 py-2 font-mono text-sm text-neutral-100 caret-pumpkin placeholder:text-neutral-500 focus:border-pumpkin focus:outline-none focus:ring-1 focus:ring-pumpkin/60"
          />
          <button
            type="submit"
            disabled={loading || url.trim() === ""}
            className="rounded-md bg-gradient-to-b from-[#ff8a3d] to-pumpkin px-4 py-2 text-sm font-semibold text-black shadow-[0_0_10px_1px_rgba(255,107,26,0.25)] transition-[box-shadow,transform,opacity] duration-100 hover:shadow-[0_0_28px_8px_rgba(255,107,26,0.6)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:hover:shadow-none disabled:active:scale-100"
          >
            {loading ? "Digging…" : "Resurrect"}
          </button>
        </form>

        <p
          id="url-helper"
          className={`mt-3 text-xs text-neutral-500 transition-opacity duration-300 motion-reduce:transition-none ${
            helperVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          We&apos;ll look up the most recent Wayback Machine snapshot.
        </p>

        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => handleExampleClick(example)}
              disabled={loading}
              className="group inline-flex items-center gap-1.5 rounded-b-sm rounded-t-xl border border-neutral-800 bg-tomb px-3 py-1.5 font-mono text-xs text-ghost/80 transition-colors hover:border-pumpkin hover:text-pumpkin focus-visible:border-pumpkin focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-neutral-800 disabled:hover:text-ghost/80"
            >
              <SkullIcon className="h-3.5 w-3.5 shrink-0 text-neutral-500 transition-colors group-hover:text-pumpkin" />
              {example}
            </button>
          ))}
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-3 rounded-md border border-pumpkin/40 border-l-4 border-l-pumpkin bg-tomb px-4 py-3 text-left"
          >
            <WarningIcon className="mt-0.5 h-5 w-5 shrink-0 text-pumpkin" />
            <div>
              <p className="text-sm text-white">{ERROR_COPY[error].message}</p>
              <p className="mt-1 text-xs text-neutral-400">
                {ERROR_COPY[error].hint}
              </p>
            </div>
          </div>
        )}
      </div>

      {loading && (
        <ResultsLayout
          ghost={
            <section id="ghost" className="flex scroll-mt-6 flex-col font-mono">
              <h2 className="mb-2 text-sm uppercase tracking-widest text-ghost [font-variant-caps:all-small-caps]">
                Ghost
              </h2>
              <div
                className="h-32 animate-pulse rounded-b-md rounded-t-[2rem] border border-neutral-800 bg-tomb motion-reduce:animate-none"
                aria-hidden="true"
              />
            </section>
          }
          resurrected={
            <section className="flex flex-col font-mono">
              <h2 className="mb-2 text-sm uppercase tracking-widest text-pumpkin [font-variant-caps:all-small-caps]">
                Resurrected
              </h2>
              <article className="flex h-[24rem] flex-col overflow-hidden rounded-md border border-neutral-800 bg-tomb p-8 md:h-[75vh] md:p-10">
                <div className="space-y-4" aria-hidden="true">
                  <ShimmerLine width="w-3/4" />
                  <ShimmerLine width="w-full" />
                  <ShimmerLine width="w-3/5" />
                </div>
                <LoadingGhost />
              </article>
            </section>
          }
        />
      )}

      {result && (
        <ResultsLayout
          id="results"
          className="animate-fade-in motion-reduce:animate-none"
          ghost={
            <section id="ghost" className="flex scroll-mt-6 flex-col font-mono">
              <h2 className="mb-2 text-sm uppercase tracking-widest text-ghost [font-variant-caps:all-small-caps]">
                Ghost
              </h2>
              <TombstoneLink url={result.snapshotUrl} />
            </section>
          }
          resurrected={
            <section className="flex flex-col font-mono">
              <h2 className="mb-2 text-sm uppercase tracking-widest text-pumpkin [font-variant-caps:all-small-caps]">
                Resurrected
              </h2>
              <article className="overflow-auto rounded-md border border-neutral-800 bg-tomb p-8 font-sans md:h-[75vh] md:p-10">
                {isEmpty ? (
                  <div className="flex min-h-[20rem] flex-col items-center justify-center text-center md:h-full">
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
                    {result.extracted.title && (
                      <h1 className="mb-6 font-display text-3xl font-bold leading-tight text-neutral-50">
                        {result.extracted.title}
                      </h1>
                    )}
                    {result.extracted.headings.map((heading, i) => (
                      <h2
                        key={`h-${i}`}
                        className="mb-3 mt-8 font-display text-xl font-semibold text-neutral-100"
                      >
                        {heading}
                      </h2>
                    ))}
                    {result.extracted.paragraphs.map((paragraph, i) => (
                      <p
                        key={`p-${i}`}
                        className="mb-5 text-base leading-7 text-neutral-300"
                      >
                        {paragraph}
                      </p>
                    ))}
                    {result.extracted.images.map((src, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={`i-${i}`}
                        src={src}
                        alt=""
                        className="mb-5 max-w-full rounded-sm border border-pumpkin/60 saturate-50 transition-[filter] duration-300 hover:saturate-100"
                      />
                    ))}
                    <a
                      href="#ghost"
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToGhost();
                      }}
                      className="mt-6 inline-block font-mono text-sm text-ghost underline underline-offset-4 hover:text-pumpkin"
                    >
                      ← Back to ghost
                    </a>
                  </>
                )}
              </article>
            </section>
          }
        />
      )}

      <footer className="relative z-10 mt-auto flex flex-col items-center gap-2 pt-16 text-xs text-neutral-500">
        <GravestoneIcon className="h-8 w-8 text-neutral-600" />
        <p>Built for Kiroween 2026 🎃</p>
      </footer>
    </main>
  );
}
