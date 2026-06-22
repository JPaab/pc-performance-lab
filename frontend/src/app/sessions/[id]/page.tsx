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

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-zinc-900 bg-black/40 p-5">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-zinc-100">{value}</p>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-zinc-900 py-3 last:border-b-0">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className="text-right text-sm font-medium text-zinc-200">
        {value ?? "—"}
      </span>
    </div>
  );
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
      <main className="min-h-screen bg-black px-6 py-10 text-zinc-100">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/sessions"
            className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
          >
            ← Back to sessions
          </Link>

          <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-8">
            <h1 className="text-3xl font-bold">Session not found</h1>
            <p className="mt-3 text-zinc-500">
              The backend did not return a performance session for this ID.
            </p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-zinc-100">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <Link
            href="/sessions"
            className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
          >
            ← Back to sessions
          </Link>

          <div className="mt-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-emerald-400">
                Session #{session.id}
              </p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-6xl">
                {session.gameName}
              </h1>
              <p className="mt-4 max-w-2xl text-zinc-400">
                {session.scenario ?? "No scenario"} · {session.sourceType} ·{" "}
                {formatDuration(session.durationSeconds)}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 md:text-right">
              <p className="text-sm text-emerald-300">Average FPS</p>
              <p className="mt-1 text-5xl font-bold text-emerald-400">
                {formatNumber(session.averageFps)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            label="1% Low"
            value={formatNumber(session.onePercentLowFps, " fps")}
          />
          <MetricCard
            label="0.1% Low"
            value={formatNumber(session.zeroPointOnePercentLowFps, " fps")}
          />
          <MetricCard
            label="P99 Frametime"
            value={formatNumber(session.p99FrameTimeMs, " ms")}
          />
          <MetricCard label="Stutters" value={session.stutterCount ?? "—"} />
        </div>

        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6">
          <h2 className="text-xl font-semibold">Session details</h2>

          <div className="mt-5">
            <InfoRow label="Snapshot ID" value={session.snapshotId} />
            <InfoRow
              label="P95 frametime"
              value={formatNumber(session.p95FrameTimeMs, " ms")}
            />
            <InfoRow
              label="P99.9 frametime"
              value={formatNumber(session.p999FrameTimeMs, " ms")}
            />
            <InfoRow label="Dropped frames" value={session.droppedFrames} />
            <InfoRow label="Created at" value={session.createdAt} />
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
        </section>

        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6">
          <h2 className="text-xl font-semibold">Sensor summaries</h2>

          {sensorSummaries.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">
              No HWiNFO sensor summary imported for this session yet.
            </p>
          ) : (
            <div className="mt-5 grid gap-5">
              {sensorSummaries.map((summary) => (
                <article
                  key={summary.id}
                  className="rounded-2xl border border-zinc-900 bg-black/40 p-5"
                >
                  <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-100">
                        {summary.sourceType}
                      </p>
                      <p className="text-sm text-zinc-500">
                        {summary.sampleCount} samples
                      </p>
                    </div>
                    <p className="text-xs text-zinc-600">{summary.createdAt}</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <MetricCard
                      label="CPU temp avg"
                      value={formatNumber(summary.cpuPackageTempAvg, " °C")}
                    />
                    <MetricCard
                      label="CPU power avg"
                      value={formatNumber(summary.cpuPackagePowerAvg, " W")}
                    />
                    <MetricCard
                      label="CPU usage avg"
                      value={formatNumber(summary.totalCpuUsageAvg, " %")}
                    />
                    <MetricCard
                      label="GPU temp avg"
                      value={formatNumber(summary.gpuTemperatureAvg, " °C")}
                    />
                    <MetricCard
                      label="GPU hotspot max"
                      value={formatNumber(
                        summary.gpuHotSpotTemperatureMax,
                        " °C",
                      )}
                    />
                    <MetricCard
                      label="GPU power avg"
                      value={formatNumber(summary.gpuPowerAvg, " W")}
                    />
                    <MetricCard
                      label="GPU clock avg"
                      value={formatNumber(summary.gpuClockAvg, " MHz")}
                    />
                    <MetricCard
                      label="GPU load avg"
                      value={formatNumber(summary.gpuCoreLoadAvg, " %")}
                    />
                    <MetricCard
                      label="Memory load avg"
                      value={formatNumber(
                        summary.physicalMemoryLoadAvg,
                        " %",
                      )}
                    />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}