import Link from "next/link";
import type { ReactNode } from "react";
import { AppHeader } from "@/components/app-header";
import { buildApiUrl } from "@/lib/api";
import { DeleteButton } from "@/components/delete-button";

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

type SensorSummary = {
  id: number;
  sessionId: number;
  sourceType: string;
  sampleCount: number;

  cpuPackageTempAvg: number | null;
  cpuPackageTempMax: number | null;
  cpuCoreMaxTempMax: number | null;
  cpuPackagePowerAvg: number | null;
  cpuPackagePowerMax: number | null;
  totalCpuUsageAvg: number | null;
  physicalMemoryLoadAvg: number | null;
  physicalMemoryLoadMax: number | null;

  gpuTemperatureAvg: number | null;
  gpuTemperatureMax: number | null;
  gpuHotSpotTemperatureAvg: number | null;
  gpuHotSpotTemperatureMax: number | null;
  gpuPowerAvg: number | null;
  gpuPowerMax: number | null;
  gpuClockAvg: number | null;
  gpuClockMax: number | null;
  gpuMemoryClockAvg: number | null;
  gpuCoreLoadAvg: number | null;
  gpuCoreLoadMax: number | null;
  gpuMemoryUsageAvg: number | null;
  gpuMemoryUsageMax: number | null;

  gpuMemoryJunctionTemperatureAvg: number | null;
  gpuMemoryJunctionTemperatureMax: number | null;
  gpuEffectiveClockAvg: number | null;
  gpuEffectiveClockMax: number | null;

  cpuAverageEffectiveClockAvg: number | null;
  cpuAverageEffectiveClockMax: number | null;
  cpuPcoreClockAvg: number | null;
  cpuPcoreClockMax: number | null;
  cpuEcoreClockAvg: number | null;
  cpuEcoreClockMax: number | null;
  cpuRingClockAvg: number | null;
  cpuRingClockMax: number | null;

  cpuThermalThrottlingDetected: boolean;
  cpuPowerLimitDetected: boolean;
  cpuLimitReasonsDetected: boolean;

  gpuPerformanceLimitDetected: boolean;
  gpuPowerLimitDetected: boolean;
  gpuThermalLimitDetected: boolean;
  gpuReliabilityVoltageLimitDetected: boolean;
  gpuMaxOperatingVoltageLimitDetected: boolean;
  gpuUtilizationLimitDetected: boolean;

  createdAt: string;
};

type HealthTone = "good" | "warning" | "bad" | "info";

