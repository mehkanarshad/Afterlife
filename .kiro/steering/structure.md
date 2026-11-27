# Project Structure

## Directories

### `app/`
UI lives here: pages, layouts, and Client Components. Each route segment is a folder following Next.js App Router conventions.

### `app/api/`
API route handlers only. Each endpoint is a folder containing a `route.ts` file. Handlers should be thin: validate input, call into `lib/`, and return a response. No business logic in route files.

### `lib/`
Pure utility functions with no framework dependencies. Functions here must be:
- Stateless and side-effect-free where possible
- Independently testable
- Importable from both route handlers and Server Components

Current modules:
- `lib/wayback.ts` — Wayback Machine availability lookup, exact-capture URLs, and the CDX per-year snapshot list
- `lib/extract.ts` — HTML content extraction via Cheerio
- `lib/quality.ts` — quality score and Full / Partial / Thin badge, shared by the API and the UI
- `lib/post-mortem.ts` — era labels and CDX response parsing (safe for the browser)
- `lib/death-cause.ts` — death-cause inference from snapshot HTML (server only, uses Cheerio)
- `lib/share.ts` — share-link encoding and decoding, date helpers (safe for the browser)
- `lib/origin.ts` — the site's public origin from request headers, for absolute URLs
- `lib/public-registry.ts` — in-memory list of public resurrections behind the public API (server only)
- `lib/shared-load.ts` — loads and caches the capture behind a share link, builds the raw JSON (server only)
- `lib/resurrect.ts` — fetch one snapshot and extract it (shared by `/api/resurrect` and `/api/council`)
- `lib/council.ts` — Council Mode: candidate selection, the four analysts' votes and the debate lines
- `lib/sites.ts` — the 20 hardcoded dead sites shown in the graveyard

## Conventions

- Co-locate a component with its route if it is only used in one place. Promote to a shared location only when used in two or more places.
- Avoid barrel files (`index.ts`) unless a module has more than three exports that are routinely imported together.
- Keep file names lowercase with hyphens (`my-component.tsx`), except for Next.js special files (`layout.tsx`, `page.tsx`, `route.ts`).
