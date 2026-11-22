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

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResurrectResult | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = url.trim();
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

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 px-6 py-12">
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Afterlife</h1>
        <form onSubmit={handleSubmit} className="mt-6 flex gap-2">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="geocities.com"
            aria-label="Website URL"
            className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm placeholder:text-neutral-500 focus:border-neutral-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || url.trim() === ""}
            className="rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Resurrect
          </button>
        </form>

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
            <iframe
              src={result.snapshotUrl}
              title="Original snapshot"
              className="h-[75vh] w-full rounded-md border border-neutral-800 bg-white"
            />
          </section>

          <section className="flex flex-col font-sans">
            <h2 className="mb-2 text-xs uppercase tracking-widest text-neutral-400">
              Resurrected
            </h2>
            <article className="h-[75vh] overflow-auto rounded-md border border-neutral-800 bg-neutral-900 p-6">
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
