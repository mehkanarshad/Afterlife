"use client";

import { FormEvent, useState } from "react";

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

const HAS_PROTOCOL = /^[a-z][a-z0-9+.-]*:\/\//i;
const EXAMPLES = ["geocities.com", "altavista.com", "myspace.com/tom"];

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorKind | null>(null);
  const [result, setResult] = useState<ResurrectResult | null>(null);

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
      <Cobweb />
      <BatSilhouette />
      <div className="relative z-10 mx-auto max-w-md text-center">
        <h1 className="font-display text-5xl font-bold tracking-wide text-pumpkin [text-shadow:0_0_24px_rgba(255,107,26,0.35)] sm:text-6xl">
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

        {loading && (
          <div className="mt-8 flex justify-center" role="status" aria-label="Loading">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-800 border-t-pumpkin" />
          </div>
        )}
      </div>

      {result && (
        <div className="relative z-10 mx-auto mt-10 grid max-w-7xl grid-cols-1 gap-6 md:grid-cols-2">
          <section className="flex flex-col font-mono">
            <h2 className="mb-2 text-xs uppercase tracking-widest text-pumpkin/80">
              Ghost
            </h2>
            <div className="rounded-md border border-neutral-800 bg-tomb p-6 text-sm">
              <a
                href={result.snapshotUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-ghost underline underline-offset-4 hover:text-pumpkin"
              >
                View original snapshot
              </a>
              <p className="mt-3 break-all text-xs text-neutral-500">
                {result.snapshotUrl}
              </p>
            </div>
          </section>

          <section className="flex flex-col font-sans">
            <h2 className="mb-2 text-xs uppercase tracking-widest text-pumpkin/80">
              Resurrected
            </h2>
            <article className="h-[75vh] overflow-auto rounded-md border border-neutral-800 bg-tomb p-6">
              {isEmpty && (
                <div className="flex h-full flex-col items-center justify-center text-center text-gray-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-16 w-16"
                    aria-hidden="true"
                  >
                    <path d="M12 3a7 7 0 0 0-7 7v10l2.33-2 2.34 2 2.33-2 2.33 2 2.34-2L19 20V10a7 7 0 0 0-7-7z" />
                    <circle cx="9.5" cy="10" r="1" fill="currentColor" />
                    <circle cx="14.5" cy="10" r="1" fill="currentColor" />
                  </svg>
                  <p className="mt-4 text-base">
                    Nothing readable survived in this snapshot.
                  </p>
                  <p className="mt-2 max-w-sm text-sm text-gray-500">
                    The archive only captured a redirect stub. Try another URL, or
                    view the original snapshot below.
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
              )}
              {result.extracted.title && (
                <h1 className="mb-4 text-3xl font-bold">
                  {result.extracted.title}
                </h1>
              )}
              {result.extracted.headings.map((heading, i) => (
                <h2 key={`h-${i}`} className="mb-2 mt-6 text-xl font-semibold">
                  {heading}
                </h2>
              ))}
              {result.extracted.paragraphs.map((paragraph, i) => (
                <p key={`p-${i}`} className="mb-4 leading-relaxed text-neutral-300">
                  {paragraph}
                </p>
              ))}
              {result.extracted.images.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={`i-${i}`}
                  src={src}
                  alt=""
                  className="mb-4 max-w-full"
                />
              ))}
            </article>
          </section>
        </div>
      )}
    </main>
  );
}
