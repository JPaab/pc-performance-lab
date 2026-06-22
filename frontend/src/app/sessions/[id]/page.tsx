import Link from "next/link";
import type { ReactNode } from "react";
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

function formatDuration(seconds: number | null | undefined) {
  if (!seconds) {
    return "—";
  }

  const roundedSeconds = Math.round(seconds);
  const minutes = Math.floor(roundedSeconds / 60);
  const remainingSeconds = roundedSeconds % 60;

  return `${minutes}m ${remainingSeconds}s`;
}

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [session, sensorSummaries] = await Promise.all([
    getSession(id),
    getSensorSummaries(id),
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

  return (
    <>
      <AppHeader />

      <main className="min-h-screen px-6 py-10 text-zinc-100">
        <div className="mx-auto max-w-7xl">
          <BackLink />

          <SessionHero session={session} />

          <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <PerformancePanel session={session} />
            <RunContextPanel session={session} />
          </section>

          <SensorSection sensorSummaries={sensorSummaries} />

          <SessionNotes session={session} sensorSummary={latestSensorSummary} />
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

function SessionHero({ session }: { session: PerformanceSession }) {
  return (
    <section className="mt-8 overflow-hidden rounded-[2rem] border border-violet-950/70 bg-[#0d0716]/80 shadow-2xl shadow-black/30">
      <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
        <div className="min-w-0 p-8 md:p-10">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-violet-300">
            Session #{session.id}
          </p>

          <h1 className="mt-4 truncate text-5xl font-black tracking-[-0.06em] text-zinc-50 md:text-7xl">
            {session.gameName}
          </h1>

          <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-400">
            {session.scenario ?? "No scenario"} · {session.sourceType}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <NavButton href="/compare">Compare this run</NavButton>
            <NavButton href="/import">Import sensor data</NavButton>
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
              value={formatNumber(session.onePercentLowFps)}
            />
            <HeroMetric
              label="P99"
              value={formatNumber(session.p99FrameTimeMs, " ms")}
            />
            <HeroMetric label="Drops" value={session.droppedFrames ?? "—"} />
          </div>
        </div>
      </div>
    </section>
  );
}

function PerformancePanel({ session }: { session: PerformanceSession }) {
  return (
    <section className="rounded-3xl border border-violet-950/70 bg-[#0d0716]/80 p-6 shadow-2xl shadow-black/25">
      <p className="text-sm font-medium uppercase tracking-[0.25em] text-violet-300">
        Performance
      </p>

      <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
        Frametime profile
      </h2>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Metric label="Average FPS" value={formatNumber(session.averageFps)} />
        <Metric
          label="1% Low"
          value={formatNumber(session.onePercentLowFps, " fps")}
        />
        <Metric
          label="0.1% Low"
          value={formatNumber(session.zeroPointOnePercentLowFps, " fps")}
        />
        <Metric
          label="P95"
          value={formatNumber(session.p95FrameTimeMs, " ms")}
        />
        <Metric
          label="P99"
          value={formatNumber(session.p99FrameTimeMs, " ms")}
        />
        <Metric
          label="P99.9"
          value={formatNumber(session.p999FrameTimeMs, " ms")}
        />
        <Metric label="Stutters" value={session.stutterCount ?? "—"} />
        <Metric label="Dropped frames" value={session.droppedFrames ?? "—"} />
        <Metric
          label="Duration"
          value={formatDuration(session.durationSeconds)}
        />
      </div>
    </section>
  );
}

function RunContextPanel({ session }: { session: PerformanceSession }) {
  return (
    <section className="rounded-3xl border border-violet-950/70 bg-[#0d0716]/80 p-6 shadow-2xl shadow-black/25">
      <p className="text-sm font-medium uppercase tracking-[0.25em] text-violet-300">
        Context
      </p>

      <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
        Run metadata
      </h2>

      <div className="mt-6 grid gap-3">
        <InfoLine label="Snapshot" value={`#${session.snapshotId}`} />
        <InfoLine label="Source" value={session.sourceType} />
        <InfoLine label="Created at" value={session.createdAt} />
      </div>

      {session.tags.length > 0 && (
        <div className="mt-6">
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-600">
            tags
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {session.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-violet-950/70 bg-black/25 px-3 py-1 text-xs text-zinc-400"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function SensorSection({
  sensorSummaries,
}: {
  sensorSummaries: SensorSummary[];
}) {
  return (
    <section className="mt-8 rounded-3xl border border-violet-950/70 bg-[#0d0716]/80 p-6 shadow-2xl shadow-black/25">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-violet-300">
            Sensors
          </p>

          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
            HWiNFO summaries
          </h2>
        </div>

        <p className="max-w-xl text-sm leading-6 text-zinc-500">
          Thermals, power, clocks and limiter flags from the imported HWiNFO
          CSV.
        </p>
      </div>

      {sensorSummaries.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-violet-950/70 bg-black/25 p-5 text-sm text-zinc-500">
          No HWiNFO sensor summary imported for this session yet.
        </p>
      ) : (
        <div className="mt-6 grid gap-5">
          {sensorSummaries.map((summary) => (
            <SensorSummaryCard key={summary.id} summary={summary} />
          ))}
        </div>
      )}
    </section>
  );
}

function SensorSummaryCard({ summary }: { summary: SensorSummary }) {
  return (
    <article className="overflow-hidden rounded-3xl border border-violet-950/70 bg-black/20">
      <div className="flex flex-col gap-3 border-b border-violet-950/70 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-zinc-100">
            {summary.sourceType}
          </p>

          <p className="mt-1 text-sm text-zinc-500">
            Summary #{summary.id} · {summary.sampleCount} samples
          </p>
        </div>

        <p className="text-sm text-zinc-600">{summary.createdAt}</p>
      </div>

      <div className="grid gap-0 lg:grid-cols-3">
        <SensorGroup title="Thermals">
          <SensorSubGroup title="CPU">
            <SensorMetric
              label="Package avg"
              value={formatNumber(summary.cpuPackageTempAvg, " °C")}
            />
            <SensorMetric
              label="Package max"
              value={formatNumber(summary.cpuPackageTempMax, " °C")}
            />
            <SensorMetric
              label="Core max"
              value={formatNumber(summary.cpuCoreMaxTempMax, " °C")}
            />
          </SensorSubGroup>

          <SensorSubGroup title="GPU">
            <SensorMetric
              label="GPU avg"
              value={formatNumber(summary.gpuTemperatureAvg, " °C")}
            />
            <SensorMetric
              label="GPU max"
              value={formatNumber(summary.gpuTemperatureMax, " °C")}
            />
            <SensorMetric
              label="Hotspot max"
              value={formatNumber(summary.gpuHotSpotTemperatureMax, " °C")}
            />
            <SensorMetric
              label="Memory junction max"
              value={formatNumber(
                summary.gpuMemoryJunctionTemperatureMax,
                " °C",
              )}
            />
          </SensorSubGroup>
        </SensorGroup>

        <SensorGroup title="Power">
          <SensorSubGroup title="CPU">
            <SensorMetric
              label="Package power avg"
              value={formatNumber(summary.cpuPackagePowerAvg, " W")}
            />
            <SensorMetric
              label="Package power max"
              value={formatNumber(summary.cpuPackagePowerMax, " W")}
            />
          </SensorSubGroup>

          <SensorSubGroup title="GPU">
            <SensorMetric
              label="GPU power avg"
              value={formatNumber(summary.gpuPowerAvg, " W")}
            />
            <SensorMetric
              label="GPU power max"
              value={formatNumber(summary.gpuPowerMax, " W")}
            />
          </SensorSubGroup>

          <SensorSubGroup title="Memory">
            <SensorMetric
              label="RAM load avg"
              value={formatNumber(summary.physicalMemoryLoadAvg, " %")}
            />
            <SensorMetric
              label="RAM load max"
              value={formatNumber(summary.physicalMemoryLoadMax, " %")}
            />
          </SensorSubGroup>
        </SensorGroup>

        <SensorGroup title="Clocks / load">
          <SensorSubGroup title="CPU">
            <SensorMetric
              label="CPU effective avg"
              value={formatNumber(summary.cpuAverageEffectiveClockAvg, " MHz")}
            />
            <SensorMetric
              label="CPU effective max"
              value={formatNumber(summary.cpuAverageEffectiveClockMax, " MHz")}
            />
            <SensorMetric
              label="CPU usage avg"
              value={formatNumber(summary.totalCpuUsageAvg, " %")}
            />
          </SensorSubGroup>

          <SensorSubGroup title="GPU">
            <SensorMetric
              label="GPU clock avg"
              value={formatNumber(summary.gpuClockAvg, " MHz")}
            />
            <SensorMetric
              label="GPU effective avg"
              value={formatNumber(summary.gpuEffectiveClockAvg, " MHz")}
            />
            <SensorMetric
              label="Memory clock avg"
              value={formatNumber(summary.gpuMemoryClockAvg, " MHz")}
            />
            <SensorMetric
              label="GPU load avg"
              value={formatNumber(summary.gpuCoreLoadAvg, " %")}
            />
            <SensorMetric
              label="GPU load max"
              value={formatNumber(summary.gpuCoreLoadMax, " %")}
            />
            <SensorMetric
              label="VRAM usage max"
              value={formatNumber(summary.gpuMemoryUsageMax, " %")}
            />
          </SensorSubGroup>
        </SensorGroup>
      </div>
    </article>
  );
}

function SessionNotes({
  session,
  sensorSummary,
}: {
  session: PerformanceSession;
  sensorSummary: SensorSummary | null;
}) {
  return (
    <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
      <section className="rounded-3xl border border-violet-950/70 bg-[#0d0716]/80 p-6">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-violet-300">
          Notes
        </p>

        <p className="mt-4 text-sm leading-7 text-zinc-500">
          {session.notes ?? "No notes saved for this session."}
        </p>
      </section>

      <SensorHealthPanel sensorSummary={sensorSummary} />
    </section>
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
          />

          <HealthCheckRow
            label="CPU power limit"
            detected={sensorSummary.cpuPowerLimitDetected}
            severity="bad"
          />

          <HealthCheckRow
            label="CPU limit reasons"
            detected={sensorSummary.cpuLimitReasonsDetected}
            severity="bad"
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
          />

          <HealthCheckRow
            label="GPU power limit"
            detected={sensorSummary.gpuPowerLimitDetected}
            severity="warning"
          />

          <HealthCheckRow
            label="GPU reliability voltage"
            detected={sensorSummary.gpuReliabilityVoltageLimitDetected}
            severity="warning"
          />

          <HealthCheckRow
            label="GPU max operating voltage"
            detected={sensorSummary.gpuMaxOperatingVoltageLimitDetected}
            severity="warning"
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

function InfoLine({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-4 border-b border-violet-950/70 py-3 last:border-b-0">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="truncate text-right text-sm font-medium text-zinc-100">
        {value}
      </p>
    </div>
  );
}

function SensorGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-violet-950/70 p-5 last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0">
      <p className="text-xs font-medium uppercase tracking-[0.25em] text-violet-300">
        {title}
      </p>

      <div className="mt-5 grid gap-4">{children}</div>
    </section>
  );
}

function SensorSubGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-violet-950/70 bg-black/20 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
        {title}
      </p>

      <div className="mt-4 grid gap-3">{children}</div>
    </div>
  );
}

function SensorMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-4 border-b border-violet-950/60 pb-3 last:border-b-0">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="truncate text-right text-sm font-semibold text-zinc-100">
        {value}
      </p>
    </div>
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
