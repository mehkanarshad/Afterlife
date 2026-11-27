This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Afterlife Public API

**Free for researchers, archivists, and anyone building on the dead web.**

No key, no signup. Every response is JSON, and CORS is open (`Access-Control-Allow-Origin: *`), so you can call it straight from a browser.

### What "public" means

A resurrection becomes public when its share page (`/r/{id}`) is opened. Your private resurrection log stays in your own browser and is never sent to the server's list, and neither is anything you resurrect without sharing.

The list lives in the server's memory. It holds the 200 most recent public resurrections and **resets when the server restarts**. Treat it as a window onto what this server has seen lately, not as a complete archive. Everything in it came from the Internet Archive's Wayback Machine, which is the permanent record. Use the snapshot URL in each item to cite it.

### `GET /api/public/resurrections`

Lists public resurrections, newest first.

| Parameter | Default | Meaning |
|---|---|---|
| `limit` | `50` | How many items to return, from 1 to 100. |
| `offset` | `0` | How many items to skip, for paging. |
| `site` | none | Only this site, e.g. `geocities.com`. The protocol, `www.` and a trailing slash are ignored. |
| `include` | none | `extracted` adds each page's extracted content (title, headings, paragraphs, image URLs). Without it, items are summaries. |

A bad parameter returns HTTP 400 with `{ "error": "..." }`. Responses are cached for 30 seconds.

```json
{
  "schema": "afterlife.public-resurrections/1",
  "total": 2,
  "limit": 50,
  "offset": 0,
  "retention": "memory",
  "items": [
    {
      "id": "eyJ1IjoiZXhhbXBsZS5jb20iLCJ0IjoiMjAyNjExMjIwMzA5NDAiLCJyIjoiMjAyNi0xMS0yOFQxMDowMDowMC4wMDBaIiwiZCI6bnVsbH0",
      "page": "https://afterlife.example/r/eyJ1IjoiZXhhbXBsZS5jb20iLCJ0IjoiMjAyNjExMjIwMzA5NDAiLCJyIjoiMjAyNi0xMS0yOFQxMDowMDowMC4wMDBaIiwiZCI6bnVsbH0",
      "raw": "https://afterlife.example/r/eyJ1IjoiZXhhbXBsZS5jb20iLCJ0IjoiMjAyNjExMjIwMzA5NDAiLCJyIjoiMjAyNi0xMS0yOFQxMDowMDowMC4wMDBaIiwiZCI6bnVsbH0/raw",
      "site": {
        "url": "example.com",
        "name": "example.com",
        "diedYear": null
      },
      "firstSeenAt": "2026-11-27T21:32:05.225Z",
      "snapshot": {
        "source": "Internet Archive Wayback Machine",
        "timestamp": "20261122030940",
        "capturedAt": "2026-11-22T03:09:40.000Z",
        "url": "https://web.archive.org/web/20261122030940/https://example.com/"
      },
      "quality": {
        "score": 170,
        "badge": "Partial",
        "fragments": 1
      },
      "postMortem": {
        "cause": "Undetermined",
        "evidence": "The snapshot looks like a working page. The archive doesn't show how the site died."
      }
    }
  ]
}
```

| Field | Meaning |
|---|---|
| `total` | Matches before `limit` and `offset`, so you can page through them. |
| `retention` | Always `"memory"`: the list resets on restart. |
| `id`, `page`, `raw` | The share id, its page, and its [raw record](#raw-record). |
| `site.diedYear` | Approximate death year for the 20 sites in Afterlife's graveyard, otherwise `null`. |
| `firstSeenAt` | When this server first saw the capture. |
| `snapshot` | The Wayback Machine capture: its 14-digit timestamp, the same time as ISO 8601, and a replay URL. |
| `quality` | A readable-content `score`, a `badge` (`Thin` under 50, `Partial` under 500, otherwise `Full`) and the `fragments` count (headings, paragraphs and images). |
| `postMortem` | An inferred cause of death (`Redirect stub`, `Domain expired`, `404`, `Server gone` or `Undetermined`) and the evidence for it. A heuristic over one capture, not a fact. |

The API reports only what the server can vouch for. A share link's own date and death year can be edited by anyone, so they are ignored: `firstSeenAt` is the server's clock, and `diedYear` comes from the graveyard list.

```bash
# the five newest, as a quick look
curl -s 'https://afterlife.example/api/public/resurrections?limit=5' | jq '.items[] | {site: .site.url, badge: .quality.badge}'

# everything about one site, with content
curl -s 'https://afterlife.example/api/public/resurrections?site=geocities.com&include=extracted'
```

```js
// from any web page
const res = await fetch("https://afterlife.example/api/public/resurrections?limit=20");
const { total, items } = await res.json();
```

### Raw record

`GET /r/{id}/raw` returns the full record behind one share page: site, snapshot, quality, post-mortem and extracted content. It is the same data as `include=extracted`, for a single resurrection, and it is also open to any origin. Its `schema` is `afterlife.resurrection/1`.

### Good manners

- There is no built-in rate limit, but an uncached page costs a request to the Wayback Machine. Please keep your traffic modest, and cache what you fetch.
- The content belongs to the original sites' authors. Credit the [Internet Archive](https://archive.org) and link the snapshot URL.
- `schema` names are versioned. New fields may appear in `/1`, but existing ones won't change meaning. A breaking change would ship as `/2`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
