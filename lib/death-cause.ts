import * as cheerio from "cheerio";
import type { DeathVerdict } from "./post-mortem";

// Server-only: reads snapshot HTML with Cheerio. Kept apart from
// lib/post-mortem.ts, whose era and CDX helpers the browser also imports, so
// Cheerio never ends up in the client bundle.

// Phrases that registrars and parking services put on lapsed domains.
const PARKED_PATTERNS = [
  /this domain (?:name )?(?:is|may be) for sale/i,
  /buy this domain/i,
  /domain (?:name )?(?:has )?expired/i,
  /this domain is parked/i,
  /parked (?:free|domain)/i,
  /domain (?:is )?available for (?:purchase|registration)/i,
  /(?:sedo|dan\.com|hugedomains|afternic|bodis)\b/i,
];

const WAYBACK_PREFIX = /^https?:\/\/web\.archive\.org\/web\/\d{1,14}[a-z_]*\/?/i;

/** Strips the Wayback replay prefix from a rewritten link. */
function originalTarget(url: string): string {
  return url.replace(WAYBACK_PREFIX, "");
}

function hostOf(url: string): string {
  try {
    return new URL(/^[a-z]+:\/\//i.test(url) ? url : `http://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * Infers how a site died from its snapshot. This is a heuristic and the UI
 * labels it as inferred. Checks run from strongest evidence to weakest.
 *
 * @param archivedStatus HTTP status the archive recorded for the capture, if known.
 * @param html           The snapshot HTML as served by the Wayback replay.
 * @param thin           True when the extracted content scored below the thin threshold.
 */
export function inferDeathCause({
  archivedStatus,
  html,
  thin,
}: {
  archivedStatus: number | null;
  html: string;
  thin: boolean;
}): DeathVerdict {
  if (archivedStatus === 404 || archivedStatus === 410) {
    return { cause: "404", evidence: `The archive recorded HTTP ${archivedStatus} for this page.` };
  }
  if (archivedStatus !== null && archivedStatus >= 500) {
    return {
      cause: "Server gone",
      evidence: `The archive recorded HTTP ${archivedStatus}: the server was failing when it was captured.`,
    };
  }

  const $ = cheerio.load(html);

  // Wayback injects its own scripts; drop them before reading page text/code.
  $("script").each((_, el) => {
    const code = $(el).html() ?? "";
    const src = $(el).attr("src") ?? "";
    if (/archive\.org|__wm\b|wombat/i.test(code + src)) $(el).remove();
  });

  const text = $("body").text().replace(/\s+/g, " ");
  const parked = PARKED_PATTERNS.map((p) => text.match(p)).find(Boolean);
  if (parked) {
    return { cause: "Domain expired", evidence: `The page reads "${parked[0]}", typical of a lapsed or parked domain.` };
  }

  const refresh = $('meta[http-equiv="refresh" i]').attr("content") ?? "";
  const refreshUrl = /url\s*=\s*['"]?([^'"\s>]+)/i.exec(refresh)?.[1];
  if (refreshUrl) {
    return {
      cause: "Redirect stub",
      evidence: `The page only redirects visitors to ${hostOf(originalTarget(refreshUrl))}.`,
    };
  }

  if (archivedStatus !== null && archivedStatus >= 300 && archivedStatus < 400) {
    return { cause: "Redirect stub", evidence: `The archive recorded an HTTP ${archivedStatus} redirect.` };
  }

  const inline = $("script")
    .map((_, el) => $(el).html() ?? "")
    .get()
    .join("\n");
  if (thin && /\blocation(?:\.href)?\s*=(?!=)|\blocation\.(?:replace|assign)\s*\(/.test(inline)) {
    return { cause: "Redirect stub", evidence: "The page sends visitors elsewhere with a script redirect." };
  }

  if (thin) {
    return {
      cause: "Undetermined",
      evidence: "The snapshot is nearly empty, but it shows no redirect, error or parking notice.",
    };
  }
  return {
    cause: "Undetermined",
    evidence: "The snapshot looks like a working page. The archive doesn't show how the site died.",
  };
}
