"use client";

import { FormEvent, useEffect, useState } from "react";
import { DEAD_SITES, DeadSite } from "@/lib/sites";
import { useCeremonyGate } from "./ceremony";
import { BatSilhouette, Cobweb, GravestoneIcon } from "./icons";
import { Modal } from "./modal";
import { addRecord } from "./resurrection-log";
import { ErrorAlert, LoadingView, ResultView } from "./results-view";
import { TombstoneCard } from "./tombstone-card";
import { useResurrect } from "./use-resurrect";

const HAS_PROTOCOL = /^[a-z][a-z0-9+.-]*:\/\//i;

const primaryButton =
  "rounded-md bg-gradient-to-b from-[#ff8a3d] to-pumpkin px-5 py-2 font-mono text-sm font-semibold text-black shadow-[0_0_10px_1px_rgba(255,107,26,0.25)] transition-[box-shadow,transform,opacity] duration-100 hover:shadow-[0_0_28px_8px_rgba(255,107,26,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pumpkin focus-visible:ring-offset-2 focus-visible:ring-offset-tomb active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:active:scale-100";

const secondaryButton =
  "rounded-md border border-neutral-700 px-5 py-2 font-mono text-sm text-neutral-300 transition-colors hover:border-ghost/60 hover:text-ghost focus-visible:border-ghost focus-visible:outline-none";

type ModalState = { kind: "closed" } | { kind: "site"; site: DeadSite } | { kind: "bury" };

export default function Home() {
  const [modal, setModal] = useState<ModalState>({ kind: "closed" });
  const [url, setUrl] = useState("");
  const [focused, setFocused] = useState(false);
  const { loading, error, result, resurrect, reset } = useResurrect();
  const ceremonyDone = useCeremonyGate(loading);

  // Every successful resurrection, thin ones included, goes into the /log.
  // `result` is a new object per response, so this runs once per success.
  useEffect(() => {
    if (result) addRecord(result);
  }, [result]);
  // The ceremony runs for at least CEREMONY_MS, even when the response is
  // faster. Errors skip it and show at once.
  const showCeremony = error === null && (loading || (result !== null && !ceremonyDone));

  // The confirm step is shown until the first request for this site starts.
  const started = loading || error !== null || result !== null;
  const showingResults = loading || result !== null;

  function openSite(site: DeadSite) {
    reset();
    setModal({ kind: "site", site });
  }

  function openBury() {
    reset();
    setModal({ kind: "bury" });
  }

  function close() {
    reset();
    setModal({ kind: "closed" });
  }

  function handleBlur() {
    setFocused(false);
    const trimmed = url.trim();
    if (trimmed && !HAS_PROTOCOL.test(trimmed)) setUrl(`https://${trimmed}`);
  }

  function handleBury(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void resurrect(url);
  }

  const outcome = (
    <>
      {error && <ErrorAlert kind={error} />}
      {showCeremony && <LoadingView />}
      {result && ceremonyDone && (
        <ResultView
          result={result}
          onResurrectSnapshot={(timestamp) => void resurrect(result.originalUrl, timestamp)}
        />
      )}
    </>
  );

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-crypt px-6 pb-12 font-mono text-neutral-200">
      <div className="moonlight pointer-events-none absolute inset-x-0 top-0 z-0 h-[36rem]" aria-hidden="true" />
      <div className="ground-fog pointer-events-none fixed inset-x-0 bottom-0 z-0 h-64" aria-hidden="true" />
      <Cobweb />
      <BatSilhouette />

      <header className="relative z-10 mx-auto w-full max-w-2xl pb-14 pt-16 text-center sm:pt-24">
        <h1 className="animate-flicker font-display text-5xl font-bold tracking-wide text-pumpkin [text-shadow:0_0_28px_rgba(255,107,26,0.35)] motion-reduce:animate-none sm:text-7xl">
          The Afterlife
        </h1>
        <p className="mx-auto mt-5 max-w-md font-display text-base leading-relaxed tracking-wide text-ghost/80 sm:text-lg">
          A graveyard of the dead web. Resurrect what&apos;s lost.
        </p>
        <button type="button" onClick={openBury} className={`mt-10 ${primaryButton}`}>
          Bury a new site
        </button>
      </header>

      <section aria-labelledby="graveyard-heading" className="relative z-10 mx-auto w-full max-w-6xl">
        <h2
          id="graveyard-heading"
          className="mb-10 text-center text-sm uppercase tracking-[0.3em] text-neutral-500 [font-variant-caps:all-small-caps]"
        >
          Here lie {DEAD_SITES.length} sites of the old web
        </h2>
        <ul className="grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
          {DEAD_SITES.map((site, i) => (
            <TombstoneCard key={site.domain} site={site} index={i} onSelect={openSite} />
          ))}
        </ul>
      </section>

      <footer className="relative z-10 mt-auto flex flex-col items-center gap-2 pt-20 text-xs text-neutral-500">
        <GravestoneIcon className="h-8 w-8 text-neutral-600" />
        <p>Built for Kiroween 2026 🎃</p>
      </footer>

      <Modal
        open={modal.kind === "site"}
        onClose={close}
        title={modal.kind === "site" ? `Resurrect ${modal.site.domain}?` : ""}
        wide={showingResults}
        busy={loading}
      >
        {modal.kind === "site" && (
          <div className="space-y-6">
            {!started && (
              <>
                <p className="text-sm leading-relaxed text-neutral-400">
                  {modal.site.name} was laid to rest in {modal.site.diedYear}. We&apos;ll dig up
                  its most recent Wayback Machine snapshot and bring back whatever is still
                  readable.
                </p>
                <div className="flex flex-wrap justify-end gap-3">
                  <button type="button" onClick={close} className={secondaryButton}>
                    Let it rest
                  </button>
                  <button
                    type="button"
                    data-autofocus
                    onClick={() => void resurrect(modal.site.domain)}
                    className={primaryButton}
                  >
                    Resurrect
                  </button>
                </div>
              </>
            )}
            {outcome}
            {error && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => void resurrect(modal.site.domain)}
                  className={secondaryButton}
                >
                  Try again
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={modal.kind === "bury"}
        onClose={close}
        title="Bury a new site"
        wide={showingResults}
        busy={loading}
      >
        <div className="space-y-6">
          <form onSubmit={handleBury} className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              data-autofocus
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={handleBlur}
              aria-label="Website URL"
              aria-describedby="url-helper"
              placeholder="Enter a dead website URL, e.g. geocities.com"
              className="min-w-0 flex-1 rounded-md border border-neutral-800 bg-crypt px-3 py-2 font-mono text-sm text-neutral-100 caret-pumpkin placeholder:text-neutral-500 focus:border-pumpkin focus:outline-none focus:ring-1 focus:ring-pumpkin/60"
            />
            <button type="submit" disabled={loading || url.trim() === ""} className={primaryButton}>
              {loading ? "Digging…" : "Resurrect"}
            </button>
          </form>
          <p
            id="url-helper"
            className={`-mt-3 text-xs text-neutral-500 transition-opacity duration-300 motion-reduce:transition-none ${
              focused || url.trim() !== "" ? "opacity-100" : "opacity-0"
            }`}
          >
            We&apos;ll look up the most recent Wayback Machine snapshot.
          </p>
          {outcome}
        </div>
      </Modal>
    </main>
  );
}
