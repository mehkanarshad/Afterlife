const WAYBACK_API = "https://archive.org/wayback/available";

export interface WaybackSnapshot {
  url: string;
  timestamp: string;
  status: string;
}

/**
 * Fetches the closest available Wayback Machine snapshot for a given URL.
 */
export async function fetchSnapshot(url: string): Promise<WaybackSnapshot | null> {
  const endpoint = `${WAYBACK_API}?url=${encodeURIComponent(url)}`;
  const res = await fetch(endpoint);

  if (!res.ok) {
    throw new Error(`Wayback API responded with status ${res.status}`);
  }

  const data = await res.json();
  const closest = data?.archived_snapshots?.closest;

  if (!closest || closest.available !== true) {
    return null;
  }

  return {
    url: closest.url as string,
    timestamp: closest.timestamp as string,
    status: closest.status as string,
  };
}
