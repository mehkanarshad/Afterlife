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
1. Results are shown inside a modal, opened from the graveyard grid or from "Bury a new site". See requirement 6.
2. Each request calls `POST /api/resurrect` with the site's domain or the entered URL.
3. A loading skeleton shows while the request is pending. See requirement 5.6.
4. On error, an alert card appears in the modal. See requirement 5.4.
5. On success, two columns appear side by side on medium screens and wider, separated by a divider with a small ghost icon, and stack on narrow screens with Ghost on top.
6. The left column is labeled "Ghost", uses a monospace font, and shows a "View original snapshot" link to `snapshotUrl`. The link opens in a new tab. An iframe is not used, because the Wayback Machine snapshot would not load in it.
7. The right column is labeled "Resurrected", uses a sans-serif font, and renders the title as `<h1>`, headings as `<h2>`, paragraphs as `<p>`, and images as `<img>` with `max-width: 100%`.

### 5. User Experience

**User story:** As a first-time user, I want a working path on my first try, and clear feedback when a site can't be resurrected.

Acceptance criteria:

1. **Guided entry.** The graveyard grid (requirement 6) replaces the earlier example chips: every tombstone is a working one-click path. In the "Bury a new site" modal, the input placeholder reads "Name the grave: geocities.com", and helper text below it reads "We'll dig up the most recent Wayback Machine snapshot." The helper text fades in on focus and fades out when an empty input loses focus.
2. **Automatic `https://` prefixing.** When the "Bury a new site" input loses focus, and it is non-empty with no `scheme://`, `https://` is prepended. Grid sites are submitted as bare domains. While a request is in flight, the submit button is disabled and reads "Digging…".
3. **Thin-snapshot detection.** After extraction, the API computes a quality score: `title.length + headings.join("").length + paragraphs.join("").length + images.length * 10`.
   - Below 50, the response includes `"status": "thin_snapshot"` and `"hint": "This snapshot contains very little readable content. It may be a redirect or error page."`
   - At 50 or more, the response includes `"status": "ok"` and no `hint`.
   - This is metadata only. The HTTP status code stays 200.
4. **Contextual error messages.** Each error appears as an alert card in the modal, with a "Dig again" button for grid sites. The card has a dark background, a 1px orange border with a 4px orange left border, and an orange warning icon. The headline is white and the hint is muted gray. The copy is chosen from the HTTP status:

   | Condition | Headline | Hint |
   |---|---|---|
   | HTTP 404 | "This site was never buried here. No archive exists." | "Check the spelling, or try another grave." |
   | HTTP 504 | "The archive is haunting us with silence." | "Try again in a moment." |
   | Network failure (`fetch` rejects) | "The spirits can't reach the archive." | "Check your connection, then dig again." |
   | Any other error, or an unreadable 200 body | "Something stirred that we didn't expect." | "Dig again, or try a different grave." |

5. **Empty state.** When the title is `""` and headings, paragraphs and images are all empty, the Resurrected panel shows, centered and top to bottom:
   - A ghost icon with a soft orange glow.
   - "We dug, but only bones remained." in pale green.
   - A detail line chosen by the inferred cause of death: "This snapshot is a redirect stub — nothing readable survived." for a redirect stub, "The domain lapsed and a parking page took its place — …" for an expired domain, "The archive only kept an error page — …" for a 404, "The server was already dead when the archive visited — …" for a gone server, and "The page was empty when the archive visited — …" when the cause is unknown or unrecorded.
   - "Try another year in the Post-Mortem Report below, or open the original snapshot." in muted gray.
   - The tombstone snapshot link, the same card used in the Ghost column.
   - No success toast is shown for an empty result.

