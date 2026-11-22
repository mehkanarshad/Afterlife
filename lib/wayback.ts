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
    const endpoint = `${WAYBACK_API}?url=${encodeURIComponent(url)}`;
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
