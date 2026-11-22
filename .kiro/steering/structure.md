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
- `lib/wayback.ts` — Wayback Machine availability and snapshot URL resolution
- `lib/extract.ts` — HTML content extraction via Cheerio

## Conventions

- Co-locate a component with its route if it is only used in one place. Promote to a shared location only when used in two or more places.
- Avoid barrel files (`index.ts`) unless a module has more than three exports that are routinely imported together.
- Keep file names lowercase with hyphens (`my-component.tsx`), except for Next.js special files (`layout.tsx`, `page.tsx`, `route.ts`).
