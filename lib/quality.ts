export interface ExtractedContent {
  title: string;
  headings: string[];
  paragraphs: string[];
  images: string[];
}

/** Below this score a snapshot is "thin" (the API's `thin_snapshot` status). */
export const THIN_THRESHOLD = 50;
/** At or above this score a snapshot counts as a full page. */
export const FULL_THRESHOLD = 500;

export type QualityBadge = "Full" | "Partial" | "Thin";

/** Readable-content score: characters of text, plus 10 per image. */
export function qualityScore(content: ExtractedContent): number {
  return (
    content.title.length +
    content.headings.join("").length +
    content.paragraphs.join("").length +
    content.images.length * 10
  );
}

export function qualityBadge(score: number): QualityBadge {
  if (score < THIN_THRESHOLD) return "Thin";
  if (score < FULL_THRESHOLD) return "Partial";
  return "Full";
}
