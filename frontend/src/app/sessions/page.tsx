import Link from "next/link";
import { AppHeader } from "@/components/app-header";
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

    const sessions = (await response.json()) as PerformanceSession[];

    return sessions.sort((a, b) => b.id - a.id);
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

  const roundedSeconds = Math.round(seconds);
  const minutes = Math.floor(roundedSeconds / 60);
  const remainingSeconds = roundedSeconds % 60;

  return `${minutes}m ${remainingSeconds}s`;
}

export default async function SessionsPage() {
  const sessions = await getSessions();

  return (
    <>
      <AppHeader />

      <main className="min-h-screen px-6 py-10 text-zinc-100">
        <div className="mx-auto max-w-7xl">
          <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-violet-300">
                Sessions
              </p>

              <h1 className="mt-3 max-w-4xl text-5xl font-black tracking-[-0.06em] md:text-7xl">
                Benchmark runs
              </h1>

              <p className="mt-4 max-w-2xl text-zinc-400">
                Imported and manually registered game sessions. Scan FPS, lows,
                frametime and stability without opening every detail page.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <NavButton href="/import">Import run</NavButton>
              <NavButton href="/compare">Compare</NavButton>
            </div>
          </header>

          <section className="mt-8 grid overflow-hidden rounded-3xl border border-violet-950/70 bg-[#0d0716]/70 sm:grid-cols-3">
            <SummaryItem label="Total sessions" value={sessions.length} />
            <SummaryItem
              label="CapFrameX imports"
              value={
                sessions.filter(
                  (session) => session.sourceType === "CAPFRAMEX_JSON",
                ).length
              }
            />
            <SummaryItem
              label="Manual entries"
              value={
                sessions.filter((session) => session.sourceType === "MANUAL")
                  .length
              }
            />
          </section>

          {sessions.length === 0 ? (
            <EmptyState />
          ) : (
            <section className="mt-8 grid gap-5 lg:grid-cols-2">
              {sessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </section>
          )}
        </div>
      </main>
    </>
  );
}

function SessionCard({ session }: { session: PerformanceSession }) {
  return (
    <article className="group min-w-0 rounded-3xl border border-violet-950/70 bg-[#0d0716]/80 p-6 shadow-2xl shadow-black/25 transition hover:border-violet-700/80">
      <div className="flex min-w-0 items-start justify-between gap-5">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-600">
            Session #{session.id}
          </p>

          <h2 className="mt-2 truncate text-2xl font-semibold text-zinc-50">
            {session.gameName}
          </h2>

          <p className="mt-2 line-clamp-2 text-sm text-zinc-500">
            {session.scenario ?? "No scenario"}
          </p>
        </div>

        <span className="shrink-0 rounded-full border border-violet-900/80 bg-violet-950/30 px-3 py-1 text-xs font-medium text-violet-200">
          {session.sourceType}
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-600">
            average fps
          </p>

          <p className="mt-1 text-6xl font-black tracking-[-0.06em] text-violet-300">
            {formatNumber(session.averageFps)}
          </p>
        </div>

        <Link
          href={`/sessions/${session.id}`}
          className="inline-flex justify-center rounded-full border border-violet-900/80 px-4 py-2 text-sm font-medium text-zinc-300 transition group-hover:border-violet-300 group-hover:text-violet-200"
        >
          Details
        </Link>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="1% low"
          value={formatNumber(session.onePercentLowFps, " fps")}
        />
        <Metric
          label="0.1% low"
          value={formatNumber(session.zeroPointOnePercentLowFps, " fps")}
        />
        <Metric
          label="P99"
          value={formatNumber(session.p99FrameTimeMs, " ms")}
        />
        <Metric label="Stutters" value={session.stutterCount ?? "—"} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <SmallInfo label="Snapshot" value={`#${session.snapshotId}`} />
        <SmallInfo
          label="Duration"
          value={formatDuration(session.durationSeconds)}
        />
        <SmallInfo label="Dropped" value={session.droppedFrames ?? "—"} />
      </div>

      {session.tags.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {session.tags.slice(0, 6).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-violet-950/70 bg-black/25 px-3 py-1 text-xs text-zinc-400"
            >
              {tag}
            </span>
          ))}

          {session.tags.length > 6 && (
            <span className="rounded-full border border-violet-950/70 bg-black/25 px-3 py-1 text-xs text-zinc-600">
              +{session.tags.length - 6}
            </span>
          )}
        </div>
      )}

      {session.notes && (
        <details className="mt-5 rounded-2xl border border-violet-950/70 bg-black/20">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-zinc-400 transition hover:text-violet-200">
            Notes
          </summary>

          <p className="border-t border-violet-950/70 px-4 py-3 text-sm leading-6 text-zinc-500">
            {session.notes}
          </p>
        </details>
      )}
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-0 rounded-2xl border border-violet-950/70 bg-black/25 p-4">
      <p className="text-xs text-zinc-600">{label}</p>
      <p className="mt-1 truncate text-lg font-semibold text-zinc-100">
        {value}
      </p>
    </div>
  );
}

function SmallInfo({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="min-w-0 border-l border-violet-950/70 pl-3">
      <p className="text-xs text-zinc-600">{label}</p>
      <p className="mt-1 truncate text-sm font-medium text-zinc-300">{value}</p>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-b border-violet-950/70 p-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <p className="text-xs uppercase tracking-[0.22em] text-zinc-600">
        {label}
      </p>

      <p className="mt-2 text-4xl font-black tracking-[-0.05em] text-zinc-50">
        {value}
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <section className="mt-8 rounded-3xl border border-violet-950/70 bg-[#0d0716]/80 p-8">
      <h2 className="text-2xl font-semibold text-zinc-50">No sessions found</h2>

      <p className="mt-3 max-w-xl text-zinc-500">
        Import a CapFrameX JSON from the import page, or create a manual session
        from the backend while the UI is still evolving.
      </p>

      <div className="mt-6">
        <PrimaryLink href="/import">Import first run</PrimaryLink>
      </div>
    </section>
  );
}

function NavButton({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="rounded-full border border-violet-900/80 bg-violet-950/20 px-5 py-3 text-sm font-medium text-zinc-300 transition hover:border-violet-300 hover:text-violet-200"
    >
      {children}
    </Link>
  );
}

function PrimaryLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="inline-flex rounded-full bg-violet-300 px-5 py-3 text-sm font-semibold text-black transition hover:bg-violet-200"
    >
      {children}
    </Link>
  );
}
