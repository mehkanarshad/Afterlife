# Tech Stack

## Core

- **Next.js 14** with the App Router (`app/` directory). Use Server Components by default; opt into Client Components only when interactivity requires it.
- **TypeScript** in strict mode. All files must be `.ts` or `.tsx`. No `any` types — use `unknown` and narrow explicitly.
- **Tailwind CSS** for all styling. No CSS modules, no inline `style` props unless a value cannot be expressed as a utility class.

## Libraries

- **Cheerio** for server-side HTML parsing and content extraction. Used in `lib/` utility functions, never in route handlers directly.

## Data

- No database. All state is in-memory and request-scoped. Nothing is persisted between requests.
- No authentication, no sessions, no cookies.

## Constraints

- Fetch calls to the Wayback Machine happen server-side only (API routes or Server Components). Never expose Wayback Machine requests to the browser.
- Keep bundle size small: avoid importing large libraries into Client Components.