6. **Resurrection ceremony.** While a request is in flight, the Resurrected panel shows three shimmering placeholder lines above a short ceremony, built from CSS keyframes plus a small typewriter hook (`app/ceremony.tsx`):
   - 0–400ms: a glowing orange crack draws down a tombstone. 400–650ms: the two halves split apart.
   - 550–1350ms: a ghost rises out of the crack until it clears the stone, then floats gently in place.
   - Status text types out on a schedule: "Summoning the archive…" at 0ms, "Reading the bones…" at 650ms, "Stitching fragments…" at 1300ms. In Council Mode the last phrase is "Convening the council…". Screen readers get each whole phrase, not each typed character.
   - The result is held until 2000ms even if the response is faster. It then reveals in groups 200ms apart: title, headings, paragraphs, images. A fast response is fully shown at about 2.9s. A slower response keeps the ceremony's idle state until it arrives. Errors skip the ceremony and show at once.
   - Under reduced motion, the ceremony shows its final state without movement and does not delay the result.

### 6. Graveyard grid

**User story:** As a visitor, I want to browse famous dead sites like a cemetery and resurrect one with a click, and still be able to try any URL.

Acceptance criteria:

1. **Hero.** "The Afterlife" in the display serif (Cinzel) with the slow flicker, and the subtitle "A graveyard of the dead web. Resurrect what's lost." A "Bury a new site" button opens the custom-URL modal.
2. **Grid.** 20 hardcoded dead sites from `lib/sites.ts`, each with a name, domain, approximate death year and category. The grid has 3 columns at 1024px and wider, 2 from 768px, and 1 below that.
3. **Tombstone cards.** Each card has a dark stone texture (`.stone` plus the noise overlay), an arched top, a cross and "R · I · P", the site name, its domain, "† <year>", a category tag and a "Resurrect" button. Cards have a slight fixed tilt and a ground shadow, and straighten and lift with an orange glow on hover or keyboard focus.
4. **Card click.** The whole card is clickable through the button's stretched `::after`, with a single tab stop per card labeled "Resurrect <name>". The button must not use a transform, which would shrink the click area mid-press.
5. **Confirm modal.** Clicking a card opens a modal titled "Resurrect <domain>?" with a short note, a "Let it rest" button and a focused "Resurrect" button. Confirming runs the API flow, and the loading, error or result view replaces the confirm step inside the same modal, which widens for results.
6. **Bury a new site.** The modal contains the earlier custom-URL flow: the input with `https://` prefixing and the fading helper text, a submit button, and the results below the form.
7. **Modal behavior.** Modals use the native `<dialog>` with `showModal()`, so focus is trapped and the page behind is inert. Escape, the close button and a backdrop click all close it. Page scroll is locked while open. The progress bar sits under the modal header. Closing a modal, or opening another site, discards any in-flight response.
8. **Atmosphere.** The cobweb and bat from earlier stay, with a moonlight glow behind the hero and slowly drifting ground fog. Decorative layers are `aria-hidden` and ignore pointer events. Motion is disabled under reduced motion.

### 7. Resurrection log and share links

**User story:** As a returning visitor, I want a record of the sites I've resurrected, so I can revisit them and send one to someone.

Acceptance criteria:

1. **Recording.** Every successful resurrection, thin ones included, is saved to `localStorage` under `afterlife:log`, newest first, capped at 50. Failed requests are not saved. Each record holds `{ url, timestamp, deathYear, qualityScore, shareId }` plus the extracted `result`, so viewing and sharing work without calling Wayback again.
   - `deathYear` comes from the graveyard list and is `null` for custom URLs not in it.
   - `qualityScore` uses the same formula as the API (`lib/quality.ts`).
   - `shareId` is 12 random URL-safe characters.
   - Stored data is validated on read. Corrupt or unrecognized entries are dropped. If storage is full, the oldest records are dropped to make room.
