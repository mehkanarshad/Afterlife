import { QualityBadge as Badge, qualityBadge } from "@/lib/quality";

const STYLES: Record<Badge, string> = {
  Full: "border-ghost/50 text-ghost",
  Partial: "border-pumpkin/50 text-pumpkin",
  Thin: "border-neutral-600 text-neutral-400",
};

export function QualityBadge({ score }: { score: number }) {
  const badge = qualityBadge(score);
  return (
    <span
      title={`Quality score ${score}`}
      className={`rounded-full border bg-black/30 px-2.5 py-0.5 font-mono text-[0.7rem] uppercase tracking-wider ${STYLES[badge]}`}
    >
      {badge}
    </span>
  );
}

const dateFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatDate(date: Date): string {
  return dateFormat.format(date);
}
