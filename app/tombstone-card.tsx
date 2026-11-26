import type { DeadSite } from "@/lib/sites";
import { CrossIcon } from "./icons";

// Small fixed tilts so the rows look like an old, settling cemetery rather
// than a spreadsheet. Indexed by position, so the layout is deterministic.
const TILTS = ["-rotate-1", "rotate-[0.6deg]", "rotate-0", "rotate-1", "-rotate-[0.6deg]"];

export function TombstoneCard({
  site,
  index,
  onSelect,
}: {
  site: DeadSite;
  index: number;
  onSelect: (site: DeadSite) => void;
}) {
  return (
    <li className="relative pb-4">
      <article
        className={`stone group relative flex h-full flex-col items-center rounded-b-md rounded-t-[999px_420px] border border-neutral-700/70 px-6 pb-6 pt-12 text-center shadow-[0_18px_30px_-12px_rgba(0,0,0,0.9)] transition-[transform,box-shadow,border-color] duration-300 focus-within:-translate-y-1 focus-within:rotate-0 focus-within:border-pumpkin/60 hover:-translate-y-1 hover:rotate-0 hover:border-pumpkin/50 hover:shadow-[0_22px_40px_-12px_rgba(0,0,0,0.95),0_0_30px_rgba(255,107,26,0.12)] motion-reduce:transition-none ${
          TILTS[index % TILTS.length]
        }`}
      >
        <span className="noise-overlay rounded-[inherit]" aria-hidden="true" />
        <CrossIcon className="relative h-6 w-6 text-neutral-500 transition-colors group-hover:text-ghost" />
        <p className="relative mt-3 font-display text-[0.65rem] tracking-[0.4em] text-neutral-500">
          R · I · P
        </p>
        <h3 className="relative mt-3 font-display text-2xl font-bold tracking-wide text-neutral-100 [text-shadow:0_1px_0_rgba(0,0,0,0.8)]">
          {site.name}
        </h3>
        <p className="relative mt-1 font-mono text-xs text-neutral-500">{site.domain}</p>
        <p className="relative mt-4 font-display text-lg tracking-widest text-ghost/80">
          <span className="sr-only">Died </span>
          <span aria-hidden="true">† </span>
          {site.diedYear}
        </p>
        <span className="relative mt-4 rounded-full border border-neutral-700 bg-black/30 px-2.5 py-0.5 font-mono text-[0.7rem] uppercase tracking-wider text-neutral-400">
          {site.category}
        </span>
        <button
          type="button"
          onClick={() => onSelect(site)}
          aria-label={`Resurrect ${site.name}`}
          // after: stretches the click target over the whole card, so the
          // card is clickable while keeping a single tab stop. No transform
          // on this button: a transform (e.g. active:scale) would make it the
          // containing block for ::after, shrinking the hit area mid-click.
          className="mt-6 rounded-md border border-pumpkin/50 bg-black/40 px-4 py-1.5 font-mono text-sm text-pumpkin transition-[background-color,color,box-shadow] duration-150 after:absolute after:inset-0 after:rounded-[inherit] after:content-[''] hover:bg-pumpkin hover:text-black group-hover:shadow-[0_0_18px_rgba(255,107,26,0.35)] focus-visible:bg-pumpkin focus-visible:text-black focus-visible:outline-none"
        >
          Resurrect
        </button>
      </article>
      {/* Grave mound / ground shadow */}
      <span
        className="pointer-events-none absolute inset-x-6 bottom-1 h-4 rounded-[50%] bg-black/70 blur-md"
        aria-hidden="true"
      />
    </li>
  );
}
