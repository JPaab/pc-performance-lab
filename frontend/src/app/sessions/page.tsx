import Link from "next/link";
import { buildApiUrl } from "@/lib/api";

type PerformanceSession = {
  id: number;
  snapshotId: number;
  gameName: string;
  scenario: string | null;
  sourceType: string;
  durationSeconds: number | null;
  averageFps: number | null;
  onePercentLowFps: number | null;
  zeroPointOnePercentLowFps: number | null;
  p95FrameTimeMs: number | null;
  p99FrameTimeMs: number | null;
  p999FrameTimeMs: number | null;
  stutterCount: number | null;
  droppedFrames: number | null;
  tags: string[];
  notes: string | null;
  createdAt: string;
};

async function getSessions(): Promise<PerformanceSession[]> {
  try {
    const response = await fetch(buildApiUrl("/api/sessions"), {
      cache: "no-store",
    });

    if (!response.ok) {
      return [];
    }

    return response.json();
  } catch {
    return [];
  }
}

function formatNumber(value: number | null | undefined, suffix = "") {
  if (value === null || value === undefined) {
    return "—";
  }

  return `${value.toFixed(2)}${suffix}`;
}

function formatDuration(seconds: number | null | undefined) {
  if (!seconds) {
    return "—";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}m ${remainingSeconds}s`;
}

export default async function SessionsPage() {
  const sessions = await getSessions();

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-zinc-100">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-emerald-400">
              Sessions
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-6xl">
              Performance sessions
            </h1>
            <p className="mt-4 max-w-2xl text-zinc-400">
              Imported and manually registered benchmark sessions with FPS,
              frametime and stability metrics.
            </p>
          </div>

          <Link
            href="/"
            className="rounded-full border border-zinc-800 px-5 py-3 text-sm font-medium text-zinc-300 transition hover:border-emerald-400 hover:text-emerald-400"
          >
            Back to dashboard
          </Link>

          <Link
            href="/compare"
            className="rounded-full border border-zinc-800 px-5 py-3 text-sm font-medium text-zinc-300 transition hover:border-emerald-400 hover:text-emerald-400"
          >
            Compare sessions
          </Link>
        </div>

        {sessions.length === 0 ? (
          <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-8">
            <h2 className="text-xl font-semibold text-zinc-100">
              No sessions found
            </h2>
            <p className="mt-3 text-zinc-500">
              Start the backend, create a build and snapshot, then import a
              CapFrameX JSON or create a manual session.
            </p>
          </section>
        ) : (
          <div className="grid gap-5">
            {sessions.map((session) => (
              <article
                key={session.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-semibold text-zinc-50">
                        {session.gameName}
                      </h2>
                      <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                        {session.sourceType}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-zinc-500">
                      {session.scenario ?? "No scenario"} · Snapshot #
                      {session.snapshotId} ·{" "}
                      {formatDuration(session.durationSeconds)}
                    </p>
                  </div>

                  <div className="text-left md:text-right">
                    <p className="text-sm text-zinc-500">Average FPS</p>
                    <p className="text-4xl font-bold text-emerald-400">
                      {formatNumber(session.averageFps)}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-5">
                  <Metric
                    label="1% Low"
                    value={formatNumber(session.onePercentLowFps, " fps")}
                  />
                  <Metric
                    label="0.1% Low"
                    value={formatNumber(
                      session.zeroPointOnePercentLowFps,
                      " fps",
                    )}
                  />
                  <Metric
                    label="P99 Frametime"
                    value={formatNumber(session.p99FrameTimeMs, " ms")}
                  />
                  <Metric
                    label="Stutters"
                    value={session.stutterCount ?? "—"}
                  />
                  <Metric
                    label="Dropped"
                    value={session.droppedFrames ?? "—"}
                  />
                </div>

                {session.tags.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {session.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-zinc-900 px-3 py-1 text-xs text-zinc-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {session.notes && (
                  <p className="mt-5 border-t border-zinc-900 pt-4 text-sm text-zinc-500">
                    {session.notes}
                  </p>
                )}

                <div className="mt-5">
                  <Link
                    href={`/sessions/${session.id}`}
                    className="inline-flex rounded-full border border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-emerald-400 hover:text-emerald-400"
                  >
                    View session details
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-zinc-900 bg-black/40 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-zinc-100">{value}</p>
    </div>
  );
}
