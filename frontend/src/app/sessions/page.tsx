import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { DeleteButton } from "@/components/delete-button";
import { buildApiUrl } from "@/lib/api";

type PerformanceSession = {
  id: number;
  snapshotId: number;
  snapshotName: string;
  buildId: number;
  buildName: string;
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
  hasSensorSummary: boolean;
  tags: string[];
  notes: string | null;
  createdAt: string;
};

type Tone = "good" | "warning" | "bad" | "info";

type SessionFeel = {
  pacing: {
    label: string;
    detail: string;
    tone: Tone;
  };
  lows: {
    label: string;
    detail: string;
    tone: Tone;
  };
  drops: {
    label: string;
    detail: string;
    tone: Tone;
  };
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

function formatFps(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "—";
  }

  return `${Math.round(value)} fps`;
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

function getToneClass(tone: Tone) {
  if (tone === "good") {
    return "text-green-300";
  }

  if (tone === "warning") {
    return "text-amber-300";
  }

  if (tone === "bad") {
    return "text-rose-300";
  }

  return "text-violet-200";
}

function getToneBorderClass(tone: Tone) {
  if (tone === "good") {
    return "border-green-500/40 bg-green-500/10";
  }

  if (tone === "warning") {
    return "border-amber-500/40 bg-amber-500/10";
  }

  if (tone === "bad") {
    return "border-rose-500/40 bg-rose-500/10";
  }

  return "border-violet-500/40 bg-violet-500/10";
}

function getBestBy(
  sessions: PerformanceSession[],
  getValue: (session: PerformanceSession) => number | null,
) {
  return sessions.reduce<PerformanceSession | null>((best, session) => {
    const value = getValue(session);

    if (value === null) {
      return best;
    }

    if (!best) {
      return session;
    }

    const bestValue = getValue(best);

    if (bestValue === null || value > bestValue) {
      return session;
    }

    return best;
  }, null);
}

function getCleanRunCount(sessions: PerformanceSession[]) {
  return sessions.filter((session) => {
    const hasDrops = (session.droppedFrames ?? 0) > 0;
    const hasBadP99 =
      session.p99FrameTimeMs !== null && session.p99FrameTimeMs > 16.7;

    return !hasDrops && !hasBadP99;
  }).length;
}

export default async function SessionsPage() {
  const sessions = await getSessions();

  const bestAverage = getBestBy(sessions, (session) => session.averageFps);
  const bestLow = getBestBy(sessions, (session) => session.onePercentLowFps);
  const cleanRuns = getCleanRunCount(sessions);

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
                Scan your captures by feel: average FPS, lows, frame pacing and
                drop risk. Open the detail page only when a run deserves deeper
                analysis.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <NavButton href="/import">Import run</NavButton>
              <NavButton href="/compare">Compare</NavButton>
            </div>
          </header>

          <section className="mt-8 grid overflow-hidden rounded-3xl border border-violet-950/70 bg-[#0d0716]/70 sm:grid-cols-4">
            <SummaryItem label="Total runs" value={sessions.length} />

            <SummaryItem
              label="Best average"
              value={formatFps(bestAverage?.averageFps)}
            />

            <SummaryItem
              label="Best 1% low"
              value={formatFps(bestLow?.onePercentLowFps)}
            />

            <SummaryItem label="Clean runs" value={cleanRuns} />
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
  const feel = getSessionFeel(session);

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

          <p className="mt-2 truncate text-sm text-zinc-600">
            {session.snapshotName} · {session.buildName}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap justify-end gap-2">
          <span className="rounded-full border border-violet-900/80 bg-violet-950/30 px-3 py-1 text-xs font-medium text-violet-200">
            {session.sourceType}
          </span>

          <span
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              session.hasSensorSummary
                ? "border-green-500/30 bg-green-500/10 text-green-300"
                : "border-violet-950/80 bg-black/20 text-zinc-600"
            }`}
          >
            {session.hasSensorSummary ? "HWiNFO" : "No sensors"}
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-600">
            average fps
          </p>

          <p className="mt-1 text-6xl font-black tracking-[-0.06em] text-violet-300">
            {formatNumber(session.averageFps)}
          </p>

          <p className="mt-2 text-sm text-zinc-500">
            1% low:{" "}
            <span className="font-medium text-zinc-300">
              {formatFps(session.onePercentLowFps)}
            </span>{" "}
            · P99:{" "}
            <span className="font-medium text-zinc-300">
              {formatNumber(session.p99FrameTimeMs, " ms")}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2 md:justify-end">
          <Link
            href={`/sessions/${session.id}`}
            className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-full border border-violet-900/80 bg-violet-950/20 px-4 text-sm font-medium leading-5 text-zinc-300 transition hover:border-violet-300 hover:text-violet-200"
          >
            Open
          </Link>

          <DeleteButton
            endpoint={`/api/sessions/${session.id}`}
            confirmMessage={`Delete run #${session.id}?`}
            className="h-10 rounded-full border border-rose-900/70 bg-rose-950/20 px-4 text-rose-300 transition hover:border-rose-400 hover:bg-rose-950/30 hover:text-rose-200 disabled:opacity-50"
          />
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <FeelCard
          label="Frame pacing"
          value={feel.pacing.label}
          detail={feel.pacing.detail}
          tone={feel.pacing.tone}
        />

        <FeelCard
          label="Low FPS stability"
          value={feel.lows.label}
          detail={feel.lows.detail}
          tone={feel.lows.tone}
        />

        <FeelCard
          label="Drop risk"
          value={feel.drops.label}
          detail={feel.drops.detail}
          tone={feel.drops.tone}
        />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <SmallInfo
          label="Duration"
          value={formatDuration(session.durationSeconds)}
        />

        <SmallInfo
          label="0.1% low"
          value={formatFps(session.zeroPointOnePercentLowFps)}
        />

        <SmallInfo
          label="Captured"
          value={formatDateLabel(session.createdAt)}
        />
      </div>

      {session.tags.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {session.tags.slice(0, 5).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-violet-950/70 bg-black/25 px-3 py-1 text-xs text-zinc-400"
            >
              {tag}
            </span>
          ))}

          {session.tags.length > 5 && (
            <span className="rounded-full border border-violet-950/70 bg-black/25 px-3 py-1 text-xs text-zinc-600">
              +{session.tags.length - 5}
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

function getSessionFeel(session: PerformanceSession): SessionFeel {
  return {
    pacing: getFramePacingStatus(session.p99FrameTimeMs),
    lows: getLowStabilityStatus(session.averageFps, session.onePercentLowFps),
    drops: getDropStatus(session.droppedFrames, session.p999FrameTimeMs),
  };
}

function getFramePacingStatus(
  p99FrameTimeMs: number | null,
): SessionFeel["pacing"] {
  if (p99FrameTimeMs === null) {
    return {
      label: "No data",
      detail: "Missing P99 data",
      tone: "info",
    };
  }

  if (p99FrameTimeMs <= 6) {
    return {
      label: "Very smooth",
      detail: `${formatNumber(p99FrameTimeMs, " ms")} P99`,
      tone: "good",
    };
  }

  if (p99FrameTimeMs <= 10) {
    return {
      label: "Smooth",
      detail: `${formatNumber(p99FrameTimeMs, " ms")} P99`,
      tone: "good",
    };
  }

  if (p99FrameTimeMs <= 16.7) {
    return {
      label: "Watch spikes",
      detail: `${formatNumber(p99FrameTimeMs, " ms")} P99`,
      tone: "warning",
    };
  }

  return {
    label: "Rough",
    detail: `${formatNumber(p99FrameTimeMs, " ms")} P99`,
    tone: "bad",
  };
}

function getLowStabilityStatus(
  averageFps: number | null,
  onePercentLowFps: number | null,
): SessionFeel["lows"] {
  if (!averageFps || !onePercentLowFps) {
    return {
      label: "No data",
      detail: "Missing lows",
      tone: "info",
    };
  }

  const ratio = onePercentLowFps / averageFps;
  const percent = Math.round(ratio * 100);

  if (ratio >= 0.72) {
    return {
      label: "Strong",
      detail: `${percent}% of average`,
      tone: "good",
    };
  }

  if (ratio >= 0.58) {
    return {
      label: "Decent",
      detail: `${percent}% of average`,
      tone: "warning",
    };
  }

  return {
    label: "Weak",
    detail: `${percent}% of average`,
    tone: "bad",
  };
}

function getDropStatus(
  droppedFrames: number | null,
  p999FrameTimeMs: number | null,
): SessionFeel["drops"] {
  if ((droppedFrames ?? 0) > 0) {
    return {
      label: "Drops",
      detail: `${droppedFrames} dropped`,
      tone: "bad",
    };
  }

  if (p999FrameTimeMs !== null && p999FrameTimeMs > 20) {
    return {
      label: "Spike risk",
      detail: `${formatNumber(p999FrameTimeMs, " ms")} P99.9`,
      tone: "warning",
    };
  }

  return {
    label: "Clean",
    detail: "No dropped frames",
    tone: "good",
  };
}

function formatDateLabel(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}

function FeelCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: Tone;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${getToneBorderClass(tone)}`}>
      <p className="text-xs text-zinc-600">{label}</p>

      <p className={`mt-1 text-lg font-semibold ${getToneClass(tone)}`}>
        {value}
      </p>

      <p className="mt-1 text-xs text-zinc-500">{detail}</p>
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

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
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
        Import a CapFrameX JSON from the import page, then attach HWiNFO sensor
        data from the session detail or import flow.
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