2. **Nav.** A nav across the top of every page links "Graveyard" (`/`) and "Log" (`/log`) and marks the current page.
3. **`/log` timeline.** One entry per resurrection on a vertical timeline. Each entry shows the site name, the resurrection date and time, the death year when known, and a quality badge: Thin below 50, Partial from 50 to 499, Full at 500 or more.
4. **Open grave.** Opens the stored result in a modal.
5. **Copy grave link.** Copies `<origin>/r/{shareId}` and shows "Link copied ✓" for 2 seconds. If the clipboard is unavailable (non-secure origin), it shows the link in a selectable field instead.
6. **Empty the graveyard.** Asks "Empty the graveyard?" in a modal, with "Keep them" focused by default and the erased count in the text. Confirming removes every record. Confirming removes every record.
7. **`/r/[shareId]`.** A read-only view of one record: site name, death year, snapshot date, resurrection date, quality badge and the result. An unknown ID shows "This grave is empty" with an explanation.

### 8. Post-Mortem Report

**User story:** As a visitor, I want to know how a site died and what else the archive holds, so I can dig up a better year.

Acceptance criteria:

1. **Placement.** A collapsible parchment "Post-Mortem Report" (native `<details>`) sits below the two-column comparison wherever a result is shown. It is collapsed by default, and its header always shows the key findings: cause, quality and era.
2. **Death cause (inferred).** `/api/resurrect` returns `postMortem: { cause, evidence }`, computed by `inferDeathCause` in `lib/post-mortem.ts`. Rules, strongest first:
   - Archived HTTP 404 or 410 → "404".
   - Archived HTTP 5xx → "Server gone".
   - Parking or registrar text, e.g. "This domain is for sale" → "Domain expired".
   - A meta refresh, an archived 3xx, or a script redirect on a thin page → "Redirect stub".
   - Otherwise "Undetermined".
   The UI labels the cause "(inferred)" and shows the evidence sentence. When Wayback replays an archived 404 or 5xx, which it marks with a `Memento-Datetime` header, the route treats it as the site's own response instead of a fetch failure.
3. **Snapshot quality.** Full, Partial or Thin from the existing quality score, with the score shown.
4. **Era detected.** From the snapshot timestamp's year: 90s, 2000s, 2010s or 2020s.
5. **Available snapshots.** Opening the report calls `GET /api/snapshots?url=`. That route queries the Wayback CDX API server-side for one HTTP-200 capture per year, with a 15-second timeout, returning 504 on timeout and 502 on other failures. The list is cached for the session.
   - In the home page modals, each year resurrects that exact capture: `POST /api/resurrect` with `{ url, timestamp }`, which runs the ceremony again. The year being shown is marked and disabled.
   - In read-only views (the log modal and `/r/[shareId]`), each year opens the capture on the Wayback Machine instead.
   - A failed lookup shows a message with a "Dig again" button.
6. **Older log records** without `postMortem` show "The coroner wasn't present for this one. Resurrect the site again to file a report.". A malformed `postMortem` in storage causes the record to be dropped.

### 9. Council Mode

**User story:** As a visitor, I want to watch several analysts compare a site's snapshots and agree on the best one, so the choice of snapshot is visible and justified.

Acceptance criteria:

1. **Toggle.** A "Council Mode" switch (`role="switch"`) appears in the confirm modal and the "Bury a new site" modal. It is off by default, is remembered across modals during the visit, and is disabled while a request runs. Picking a year in the post-mortem timeline always resurrects exactly that year, with no council.
2. **Endpoint.** `POST /api/council { url }` lists the site's snapshot years from the CDX API (15-second timeout), takes up to three of them (the earliest, a middle one and the latest), and fetches and extracts all three in parallel. It returns `{ result, council: { lines, verdict, votes } }`, where `result` is the winning snapshot's normal resurrection result plus `council: { year, agreed, total }`.
3. **Voting.** Four analysts each vote for one real snapshot by one rule, judging only non-thin pages (or all of them if every capture is thin). Ties between years are broken by readable-content score, then by the earlier year:
   - Archaeologist: the largest HTML capture (most intact).
   - Designer: the oldest page (most period character).
   - Engineer: the most readable text to rebuild.
   - Tester: the most fragments to verify (headings, paragraphs and images).
