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

const HAS_PROTOCOL = /^[a-z][a-z0-9+.-]*:\/\//i;
const EXAMPLES = ["geocities.com", "altavista.com", "myspace.com/tom"];

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

    try {
      const res = await fetch("/api/resurrect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const data: unknown = await res.json();

      if (!res.ok) {
        const message =
          typeof data === "object" && data !== null && "error" in data
            ? String((data as { error: unknown }).error)
            : "Something went wrong";
        setError(message);
        return;
      }

      setResult(data as ResurrectResult);
    } catch {
      setError("Could not reach the server");
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
    <main className="min-h-screen bg-neutral-950 text-neutral-100 px-6 py-12">
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Afterlife</h1>
        <form onSubmit={handleSubmit} className="mt-6 flex gap-2">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={handleBlur}
            placeholder="Enter a dead website URL, e.g. geocities.com"
            aria-label="Website URL"
            className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm placeholder:text-neutral-500 focus:border-neutral-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || url.trim() === ""}
            className="rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Digging…" : "Resurrect"}
          </button>
        </form>

        <p className="mt-2 text-xs text-neutral-500">
          We&apos;ll look up the most recent Wayback Machine snapshot.
        </p>

        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => handleExampleClick(example)}
              disabled={loading}
              className="rounded-full border border-neutral-700 px-3 py-1 font-mono text-xs text-neutral-300 transition-colors hover:border-neutral-400 hover:text-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {example}
            </button>
          ))}
        </div>

        {error && (
          <p role="alert" className="mt-3 text-sm text-red-500">
            {error}
          </p>
        )}

        {loading && (
          <div className="mt-8 flex justify-center" role="status" aria-label="Loading">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-700 border-t-neutral-100" />
          </div>
        )}
      </div>

      {result && (
        <div className="mx-auto mt-10 grid max-w-7xl grid-cols-1 gap-6 md:grid-cols-2">
          <section className="flex flex-col font-mono">
            <h2 className="mb-2 text-xs uppercase tracking-widest text-neutral-400">
              Ghost
            </h2>
            <div className="rounded-md border border-neutral-800 bg-neutral-900 p-6 text-sm">
              <a
                href={result.snapshotUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-sky-400 underline underline-offset-4 hover:text-sky-300"
              >
                View original snapshot
              </a>
              <p className="mt-3 break-all text-xs text-neutral-500">
                {result.snapshotUrl}
              </p>
            </div>
          </section>

          <section className="flex flex-col font-sans">
            <h2 className="mb-2 text-xs uppercase tracking-widest text-neutral-400">
              Resurrected
            </h2>
            <article className="h-[75vh] overflow-auto rounded-md border border-neutral-800 bg-neutral-900 p-6">
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
                    className="mt-4 text-sm text-sky-400 underline underline-offset-4 hover:text-sky-300"
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
