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
  createdAt: string;
};

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
          Sensor data is separated by thermals, power and clocks so it is easier
          to read. Thermal throttling and limiter alerts come next.
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
          <SensorMetric
            label="CPU package avg"
            value={formatNumber(summary.cpuPackageTempAvg, " °C")}
          />
          <SensorMetric
            label="CPU package max"
            value={formatNumber(summary.cpuPackageTempMax, " °C")}
          />
          <SensorMetric
            label="CPU core max"
            value={formatNumber(summary.cpuCoreMaxTempMax, " °C")}
          />
          <SensorMetric
            label="GPU avg"
            value={formatNumber(summary.gpuTemperatureAvg, " °C")}
          />
          <SensorMetric
            label="GPU max"
            value={formatNumber(summary.gpuTemperatureMax, " °C")}
          />
          <SensorMetric
            label="GPU hotspot max"
            value={formatNumber(summary.gpuHotSpotTemperatureMax, " °C")}
          />
        </SensorGroup>

        <SensorGroup title="Power">
          <SensorMetric
            label="CPU power avg"
            value={formatNumber(summary.cpuPackagePowerAvg, " W")}
          />
          <SensorMetric
            label="CPU power max"
            value={formatNumber(summary.cpuPackagePowerMax, " W")}
          />
          <SensorMetric
            label="GPU power avg"
            value={formatNumber(summary.gpuPowerAvg, " W")}
          />
          <SensorMetric
            label="GPU power max"
            value={formatNumber(summary.gpuPowerMax, " W")}
          />
          <SensorMetric
            label="Memory load avg"
            value={formatNumber(summary.physicalMemoryLoadAvg, " %")}
          />
          <SensorMetric
            label="Memory load max"
            value={formatNumber(summary.physicalMemoryLoadMax, " %")}
          />
        </SensorGroup>

        <SensorGroup title="Clocks / load">
          <SensorMetric
            label="GPU clock avg"
            value={formatNumber(summary.gpuClockAvg, " MHz")}
          />
          <SensorMetric
            label="GPU clock max"
            value={formatNumber(summary.gpuClockMax, " MHz")}
          />
          <SensorMetric
            label="GPU mem clock"
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
            label="CPU usage avg"
            value={formatNumber(summary.totalCpuUsageAvg, " %")}
          />
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

      <section className="rounded-3xl border border-violet-950/70 bg-[#0d0716]/80 p-6">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-violet-300">
          Health checks
        </p>

        <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
          Run coverage
        </h2>

        <div className="mt-5 grid gap-3">
          <HealthLine
            label="HWiNFO sensor log"
            value={
              sensorSummary
                ? `Attached · Summary #${sensorSummary.id}`
                : "Missing"
            }
            active={Boolean(sensorSummary)}
          />

          <HealthLine
            label="Thermal / power limiter detection"
            value="Not tracked yet"
            active={false}
          />
        </div>

        <p className="mt-5 text-sm leading-6 text-zinc-500">
          Thermal throttling, CPU power limits and GPU limiter flags will appear
          here once HWiNFO limiter parsing is added to the importer.
        </p>
      </section>
    </section>
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
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-violet-950/70 p-5 last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0">
      <p className="text-xs font-medium uppercase tracking-[0.25em] text-violet-300">
        {title}
      </p>

      <div className="mt-5 grid gap-3">{children}</div>
    </section>
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

function HealthLine({
  label,
  value,
  active,
}: {
  label: string;
  value: string;
  active: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-4 rounded-2xl border border-violet-950/70 bg-black/25 p-4">
      <p className="text-sm text-zinc-500">{label}</p>

      <p
        className={`text-right text-sm font-medium ${
          active ? "text-violet-200" : "text-zinc-500"
        }`}
      >
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
