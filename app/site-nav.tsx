"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Graveyard" },
  { href: "/log", label: "Log" },
];

// Overlays the top of each page (absolute), so the home hero keeps its spacing.
export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-4 font-mono text-sm"
    >
      <Link
        href="/"
        className="font-display text-base font-bold tracking-wide text-pumpkin/90 transition-colors hover:text-pumpkin focus-visible:text-pumpkin focus-visible:outline-none"
      >
        Afterlife
      </Link>
      <ul className="flex items-center gap-6">
        {LINKS.map(({ href, label }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`underline-offset-8 transition-colors hover:text-ghost focus-visible:text-ghost focus-visible:underline focus-visible:outline-none ${
                  active ? "text-ghost underline decoration-pumpkin/70" : "text-neutral-400"
                }`}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
