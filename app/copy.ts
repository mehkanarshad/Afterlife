import type { DeathCause } from "@/lib/post-mortem";
import {
  ExtractedContent,
  THIN_THRESHOLD,
  fragmentCount,
  qualityScore,
} from "@/lib/quality";
import type { ErrorKind } from "./use-resurrect";

// Voice: spooky, confident, never confusing. Every message names what
// happened and, where there is one, what to do next. Strings the app computes
// (counts, causes, years) are built here too, so the voice stays in one file.

// ---- Errors: a headline (white) and a hint (muted) ----------------------

export const ERROR_COPY: Record<ErrorKind, { message: string; hint: string }> = {
  not_found: {
    message: "This site was never buried here. No archive exists.",
    hint: "Check the spelling, or try another grave.",
  },
  timeout: {
    message: "The archive is haunting us with silence.",
    hint: "Try again in a moment.",
  },
  network: {
    message: "The spirits can't reach the archive.",
    hint: "Check your connection, then dig again.",
  },
  unknown: {
    message: "Something stirred that we didn't expect.",
    hint: "Dig again, or try a different grave.",
  },
};

export const EMPTY_URL_ERROR = "The grave needs a name. Enter a URL.";

// ---- Loading ----------------------------------------------------------------

export const CEREMONY_PHRASES = {
  summon: "Summoning the archive…",
  read: "Reading the bones…",
  stitch: "Stitching fragments…",
  council: "Convening the council…",
} as const;

// ---- Thin or empty snapshot ---------------------------------------------

export const EMPTY_STATE_TITLE = "We dug, but only bones remained.";
export const EMPTY_STATE_HINT =
  "Try another year in the Post-Mortem Report below, or open the original snapshot.";

// Says why the snapshot is empty, using the inferred cause of death.
const EMPTY_STATE_DETAIL: Record<DeathCause, string> = {
  "Redirect stub": "This snapshot is a redirect stub — nothing readable survived.",
  "Domain expired": "The domain lapsed and a parking page took its place — nothing readable survived.",
  "404": "The archive only kept an error page — nothing readable survived.",
  "Server gone": "The server was already dead when the archive visited — nothing readable survived.",
  Undetermined: "The page was empty when the archive visited — nothing readable survived.",
};

export function emptyStateDetail(cause: DeathCause | undefined): string {
  return EMPTY_STATE_DETAIL[cause ?? "Undetermined"];
}

// ---- Success toast ----------------------------------------------------------

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/**
 * The line shown when a live resurrection lands. Returns null for an empty
 * result, where the panel already explains what happened. A thin result is
 * called out as thin, so the toast never claims more than was recovered.
 */
export function successToast(extracted: ExtractedContent): string | null {
  const fragments = fragmentCount(extracted);
  if (fragments === 0 && extracted.title === "") return null;
  if (fragments === 0) return "Resurrection complete, but only a name survived.";
  const stitched = `${plural(fragments, "fragment")} stitched.`;
  if (qualityScore(extracted) < THIN_THRESHOLD) {
    return `Resurrection complete, but only scraps survived. ${stitched}`;
  }
  return `Resurrection complete. ${stitched} The dead walk again.`;
}

// ---- Buttons and labels ----------------------------------------------------

export const BUTTONS = {
  retry: "Dig again",
  digging: "Digging…",
  openGrave: "Open grave",
  copyLink: "Copy grave link",
  linkCopied: "Link copied ✓",
  clearLog: "Empty the graveyard",
  keepLog: "Keep them",
  skipDebate: "Skip to the verdict",
  continue: "Reveal the resurrection",
  viewSnapshot: "View original snapshot →",
  backToGhost: "← Back to ghost",
} as const;

// ---- Bury a new site -------------------------------------------------------

export const BURY = {
  placeholder: "Name the grave: geocities.com",
  helper: "We'll dig up the most recent Wayback Machine snapshot.",
} as const;

// ---- Council ----------------------------------------------------------------

export const COUNCIL = {
  toggleHelp:
    "Four analysts examine early, middle and recent snapshots, argue over the remains, and choose the best one. Slower.",
  footnote: "Each analyst weighs the real snapshots by its own rule: size, age, text and fragments.",
  finished: "The council has spoken. Resurrecting…",
  skipped:
    "The archive wouldn't list its snapshots in time, so the council sat this one out. Showing the most recent remains.",
} as const;

// ---- Post-Mortem Report ----------------------------------------------------

export const POST_MORTEM = {
  labels: {
    cause: "Cause of death",
    quality: "Condition of remains",
    era: "Era",
    years: "Other years on record",
  },
  causeUnrecorded: "Cause unrecorded",
  causeNotFiled: "The coroner wasn't present for this one. Resurrect the site again to file a report.",
  searching: "Digging through the archive…",
  timeout: "The archive went silent while listing its other years.",
  failed: "The archive wouldn't list its other years.",
  network: "The spirits couldn't reach the server.",
  none: "The archive holds no other years for this URL.",
} as const;

// ---- Log and share pages ---------------------------------------------------

export const LOG = {
  subtitle: "Every grave you've disturbed, kept in this browser only.",
  emptyTitle: "Your graveyard is empty. Resurrect something.",
  emptyHelp: "Raise a site from the graveyard and it will be recorded here.",
  emptyLink: "Go to the graveyard",
  clearTitle: "Empty the graveyard?",
  clearBody: (n: number) =>
    `This erases all ${n} resurrection${n === 1 ? "" : "s"} from this browser. Their grave links will stop working. This can't be undone.`,
  manualCopy: "Grave link (copy it manually)",
} as const;

interface ShareFacts {
  /** Domain as shown in titles, e.g. "geocities.com". */
  domain: string;
  deathYear: number | null;
  /** Year of the archived capture. */
  snapshotYear: number;
  /** Already formatted, e.g. "November 27, 2026". */
  resurrectedOn: string;
}

/** Banner at the top of a shared page. */
export function shareBanner({ deathYear, snapshotYear, resurrectedOn }: ShareFacts): string {
  const lead =
    deathYear !== null
      ? `This site died in ${deathYear}.`
      : `The Wayback Machine last captured this site in ${snapshotYear}.`;
  return `${lead} Resurrected by Afterlife on ${resurrectedOn}.`;
}

export function shareTitle(domain: string): string {
  return `${domain} — Resurrected by Afterlife`;
}

export function shareDescription({ domain, deathYear, snapshotYear, resurrectedOn }: ShareFacts): string {
  const from = `from a ${snapshotYear} Wayback Machine snapshot`;
  return deathYear !== null
    ? `${domain} died in ${deathYear}. Resurrected by Afterlife on ${resurrectedOn}, ${from}.`
    : `Afterlife resurrected ${domain} on ${resurrectedOn}, ${from}.`;
}

export const SHARE = {
  cta: "Resurrect your own",
  ctaHelp: "Every dead site has a grave. Dig up one of your own.",
  rawData: "Raw data (JSON)",
  loadFailedTitle: "The grave wouldn't open",
  loadFailedHelp: "This resurrection exists, but the archive didn't answer in time.",
  missingTitle: "This grave is empty",
  missingBody:
    "No resurrection with this link is stored in this browser. Grave links only open in the browser that raised the site, and emptying the graveyard erases them.",
  missingLink: "Back to the graveyard",
} as const;
