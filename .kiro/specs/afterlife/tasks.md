# Afterlife Tasks

Pipeline: Wayback lookup → HTML fetch → Cheerio extraction → modern render

## Steering

- [x] Write `.kiro/steering/product.md`
- [x] Write `.kiro/steering/tech.md`
- [x] Write `.kiro/steering/structure.md`

## Wayback lookup (`lib/wayback.ts`)

- [x] Implement `getSnapshot(url)` using native `fetch` and the Wayback availability API
- [x] Rewrite `http://` snapshot URLs to `https://`
- [x] Return `null` on no snapshot, non-OK response, or any error
- [x] Add `scripts/test-wayback.ts` and run it with `tsx` against `geocities.com`
- [x] Install `tsx` as a dev dependency

## Content extraction (`lib/extract.ts`)

- [x] Install `cheerio`
- [x] Implement `extractContent(html)` returning `{ title, headings, paragraphs, images }`
- [x] Title from `<title>` with `<h1>` fallback
- [x] Headings from `h1`-`h3`, trimmed, non-empty
- [x] Paragraphs from `<p>`, trimmed, longer than 20 characters
- [x] Images from `<img src>`, only URLs starting with `http`
- [x] Strip `<script>`, `<style>` and `<noscript>` before extracting
- [x] Check the title fallback, filtering rules and empty input with sample HTML

## API route (`app/api/resurrect/route.ts`)

- [x] Accept `POST` with JSON body `{ url: string }`
- [x] Return 400 for malformed JSON or a missing or empty `url`
- [x] Call `getSnapshot` and return 404 `{ error: "No snapshot found" }` when it returns `null`
- [x] Fetch the snapshot HTML with a 10-second timeout
- [x] Map failures to 504 (timeout), 502 (upstream non-OK) and 500 (other)
- [x] Return `{ originalUrl, snapshotTimestamp, extracted }`
- [x] Add `snapshotUrl` to the response for the UI
- [x] Test with `curl` for `example.com`, `geocities.com`, an unknown site, bad JSON and a missing `url`

## UI (`app/page.tsx`)

- [x] Centered URL input and "Resurrect" button on a dark background
- [x] Call `POST /api/resurrect` on submit
- [x] Loading spinner while the request is pending
- [x] Red error message below the input
- [x] Two-column result layout, stacked on narrow screens
- [x] "Resurrected" column rendering title, headings, paragraphs and images
- [x] "Ghost" column with an iframe of the snapshot
- [x] Replace the iframe with a "View original snapshot" link, because the iframe was blocked

## Open items

- [ ] Exercise the 502, 504 and 500 error paths in a live test
- [ ] Run `next lint` after ESLint is configured for the project
- [ ] Check the page in a browser
- [ ] Preserve the original order of headings and paragraphs in the resurrected view
