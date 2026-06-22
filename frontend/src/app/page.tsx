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
  cpuOverclock: string | null;
  ramProfile: string | null;
  operatingSystemProfile: string | null;
  gpuDriver: string | null;
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
  droppedFrames: number | null;
  createdAt: string;
};

type SensorSummaryInfo = {
  id: number;
  sessionId: number;
  sourceType: string;
  sampleCount: number;
  cpuPackageTempAvg: number | null;
  cpuPackageTempMax: number | null;
  gpuTemperatureAvg: number | null;
  gpuTemperatureMax: number | null;
  gpuPowerAvg: number | null;
  gpuPowerMax: number | null;
  createdAt: string;
};

type DashboardSummary = {
  buildCount: number;
  snapshotCount: number;
  sessionCount: number;
  sensorSummaryCount: number;
  latestBuild: BuildSummary | null;
  latestSnapshot: SnapshotSummary | null;
  latestSession: SessionSummary | null;
  latestSensorSummary: SensorSummaryInfo | null;
  bestAverageFpsSession: SessionSummary | null;
};

async function getDashboardSummary(): Promise<DashboardSummary | null> {
  try {
    const response = await fetch("http://localhost:8080/api/dashboard/summary", {
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

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5 shadow-sm">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-zinc-50">{value}</p>
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6">
      <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
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

export default async function Home() {
  const summary = await getDashboardSummary();

  if (!summary) {
    return (
      <main className="min-h-screen bg-black px-6 py-10 text-zinc-100">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-bold tracking-tight">
            PC Performance Lab
          </h1>
          <p className="mt-4 max-w-2xl text-zinc-400">
            Backend API is not available. Start the Spring Boot server on port
            8080 and refresh this page.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-zinc-100">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-emerald-400">
            PC Performance Lab
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-6xl">
            Performance dashboard
          </h1>
          <p className="mt-4 max-w-2xl text-zinc-400">
            Track PC builds, hardware snapshots, benchmark sessions and sensor
            summaries to understand if a change actually improves performance.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Builds" value={summary.buildCount} />
          <StatCard label="Snapshots" value={summary.snapshotCount} />
          <StatCard label="Sessions" value={summary.sessionCount} />
          <StatCard label="Sensor summaries" value={summary.sensorSummaryCount} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <SectionCard title="Latest PC build">
            {summary.latestBuild ? (
              <>
                <InfoRow label="Name" value={summary.latestBuild.name} />
                <InfoRow label="CPU" value={summary.latestBuild.cpu} />
                <InfoRow label="GPU" value={summary.latestBuild.gpu} />
                <InfoRow label="RAM" value={`${summary.latestBuild.ramGb} GB`} />
              </>
            ) : (
              <p className="text-sm text-zinc-500">No build registered yet.</p>
            )}
          </SectionCard>

          <SectionCard title="Latest hardware snapshot">
            {summary.latestSnapshot ? (
              <>
                <InfoRow label="Name" value={summary.latestSnapshot.name} />
                <InfoRow
                  label="CPU OC"
                  value={summary.latestSnapshot.cpuOverclock}
                />
                <InfoRow
                  label="RAM profile"
                  value={summary.latestSnapshot.ramProfile}
                />
                <InfoRow
                  label="GPU driver"
                  value={summary.latestSnapshot.gpuDriver}
                />
              </>
            ) : (
              <p className="text-sm text-zinc-500">No snapshot registered yet.</p>
            )}
          </SectionCard>

          <SectionCard title="Latest performance session">
            {summary.latestSession ? (
              <>
                <InfoRow label="Game" value={summary.latestSession.gameName} />
                <InfoRow
                  label="Scenario"
                  value={summary.latestSession.scenario}
                />
                <InfoRow
                  label="Average FPS"
                  value={formatNumber(summary.latestSession.averageFps, " fps")}
                />
                <InfoRow
                  label="1% Low"
                  value={formatNumber(
                    summary.latestSession.onePercentLowFps,
                    " fps",
                  )}
                />
                <InfoRow
                  label="P99 frametime"
                  value={formatNumber(
                    summary.latestSession.p99FrameTimeMs,
                    " ms",
                  )}
                />
              </>
            ) : (
              <p className="text-sm text-zinc-500">No session imported yet.</p>
            )}
          </SectionCard>

          <SectionCard title="Latest sensor summary">
            {summary.latestSensorSummary ? (
              <>
                <InfoRow
                  label="Samples"
                  value={summary.latestSensorSummary.sampleCount}
                />
                <InfoRow
                  label="CPU temp avg"
                  value={formatNumber(
                    summary.latestSensorSummary.cpuPackageTempAvg,
                    " °C",
                  )}
                />
                <InfoRow
                  label="GPU temp avg"
                  value={formatNumber(
                    summary.latestSensorSummary.gpuTemperatureAvg,
                    " °C",
                  )}
                />
                <InfoRow
                  label="GPU power avg"
                  value={formatNumber(
                    summary.latestSensorSummary.gpuPowerAvg,
                    " W",
                  )}
                />
              </>
            ) : (
              <p className="text-sm text-zinc-500">
                No sensor summary imported yet.
              </p>
            )}
          </SectionCard>
        </div>

        <div className="mt-6">
          <SectionCard title="Best average FPS session">
            {summary.bestAverageFpsSession ? (
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                  <p className="text-2xl font-semibold text-zinc-50">
                    {summary.bestAverageFpsSession.gameName}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {summary.bestAverageFpsSession.scenario ?? "No scenario"}
                  </p>
                </div>
                <p className="text-4xl font-bold text-emerald-400">
                  {formatNumber(summary.bestAverageFpsSession.averageFps, " fps")}
                </p>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">
                No FPS data available yet.
              </p>
            )}
          </SectionCard>
        </div>
      </div>
    </main>
  );
}