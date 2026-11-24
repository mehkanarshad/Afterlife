const WAYBACK_API = "https://archive.org/wayback/available";

interface WaybackAvailableResponse {
  archived_snapshots?: {
    closest?: {
      available: boolean;
      url: string;
      timestamp: string;
      status: string;
    };
  };
}

export async function getSnapshot(
  url: string
): Promise<{ snapshotUrl: string; timestamp: string } | null> {
  try {
    // The availability API times out for some https:// URLs (e.g. geocities.com)
    // but resolves the same bare host, so look up without the protocol.
    const bare = url.trim().replace(/^https?:\/\//i, "");
    const endpoint = `${WAYBACK_API}?url=${encodeURIComponent(bare)}`;
    const res = await fetch(endpoint);

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as WaybackAvailableResponse;
    const closest = data?.archived_snapshots?.closest;

    if (!closest || !closest.available) {
      return null;
    }

    const snapshotUrl = closest.url.replace(/^http:\/\//, "https://");

    return { snapshotUrl, timestamp: closest.timestamp };
  } catch {
    return null;
  }
}
