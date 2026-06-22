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

function getDashboardCounts(summary: DashboardSummary): DashboardCounts {
  return {
    buildCount: summary.counts?.buildCount ?? summary.buildCount ?? 0,
    snapshotCount: summary.counts?.snapshotCount ?? summary.snapshotCount ?? 0,
    sessionCount: summary.counts?.sessionCount ?? summary.sessionCount ?? 0,
    sensorSummaryCount:
      summary.counts?.sensorSummaryCount ?? summary.sensorSummaryCount ?? 0,
  };
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

              <section className="mt-8 grid gap-6 lg:grid-cols-[1.12fr_0.88fr]">
                <BestOverallCard
                  session={summary.bestAverageFpsSession}
                  sensorSummary={summary.latestSensorSummary}
                />

                <WorkflowCard />
              </section>

              <LatestActivity summary={summary} />
            </>
          )}
        </div>
      </main>
    </>
  );
}

function Hero({ summary }: { summary: DashboardSummary }) {
  const latestSession = summary.latestSession;

  return (
    <section className="overflow-hidden rounded-[2rem] border border-violet-950/70 bg-[#0d0716]/80 shadow-2xl shadow-black/30">
      <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
        <div className="min-w-0 p-8 md:p-10">
          <p className="text-sm font-medium uppercase tracking-[0.32em] text-violet-300">
            PC Performance Lab
          </p>

          <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-[-0.06em] text-zinc-50 md:text-7xl">
            Measure tweaks.
            <br />
            Keep what wins.
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-400">
            A dark benchmark dashboard for PC builds, hardware snapshots,
            CapFrameX sessions and HWiNFO sensor logs.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <PrimaryLink href="/import">Import benchmark</PrimaryLink>
            <SecondaryLink href="/compare">Compare sessions</SecondaryLink>
          </div>
        </div>

        <div className="min-w-0 border-t border-violet-950/70 bg-black/25 p-8 md:p-10 lg:border-l lg:border-t-0">
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-zinc-600">
            Latest run
          </p>

          {latestSession ? (
            <div className="mt-5">
              <div className="flex min-w-0 items-start justify-between gap-5">
                <div className="min-w-0">
                  <p className="truncate text-2xl font-semibold text-zinc-50">
                    {latestSession.gameName}
                  </p>

                  <p className="mt-2 line-clamp-2 text-sm text-zinc-500">
                    {latestSession.scenario ?? "No scenario"}
                  </p>
                </div>

                <Link
                  href={`/sessions/${latestSession.id}`}
                  className="shrink-0 rounded-full border border-violet-900/80 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-violet-300 hover:text-violet-200"
                >
                  Open
                </Link>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <HeroMetric
                  label="AVG"
                  value={formatNumber(latestSession.averageFps)}
                />
                <HeroMetric
                  label="1% LOW"
                  value={formatNumber(latestSession.onePercentLowFps)}
                />
                <HeroMetric
                  label="P99"
                  value={formatNumber(latestSession.p99FrameTimeMs, " ms")}
                />
              </div>
            </div>
          ) : (
            <p className="mt-5 text-sm text-zinc-500">
              Import your first CapFrameX JSON to start tracking sessions.
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
      <StatItem label="Sessions" value={counts.sessionCount} />
      <StatItem label="Sensor logs" value={counts.sensorSummaryCount} />
    </section>
  );
}

function BestOverallCard({
  session,
  sensorSummary,
}: {
  session: SessionSummary | null;
  sensorSummary: SensorSummaryInfo | null;
}) {
  const hasMatchingSensorData =
    Boolean(session) && sensorSummary?.sessionId === session?.id;

  return (
    <section className="rounded-3xl border border-violet-950/70 bg-[#0d0716]/80 p-6 shadow-2xl shadow-black/25">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-violet-300">
            Best overall state
          </p>

          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
            Current winner
          </h2>
        </div>

        <p className="max-w-sm text-sm leading-6 text-zinc-500">
          Temporary ranking based on FPS, lows and frametime. Sensor scoring
          will become stricter after adding limiter detection.
        </p>
      </div>

      {!session ? (
        <p className="mt-6 text-sm text-zinc-500">No sessions available yet.</p>
      ) : (
        <>
          <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <p className="truncate text-2xl font-semibold text-zinc-50">
                {session.gameName}
              </p>

              <p className="mt-2 line-clamp-2 text-sm text-zinc-500">
                {session.scenario ?? "No scenario"} · Session #{session.id}
              </p>
            </div>

            <div className="shrink-0 md:text-right">
              <p className="text-xs uppercase tracking-[0.22em] text-zinc-600">
                avg fps
              </p>

              <p className="mt-1 text-6xl font-black tracking-[-0.06em] text-violet-300">
                {formatNumber(session.averageFps)}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MiniMetric
              label="1% low"
              value={formatNumber(session.onePercentLowFps, " fps")}
            />
            <MiniMetric
              label="P99"
              value={formatNumber(session.p99FrameTimeMs, " ms")}
            />
            <MiniMetric label="Stutters" value={session.stutterCount ?? "—"} />
            <MiniMetric
              label="Sensors"
              value={hasMatchingSensorData ? "Attached" : "Not matched"}
            />
          </div>
        </>
      )}
    </section>
  );
}

function WorkflowCard() {
  return (
    <section className="rounded-3xl border border-violet-950/70 bg-[#0d0716]/80 p-6 shadow-2xl shadow-black/25">
      <p className="text-sm font-medium uppercase tracking-[0.25em] text-violet-300">
        Workflow
      </p>

      <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
        Clean test chain
      </h2>

      <div className="mt-6 grid gap-3">
        <WorkflowStep
          href="/builds"
          number="01"
          title="Build"
          text="Fixed hardware profile."
        />

        <WorkflowStep
          href="/builds"
          number="02"
          title="Snapshot"
          text="BIOS, OS, driver and tweak state."
        />

        <WorkflowStep
          href="/import"
          number="03"
          title="Import"
          text="CapFrameX JSON and HWiNFO CSV."
        />

        <WorkflowStep
          href="/compare"
          number="04"
          title="Compare"
          text="FPS, lows, frametime and sensors."
        />
      </div>
    </section>
  );
}

function LatestActivity({ summary }: { summary: DashboardSummary }) {
  return (
    <section className="mt-8 rounded-3xl border border-violet-950/70 bg-[#0d0716]/80 p-6 shadow-2xl shadow-black/25">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-violet-300">
            Latest
          </p>

          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
            Activity details
          </h2>
        </div>

        <p className="max-w-xl text-sm leading-6 text-zinc-500">
          Collapsed by default so the dashboard stays clean. Open the detail you
          need.
        </p>
      </div>

      <div className="mt-6 divide-y divide-violet-950/70 overflow-hidden rounded-2xl border border-violet-950/70 bg-black/20">
        <LatestBuildDetails build={summary.latestBuild} />
        <LatestSnapshotDetails snapshot={summary.latestSnapshot} />
        <LatestSessionDetails session={summary.latestSession} />
        <LatestSensorDetails sensorSummary={summary.latestSensorSummary} />
      </div>
    </section>
  );
}

function LatestBuildDetails({ build }: { build: BuildSummary | null }) {
  return (
    <DetailsRow title="Latest build">
      {!build ? (
        <EmptyText>No build registered yet.</EmptyText>
      ) : (
        <DetailGrid>
          <DetailItem label="Name" value={build.name} />
          <DetailItem label="CPU" value={build.cpu} />
          <DetailItem label="GPU" value={build.gpu} />
          <DetailItem label="RAM" value={`${build.ramGb} GB`} />
        </DetailGrid>
      )}
    </DetailsRow>
  );
}

function LatestSnapshotDetails({
  snapshot,
}: {
  snapshot: SnapshotSummary | null;
}) {
  return (
    <DetailsRow title="Latest snapshot">
      {!snapshot ? (
        <EmptyText>No snapshot registered yet.</EmptyText>
      ) : (
        <DetailGrid>
          <DetailItem label="Name" value={snapshot.name} />
          <DetailItem label="OS" value={snapshot.operatingSystemProfile} />
          <DetailItem label="Power plan" value={snapshot.powerPlan} />
          <DetailItem
            label="HAGS"
            value={
              snapshot.hagsEnabled === null
                ? "—"
                : snapshot.hagsEnabled
                  ? "Enabled"
                  : "Disabled"
            }
          />
        </DetailGrid>
      )}
    </DetailsRow>
  );
}

function LatestSessionDetails({ session }: { session: SessionSummary | null }) {
  return (
    <DetailsRow title="Latest session">
      {!session ? (
        <EmptyText>No performance session imported yet.</EmptyText>
      ) : (
        <DetailGrid>
          <DetailItem label="Game" value={session.gameName} />
          <DetailItem label="Source" value={session.sourceType} />
          <DetailItem
            label="Average FPS"
            value={formatNumber(session.averageFps)}
          />
          <DetailItem
            label="P99"
            value={formatNumber(session.p99FrameTimeMs, " ms")}
          />
        </DetailGrid>
      )}
    </DetailsRow>
  );
}

function LatestSensorDetails({
  sensorSummary,
}: {
  sensorSummary: SensorSummaryInfo | null;
}) {
  return (
    <DetailsRow title="Latest sensor summary">
      {!sensorSummary ? (
        <EmptyText>No HWiNFO sensor summary imported yet.</EmptyText>
      ) : (
        <DetailGrid>
          <DetailItem label="Samples" value={sensorSummary.sampleCount} />
          <DetailItem
            label="CPU avg"
            value={formatNumber(sensorSummary.cpuPackageTempAvg, " °C")}
          />
          <DetailItem
            label="GPU avg"
            value={formatNumber(sensorSummary.gpuTemperatureAvg, " °C")}
          />
          <DetailItem
            label="GPU power"
            value={formatNumber(sensorSummary.gpuPowerAvg, " W")}
          />
        </DetailGrid>
      )}
    </DetailsRow>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-violet-950/70 bg-black/30 p-4">
      <p className="text-xs text-zinc-600">{label}</p>
      <p className="mt-1 truncate text-2xl font-bold text-zinc-100">{value}</p>
    </div>
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
      <p className="mt-1 truncate text-lg font-semibold text-zinc-100">
        {value}
      </p>
    </div>
  );
}

function WorkflowStep({
  href,
  number,
  title,
  text,
}: {
  href: string;
  number: string;
  title: string;
  text: string;
}) {
  return (
    <Link
      href={href}
      className="grid min-w-0 grid-cols-[48px_1fr] gap-4 rounded-2xl border border-violet-950/70 bg-black/25 p-4 transition hover:border-violet-400 hover:bg-violet-950/20"
    >
      <p className="font-mono text-sm text-violet-300">{number}</p>

      <div className="min-w-0">
        <p className="truncate font-semibold text-zinc-100">{title}</p>
        <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{text}</p>
      </div>
    </Link>
  );
}

function DetailsRow({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 transition hover:bg-violet-950/20">
        <p className="min-w-0 truncate font-medium text-zinc-100">{title}</p>

        <span className="shrink-0 text-zinc-600 group-open:hidden">+</span>
        <span className="hidden shrink-0 text-zinc-600 group-open:inline">
          −
        </span>
      </summary>

      <div className="px-5 pb-5">{children}</div>
    </details>
  );
}

function DetailGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-violet-950/70 bg-black/25 p-4">
      <p className="text-xs text-zinc-600">{label}</p>
      <p className="mt-1 truncate text-sm font-medium text-zinc-100">
        {value ?? "—"}
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

function EmptyText({ children }: { children: string }) {
  return <p className="text-sm text-zinc-500">{children}</p>;
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
