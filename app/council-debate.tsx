"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Agent, CouncilTranscript, CouncilVerdict } from "@/lib/council";

const AVATAR: Record<Agent, string> = {
  Archaeologist: "🏺",
  Designer: "🎨",
  Engineer: "🔧",
  Tester: "🔍",
};

const FIRST_LINE_MS = 400;
const LINE_MS = 1500;
const END_PAUSE_MS = 1200;

export function CouncilToggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-help`}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pumpkin focus-visible:ring-offset-2 focus-visible:ring-offset-tomb disabled:cursor-not-allowed disabled:opacity-50 ${
          checked ? "border-pumpkin bg-pumpkin/30" : "border-neutral-700 bg-crypt"
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 rounded-full transition-transform motion-reduce:transition-none ${
            checked ? "translate-x-5 bg-pumpkin" : "translate-x-0 bg-neutral-500"
          }`}
          style={{ height: "1.125rem", width: "1.125rem" }}
        />
      </button>
      <div className="min-w-0">
        <p id={`${id}-label`} className="text-sm text-neutral-100">
          Council Mode
        </p>
        <p id={`${id}-help`} className="mt-0.5 text-xs leading-relaxed text-neutral-500">
          Four analysts compare early, middle and recent snapshots, debate, and pick the best one.
          Takes longer.
        </p>
      </div>
    </div>
  );
}

/** Plays the transcript one line at a time, then calls `onDone`. */
export function CouncilDebate({
  transcript,
  onDone,
}: {
  transcript: CouncilTranscript;
  onDone: () => void;
}) {
  const total = transcript.lines.length;
  const [shown, setShown] = useState(0);
  const [reduced, setReduced] = useState(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    // Reduced motion: show the whole debate at once and let the reader decide
    // when to move on, instead of advancing on a timer.
    if (reduced) {
      setShown(total);
      return;
    }
    if (shown >= total) {
      const id = setTimeout(() => onDoneRef.current(), END_PAUSE_MS);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => setShown((n) => n + 1), shown === 0 ? FIRST_LINE_MS : LINE_MS);
    return () => clearTimeout(id);
  }, [shown, total, reduced]);

  const finished = shown >= total;

  return (
    <section
      aria-label="Council debate"
      className="stone relative overflow-hidden rounded-b-md rounded-t-2xl border border-pumpkin/50 p-5 sm:p-6"
    >
      <span className="noise-overlay rounded-[inherit]" aria-hidden="true" />
      <div className="relative flex items-center justify-between gap-3">
        <h3 className="text-sm uppercase tracking-[0.3em] text-pumpkin [font-variant-caps:all-small-caps]">
          The Council convenes
        </h3>
        {reduced ? (
          <button
            type="button"
            onClick={() => onDoneRef.current()}
            className="rounded-md border border-pumpkin/60 px-3 py-1 text-xs text-pumpkin transition-colors hover:bg-pumpkin hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pumpkin"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onDoneRef.current()}
            className="rounded-md border border-neutral-700 px-3 py-1 text-xs text-neutral-400 transition-colors hover:border-ghost/60 hover:text-ghost focus-visible:border-ghost focus-visible:outline-none"
          >
            Skip debate
          </button>
        )}
      </div>

      <ol role="log" aria-live="polite" className="relative mt-5 space-y-4">
        {transcript.lines.slice(0, shown).map((line, i) => {
          const speaking = !reduced && i === shown - 1;
          return (
            <li key={i} className="flex animate-rise-in items-start gap-3 motion-reduce:animate-none">
              <span
                aria-hidden="true"
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-lg transition-colors ${
                  speaking
                    ? "animate-speak border-pumpkin bg-pumpkin/15 motion-reduce:animate-none"
                    : "border-neutral-700 bg-crypt"
                }`}
              >
                {AVATAR[line.speaker]}
              </span>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-widest text-pumpkin/80">{line.speaker}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-neutral-100">{line.text}</p>
              </div>
            </li>
          );
        })}
      </ol>

      <p className="relative mt-6 text-xs text-neutral-500">
        Each analyst scores the real snapshots by its own rule: size, age, text and fragments.
        {finished && !reduced && " Resurrecting…"}
      </p>
    </section>
  );
}

export function CouncilVerdictBadge({ verdict }: { verdict: CouncilVerdict }) {
  return (
    <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-pumpkin/60 bg-pumpkin/10 px-4 py-1.5 text-sm text-pumpkin">
      <span aria-hidden="true">⚖️</span>
      <span>
        Council verdict: {verdict.agreed}/{verdict.total} agents agreed on {verdict.year}.
      </span>
    </p>
  );
}
