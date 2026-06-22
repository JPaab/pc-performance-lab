import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { buildApiUrl } from "@/lib/api";

type DashboardCounts = {
  buildCount: number;
  snapshotCount: number;
  sessionCount: number;
  sensorSummaryCount: number;
};

type BuildSummary = {
  id: number;
  name: string;
  cpu: string;
  gpu: string;
  ramGb: number;
  createdAt: string;
};

type SnapshotSummary = {
  id: number;
  buildId: number;
  name: string;
  operatingSystemProfile: string | null;
  powerPlan: string | null;
  hagsEnabled: boolean | null;
  createdAt: string;
};

type SessionSummary = {
  id: number;
  snapshotId: number;
  gameName: string;
  scenario: string | null;
  sourceType: string;
  averageFps: number | null;
  onePercentLowFps: number | null;
  p99FrameTimeMs: number | null;
  stutterCount: number | null;
  createdAt: string;
};

type SensorSummaryInfo = {
  id: number;
  sessionId: number;
  sourceType: string;
  sampleCount: number;
  cpuPackageTempAvg: number | null;
  gpuTemperatureAvg: number | null;
  gpuPowerAvg: number | null;
  createdAt: string;
};

type DashboardSummary = {
  counts?: DashboardCounts;

  buildCount?: number;
  snapshotCount?: number;
  sessionCount?: number;
  sensorSummaryCount?: number;

  latestBuild: BuildSummary | null;
  latestSnapshot: SnapshotSummary | null;
  latestSession: SessionSummary | null;
  latestSensorSummary: SensorSummaryInfo | null;
  bestAverageFpsSession: SessionSummary | null;
};

type Tone = "good" | "warning" | "bad" | "info";

type FeelStatus = {
  label: string;
  detail: string;
  tone: Tone;
};

