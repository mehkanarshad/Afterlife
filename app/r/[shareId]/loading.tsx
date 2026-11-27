import { LoadingView } from "../../results-view";

// Shown while the server digs the snapshot out of the archive.
export default function Loading() {
  return (
    <main className="relative min-h-screen bg-crypt px-6 pb-16 pt-28 font-mono text-neutral-200">
      <div className="relative mx-auto w-full max-w-6xl">
        <LoadingView />
      </div>
    </main>
  );
}
