import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { decodeShareId, formatLongDate, parseWaybackTimestamp, ShareRef } from "@/lib/share";
import { originFromHeaders } from "@/lib/origin";
import { registerPublic } from "@/lib/public-registry";
import { loadShared } from "@/lib/shared-load";
import { qualityScore } from "@/lib/quality";
import { normalizeUrl, siteName } from "@/lib/sites";
import { BUTTONS, ERROR_COPY, SHARE, shareBanner, shareDescription, shareTitle } from "../../copy";
import { GhostIcon } from "../../icons";
import { QualityBadge } from "../../quality-badge";
import { ResultView } from "../../results-view";
import type { ResurrectResult } from "../../use-resurrect";
import { LocalSharePage } from "./local-share";

type Props = { params: { shareId: string } };

const ctaClass =
  "inline-block rounded-md bg-gradient-to-b from-[#ff8a3d] to-pumpkin px-5 py-2 font-mono text-sm font-semibold text-black shadow-[0_0_10px_1px_rgba(255,107,26,0.25)] transition-[box-shadow,transform] duration-100 hover:shadow-[0_0_28px_8px_rgba(255,107,26,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pumpkin focus-visible:ring-offset-2 focus-visible:ring-offset-crypt active:scale-[0.97]";

/** Absolute origin for og:image and canonical URLs, from the request itself. */
function requestOrigin(): string {
  const h = headers();
  return originFromHeaders((name) => h.get(name));
}

function facts(share: ShareRef) {
  return {
    domain: normalizeUrl(share.url),
    deathYear: share.deathYear,
    snapshotYear: Number(share.timestamp.slice(0, 4)),
    resurrectedOn: formatLongDate(new Date(share.resurrectedAt)),
  };
}

// Built from the share id alone: no archive fetch, so crawlers get their tags
// immediately even when the Wayback Machine is slow.
export function generateMetadata({ params }: Props): Metadata {
  const share = decodeShareId(params.shareId);
  if (!share) {
    return { title: "A resurrection — Afterlife", robots: { index: false, follow: false } };
  }
  const f = facts(share);
  const title = shareTitle(f.domain);
  const description = shareDescription(f);
  const path = `/r/${params.shareId}`;
  return {
    metadataBase: new URL(requestOrigin()),
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      siteName: "Afterlife",
      title,
      description,
      url: path,
      publishedTime: share.resurrectedAt,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function SharedResurrectionPage({ params }: Props) {
  const share = decodeShareId(params.shareId);

  // Not a self-contained id: an older link that lives in one browser's storage.
  if (!share) return <LocalSharePage shareId={params.shareId} />;

  const loaded = await loadShared(share);

  // Opening a share page makes the resurrection public: it is listed in
  // /api/public/resurrections. Nothing from a private log gets here.
  if (loaded.ok) registerPublic(params.shareId, share.url, loaded.payload);

  return (
    <main className="relative flex min-h-screen flex-col bg-crypt px-6 pb-16 pt-24 font-mono text-neutral-200">
      <div className="moonlight pointer-events-none absolute inset-x-0 top-0 h-[28rem]" aria-hidden="true" />
      <div className="relative mx-auto w-full max-w-6xl">
        <Banner share={share} />

        {loaded.ok ? (
          <SharedContent
            shareId={params.shareId}
            share={share}
            result={loaded.payload}
          />
        ) : (
          <LoadFailed shareId={params.shareId} status={loaded.status} />
        )}

        <section className="mt-16 flex flex-col items-center gap-4 border-t border-neutral-800 pt-10 text-center">
          <GhostIcon className="h-10 w-10 text-ghost/70" strokeWidth={1.25} />
          <p className="max-w-md text-sm text-neutral-400">{SHARE.ctaHelp}</p>
          <Link href="/" className={ctaClass}>
            {SHARE.cta}
          </Link>
        </section>
      </div>
    </main>
  );
}

function Banner({ share }: { share: ShareRef }) {
  return (
    <div className="stone relative mb-10 flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-b-md rounded-t-2xl border border-pumpkin/50 px-5 py-4 sm:px-6">
      <span className="noise-overlay rounded-[inherit]" aria-hidden="true" />
      <p className="relative text-sm leading-relaxed text-neutral-100">{shareBanner(facts(share))}</p>
      <Link href="/" className={`relative ${ctaClass}`}>
        {SHARE.cta}
      </Link>
    </div>
  );
}

function SharedContent({
  shareId,
  share,
  result,
}: {
  shareId: string;
  share: ShareRef;
  result: ResurrectResult;
}) {
  const snapshotDate = parseWaybackTimestamp(result.snapshotTimestamp);
  const domain = normalizeUrl(share.url);

  return (
    <>
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b border-neutral-800 pb-6">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500 [font-variant-caps:all-small-caps]">
            A resurrection
          </p>
          <h1 className="mt-2 break-words font-display text-4xl font-bold tracking-wide text-pumpkin [text-shadow:0_0_24px_rgba(255,107,26,0.3)] sm:text-5xl">
            {siteName(share.url)}
          </h1>
          <p className="mt-2 break-words text-xs text-neutral-500">
            {domain !== siteName(share.url).toLowerCase() && <>{domain} · </>}
            {share.deathYear !== null && (
              <>
                <span className="text-ghost/70">† {share.deathYear}</span>
                {" · "}
              </>
            )}
            {snapshotDate && (
              <>
                Snapshot from{" "}
                <time dateTime={snapshotDate.toISOString()}>{formatLongDate(snapshotDate)}</time>
                {" · "}
              </>
            )}
            Resurrected <time dateTime={share.resurrectedAt}>{formatLongDate(new Date(share.resurrectedAt))}</time>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <QualityBadge score={qualityScore(result.extracted)} />
          <a
            href={`/r/${shareId}/raw`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-neutral-700 px-3 py-1 text-xs text-neutral-300 transition-colors hover:border-ghost/60 hover:text-ghost focus-visible:border-ghost focus-visible:outline-none"
          >
            {SHARE.rawData}
          </a>
        </div>
      </header>
      <ResultView result={result} />
    </>
  );
}

function LoadFailed({ shareId, status }: { shareId: string; status: number }) {
  const copy = status === 504 ? ERROR_COPY.timeout : status === 404 ? ERROR_COPY.not_found : ERROR_COPY.unknown;
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-12 text-center">
      <GhostIcon className="h-16 w-16 text-ghost/70" strokeWidth={1.25} />
      <h1 className="mt-6 font-display text-2xl font-bold text-neutral-100">{SHARE.loadFailedTitle}</h1>
      <p className="mt-3 text-sm text-neutral-400">{SHARE.loadFailedHelp}</p>
      <p className="mt-1 text-sm text-neutral-500">
        {copy.message} {copy.hint}
      </p>
      <a
        href={`/r/${shareId}`}
        className="mt-6 text-sm text-ghost underline underline-offset-4 hover:text-pumpkin"
      >
        {BUTTONS.retry}
      </a>
    </div>
  );
}