async function getDashboardSummary(): Promise<DashboardSummary | null> {
  try {
    const response = await fetch(buildApiUrl("/api/dashboard/summary"), {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
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

function getDashboardCounts(summary: DashboardSummary): DashboardCounts {
  return {
    buildCount: summary.counts?.buildCount ?? summary.buildCount ?? 0,
    snapshotCount: summary.counts?.snapshotCount ?? summary.snapshotCount ?? 0,
    sessionCount: summary.counts?.sessionCount ?? summary.sessionCount ?? 0,
    sensorSummaryCount:
      summary.counts?.sensorSummaryCount ?? summary.sensorSummaryCount ?? 0,
  };
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

export default async function HomePage() {
  const summary = await getDashboardSummary();

  return (
    <>
      <AppHeader />

      <main className="min-h-screen px-6 py-10 text-zinc-100">
        <div className="mx-auto max-w-7xl">
          {!summary ? (
            <BackendUnavailable />
          ) : (
            <>
              <Hero summary={summary} />
              <Workflow
                summary={summary}
                counts={getDashboardCounts(summary)}
              />
              <RunHighlights summary={summary} />
            </>
          )}
        </div>
      </main>
    </>
  );
}

function Hero({ summary }: { summary: DashboardSummary }) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-violet-950/70 bg-[#0d0716]/80 shadow-2xl shadow-black/30">
      <div className="grid lg:grid-cols-[1.12fr_0.88fr]">
        <div className="min-w-0 p-8 md:p-10">
          <p className="text-sm font-medium uppercase tracking-[0.32em] text-violet-300">
            PC Performance Lab
          </p>

          <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-[-0.06em] text-zinc-50 md:text-7xl">
            Tune.
            <br />
            Measure.
            <br />
            Keep what wins.
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-400">
            Benchmark runs, tuning states and sensor logs in one clean flow.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <PrimaryLink href="/import">Import benchmark</PrimaryLink>
            <SecondaryLink href="/sessions">View runs</SecondaryLink>
          </div>
        </div>

        <BestOverallHero session={summary.bestAverageFpsSession} />
      </div>
    </section>
  );
}

function BestOverallHero({ session }: { session: SessionSummary | null }) {
  return (
    <div className="min-w-0 border-t border-violet-950/70 bg-black/25 p-8 md:p-10 lg:border-l lg:border-t-0">
      <div className="flex items-start justify-between gap-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-zinc-600">
            Best overall run
          </p>

          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-zinc-50">
            Current winner
          </h2>
        </div>

        {session && (
          <Link
            href={`/sessions/${session.id}`}
            className="shrink-0 rounded-full border border-violet-900/80 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-violet-300 hover:text-violet-200"
          >
            Open
          </Link>
        )}
      </div>

      {!session ? (
        <p className="mt-6 text-sm text-zinc-500">
          No benchmark run with FPS data yet.
        </p>
      ) : (
        <>
          <div className="mt-6">
            <p className="truncate text-2xl font-semibold text-zinc-50">
              {session.gameName}
            </p>

            <p className="mt-2 line-clamp-2 text-sm text-zinc-500">
              {session.scenario ?? "No scenario"} · Session #{session.id}
            </p>
          </div>

          <div className="mt-7">
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-600">
              average fps
            </p>

            <p className="mt-1 text-6xl font-black tracking-[-0.06em] text-violet-300">
              {formatNumber(session.averageFps)}
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <MiniInfo
              label="1% low"
              value={formatFps(session.onePercentLowFps)}
            />
            <MiniInfo
              label="P99"
              value={formatNumber(session.p99FrameTimeMs, " ms")}
            />
            <MiniInfo label="Stutters" value={session.stutterCount ?? "—"} />
          </div>
        </>
      )}
    </div>
  );
}

function Workflow({
  summary,
  counts,
}: {
  summary: DashboardSummary;
  counts: DashboardCounts;
}) {
  const hasBuild = Boolean(summary.latestBuild);
  const hasSnapshot = Boolean(summary.latestSnapshot);
  const hasSession = Boolean(summary.latestSession);
  const canCompare = counts.sessionCount >= 2;

  const snapshotHref = summary.latestSnapshot
    ? `/builds/${summary.latestSnapshot.buildId}/snapshots`
    : summary.latestBuild
      ? `/builds/${summary.latestBuild.id}/snapshots`
      : "/builds";

  return (
    <section className="mt-8 rounded-3xl border border-violet-950/70 bg-[#0d0716]/80 p-6 shadow-2xl shadow-black/25">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-violet-300">
            Workflow
          </p>

          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
            From hardware to decision
          </h2>
        </div>

        <p className="max-w-xl text-sm leading-6 text-zinc-500">
          Complete one step to unlock the next. No benchmark should exist
          without a hardware profile and a tuning state.
        </p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-4">
        <WorkflowStep
          href="/builds"
          number="01"
          title="Hardware"
          text={
            summary.latestBuild
              ? summary.latestBuild.name
              : "Create a fixed hardware profile"
          }
          status={hasBuild ? "Done" : "Start"}
          done={hasBuild}
          locked={false}
          footer={`${counts.buildCount} builds`}
        />

        <WorkflowStep
          href={snapshotHref}
          number="02"
          title="Tuning state"
          text={
            !hasBuild
              ? "Register hardware first"
              : summary.latestSnapshot
                ? summary.latestSnapshot.name
                : "Save BIOS, OS, driver and tweak state"
          }
          status={!hasBuild ? "Locked" : hasSnapshot ? "Done" : "Next"}
          done={hasSnapshot}
          locked={!hasBuild}
          footer={`${counts.snapshotCount} snapshots`}
        />

        <WorkflowStep
          href="/import"
          number="03"
          title="Capture"
          text={
            !hasSnapshot
              ? "Create a tuning state first"
              : summary.latestSession
                ? `${summary.latestSession.gameName} · ${formatFps(
                    summary.latestSession.averageFps,
                  )}`
                : "Import CapFrameX and attach HWiNFO"
          }
          status={!hasSnapshot ? "Locked" : hasSession ? "Done" : "Next"}
          done={hasSession}
          locked={!hasSnapshot}
          footer={`${counts.sessionCount} runs`}
        />

        <WorkflowStep
          href="/compare"
          number="04"
          title="Decision"
          text={
            !hasSession
              ? "Import runs first"
              : canCompare
                ? "Compare baseline vs candidate"
                : "Needs at least two runs"
          }
          status={!hasSession ? "Locked" : canCompare ? "Ready" : "Waiting"}
          done={canCompare}
          locked={!hasSession}
          footer="Keep what wins"
        />
      </div>
    </section>
  );
}

function WorkflowStep({
  href,
  number,
  title,
  text,
  status,
  done,
  locked,
  footer,
}: {
  href: string;
  number: string;
  title: string;
  text: string;
  status: string;
  done: boolean;
  locked: boolean;
  footer: string;
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <p
          className={`font-mono text-sm ${
            locked ? "text-zinc-700" : "text-violet-300"
          }`}
        >
          {number}
        </p>

        <span
          className={`rounded-full border px-3 py-1 text-xs font-medium ${
            locked
              ? "border-zinc-800 bg-black/20 text-zinc-700"
              : done
                ? "border-green-500/30 bg-green-500/10 text-green-300"
                : "border-violet-950/80 bg-black/30 text-zinc-500"
          }`}
        >
          {status}
        </span>
      </div>

      <p
        className={`mt-5 text-xl font-semibold tracking-[-0.03em] ${
          locked ? "text-zinc-700" : "text-zinc-100"
        }`}
      >
        {title}
      </p>

      <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-500">
        {text}
      </p>

      <p
        className={`mt-5 text-xs uppercase tracking-[0.2em] ${
          locked ? "text-zinc-800" : "text-zinc-700 group-hover:text-violet-300"
        }`}
      >
        {footer}
      </p>
    </>
  );

  if (locked) {
    return (
      <article className="min-w-0 cursor-not-allowed rounded-2xl border border-violet-950/40 bg-black/15 p-4 opacity-70">
        {content}
      </article>
    );
  }

  return (
    <Link
      href={href}
      className="group min-w-0 rounded-2xl border border-violet-950/70 bg-black/25 p-4 transition hover:border-violet-400/70"
    >
      {content}
    </Link>
  );
}

function RunHighlights({ summary }: { summary: DashboardSummary }) {
  return (
    <section className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <LatestRunFeel session={summary.latestSession} />
      <LatestInfo summary={summary} />
    </section>
  );
}

function LatestRunFeel({ session }: { session: SessionSummary | null }) {
  const latestFeel = session ? getRunFeel(session) : null;

  return (
    <section className="rounded-3xl border border-violet-950/70 bg-[#0d0716]/80 p-6 shadow-2xl shadow-black/25">
      <div className="flex items-start justify-between gap-5">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-violet-300">
            Latest run feel
          </p>

          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
            Latest capture
          </h2>
        </div>

        {session && (
          <Link
            href={`/sessions/${session.id}`}
            className="shrink-0 rounded-full border border-violet-900/80 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-violet-300 hover:text-violet-200"
          >
            Open
          </Link>
        )}
      </div>

      {session && latestFeel ? (
        <>
          <div className="mt-6">
            <p className="truncate text-2xl font-semibold text-zinc-50">
              {session.gameName}
            </p>

            <p className="mt-2 line-clamp-2 text-sm text-zinc-500">
              {session.scenario ?? "No scenario"} · Session #{session.id}
            </p>
          </div>

          <div className="mt-6 grid gap-3">
            <HeroFeelRow
              label="Frame pacing"
              value={latestFeel.pacing.label}
              detail={latestFeel.pacing.detail}
              tone={latestFeel.pacing.tone}
            />

            <HeroFeelRow
              label="Low FPS stability"
              value={latestFeel.lows.label}
              detail={latestFeel.lows.detail}
              tone={latestFeel.lows.tone}
            />

            <HeroFeelRow
              label="Hitch risk"
              value={latestFeel.hitch.label}
              detail={latestFeel.hitch.detail}
              tone={latestFeel.hitch.tone}
            />
          </div>
        </>
      ) : (
        <p className="mt-6 text-sm text-zinc-500">
          Import your first CapFrameX JSON to start tracking run feel.
        </p>
      )}
    </section>
  );
}

function LatestInfo({ summary }: { summary: DashboardSummary }) {
  return (
    <section className="rounded-3xl border border-violet-950/70 bg-[#0d0716]/80 p-6 shadow-2xl shadow-black/25">
      <p className="text-sm font-medium uppercase tracking-[0.25em] text-violet-300">
        Latest info
      </p>

      <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
        Last tracked state
      </h2>

      <div className="mt-6 grid gap-3">
        <LatestInfoRow
          label="Build"
          title={summary.latestBuild?.name ?? "No build"}
          detail={
            summary.latestBuild
              ? `${summary.latestBuild.cpu} · ${summary.latestBuild.gpu}`
              : "Create hardware profile first"
          }
          href="/builds"
        />

        <LatestInfoRow
          label="Snapshot"
          title={summary.latestSnapshot?.name ?? "No snapshot"}
          detail={
            summary.latestSnapshot
              ? `${summary.latestSnapshot.operatingSystemProfile ?? "Unknown OS"} · ${
                  summary.latestSnapshot.powerPlan ?? "No power plan"
                }`
              : "Create tuning state first"
          }
          href={
            summary.latestSnapshot
              ? `/builds/${summary.latestSnapshot.buildId}/snapshots`
              : "/builds"
          }
        />

        <LatestInfoRow
          label="Run"
          title={
            summary.latestSession
              ? `${summary.latestSession.gameName} · Session #${summary.latestSession.id}`
              : "No run"
          }
          detail={
            summary.latestSession
              ? `${formatFps(summary.latestSession.averageFps)} avg · ${formatFps(
                  summary.latestSession.onePercentLowFps,
                )} 1% low`
              : "Import CapFrameX first"
          }
          href={
            summary.latestSession
              ? `/sessions/${summary.latestSession.id}`
              : "/import"
          }
        />

        <LatestInfoRow
          label="Sensors"
          title={
            summary.latestSensorSummary
              ? `HWiNFO summary #${summary.latestSensorSummary.id}`
              : "No HWiNFO"
          }
          detail={
            summary.latestSensorSummary
              ? `${summary.latestSensorSummary.sampleCount} samples · CPU ${formatNumber(
                  summary.latestSensorSummary.cpuPackageTempAvg,
                  " °C",
                )} · GPU ${formatNumber(
                  summary.latestSensorSummary.gpuTemperatureAvg,
                  " °C",
                )}`
              : "Attach sensor CSV after importing a run"
          }
          href="/import"
        />
      </div>
    </section>
  );
}

function LatestInfoRow({
  label,
  title,
  detail,
  href,
}: {
  label: string;
  title: string;
  detail: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="grid gap-3 rounded-2xl border border-violet-950/70 bg-black/25 p-4 transition hover:border-violet-400/70 md:grid-cols-[110px_1fr_auto] md:items-center"
    >
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-violet-300">
        {label}
      </p>

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-zinc-100">{title}</p>
        <p className="mt-1 line-clamp-1 text-sm text-zinc-500">{detail}</p>
      </div>

      <span className="text-sm text-zinc-700">Open</span>
    </Link>
  );
}

function MiniInfo({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-0 rounded-2xl border border-violet-950/70 bg-black/25 p-4">
      <p className="text-xs text-zinc-600">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-zinc-100">
        {value}
      </p>
    </div>
  );
}

function getRunFeel(session: SessionSummary) {
  return {
    pacing: getFramePacingStatus(session.p99FrameTimeMs),
    lows: getLowStabilityStatus(session.averageFps, session.onePercentLowFps),
    hitch: getHitchStatus(session.stutterCount, session.p99FrameTimeMs),
  };
}

function getFramePacingStatus(p99FrameTimeMs: number | null): FeelStatus {
  if (p99FrameTimeMs === null) {
    return {
      label: "No data",
      detail: "Missing P99",
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
): FeelStatus {
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
      label: "Strong lows",
      detail: `${percent}% of average`,
      tone: "good",
    };
  }

  if (ratio >= 0.58) {
    return {
      label: "Decent lows",
      detail: `${percent}% of average`,
      tone: "warning",
    };
  }

  return {
    label: "Weak lows",
    detail: `${percent}% of average`,
    tone: "bad",
  };
}

function getHitchStatus(
  stutterCount: number | null,
  p99FrameTimeMs: number | null,
): FeelStatus {
  if ((stutterCount ?? 0) > 0) {
    return {
      label: "Hitch events",
      detail: `${stutterCount} detected`,
      tone: "warning",
    };
  }

  if (p99FrameTimeMs !== null && p99FrameTimeMs > 16.7) {
    return {
      label: "Spike risk",
      detail: "P99 exceeds 16.7 ms",
      tone: "warning",
    };
  }

  return {
    label: "Clean",
    detail: "No obvious hitch signal",
    tone: "good",
  };
}

function HeroFeelRow({
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
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-zinc-600">{label}</p>
        <p className={`text-sm font-semibold ${getToneClass(tone)}`}>{value}</p>
      </div>

      <p className="mt-1 text-sm text-zinc-500">{detail}</p>
    </div>
  );
}

function PrimaryLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="rounded-full bg-violet-300 px-5 py-3 text-sm font-semibold text-black transition hover:bg-violet-200"
    >
      {children}
    </Link>
  );
}

function SecondaryLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="rounded-full border border-violet-900/80 px-5 py-3 text-sm font-medium text-zinc-300 transition hover:border-violet-300 hover:text-violet-200"
    >
      {children}
    </Link>
  );
}

function BackendUnavailable() {
  return (
    <section className="rounded-3xl border border-red-500/30 bg-red-500/10 p-8">
      <h2 className="text-2xl font-semibold text-red-200">
        Backend unavailable
      </h2>
      <p className="mt-3 text-red-100/70">
        Start the Spring Boot backend and refresh this page.
      </p>
    </section>
  );
}
