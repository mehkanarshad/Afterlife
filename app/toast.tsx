"use client";

import { useEffect, useState } from "react";

const VISIBLE_MS = 6000;
const FADE_MS = 400;

// A passing notice at the top of the result. It is inline, not floating: the
// modal is a <dialog> in the browser's top layer, so a page-level toast would
// sit behind its backdrop. Mount it when the result appears; it removes
// itself after a few seconds. Screen readers hear it through role="status".
export function Toast({ message }: { message: string }) {
  const [phase, setPhase] = useState<"shown" | "fading" | "gone">("shown");

  useEffect(() => {
    const fade = setTimeout(() => setPhase("fading"), VISIBLE_MS);
    const gone = setTimeout(() => setPhase("gone"), VISIBLE_MS + FADE_MS);
    return () => {
      clearTimeout(fade);
      clearTimeout(gone);
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <p
      role="status"
      className={`animate-rise-in rounded-md border border-ghost/40 bg-ghost/10 px-4 py-2 text-sm text-ghost transition-opacity duration-[400ms] motion-reduce:animate-none motion-reduce:transition-none ${
        phase === "fading" ? "opacity-0" : "opacity-100"
      }`}
    >
      {message}
    </p>
  );
}
