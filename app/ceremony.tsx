"use client";

import { useEffect, useId, useRef, useState } from "react";
import { GhostIcon } from "./icons";

// Timeline (ms from the click). The CSS in globals.css uses the same numbers:
//   0–400     crack draws down the stone
//   400–650   the two halves split apart
//   550–1350  the ghost rises out of the crack, then floats in place
//   0 / 650 / 1300  each status phrase starts typing
//   2000      the result is allowed to appear (see useCeremonyGate)
// The result view then staggers in over 900ms, so a fast response is fully
// shown at about 2.9s.
export const CEREMONY_MS = 2000;

const PHRASES = [
  { text: "Scanning archive…", at: 0 },
  { text: "47 snapshots found…", at: 650 },
  { text: "Rebuilding…", at: 1300 },
];
const CHAR_MS = 22;

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Returns false from the moment a request starts until CEREMONY_MS has
 * passed, so a fast response doesn't cut the ceremony short. A slow response
 * just keeps the ceremony's final, idle state on screen.
 */
export function useCeremonyGate(loading: boolean): boolean {
  const [done, setDone] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!loading) return;
    // Deliberately not cleared when `loading` flips back to false: the
    // response arriving must not cancel the remaining ceremony time.
    setDone(false);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setDone(true), prefersReducedMotion() ? 0 : CEREMONY_MS);
  }, [loading]);

  useEffect(() => () => clearTimeout(timer.current), []);

  return done;
}

/** Types PHRASES out on their schedule. Returns the current phrase and how much is shown. */
function useTypewriter() {
  const [state, setState] = useState({ index: 0, chars: 0 });

  useEffect(() => {
    if (prefersReducedMotion()) {
      // No typing: show each phrase whole when its turn comes.
      const timers = PHRASES.map((p, index) =>
        setTimeout(() => setState({ index, chars: p.text.length }), p.at)
      );
      return () => timers.forEach(clearTimeout);
    }

    const start = performance.now();
    const last = PHRASES[PHRASES.length - 1];
    const id = setInterval(() => {
      const elapsed = performance.now() - start;
      let index = 0;
      PHRASES.forEach((p, i) => {
        if (elapsed >= p.at) index = i;
      });
      const chars = Math.min(
        PHRASES[index].text.length,
        Math.floor((elapsed - PHRASES[index].at) / CHAR_MS)
      );
      setState((s) => (s.index === index && s.chars === chars ? s : { index, chars }));
      if (elapsed >= last.at + last.text.length * CHAR_MS) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, []);

  return { phrase: PHRASES[state.index].text, typed: PHRASES[state.index].text.slice(0, state.chars) };
}

// Points of the crack; the halves are clipped along the same zigzag.
const CRACK = "48,6 44,40 52,58 45,78 51,96 48,120";
const LEFT_HALF = `0,0 48,0 ${CRACK} 0,120`;
const RIGHT_HALF = `48,0 96,0 96,120 ${CRACK.split(" ").reverse().join(" ")}`;
const STONE = "M8 120V44a40 40 0 0 1 80 0v76z";

export function ResurrectionCeremony() {
  const { phrase, typed } = useTypewriter();
  const id = useId().replace(/:/g, "");

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-1 flex-col items-center justify-center py-8 text-center"
    >
      {/* Screen readers get each whole phrase, not every typed character. */}
      <span className="sr-only">{phrase}</span>

      <div className="relative h-52 w-32" aria-hidden="true">
        {/* Rendered before the stone, so it is hidden behind it while emerging. */}
        <GhostIcon
          className="ceremony-ghost absolute bottom-6 left-1/2 -ml-7 h-14 w-14 text-ghost drop-shadow-[0_0_12px_rgba(168,230,207,0.55)]"
          strokeWidth={1.25}
        />
        <svg
          viewBox="0 0 96 124"
          className="absolute bottom-0 left-1/2 h-[7.75rem] w-24 -translate-x-1/2 overflow-visible"
        >
          <defs>
            <clipPath id={`${id}-left`}>
              <polygon points={LEFT_HALF} />
            </clipPath>
            <clipPath id={`${id}-right`}>
              <polygon points={RIGHT_HALF} />
            </clipPath>
          </defs>
          <g className="ceremony-half-left" clipPath={`url(#${id}-left)`}>
            <path d={STONE} fill="#1d1d25" stroke="#52525b" strokeWidth="1.5" />
          </g>
          <g className="ceremony-half-right" clipPath={`url(#${id}-right)`}>
            <path d={STONE} fill="#1d1d25" stroke="#52525b" strokeWidth="1.5" />
          </g>
          <polyline
            points={CRACK}
            fill="none"
            stroke="#ff6b1a"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            className="ceremony-crack"
          />
          <path d="M0 122h96" stroke="#3f3f46" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      <p aria-hidden="true" className="mt-6 h-5 font-mono text-sm text-ghost/80">
        {typed}
        <span className="ceremony-caret ml-0.5 inline-block text-pumpkin">▍</span>
      </p>
    </div>
  );
}
