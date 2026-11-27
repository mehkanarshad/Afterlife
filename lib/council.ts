import { DeathCause, SnapshotEntry, eraOf } from "./post-mortem";

// The "council" is four analysts. Each one applies one rule to the real
// snapshots and votes for a year. Nothing here is scripted per site: every
// number and year in a line comes from the candidates passed in.

export type Agent = "Archaeologist" | "Designer" | "Engineer" | "Tester";
export const AGENTS: readonly Agent[] = ["Archaeologist", "Designer", "Engineer", "Tester"];

export interface CouncilCandidate {
  year: number;
  timestamp: string;
  /** Quality score below the thin threshold. */
  thin: boolean;
  /** Readable-content score (see lib/quality.ts). */
  score: number;
  /** Fragments to verify: headings + paragraphs + images. */
  blocks: number;
  /** Size of the captured HTML. */
  htmlBytes: number;
  /** Count of <table> and <font> tags, markers of period layout. */
  tables: number;
  fonts: number;
  cause: DeathCause;
}

export interface CouncilInput {
  /** Snapshots that were retrieved, oldest first. At least one. */
  candidates: CouncilCandidate[];
  /** Years that were picked but could not be retrieved. */
  failedYears: number[];
  /** How many years of snapshots the archive lists for this URL. */
  totalSnapshots: number;
}

export interface CouncilLine {
  speaker: Agent;
  text: string;
}

/** Stored on the result, so the badge survives in the log and share pages. */
export interface CouncilVerdict {
  year: number;
  agreed: number;
  total: number;
}

export interface CouncilTranscript {
  lines: CouncilLine[];
  verdict: CouncilVerdict;
  votes: Record<Agent, number>;
}

/** The earliest, a middle and the latest snapshot: the widest spread of eras. */
export function pickCandidates(snapshots: SnapshotEntry[], max = 3): SnapshotEntry[] {
  if (snapshots.length <= max) return snapshots;
  const middle = snapshots[Math.floor((snapshots.length - 1) / 2)];
  return [snapshots[0], middle, snapshots[snapshots.length - 1]];
}

function best<T>(items: T[], key: (item: T) => number, sign: 1 | -1 = 1): T {
  // Ties go to the earlier year, since items are sorted oldest first.
  return items.reduce((top, item) => (sign * key(item) > sign * key(top) ? item : top));
}

const CAUSE_TEXT: Record<DeathCause, string> = {
  "Redirect stub": "a redirect stub",
  "Domain expired": "a parked domain",
  "404": "an error page",
  "Server gone": "a server error",
  Undetermined: "nearly empty",
};

