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

const ERROR_MESSAGES: Record<ErrorKind, string> = {
  not_found:
    "No archive exists for this URL. It may never have been crawled, or the URL is misspelled.",
  timeout: "Wayback Machine took too long to respond. Try again in a moment.",
  network: "Couldn't reach the archive. Check your connection.",
  unknown: "Something went wrong while digging. Try a different URL.",
};

const ERROR_STYLES: Record<ErrorKind, string> = {
  not_found: "border-amber-900/60 bg-amber-950/40 text-amber-300",
  timeout: "border-amber-900/60 bg-amber-950/40 text-amber-300",
  network: "border-red-900/60 bg-red-950/40 text-red-300",
  unknown: "border-red-900/60 bg-red-950/40 text-red-300",
};

function errorKindFromStatus(status: number): ErrorKind {
  if (status === 404) return "not_found";
  if (status === 504) return "timeout";
  return "unknown";
}

function ErrorIcon({ kind }: { kind: ErrorKind }) {
  const common = {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "mt-0.5 h-5 w-5 shrink-0",
    "aria-hidden": true,
  };

  switch (kind) {
    case "not_found":
      // Magnifier with a cross: searched, nothing there.
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5M9 9l4 4M13 9l-4 4" />
        </svg>
      );
    case "timeout":
      // Clock.
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case "network":
      // Wifi with a slash.
      return (
        <svg {...common}>
          <path d="M3 3l18 18M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5.2-2.8M14.5 10.4A10 10 0 0 1 19 13M2 9.5a15 15 0 0 1 4.3-2.7M10.5 6.1A15 15 0 0 1 22 9.5" />
          <circle cx="12" cy="20" r="0.75" fill="currentColor" />
        </svg>
      );
    case "unknown":
      // Warning triangle.
      return (
        <svg {...common}>
          <path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
          <path d="M12 9v4M12 17h.01" />
        </svg>
      );
  }
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
      className="flex h-full flex-col items-center justify-center text-center"
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
}: {
  ghost: React.ReactNode;
  resurrected: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative z-10 mx-auto mt-10 grid max-w-7xl grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] ${className}`}
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
    <main className="relative min-h-screen overflow-hidden bg-crypt px-6 py-12 font-mono text-neutral-200">
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
      <div className="relative z-10 mx-auto max-w-md text-center">
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
            onBlur={handleBlur}
            placeholder="Enter a dead website URL, e.g. geocities.com"
            aria-label="Website URL"
            className="min-w-0 flex-1 rounded-md border border-neutral-800 bg-tomb px-3 py-2 font-mono text-sm text-neutral-100 caret-pumpkin placeholder:text-neutral-500 focus:border-pumpkin focus:outline-none focus:ring-1 focus:ring-pumpkin/60"
          />
          <button
            type="submit"
            disabled={loading || url.trim() === ""}
            className="rounded-md bg-gradient-to-b from-[#ff8a3d] to-pumpkin px-4 py-2 text-sm font-semibold text-black transition-shadow hover:shadow-[0_0_20px_4px_rgba(255,107,26,0.45)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none"
          >
            {loading ? "Digging…" : "Resurrect"}
          </button>
        </form>

        <p className="mt-3 text-xs text-neutral-500">
          We&apos;ll look up the most recent Wayback Machine snapshot.
        </p>

        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => handleExampleClick(example)}
              disabled={loading}
              className="rounded-full border border-neutral-800 bg-tomb/60 px-3 py-1 font-mono text-xs text-ghost/80 transition-colors hover:border-pumpkin hover:text-pumpkin disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-neutral-800 disabled:hover:text-ghost/80"
            >
              {example}
            </button>
          ))}
        </div>

        {error && (
          <div
            role="alert"
            className={`mt-4 flex items-start gap-3 rounded-md border px-4 py-3 text-left text-sm ${ERROR_STYLES[error]}`}
          >
            <ErrorIcon kind={error} />
            <p>{ERROR_MESSAGES[error]}</p>
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
              <article className="h-[24rem] overflow-hidden rounded-md border border-neutral-800 bg-tomb p-8 md:h-[75vh]">
                <LoadingGhost />
              </article>
            </section>
          }
        />
      )}

      {result && (
        <ResultsLayout
          className="animate-fade-in motion-reduce:animate-none"
          ghost={
            <section id="ghost" className="flex scroll-mt-6 flex-col font-mono">
              <h2 className="mb-2 text-sm uppercase tracking-widest text-ghost [font-variant-caps:all-small-caps]">
                Ghost
              </h2>
              <a
                href={result.snapshotUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block overflow-hidden rounded-b-md rounded-t-[2rem] border border-neutral-700/80 bg-tomb px-6 pb-6 pt-7 transition-[border-color,box-shadow] hover:border-pumpkin/60 hover:shadow-[0_0_24px_rgba(255,107,26,0.12)] focus-visible:border-pumpkin focus-visible:outline-none"
              >
                <span className="noise-overlay" aria-hidden="true" />
                <SkullIcon className="relative h-8 w-8 text-neutral-500 transition-colors group-hover:text-ghost" />
                <p
                  className="relative mt-4 truncate text-xs text-neutral-400"
                  title={result.snapshotUrl}
                >
                  {result.snapshotUrl}
                </p>
                <span className="relative mt-4 inline-block text-sm text-pumpkin">
                  View original snapshot →
                </span>
              </a>
            </section>
          }
          resurrected={
            <section className="flex flex-col font-mono">
              <h2 className="mb-2 text-sm uppercase tracking-widest text-pumpkin [font-variant-caps:all-small-caps]">
                Resurrected
              </h2>
              <article className="overflow-auto rounded-md border border-neutral-800 bg-tomb p-8 font-sans md:h-[75vh] md:p-10">
                {isEmpty ? (
                  <div className="flex min-h-[20rem] flex-col items-center justify-center text-center text-gray-400 md:h-full">
                    <GhostIcon className="h-16 w-16" />
                    <p className="mt-4 text-base">
                      Nothing readable survived in this snapshot.
                    </p>
                    <p className="mt-2 max-w-sm text-sm text-gray-500">
                      The archive only captured a redirect stub. Try another URL,
                      or view the original snapshot below.
                    </p>
                    <a
                      href={result.snapshotUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 text-sm text-ghost underline underline-offset-4 hover:text-pumpkin"
                    >
                      View original snapshot
                    </a>
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
    </main>
  );
}
