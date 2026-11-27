/**
 * The site's public origin for absolute URLs (canonical, og:image, API links),
 * taken from the request's own headers so it works behind a proxy. Header
 * values end up in URLs, so only well-formed ones are accepted; anything else
 * falls back to localhost.
 */
export function originFromHeaders(get: (name: string) => string | null): string {
  const host = get("x-forwarded-host") ?? get("host") ?? "localhost:3000";
  const proto =
    (get("x-forwarded-proto") ?? "").split(",")[0].trim() || (host.startsWith("localhost") ? "http" : "https");
  if (!/^[a-z0-9.-]+(:\d{1,5})?$/i.test(host) || !/^https?$/.test(proto)) return "http://localhost:3000";
  return `${proto}://${host}`;
}