const DISSENT_REASON: Record<Agent, string> = {
  Archaeologist: "it's the most intact capture",
  Designer: "it has the most character",
  Engineer: "it has the most text to rebuild",
  Tester: "it has the most fragments to verify",
};

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function convene({ candidates, failedYears, totalSnapshots }: CouncilInput): CouncilTranscript {
  if (candidates.length === 0) throw new Error("The council needs at least one snapshot");

  // Judge only real pages. If every capture is a stub, judge them all.
  const real = candidates.filter((c) => !c.thin);
  const pool = real.length > 0 ? real : candidates;

  const picks: Record<Agent, CouncilCandidate> = {
    Archaeologist: best(pool, (c) => c.htmlBytes),
    Designer: best(pool, (c) => c.year, -1), // oldest = most character
    Engineer: best(pool, (c) => c.score),
    Tester: best(pool, (c) => c.blocks),
  };
  const votes = Object.fromEntries(AGENTS.map((a) => [a, picks[a].year])) as Record<Agent, number>;

  // Plurality wins. A tie goes to the richer page, then the earlier one.
  const tally = new Map<number, number>();
  for (const a of AGENTS) tally.set(votes[a], (tally.get(votes[a]) ?? 0) + 1);
  const winner = pool
    .filter((c) => tally.has(c.year))
    .sort((a, b) => tally.get(b.year)! - tally.get(a.year)! || b.score - a.score || a.year - b.year)[0];
  const agreed = tally.get(winner.year)!;

  const lines: CouncilLine[] = [];
  const years = [...candidates.map((c) => c.year), ...failedYears].sort((a, b) => a - b);
  const others = (pick: CouncilCandidate) => candidates.filter((c) => c !== pick);

  // Archaeologist: what was found.
  let found: string;
  if (totalSnapshots <= years.length && failedYears.length === 0) {
    found = `I found ${plural(totalSnapshots, "snapshot")}: ${years.join(", ")}.`;
  } else {
    const first = years[0];
    const last = years[years.length - 1];
    found =
      `I found ${totalSnapshots} years of snapshots` +
      (first === last ? "" : ` (${first}–${last})`) +
      ` and pulled ${years.length} to compare: ${years.join(", ")}.`;
    if (failedYears.length > 0) {
      found += ` ${failedYears.join(" and ")} wouldn't come out of the archive.`;
    }
  }
  lines.push({ speaker: "Archaeologist", text: found });

  // Designer: character.
  const d = picks.Designer;
  let design: string;
  if (candidates.length === 1) {
    design = `${d.year} is our only candidate, a ${eraOf(d.year)} page${d.thin ? ", though there's very little in it" : ""}.`;
  } else if (d.thin) {
    design = `Nothing here has much character. Every capture is close to empty, and ${d.year} is the oldest.`;
  } else {
    const stub = others(d).find((c) => c.thin);
    const newer = others(d).filter((c) => c.year > d.year).pop();
    design =
      `${d.year} has the most character: a genuine ${eraOf(d.year)} page.` +
      (stub
        ? ` The ${stub.year} one is ${CAUSE_TEXT[stub.cause]}.`
        : newer
          ? ` The ${newer.year} one is newer, so it has less period flavor.`
          : "");
  }
  lines.push({ speaker: "Designer", text: design });

  // Engineer: what can be rebuilt.
  const e = picks.Engineer;
  const layout =
    e.tables >= 3 ? `uses table layouts (${plural(e.tables, "table")})`
    : e.fonts >= 3 ? `leans on font tags (${e.fonts})`
    : "is plain markup";
  const empty = others(e).find((c) => c.blocks === 0);
  const rebuild =
    e.score === 0 ? "There is nothing to rebuild."
    : e.thin ? "There's barely anything to rebuild."
    : `I can rebuild that: ${plural(e.score, "character")} of text to work with.`;
  lines.push({
    speaker: "Engineer",
    text: `${e.year} ${layout}. ${rebuild}` + (empty ? ` The ${empty.year} one has nothing to rebuild.` : ""),
  });

  // Tester: what can be verified.
  const t = picks.Tester;
  const fewest = others(t).sort((a, b) => a.blocks - b.blocks)[0];
  lines.push({
    speaker: "Tester",
    text:
      `${t.year === d.year && candidates.length > 1 ? "Agreed. " : ""}` +
      `${t.year} gives us ${plural(t.blocks, "fragment")} to verify.` +
      (fewest ? ` ${fewest.year} gives us ${fewest.blocks}.` : ""),
  });

  // Anyone who voted differently says so before the verdict.
  for (const a of AGENTS) {
    if (votes[a] !== winner.year) {
      lines.push({
        speaker: a,
        text: `I wanted ${votes[a]} (${DISSENT_REASON[a]}), but I'll stand with ${winner.year}.`,
      });
    }
  }

  lines.push({
    speaker: "Archaeologist",
    text: agreed === AGENTS.length ? `Council agrees: ${winner.year}.` : `Council settles on ${winner.year}, ${agreed} of ${AGENTS.length}.`,
  });

  return { lines, verdict: { year: winner.year, agreed, total: AGENTS.length }, votes };
}
