"use client";

import { useEffect, useState } from "react";

// Thin orange bar: creeps toward 90% while `active`, then fills and fades
// out. Positioned absolutely, so the parent must be `relative`. It lives in
// the modal header: a <dialog> sits in the browser's top layer, so a
// page-level fixed bar would be hidden behind the backdrop.
export function ProgressBar({ active }: { active: boolean }) {
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");

  useEffect(() => {
    if (active) {
      setPhase("running");
      return;
    }
    setPhase((p) => (p === "running" ? "done" : p));
    const id = setTimeout(() => setPhase((p) => (p === "done" ? "idle" : p)), 500);
    return () => clearTimeout(id);
  }, [active]);

  if (phase === "idle") return null;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5"
      aria-hidden="true"
    >
      <div
        className={`h-full bg-pumpkin shadow-[0_0_10px_rgba(255,107,26,0.8)] ${
          phase === "running"
            ? "animate-progress motion-reduce:animate-none"
            : "w-full opacity-0 transition-opacity duration-500"
        }`}
      />
    </div>
  );
}
