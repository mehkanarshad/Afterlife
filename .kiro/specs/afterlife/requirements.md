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
1. `getSnapshot(url)` calls `https://archive.org/wayback/available?url=<encoded url>` using native `fetch`. A leading `http://` or `https://` is removed before the lookup, because the API times out for some `https://` URLs, such as `https://geocities.com`.
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
7. On success it returns 200 with `{ originalUrl, snapshotTimestamp, snapshotUrl, extracted: { title, headings, paragraphs, images }, status }`, plus `hint` when `status` is `"thin_snapshot"`. See requirement 5.3.

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
4. On error, an alert card appears below the input. See requirement 5.4.
5. On success, two columns appear side by side on medium screens and wider, and stack on narrow screens.
6. The left column is labeled "Ghost", uses a monospace font, and shows a "View original snapshot" link to `snapshotUrl`. The link opens in a new tab. An iframe is not used, because the Wayback Machine snapshot would not load in it.
7. The right column is labeled "Resurrected", uses a sans-serif font, and renders the title as `<h1>`, headings as `<h2>`, paragraphs as `<p>`, and images as `<img>` with `max-width: 100%`.

### 5. User Experience

**User story:** As a first-time user, I want a working path on my first try, and clear feedback when a site can't be resurrected.

Acceptance criteria:

1. **Example chips for guided entry.** Below the input, clickable chips show `geocities.com`, `altavista.com` and `myspace.com/tom`. Clicking a chip fills the input and submits it. The chips are disabled while a request is in flight. The input placeholder reads "Enter a dead website URL, e.g. geocities.com", and helper text below it reads "We'll look up the most recent Wayback Machine snapshot."
2. **Automatic `https://` prefixing.** When the input loses focus, and it is non-empty with no `scheme://`, `https://` is prepended. Chip values are submitted as shown, with no prefix added. While a request is in flight, the Resurrect button is disabled and reads "Digging…".
3. **Thin-snapshot detection.** After extraction, the API computes a quality score: `title.length + headings.join("").length + paragraphs.join("").length + images.length * 10`.
   - Below 50, the response includes `"status": "thin_snapshot"` and `"hint": "This snapshot contains very little readable content. It may be a redirect or error page."`
   - At 50 or more, the response includes `"status": "ok"` and no `hint`.
   - This is metadata only. The HTTP status code stays 200.
4. **Contextual error messages.** Each error appears as an alert card below the input and above the results. The card has a dark background, a 1px orange border with a 4px orange left border, and an orange warning icon. The headline is white and the hint is muted gray. The copy is chosen from the HTTP status:

   | Condition | Headline | Hint |
   |---|---|---|
   | HTTP 404 | "No archive exists for this URL." | "It may never have been crawled, or the URL is misspelled." |
   | HTTP 504 | "Wayback Machine took too long to respond." | "Try again in a moment." |
   | Network failure (`fetch` rejects) | "Couldn't reach the archive." | "Check your connection." |
   | Any other error, or an unreadable 200 body | "Something went wrong while digging." | "Try a different URL." |

5. **Empty state.** When the title is `""` and headings, paragraphs and images are all empty, the Resurrected panel shows, centered and top to bottom:
   - A ghost icon with a soft orange glow.
   - "Nothing readable survived in this snapshot." in pale green.
   - "The archive only captured a redirect stub. Try another URL, or view the original snapshot below." in muted gray.
   - The tombstone snapshot link, the same card used in the Ghost column.

6. **Loading skeleton.** While a request is in flight, the Resurrected panel shows three shimmering placeholder lines (a pale gray gradient sweep) above the rotating ghost and the cycling status text.

## Constraints

- Next.js 14 App Router, TypeScript strict mode, Tailwind CSS.
- No database. All state is in memory and request-scoped.
- Wayback Machine requests are made server-side only.
- Tone: nostalgic but clean.

## Known Limitations

- Some archived pages contain no extractable content. The archived `geocities.com` page is a 198-byte stub, so all fields come back empty.
- Headings and paragraphs are returned as separate lists, so the resurrected view cannot interleave them in their original order.
- The 502 and 500 error paths have not been exercised in a live test. A 504 has occurred live, when a snapshot fetch timed out.
- `next lint` has not been run on this code.
- When the Wayback availability API times out, it returns HTTP 200 with an `error` field. `getSnapshot` treats that as no snapshot, so the API returns 404, and the UI shows "No archive exists" when a retry would work.
- The UI empty state uses its own all-fields-empty check. It does not read the API's `status` field.
