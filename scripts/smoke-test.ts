// Smoke test for POST /api/resurrect using the UI's example URLs.
// Requires the dev server to be running. Override the target with SMOKE_BASE_URL.
//
// A URL passes when the API returns 200 with an `extracted` object and a
// `status` of "ok" or "thin_snapshot". Anything else is a fail.

const BASE_URL = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";
const EXAMPLES = ["geocities.com", "altavista.com", "myspace.com/tom"];
const REQUEST_TIMEOUT_MS = 30_000;

interface Outcome {
  url: string;
  pass: boolean;
  detail: string;
}

function hasExtracted(data: unknown): data is { extracted: object; status: unknown } {
  return (
    typeof data === "object" &&
    data !== null &&
    "extracted" in data &&
    typeof (data as { extracted: unknown }).extracted === "object" &&
    "status" in data
  );
}

async function check(url: string): Promise<Outcome> {
  const started = Date.now();
  try {
    const res = await fetch(`${BASE_URL}/api/resurrect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const seconds = ((Date.now() - started) / 1000).toFixed(1);
    const data: unknown = await res.json().catch(() => null);

    if (res.status !== 200) {
      const error =
        typeof data === "object" && data !== null && "error" in data
          ? String((data as { error: unknown }).error)
          : "no error message";
      return { url, pass: false, detail: `HTTP ${res.status} (${error}) in ${seconds}s` };
    }

    if (!hasExtracted(data) || (data.status !== "ok" && data.status !== "thin_snapshot")) {
      return { url, pass: false, detail: `HTTP 200 but unexpected response shape in ${seconds}s` };
    }

    return { url, pass: true, detail: `HTTP 200, status=${String(data.status)} in ${seconds}s` };
  } catch (err) {
    const reason =
      err instanceof Error && err.name === "TimeoutError"
        ? `no response within ${REQUEST_TIMEOUT_MS / 1000}s`
        : `could not reach ${BASE_URL} (is the dev server running?)`;
    return { url, pass: false, detail: reason };
  }
}

async function main(): Promise<void> {
  console.log(`Smoke test: POST ${BASE_URL}/api/resurrect`);
  const outcomes = await Promise.all(EXAMPLES.map(check));

  for (const { url, pass, detail } of outcomes) {
    console.log(`${pass ? "PASS" : "FAIL"}  ${url.padEnd(16)}  ${detail}`);
  }

  const passed = outcomes.filter((o) => o.pass).length;
  console.log(`${passed}/${outcomes.length} passed`);
  process.exitCode = passed === outcomes.length ? 0 : 1;
}

main();
