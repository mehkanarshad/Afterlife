"use client";

import { ReactNode, useEffect, useRef } from "react";
import { CloseIcon } from "./icons";
import { ProgressBar } from "./progress-bar";

// Native <dialog> opened with showModal(): the browser traps focus, makes the
// rest of the page inert, and closes on Escape. React stays the source of
// truth through the `open` prop.
export function Modal({
  open,
  onClose,
  title,
  wide = false,
  busy = false,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  wide?: boolean;
  /** Shows the progress bar under the header while a request runs. */
  busy?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // React's autoFocus doesn't reach showModal(), so honour a
      // data-autofocus marker instead of focusing the close button.
      dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Lock page scroll while the dialog is open.
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="modal-title"
      onCancel={(e) => {
        // Escape: let React close it so `open` stays in sync.
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        // A click on the dialog element itself is a click on the backdrop.
        if (e.target === e.currentTarget) onClose();
      }}
      className={`m-auto max-h-[90vh] w-[calc(100%-2rem)] overflow-hidden rounded-b-lg rounded-t-[2.5rem] border border-neutral-700/80 bg-tomb p-0 font-mono text-neutral-200 shadow-[0_0_60px_rgba(0,0,0,0.8)] backdrop:bg-black/75 backdrop:backdrop-blur-[2px] open:animate-modal-in motion-reduce:open:animate-none ${
        wide ? "max-w-6xl" : "max-w-lg"
      }`}
    >
      {open && (
        <div className="relative flex max-h-[90vh] flex-col">
          <span className="noise-overlay" aria-hidden="true" />
          <header className="relative flex items-start justify-between gap-4 border-b border-neutral-800 px-6 pb-4 pt-7 sm:px-8">
            <h2
              id="modal-title"
              className="font-display text-xl font-bold tracking-wide text-neutral-50 sm:text-2xl"
            >
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-2 rounded p-1 text-neutral-500 transition-colors hover:text-pumpkin focus-visible:text-pumpkin focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pumpkin"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
            <ProgressBar active={busy} />
          </header>
          <div className="relative overflow-y-auto px-6 py-6 sm:px-8">
            {children}
          </div>
        </div>
      )}
    </dialog>
  );
}