4. **Debate.** Each analyst's line states facts computed from the snapshots: the years, the count of `<table>` and `<font>` tags, characters of text, fragments and each stub's inferred death cause. An analyst whose vote lost says so before the verdict. The last line is "Council agrees: <year>." when all four agree, or "Council settles on <year>, N of 4." otherwise. The lines live in `lib/council.ts` and are not scripted per site.
5. **Playback.** After the ceremony, the debate plays one line at a time (400ms to the first, then 1.5s apart), and the speaker's avatar pulses. The result follows 1.2s after the last line. "Skip to the verdict" jumps to the result at any time. Under reduced motion, every line shows at once with no pulse, and the result waits for a "Reveal the resurrection" click.
6. **Verdict badge.** The result shows "Council verdict: N/4 agents agreed on <year>.", where N is the real vote count. The verdict is saved in the log, so the badge also appears in the log modal and on share pages.
7. **Fallback.** If the archive can't list snapshots in time, the route resurrects the latest snapshot as usual and returns `council: null`. The UI then shows "The archive wouldn't list its snapshots in time, so the council sat this one out. Showing the most recent remains." and no debate or badge. If some of the three snapshots can't be retrieved, the Archaeologist names them and the council judges the rest.

### 10. Voice and copy

**User story:** As a visitor, I want every message to be spooky but clear, so the app has a personality and I always know what to do next.

Acceptance criteria:

1. All user-facing strings live in `app/copy.ts`, so the voice is edited in one place. Strings that depend on data (counts, causes, years) are built there by small functions.
2. Every error names what happened and what to do next: a headline, then a hint such as "Check the spelling, or try another grave." or "Try again in a moment."
3. **Empty URL.** Submitting the "Bury a new site" form with an empty or whitespace-only field shows "The grave needs a name. Enter a URL.", focuses the input, marks it `aria-invalid`, and sends no request. The message clears when the user types. The submit button is disabled only while a request runs.
4. **Success toast.** When a live resurrection lands, a notice at the top of the result reads "Resurrection complete. N fragments stitched. The dead walk again.", where N is the real count of headings, paragraphs and images (singular "1 fragment"). It disappears after 6 seconds and is announced to screen readers.
   - A thin result reads "Resurrection complete, but only scraps survived. N fragments stitched." A result with only a title reads "Resurrection complete, but only a name survived."
   - An empty result shows no toast, because the panel explains it.
   - The toast is inline in the modal, not floating, because the modal's `<dialog>` is in the browser's top layer.
5. **Log empty state.** "Your graveyard is empty. Resurrect something." with a "Go to the graveyard" link.
6. Buttons keep clear verbs: "Resurrect", "Let it rest", "Dig again", "Open grave", "Copy grave link", "Empty the graveyard", "Keep them", "Skip to the verdict", "Reveal the resurrection". "Bury a new site" is unchanged.
7. API error messages and the API's `hint` field are not shown to users and keep their plain wording.

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
- Death years in `lib/sites.ts` are approximate, and some domains (e.g. `askjeeves.com`, `aim.com`) now redirect elsewhere, so their snapshots may show a successor site.
- Share links only work in the browser that created them, because the log is in that browser's `localStorage` and there is no database. Anyone else who opens one sees "This grave is empty". Clearing the log also breaks them.
- Death cause is a heuristic over a single capture. It can't see DNS or registrar history, so "Domain expired" is only detected from parking-page text, and many dead sites come back "Undetermined" because their last capture still looks alive.
- Council Mode needs the CDX list plus three snapshot fetches, so it often takes 15 seconds or more, and it falls back to a plain resurrection whenever the CDX list times out. In testing, that was two of three live attempts.
- The council's "agents" are four deterministic rules voiced as characters, not separate AI models. The UI says each analyst "scores the real snapshots by its own rule".
- The CDX lookup can take 10+ seconds when Wayback is busy, and it lists only HTTP-200 captures, so years where every capture was an error or redirect don't appear.
- Wayback snapshot fetches can take over 30 seconds. The route's 10-second timeout then returns 504 for every site until the archive speeds up.