async function getSession(id: string): Promise<PerformanceSession | null> {
  try {
    const response = await fetch(buildApiUrl(`/api/sessions/${id}`), {
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

async function getSensorSummaries(id: string): Promise<SensorSummary[]> {
  try {
    const response = await fetch(
      buildApiUrl(`/api/sessions/${id}/sensor-summaries`),
      {
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return [];
    }

    const summaries = (await response.json()) as SensorSummary[];

    return summaries.sort((a, b) => b.id - a.id);
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

function formatSourceType(value: string) {
  if (value === "CAPFRAMEX_JSON") {
    return "CapFrameX";
  }

  if (value === "HWINFO_CSV") {
    return "HWiNFO";
  }

  if (value === "MANUAL") {
    return "Manual";
  }

  return value.replaceAll("_", " ");
}

function getDisplayNumberById(items: { id: number }[], id: number) {
  const index = items.findIndex((item) => item.id === id);

  return index === -1 ? null : index + 1;
}

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [session, sensorSummaries, sessions] = await Promise.all([
    getSession(id),
    getSensorSummaries(id),
    getSessions(),
  ]);

  if (!session) {
    return (
      <>
        <AppHeader />

        <main className="min-h-screen px-6 py-10 text-zinc-100">
          <div className="mx-auto max-w-7xl">
            <BackLink />

            <section className="mt-8 rounded-3xl border border-violet-950/70 bg-[#0d0716]/80 p-8">
              <h1 className="text-3xl font-semibold">Session not found</h1>

              <p className="mt-3 text-zinc-500">
                The backend did not return a performance session for this ID.
              </p>
            </section>
          </div>
        </main>
      </>
    );
  }

  const latestSensorSummary = sensorSummaries[0] ?? null;
  const sessionDisplayNumber = getDisplayNumberById(sessions, session.id);

  return (
    <>
      <AppHeader />

      <main className="min-h-screen px-6 py-10 text-zinc-100">
        <div className="mx-auto max-w-7xl">
          <BackLink />

          <SessionHero
            session={session}
            displayNumber={sessionDisplayNumber ?? session.id}
          />

          <PerformancePanel session={session} />

          <SessionNotes session={session} sensorSummary={latestSensorSummary} />

          <SensorSection sensorSummary={latestSensorSummary} />
        </div>
      </main>
    </>
  );
}

function BackLink() {
  return (
    <Link
      href="/sessions"
      className="text-sm font-medium text-violet-300 transition hover:text-violet-200"
    >
      ← Back to sessions
    </Link>
  );
}

function SessionHero({
  session,
  displayNumber,
}: {
  session: PerformanceSession;
  displayNumber: number;
}) {
  return (
    <section className="mt-8 overflow-hidden rounded-[2rem] border border-violet-950/70 bg-[#0d0716]/80 shadow-2xl shadow-black/30">
      <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
        <div className="min-w-0 p-8 md:p-10">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-violet-300">
            Run #{displayNumber}
          </p>

          <h1 className="mt-4 truncate text-5xl font-black tracking-[-0.06em] text-zinc-50 md:text-7xl">
            {session.gameName}
          </h1>

          <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-400">
            {session.scenario ?? "No scenario"} ·{" "}
            {formatSourceType(session.sourceType)} ·{" "}
            {formatDuration(session.durationSeconds)}
          </p>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">
            {session.snapshotName} · {session.buildName} ·{" "}
            {session.hasSensorSummary ? "HWiNFO" : "No sensors"}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <NavButton href={`/compare?s2=${session.id}`}>
              Compare this run
            </NavButton>

            <NavButton href="/import">
              {session.hasSensorSummary
                ? "Replace HWiNFO data"
                : "Import sensor data"}
            </NavButton>

            <DeleteButton
              endpoint={`/api/sessions/${session.id}`}
              confirmMessage={`Delete run #${displayNumber} (${session.gameName})?`}
              redirectTo="/sessions"
              className="rounded-full border border-rose-900/70 bg-rose-950/20 px-5 py-3 text-sm font-medium text-rose-300 transition hover:border-rose-400 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>

        <div className="border-t border-violet-950/70 bg-black/25 p-8 md:p-10 lg:border-l lg:border-t-0">
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-zinc-600">
            average fps
          </p>

          <p className="mt-2 text-7xl font-black tracking-[-0.07em] text-violet-300">
            {formatNumber(session.averageFps)}
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <HeroMetric
              label="1% low"
              value={formatFps(session.onePercentLowFps)}
            />

            <HeroMetric
              label="P99"
              value={formatNumber(session.p99FrameTimeMs, " ms")}
            />

            <HeroMetric
              label="Drops"
              value={
                session.droppedFrames === null || session.droppedFrames === 0
                  ? "Clean"
                  : session.droppedFrames
              }
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function PerformancePanel({ session }: { session: PerformanceSession }) {
  const feel = getPerformanceFeel(session);

  return (
    <section className="mt-8 rounded-3xl border border-violet-950/70 bg-[#0d0716]/80 p-6 shadow-2xl shadow-black/25">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-violet-300">
            Frame analysis
          </p>

          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
            FPS, lows and pacing
          </h2>
        </div>

        <p className="max-w-xl text-sm leading-6 text-zinc-500">
          CapFrameX metrics ordered for quick diagnosis: average FPS, lows, tail
          frame times and visible hitch indicators.
        </p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <InsightCard
          label="Frame pacing"
          value={feel.framePacing.label}
          detail={feel.framePacing.detail}
          tone={feel.framePacing.tone}
        />

        <InsightCard
          label="Low FPS stability"
          value={feel.lowStability.label}
          detail={feel.lowStability.detail}
          tone={feel.lowStability.tone}
        />

        <InsightCard
          label="Hitch risk"
          value={feel.hitchRisk.label}
          detail={feel.hitchRisk.detail}
          tone={feel.hitchRisk.tone}
        />
      </div>

      <div className="mt-6 rounded-3xl border border-violet-950/70 bg-black/20 p-5">
        <p className="text-sm font-semibold text-zinc-100">
          Technical frame data
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Average" value={formatFps(session.averageFps)} />

          <Metric label="1% low" value={formatFps(session.onePercentLowFps)} />

          <Metric
            label="0.1% low"
            value={formatFps(session.zeroPointOnePercentLowFps)}
          />

          <Metric
            label="P95 frame time"
            value={formatNumber(session.p95FrameTimeMs, " ms")}
          />

          <Metric
            label="P99 frame time"
            value={formatNumber(session.p99FrameTimeMs, " ms")}
          />

          <Metric
            label="P99.9 frame time"
            value={formatNumber(session.p999FrameTimeMs, " ms")}
          />

          <Metric
            label="Stutters"
            value={
              session.stutterCount === null || session.stutterCount === 0
                ? "Clean"
                : session.stutterCount
            }
          />

          <Metric
            label="Dropped frames"
            value={
              session.droppedFrames === null || session.droppedFrames === 0
                ? "Clean"
                : session.droppedFrames
            }
          />
        </div>
      </div>
    </section>
  );
}

function getPerformanceFeel(session: PerformanceSession) {
  return {
    framePacing: getFramePacingStatus(session.p99FrameTimeMs),

    lowStability: getLowStabilityStatus(
      session.averageFps,
      session.onePercentLowFps,
    ),

    hitchRisk: getHitchRiskStatus(
      session.p999FrameTimeMs,
      session.droppedFrames,
      session.stutterCount,
    ),
  };
}

function getFramePacingStatus(p99FrameTimeMs: number | null) {
  if (p99FrameTimeMs === null) {
    return {
      label: "No data",
      detail: "Import a CapFrameX run to evaluate frame pacing.",
      tone: "info" as const,
    };
  }

  if (p99FrameTimeMs <= 6) {
    return {
      label: "Very smooth",
      detail: `99% of frames stay under ${formatNumber(p99FrameTimeMs, " ms")}.`,
      tone: "good" as const,
    };
  }

  if (p99FrameTimeMs <= 10) {
    return {
      label: "Smooth",
      detail: `P99 is ${formatNumber(
        p99FrameTimeMs,
        " ms",
      )}, still solid for high refresh gaming.`,
      tone: "good" as const,
    };
  }

  if (p99FrameTimeMs <= 16.7) {
    return {
      label: "Watch spikes",
      detail: `P99 is ${formatNumber(
        p99FrameTimeMs,
        " ms",
      )}; the run may have visible pacing spikes.`,
      tone: "warning" as const,
    };
  }

  return {
    label: "Rough pacing",
    detail: `P99 is ${formatNumber(
      p99FrameTimeMs,
      " ms",
    )}; this run likely has noticeable spikes.`,
    tone: "bad" as const,
  };
}

function getLowStabilityStatus(
  averageFps: number | null,
  onePercentLowFps: number | null,
) {
  if (!averageFps || !onePercentLowFps) {
    return {
      label: "No data",
      detail: "Average FPS and 1% low are needed for stability scoring.",
      tone: "info" as const,
    };
  }

  const ratio = onePercentLowFps / averageFps;
  const percent = Math.round(ratio * 100);

  if (ratio >= 0.72) {
    return {
      label: "Strong lows",
      detail: `1% low holds around ${percent}% of average FPS.`,
      tone: "good" as const,
    };
  }

  if (ratio >= 0.58) {
    return {
      label: "Decent lows",
      detail: `1% low holds around ${percent}% of average FPS.`,
      tone: "warning" as const,
    };
  }

  return {
    label: "Weak lows",
    detail: `1% low only holds around ${percent}% of average FPS.`,
    tone: "bad" as const,
  };
}

function getHitchRiskStatus(
  p999FrameTimeMs: number | null,
  droppedFrames: number | null,
  hitchEvents: number | null,
) {
  if ((droppedFrames ?? 0) > 0) {
    return {
      label: "Drops detected",
      detail: `${droppedFrames} dropped frames were recorded during the run.`,
      tone: "bad" as const,
    };
  }

  if (p999FrameTimeMs === null && hitchEvents === null) {
    return {
      label: "No data",
      detail: "P99.9 and hitch events are needed for a cleaner spike read.",
      tone: "info" as const,
    };
  }

  if ((hitchEvents ?? 0) === 0 && (p999FrameTimeMs ?? 0) <= 12) {
    return {
      label: "Clean",
      detail: "No meaningful hitch pattern detected in this run.",
      tone: "good" as const,
    };
  }

  if ((p999FrameTimeMs ?? 0) <= 20) {
    return {
      label: "Minor spikes",
      detail: `Worst-frame region sits around ${formatNumber(
        p999FrameTimeMs,
        " ms",
      )}.`,
      tone: "warning" as const,
    };
  }

  return {
    label: "Spike risk",
    detail: `P99.9 reaches ${formatNumber(
      p999FrameTimeMs,
      " ms",
    )}; this may explain micro-hitches.`,
    tone: "bad" as const,
  };
}

function SessionNotes({
  session,
  sensorSummary,
}: {
  session: PerformanceSession;
  sensorSummary: SensorSummary | null;
}) {
  const tags = session.tags ?? [];

  return (
    <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
      <section className="rounded-3xl border border-violet-950/70 bg-[#0d0716]/80 p-6">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-violet-300">
          Notes
        </p>

        <p className="mt-4 text-sm leading-7 text-zinc-500">
          {session.notes ?? "No notes saved for this session."}
        </p>

        {tags.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-violet-950/70 bg-black/25 px-3 py-1 text-xs text-violet-200/80"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </section>

      <SensorHealthPanel sensorSummary={sensorSummary} />
    </section>
  );
}

function SensorSection({
  sensorSummary,
}: {
  sensorSummary: SensorSummary | null;
}) {
  return (
    <section className="mt-8 rounded-3xl border border-violet-950/70 bg-[#0d0716]/80 p-6 shadow-2xl shadow-black/25">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-violet-300">
            Sensors
          </p>

          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
            HWiNFO diagnostics
          </h2>
        </div>

        <p className="max-w-xl text-sm leading-6 text-zinc-500">
          Latest sensor summary only. Thermals, power, clocks and load behavior
          for this run.
        </p>
      </div>

      {!sensorSummary ? (
        <p className="mt-6 rounded-2xl border border-violet-950/70 bg-black/25 p-5 text-sm text-zinc-500">
          No HWiNFO sensor summary imported for this run yet.
        </p>
      ) : (
        <>
          <p className="mt-5 text-sm text-zinc-600">
            {formatSourceType(sensorSummary.sourceType)} ·{" "}
            {sensorSummary.sampleCount} samples
          </p>

          <div className="mt-6">
            <SensorSummaryCard summary={sensorSummary} />
          </div>
        </>
      )}
    </section>
  );
}

function SensorSummaryCard({ summary }: { summary: SensorSummary }) {
  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <HardwareDiagnosticsCard
        title="CPU"
        description="Thermals, package power and clocks that actually explain CPU-side behavior."
      >
        <MetricSection title="Thermals">
          <SensorMetric
            label="Package max"
            value={formatNumber(summary.cpuPackageTempMax, " °C")}
            importance="primary"
          />

          <SensorMetric
            label="Core max"
            value={formatNumber(summary.cpuCoreMaxTempMax, " °C")}
            importance="primary"
          />

          <SensorMetric
            label="Package avg"
            value={formatNumber(summary.cpuPackageTempAvg, " °C")}
          />
        </MetricSection>

        <MetricSection title="Power">
          <SensorMetric
            label="Package power avg"
            value={formatNumber(summary.cpuPackagePowerAvg, " W")}
            importance="primary"
          />

          <SensorMetric
            label="Package power max"
            value={formatNumber(summary.cpuPackagePowerMax, " W")}
          />
        </MetricSection>

        <MetricSection title="Clocks / load">
          <SensorMetric
            label="P-core clock avg"
            value={formatNumber(summary.cpuPcoreClockAvg, " MHz")}
            importance="primary"
          />

          <SensorMetric
            label="P-core clock max"
            value={formatNumber(summary.cpuPcoreClockMax, " MHz")}
          />

          <SensorMetric
            label="E-core clock avg"
            value={formatNumber(summary.cpuEcoreClockAvg, " MHz")}
          />

          <SensorMetric
            label="Ring clock avg"
            value={formatNumber(summary.cpuRingClockAvg, " MHz")}
          />

          <SensorMetric
            label="Effective avg"
            value={formatNumber(summary.cpuAverageEffectiveClockAvg, " MHz")}
            hint="Load-weighted. It can look low because idle and lightly loaded cores are included."
          />

          <SensorMetric
            label="CPU usage avg"
            value={formatNumber(summary.totalCpuUsageAvg, " %")}
          />
        </MetricSection>
      </HardwareDiagnosticsCard>

      <HardwareDiagnosticsCard
        title="GPU"
        description="Undervolt, boost, load and thermal margin in one readable block."
      >
        <MetricSection title="Thermals">
          <SensorMetric
            label="GPU temp max"
            value={formatNumber(summary.gpuTemperatureMax, " °C")}
            importance="primary"
          />

          <SensorMetric
            label="Hotspot max"
            value={formatNumber(summary.gpuHotSpotTemperatureMax, " °C")}
            importance="primary"
          />

          <SensorMetric
            label="Memory junction max"
            value={formatNumber(summary.gpuMemoryJunctionTemperatureMax, " °C")}
          />

          <SensorMetric
            label="GPU temp avg"
            value={formatNumber(summary.gpuTemperatureAvg, " °C")}
          />
        </MetricSection>

        <MetricSection title="Power">
          <SensorMetric
            label="GPU power avg"
            value={formatNumber(summary.gpuPowerAvg, " W")}
            importance="primary"
          />

          <SensorMetric
            label="GPU power max"
            value={formatNumber(summary.gpuPowerMax, " W")}
          />
        </MetricSection>

        <MetricSection title="Clocks / load">
          <SensorMetric
            label="Effective clock avg"
            value={formatNumber(summary.gpuEffectiveClockAvg, " MHz")}
            importance="primary"
          />

          <SensorMetric
            label="Effective clock max"
            value={formatNumber(summary.gpuEffectiveClockMax, " MHz")}
          />

          <SensorMetric
            label="Core clock avg"
            value={formatNumber(summary.gpuClockAvg, " MHz")}
          />

          <SensorMetric
            label="Memory clock avg"
            value={formatNumber(summary.gpuMemoryClockAvg, " MHz")}
          />

          <SensorMetric
            label="GPU load avg"
            value={formatNumber(summary.gpuCoreLoadAvg, " %")}
            importance="primary"
          />

          <SensorMetric
            label="GPU load max"
            value={formatNumber(summary.gpuCoreLoadMax, " %")}
          />
        </MetricSection>
      </HardwareDiagnosticsCard>

      <HardwareDiagnosticsCard
        title="RAM"
        description="Only memory pressure from the run. Timings belong in the hardware snapshot."
      >
        <MetricSection title="System memory">
          <SensorMetric
            label="RAM load avg"
            value={formatNumber(summary.physicalMemoryLoadAvg, " %")}
            importance="primary"
          />

          <SensorMetric
            label="RAM load max"
            value={formatNumber(summary.physicalMemoryLoadMax, " %")}
          />
        </MetricSection>
      </HardwareDiagnosticsCard>
    </div>
  );
}

function SensorHealthPanel({
  sensorSummary,
}: {
  sensorSummary: SensorSummary | null;
}) {
  if (!sensorSummary) {
    return (
      <section className="rounded-3xl border border-violet-950/70 bg-[#0d0716]/80 p-6">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-violet-300">
          Health checks
        </p>

        <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
          Sensor health
        </h2>

        <p className="mt-5 rounded-2xl border border-violet-950/70 bg-black/25 p-4 text-sm text-zinc-500">
          No HWiNFO sensor summary attached to this session.
        </p>
      </section>
    );
  }

  const verdict = getSensorHealthVerdict(sensorSummary);

  return (
    <section className="rounded-3xl border border-violet-950/70 bg-[#0d0716]/80 p-6">
      <p className="text-sm font-medium uppercase tracking-[0.25em] text-violet-300">
        Health checks
      </p>

      <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
        Sensor health
      </h2>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <VerdictCard
          label="Thermals"
          value={verdict.thermalStatus}
          tone={verdict.thermalTone}
        />

        <VerdictCard
          label="CPU status"
          value={verdict.cpuStatus}
          tone={verdict.cpuTone}
        />

        <VerdictCard
          label="GPU status"
          value={verdict.gpuStatus}
          tone={verdict.gpuTone}
        />
      </div>

      <div className="mt-5 rounded-2xl border border-violet-950/70 bg-black/20">
        <div className="border-b border-violet-950/70 p-4">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-violet-300">
            CPU checks
          </p>
        </div>

        <div className="grid gap-3 p-4">
          <HealthCheckRow
            label="CPU thermal throttling"
            detected={sensorSummary.cpuThermalThrottlingDetected}
            severity="bad"
            detectedText="Thermal throttle"
          />

          <HealthCheckRow
            label="CPU power limit"
            detected={sensorSummary.cpuPowerLimitDetected}
            severity="bad"
            detectedText="Power limited"
          />

          <HealthCheckRow
            label="CPU limit reasons"
            detected={sensorSummary.cpuLimitReasonsDetected}
            severity="bad"
            detectedText="Limit reason"
          />
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-violet-950/70 bg-black/20">
        <div className="border-b border-violet-950/70 p-4">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-violet-300">
            GPU checks
          </p>
        </div>

        <div className="grid gap-3 p-4">
          <HealthCheckRow
            label="GPU thermal limit"
            detected={sensorSummary.gpuThermalLimitDetected}
            severity="bad"
            detectedText="Thermal limit"
          />

          <HealthCheckRow
            label="GPU power limit"
            detected={sensorSummary.gpuPowerLimitDetected}
            severity="warning"
            detectedText="Power capped"
          />

          <HealthCheckRow
            label="GPU reliability voltage"
            detected={sensorSummary.gpuReliabilityVoltageLimitDetected}
            severity="warning"
            detectedText="Voltage capped"
          />

          <HealthCheckRow
            label="GPU max operating voltage"
            detected={sensorSummary.gpuMaxOperatingVoltageLimitDetected}
            severity="warning"
            detectedText="Voltage ceiling"
          />

          <HealthCheckRow
            label="GPU utilization limit"
            detected={sensorSummary.gpuUtilizationLimitDetected}
            severity="info"
            detectedText="Load-bound"
          />
        </div>
      </div>

      <p className="mt-5 text-sm leading-6 text-zinc-500">
        Voltage and power limiter flags are common on NVIDIA GPUs, especially
        with undervolt curves. Thermal limits and CPU throttling are stronger
        warning signs.
      </p>
    </section>
  );
}

function getSensorHealthVerdict(summary: SensorSummary) {
  const hasCpuProblem =
    summary.cpuThermalThrottlingDetected ||
    summary.cpuPowerLimitDetected ||
    summary.cpuLimitReasonsDetected;

  const hasThermalProblem =
    summary.cpuThermalThrottlingDetected || summary.gpuThermalLimitDetected;

  const hasGpuBoostLimit =
    summary.gpuPowerLimitDetected ||
    summary.gpuReliabilityVoltageLimitDetected ||
    summary.gpuMaxOperatingVoltageLimitDetected;

  const hasGpuUtilizationLimit = summary.gpuUtilizationLimitDetected;

  return {
    thermalStatus: hasThermalProblem ? "Thermal issue" : "Clean",
    thermalTone: hasThermalProblem ? "bad" : "good",

    cpuStatus: hasCpuProblem ? "Limiter detected" : "Clean",
    cpuTone: hasCpuProblem ? "bad" : "good",

    gpuStatus: getGpuStatus({
      hasGpuThermalLimit: summary.gpuThermalLimitDetected,
      hasGpuBoostLimit,
      hasGpuUtilizationLimit,
    }),

    gpuTone: getGpuTone({
      hasGpuThermalLimit: summary.gpuThermalLimitDetected,
      hasGpuBoostLimit,
      hasGpuUtilizationLimit,
    }),
  } as const;
}

function getGpuStatus({
  hasGpuThermalLimit,
  hasGpuBoostLimit,
  hasGpuUtilizationLimit,
}: {
  hasGpuThermalLimit: boolean;
  hasGpuBoostLimit: boolean;
  hasGpuUtilizationLimit: boolean;
}) {
  if (hasGpuThermalLimit) {
    return "Thermal limit";
  }

  if (hasGpuBoostLimit) {
    return "Voltage / power capped";
  }

  if (hasGpuUtilizationLimit) {
    return "Load-bound";
  }

  return "Clean";
}

function getGpuTone({
  hasGpuThermalLimit,
  hasGpuBoostLimit,
  hasGpuUtilizationLimit,
}: {
  hasGpuThermalLimit: boolean;
  hasGpuBoostLimit: boolean;
  hasGpuUtilizationLimit: boolean;
}) {
  if (hasGpuThermalLimit) {
    return "bad";
  }

  if (hasGpuBoostLimit) {
    return "warning";
  }

  if (hasGpuUtilizationLimit) {
    return "info";
  }

  return "good";
}

function InsightCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: HealthTone;
}) {
  return (
    <div className="rounded-3xl border border-violet-950/70 bg-black/20 p-5">
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-600">
        {label}
      </p>

      <p className={`mt-3 text-2xl font-semibold ${getToneClass(tone)}`}>
        {value}
      </p>

      <p className="mt-3 text-sm leading-6 text-zinc-500">{detail}</p>
    </div>
  );
}

function HardwareDiagnosticsCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-violet-950/70 bg-black/20 p-5">
      <div>
        <p className="text-lg font-semibold text-zinc-100">{title}</p>

        <p className="mt-1 text-sm leading-6 text-zinc-500">{description}</p>
      </div>

      <div className="mt-5 grid gap-5">{children}</div>
    </section>
  );
}

function MetricSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">
        {title}
      </p>

      <div className="mt-3 grid gap-3">{children}</div>
    </section>
  );
}

function SensorMetric({
  label,
  value,
  importance = "normal",
  hint,
}: {
  label: string;
  value: string;
  importance?: "normal" | "primary";
  hint?: string;
}) {
  return (
    <div className="min-w-0 border-b border-violet-950/60 pb-3 last:border-b-0">
      <div className="flex min-w-0 items-center justify-between gap-4">
        <p className="text-sm text-zinc-500">{label}</p>

        <p
          className={`truncate text-right text-sm font-semibold ${
            importance === "primary" ? "text-violet-200" : "text-zinc-100"
          }`}
        >
          {value}
        </p>
      </div>

      {hint && <p className="mt-1 text-xs leading-5 text-zinc-600">{hint}</p>}
    </div>
  );
}

function VerdictCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: HealthTone;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-violet-950/70 bg-black/25 p-4">
      <p className="text-xs text-zinc-600">{label}</p>

      <p
        className={`mt-1 truncate text-lg font-semibold ${getToneClass(tone)}`}
      >
        {value}
      </p>
    </div>
  );
}

function HealthCheckRow({
  label,
  detected,
  severity,
  detectedText = "Detected",
  clearText = "Clear",
}: {
  label: string;
  detected: boolean;
  severity: "bad" | "warning" | "info";
  detectedText?: string;
  clearText?: string;
}) {
  const tone = detected ? severity : "good";

  return (
    <div className="flex min-w-0 items-center justify-between gap-4 rounded-2xl border border-violet-950/70 bg-black/25 p-4">
      <p className="text-sm text-zinc-500">{label}</p>

      <p className={`text-right text-sm font-semibold ${getToneClass(tone)}`}>
        {detected ? detectedText : clearText}
      </p>
    </div>
  );
}

function getToneClass(tone: HealthTone) {
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

function HeroMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-violet-950/70 bg-black/25 p-4">
      <p className="text-xs text-zinc-600">{label}</p>

      <p className="mt-1 truncate text-2xl font-bold text-zinc-100">{value}</p>
    </div>
  );
}

function NavButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-full border border-violet-900/80 bg-violet-950/20 px-5 py-3 text-sm font-medium text-zinc-300 transition hover:border-violet-300 hover:text-violet-200"
    >
      {children}
    </Link>
  );
}
