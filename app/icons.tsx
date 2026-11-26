// Decorative SVG icons and backdrop art. All are aria-hidden: meaning is
// always carried by text.

const GHOST_PATH =
  "M12 3a7 7 0 0 0-7 7v10l2.33-2 2.34 2 2.33-2 2.33 2 2.34-2L19 20V10a7 7 0 0 0-7-7z";

export function GhostIcon({
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

export function SkullIcon({ className }: { className: string }) {
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

export function WarningIcon({ className }: { className: string }) {
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

export function GravestoneIcon({ className }: { className: string }) {
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

export function CrossIcon({ className }: { className: string }) {
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
      <path d="M12 3v18M6.5 8.5h11" />
    </svg>
  );
}

export function CloseIcon({ className }: { className: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function Cobweb() {
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

export function BatSilhouette() {
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
