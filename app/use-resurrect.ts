"use client";

import { useCallback, useRef, useState } from "react";

export interface ResurrectResult {
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

export type ErrorKind = "not_found" | "timeout" | "network" | "unknown";

// Each error has a headline (shown in white) and a hint (muted).
export const ERROR_COPY: Record<ErrorKind, { message: string; hint: string }> = {
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

export function isEmptyResult(result: ResurrectResult): boolean {
  const e = result.extracted;
  return (
    e.title === "" &&
    e.headings.length === 0 &&
    e.paragraphs.length === 0 &&
    e.images.length === 0
  );
}

/** Runs POST /api/resurrect and tracks loading, error and result state. */
export function useResurrect() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorKind | null>(null);
  const [result, setResult] = useState<ResurrectResult | null>(null);
  // Bumped on every request and reset, so a response that arrives after the
  // modal was closed or another site was picked is ignored.
  const requestId = useRef(0);

  const reset = useCallback(() => {
    requestId.current += 1;
    setLoading(false);
    setError(null);
    setResult(null);
  }, []);

  const resurrect = useCallback(async (rawUrl: string) => {
    const trimmed = rawUrl.trim();
    if (!trimmed) return;

    const id = ++requestId.current;
    const isCurrent = () => id === requestId.current;
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
      if (!isCurrent()) return;
      setError("network");
      setLoading(false);
      return;
    }

    try {
      if (!res.ok) {
        if (isCurrent()) setError(errorKindFromStatus(res.status));
        return;
      }
      const data = (await res.json()) as ResurrectResult;
      if (isCurrent()) setResult(data);
    } catch {
      // A 200 with an unparseable body.
      if (isCurrent()) setError("unknown");
    } finally {
      if (isCurrent()) setLoading(false);
    }
  }, []);

  return { loading, error, result, resurrect, reset };
}
