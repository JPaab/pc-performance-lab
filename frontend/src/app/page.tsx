import Link from "next/link";
import type { ReactNode } from "react";
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

function formatDateLabel(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
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

              <StatsRail counts={getDashboardCounts(summary)} />

              <section className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                <RunCommandCenter summary={summary} />
                <NextActions summary={summary} />
              </section>

              <LabState summary={summary} />
            </>
          )}
        </div>
      </main>
    </>
  );
}

function Hero({ summary }: { summary: DashboardSummary }) {
  const latestSession = summary.latestSession;
  const latestFeel = latestSession ? getRunFeel(latestSession) : null;

  return (
    <section className="overflow-hidden rounded-[2rem] border border-violet-950/70 bg-[#0d0716]/80 shadow-2xl shadow-black/30">
      <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
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
            A command center for benchmark runs, hardware snapshots, CapFrameX
            captures and HWiNFO sensor diagnostics.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <PrimaryLink href="/import">Import benchmark</PrimaryLink>
            <SecondaryLink href="/compare">Compare sessions</SecondaryLink>
          </div>
        </div>

        <div className="min-w-0 border-t border-violet-950/70 bg-black/25 p-8 md:p-10 lg:border-l lg:border-t-0">
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-zinc-600">
            Latest run feel
          </p>

          {latestSession && latestFeel ? (
            <div className="mt-5">
              <div className="flex min-w-0 items-start justify-between gap-5">
                <div className="min-w-0">
                  <p className="truncate text-2xl font-semibold text-zinc-50">
                    {latestSession.gameName}
                  </p>

                  <p className="mt-2 line-clamp-2 text-sm text-zinc-500">
                    {latestSession.scenario ?? "No scenario"} · Session #
                    {latestSession.id}
                  </p>
                </div>

                <Link
                  href={`/sessions/${latestSession.id}`}
                  className="shrink-0 rounded-full border border-violet-900/80 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-violet-300 hover:text-violet-200"
                >
                  Open
                </Link>
              </div>

              <div className="mt-8 grid gap-3">
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
            </div>
          ) : (
            <p className="mt-5 text-sm text-zinc-500">
              Import your first CapFrameX JSON to start tracking run feel.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function StatsRail({ counts }: { counts: DashboardCounts }) {
  return (
    <section className="mt-6 grid overflow-hidden rounded-3xl border border-violet-950/70 bg-[#0d0716]/70 sm:grid-cols-2 lg:grid-cols-4">
      <StatItem label="Builds" value={counts.buildCount} />
      <StatItem label="Snapshots" value={counts.snapshotCount} />
      <StatItem label="Runs" value={counts.sessionCount} />
      <StatItem label="Sensor logs" value={counts.sensorSummaryCount} />
    </section>
  );
}

function RunCommandCenter({ summary }: { summary: DashboardSummary }) {
  return (
    <section className="rounded-3xl border border-violet-950/70 bg-[#0d0716]/80 p-6 shadow-2xl shadow-black/25">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-violet-300">
            Run command
          </p>

          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
            What deserves attention?
          </h2>
        </div>

        <p className="max-w-xl text-sm leading-6 text-zinc-500">
          Fastest average run, latest capture and sensor coverage in one place.
        </p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <RunSpotlight
          label="Latest capture"
          session={summary.latestSession}
          emptyText="No sessions imported yet."
        />

        <RunSpotlight
          label="Fastest average"
          session={summary.bestAverageFpsSession}
          emptyText="No FPS data available yet."
          highlighted
        />
      </div>
    </section>
  );
}

function RunSpotlight({
  label,
  session,
  emptyText,
  highlighted = false,
}: {
  label: string;
  session: SessionSummary | null;
  emptyText: string;
  highlighted?: boolean;
}) {
  return (
    <article
      className={`min-w-0 rounded-3xl border p-5 ${
        highlighted
          ? "border-violet-500/40 bg-violet-500/10"
          : "border-violet-950/70 bg-black/20"
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-600">
        {label}
      </p>

      {!session ? (
        <p className="mt-4 text-sm text-zinc-500">{emptyText}</p>
      ) : (
        <>
          <div className="mt-4 flex min-w-0 items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-xl font-semibold text-zinc-50">
                {session.gameName}
              </p>

              <p className="mt-1 line-clamp-2 text-sm text-zinc-500">
                {session.scenario ?? "No scenario"} · Session #{session.id}
              </p>
            </div>

            <Link
              href={`/sessions/${session.id}`}
              className="shrink-0 rounded-full border border-violet-900/80 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-violet-300 hover:text-violet-200"
            >
              Open
            </Link>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <MiniMetric label="Average" value={formatFps(session.averageFps)} />
            <MiniMetric
              label="1% low"
              value={formatFps(session.onePercentLowFps)}
            />
            <MiniMetric
              label="P99"
              value={formatNumber(session.p99FrameTimeMs, " ms")}
            />
          </div>
        </>
      )}
    </article>
  );
}

function NextActions({ summary }: { summary: DashboardSummary }) {
  const hasSessions = Boolean(summary.latestSession);
  const hasBuild = Boolean(summary.latestBuild);
  const hasSnapshot = Boolean(summary.latestSnapshot);

  return (
    <section className="rounded-3xl border border-violet-950/70 bg-[#0d0716]/80 p-6 shadow-2xl shadow-black/25">
      <p className="text-sm font-medium uppercase tracking-[0.25em] text-violet-300">
        Next move
      </p>

      <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
        Keep the test chain clean
      </h2>

      <div className="mt-6 grid gap-3">
        <ActionRow
          href="/builds"
          title={hasBuild ? "Review hardware build" : "Create hardware build"}
          text={
            hasBuild
              ? "Keep the physical setup documented."
              : "Start with CPU, GPU, RAM and base hardware."
          }
          status={hasBuild ? "Ready" : "Missing"}
          tone={hasBuild ? "good" : "warning"}
        />

        <ActionRow
          href="/builds"
          title={
            hasSnapshot ? "Review tweak snapshot" : "Create tweak snapshot"
          }
          text={
            hasSnapshot
              ? "BIOS, OS, driver and power-plan state is tracked."
              : "A benchmark without a snapshot is hard to trust."
          }
          status={hasSnapshot ? "Ready" : "Missing"}
          tone={hasSnapshot ? "good" : "warning"}
        />

        <ActionRow
          href="/import"
          title="Import new run"
          text="Feed CapFrameX JSON and attach HWiNFO CSV."
          status="Action"
          tone="info"
        />

        <ActionRow
          href={hasSessions ? "/compare" : "/sessions"}
          title={hasSessions ? "Compare tweaks" : "Open sessions"}
          text={
            hasSessions
              ? "Decide whether the candidate deserves to stay."
              : "Import runs first, then compare."
          }
          status={hasSessions ? "Ready" : "Waiting"}
          tone={hasSessions ? "good" : "info"}
        />
      </div>
    </section>
  );
}

function LabState({ summary }: { summary: DashboardSummary }) {
  return (
    <section className="mt-8 rounded-3xl border border-violet-950/70 bg-[#0d0716]/80 p-6 shadow-2xl shadow-black/25">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-violet-300">
            Lab state
          </p>

          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
            Latest tracked context
          </h2>
        </div>

        <p className="max-w-xl text-sm leading-6 text-zinc-500">
          The latest build, snapshot, run and sensor log. Enough context without
          turning the dashboard into a data dump.
        </p>
      </div>

      <div className="mt-6 divide-y divide-violet-950/70 overflow-hidden rounded-2xl border border-violet-950/70 bg-black/20">
        <StateRow
          label="Build"
          title={summary.latestBuild?.name ?? "No build registered"}
          description={
            summary.latestBuild
              ? `${summary.latestBuild.cpu} · ${summary.latestBuild.gpu} · ${summary.latestBuild.ramGb} GB RAM`
              : "Create a build before trusting benchmark history."
          }
          href="/builds"
        />

        <StateRow
          label="Snapshot"
          title={summary.latestSnapshot?.name ?? "No snapshot registered"}
          description={
            summary.latestSnapshot
              ? `${summary.latestSnapshot.operatingSystemProfile ?? "Unknown OS"} · ${
                  summary.latestSnapshot.powerPlan ?? "No power plan"
                } · HAGS ${
                  summary.latestSnapshot.hagsEnabled === null
                    ? "unknown"
                    : summary.latestSnapshot.hagsEnabled
                      ? "enabled"
                      : "disabled"
                }`
              : "Track BIOS, OS and driver state before comparing tweaks."
          }
          href="/builds"
        />

        <StateRow
          label="Run"
          title={
            summary.latestSession
              ? `${summary.latestSession.gameName} · Session #${summary.latestSession.id}`
              : "No benchmark run imported"
          }
          description={
            summary.latestSession
              ? `${formatFps(summary.latestSession.averageFps)} average · ${formatFps(
                  summary.latestSession.onePercentLowFps,
                )} 1% low · captured ${formatDateLabel(
                  summary.latestSession.createdAt,
                )}`
              : "Import a CapFrameX JSON to start measuring performance."
          }
          href={
            summary.latestSession
              ? `/sessions/${summary.latestSession.id}`
              : "/import"
          }
        />

        <StateRow
          label="Sensors"
          title={
            summary.latestSensorSummary
              ? `HWiNFO summary #${summary.latestSensorSummary.id}`
              : "No sensor summary imported"
          }
          description={
            summary.latestSensorSummary
              ? `${summary.latestSensorSummary.sampleCount} samples · CPU ${formatNumber(
                  summary.latestSensorSummary.cpuPackageTempAvg,
                  " °C",
                )} avg · GPU ${formatNumber(
                  summary.latestSensorSummary.gpuTemperatureAvg,
                  " °C",
                )} avg · ${formatNumber(
                  summary.latestSensorSummary.gpuPowerAvg,
                  " W",
                )} GPU power`
              : "Attach HWiNFO CSV to make diagnostics and comparisons useful."
          }
          href="/import"
        />
      </div>
    </section>
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

function ActionRow({
  href,
  title,
  text,
  status,
  tone,
}: {
  href: string;
  title: string;
  text: string;
  status: string;
  tone: Tone;
}) {
  return (
    <Link
      href={href}
      className="grid min-w-0 grid-cols-[1fr_auto] gap-4 rounded-2xl border border-violet-950/70 bg-black/25 p-4 transition hover:border-violet-400 hover:bg-violet-950/20"
    >
      <div className="min-w-0">
        <p className="truncate font-semibold text-zinc-100">{title}</p>
        <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{text}</p>
      </div>

      <span
        className={`self-start rounded-full px-3 py-1 text-xs font-medium ${getToneClass(tone)}`}
      >
        {status}
      </span>
    </Link>
  );
}

function StateRow({
  label,
  title,
  description,
  href,
}: {
  label: string;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="grid gap-3 px-5 py-4 transition hover:bg-violet-950/20 md:grid-cols-[160px_1fr_auto] md:items-center"
    >
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-violet-300">
        {label}
      </p>

      <div className="min-w-0">
        <p className="truncate font-medium text-zinc-100">{title}</p>
        <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{description}</p>
      </div>

      <span className="text-sm text-zinc-600">Open</span>
    </Link>
  );
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-b border-violet-950/70 p-5 last:border-b-0 sm:border-r sm:last:border-r-0 lg:border-b-0">
      <p className="text-xs uppercase tracking-[0.22em] text-zinc-600">
        {label}
      </p>

      <p className="mt-2 text-4xl font-black tracking-[-0.05em] text-zinc-50">
        {value}
      </p>
    </div>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-violet-950/70 bg-black/25 p-4">
      <p className="text-xs text-zinc-600">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-zinc-100">
        {value}
      </p>
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
