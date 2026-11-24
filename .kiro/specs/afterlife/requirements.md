# Afterlife Requirements

Afterlife resurrects dead websites. A user enters a URL, and the app finds an archived snapshot on the Wayback Machine, extracts the readable content, and shows it in a modern, clean layout.

## Pipeline

```
Wayback lookup  →  HTML fetch  →  Cheerio extraction  →  modern render
getSnapshot()      fetch()        extractContent()       app/page.tsx
(lib/wayback.ts)   (route.ts)     (lib/extract.ts)
```

All steps up to extraction run server-side inside `POST /api/resurrect`. Rendering happens in the browser.

## Requirements

### 1. Wayback lookup

**User story:** As a user, I want Afterlife to find the closest archived snapshot of a URL, so I can see a site that no longer exists.

Acceptance criteria:
1. `getSnapshot(url)` calls `https://archive.org/wayback/available?url=<encoded url>` using native `fetch`.
2. When `archived_snapshots.closest` exists and is available, it returns `{ snapshotUrl, timestamp }`.
3. A `snapshotUrl` that starts with `http://` is rewritten to `https://`.
4. It returns `null` when no snapshot exists, when the API responds with a non-OK status, and on any thrown error.

### 2. API endpoint

**User story:** As a client, I want one endpoint that runs the whole pipeline, so the UI needs a single call.

Acceptance criteria:
1. `POST /api/resurrect` accepts a JSON body `{ url: string }`.
2. A malformed JSON body, or a missing or empty `url`, returns 400.
3. When `getSnapshot` returns `null`, the endpoint returns 404 with `{ error: "No snapshot found" }`.
4. The snapshot HTML fetch has a 10-second timeout. A timeout returns 504.
5. A non-OK response from the snapshot fetch returns 502.
6. Any other unexpected error returns 500.
7. On success it returns 200 with `{ originalUrl, snapshotTimestamp, snapshotUrl, extracted: { title, headings, paragraphs, images } }`.

### 3. Content extraction

**User story:** As a user, I want only the readable content of the old page, without its styling or scripts.

Acceptance criteria:
1. `extractContent(html)` uses Cheerio and returns `{ title, headings, paragraphs, images }`.
2. `title` is the text of `<title>`, falling back to the first `<h1>`, or `""` if neither exists.
3. `headings` holds the text of all `h1`-`h3` elements, trimmed, with empty ones removed.
4. `paragraphs` holds the text of all `<p>` elements, trimmed, keeping only those longer than 20 characters.
5. `images` holds the `src` of `<img>` elements, keeping only URLs that start with `http`.
6. Empty fields are returned as `""` or `[]`.
7. `<script>`, `<style>` and `<noscript>` content is never included. Styling is not extracted.

### 4. Modern render

**User story:** As a user, I want to see the resurrected content in a clean layout and still reach the original snapshot.

Acceptance criteria:
1. `app/page.tsx` shows a centered URL input and a "Resurrect" button, on a dark background.
2. Submitting calls `POST /api/resurrect` with the entered URL.
3. A loading spinner shows while the request is pending.
4. On error, a red message appears below the input.
5. On success, two columns appear side by side on medium screens and wider, and stack on narrow screens.
6. The left column is labeled "Ghost", uses a monospace font, and shows a "View original snapshot" link to `snapshotUrl`. The link opens in a new tab. An iframe is not used, because the Wayback Machine snapshot would not load in it.
7. The right column is labeled "Resurrected", uses a sans-serif font, and renders the title as `<h1>`, headings as `<h2>`, paragraphs as `<p>`, and images as `<img>` with `max-width: 100%`.

## Constraints

- Next.js 14 App Router, TypeScript strict mode, Tailwind CSS.
- No database. All state is in memory and request-scoped.
- Wayback Machine requests are made server-side only.
- Tone: nostalgic but clean.

## Known Limitations

- Some archived pages contain no extractable content. The archived `geocities.com` page is a 198-byte stub, so all fields come back empty.
- Headings and paragraphs are returned as separate lists, so the resurrected view cannot interleave them in their original order.
- The 502, 504 and 500 error paths have not been exercised in a live test.
- `next lint` has not been run on this code.
