import Link from "next/link";
import { buildApiUrl } from "@/lib/api";

type PerformanceSession = {
  id: number;
  snapshotId: number;
  gameName: string;
  scenario: string | null;
  sourceType: string;
  averageFps: number | null;
  onePercentLowFps: number | null;
  zeroPointOnePercentLowFps: number | null;
  p99FrameTimeMs: number | null;
  stutterCount: number | null;
  droppedFrames: number | null;
  createdAt: string;
};

type MetricComparison = {
  metricName: string;
  baselineValue: number | null;
  comparisonValue: number | null;
  absoluteChange: number | null;
  percentageChange: number | null;
  unit: string;
  verdict: string;
};

type PerformanceComparisonResult = {
  baselineSessionId: number;
  comparisonSessionId: number;
  baselineLabel: string;
  comparisonLabel: string;
  metrics: MetricComparison[];
  sensorMetrics: MetricComparison[];
  summary: string;
};

async function getSessions(): Promise<PerformanceSession[]> {
  try {
    const response = await fetch(buildApiUrl("/api/sessions"), {
      cache: "no-store",
    });

    if (!response.ok) {
      return [];
    }

    return response.json();
  } catch {
    return [];
  }
}

async function getComparison(
  s1?: string,
  s2?: string,
): Promise<PerformanceComparisonResult | null> {
  if (!s1 || !s2) {
    return null;
  }

  try {
    const response = await fetch(
      buildApiUrl(`/api/compare?s1=${s1}&s2=${s2}`),
      {
        cache: "no-store",
      },
    );

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

function getVerdictClass(verdict: string) {
  if (verdict === "IMPROVED") {
    return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
  }

  if (verdict === "REGRESSED") {
    return "border-red-500/40 bg-red-500/10 text-red-300";
  }

  if (verdict === "INFO") {
    return "border-blue-500/40 bg-blue-500/10 text-blue-300";
  }

  if (verdict === "NO_DATA") {
    return "border-zinc-700 bg-zinc-900 text-zinc-500";
  }

  return "border-zinc-700 bg-zinc-900 text-zinc-300";
}

function MetricComparisonCard({ metric }: { metric: MetricComparison }) {
  return (
    <article className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-zinc-100">{metric.metricName}</h3>
          <p className="mt-1 text-sm text-zinc-500">
            {formatNumber(metric.baselineValue, ` ${metric.unit}`)} →{" "}
            {formatNumber(metric.comparisonValue, ` ${metric.unit}`)}
          </p>
        </div>

        <span
          className={`rounded-full border px-3 py-1 text-xs font-medium ${getVerdictClass(
            metric.verdict,
          )}`}
        >
          {metric.verdict}
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl bg-black/40 p-4">
          <p className="text-xs text-zinc-500">Absolute change</p>
          <p className="mt-1 text-lg font-semibold text-zinc-100">
            {formatNumber(metric.absoluteChange, ` ${metric.unit}`)}
          </p>
        </div>

        <div className="rounded-xl bg-black/40 p-4">
          <p className="text-xs text-zinc-500">Percentage change</p>
          <p className="mt-1 text-lg font-semibold text-zinc-100">
            {formatNumber(metric.percentageChange, " %")}
          </p>
        </div>
      </div>
    </article>
  );
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ s1?: string; s2?: string }>;
}) {
  const params = await searchParams;
  const sessions = await getSessions();
  const comparison = await getComparison(params.s1, params.s2);

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-zinc-100">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-emerald-400">
              Compare
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-6xl">
              Session comparison
            </h1>
            <p className="mt-4 max-w-2xl text-zinc-400">
              Compare two performance sessions and check if the new setup
              actually improved FPS, frametime stability, stutters and sensor
              data.
            </p>
          </div>

          <Link
            href="/sessions"
            className="rounded-full border border-zinc-800 px-5 py-3 text-sm font-medium text-zinc-300 transition hover:border-emerald-400 hover:text-emerald-400"
          >
            View sessions
          </Link>
        </div>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6">
          <h2 className="text-xl font-semibold">Select sessions</h2>

          <form className="mt-5 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
            <label className="grid gap-2">
              <span className="text-sm text-zinc-500">Baseline session</span>
              <select
                name="s1"
                defaultValue={params.s1 ?? ""}
                className="rounded-xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100 outline-none transition focus:border-emerald-400"
              >
                <option value="">Select baseline</option>
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    #{session.id} · {session.gameName} ·{" "}
                    {session.scenario ?? "No scenario"}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm text-zinc-500">Comparison session</span>
              <select
                name="s2"
                defaultValue={params.s2 ?? ""}
                className="rounded-xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100 outline-none transition focus:border-emerald-400"
              >
                <option value="">Select comparison</option>
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    #{session.id} · {session.gameName} ·{" "}
                    {session.scenario ?? "No scenario"}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              className="self-end rounded-xl bg-emerald-400 px-6 py-3 font-semibold text-black transition hover:bg-emerald-300"
            >
              Compare
            </button>
          </form>
        </section>

        {!comparison && (
          <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-8">
            <h2 className="text-xl font-semibold">No comparison selected</h2>
            <p className="mt-3 text-zinc-500">
              Select two sessions above. You need at least two performance
              sessions created or imported from CapFrameX.
            </p>
          </section>
        )}

        {comparison && (
          <>
            <section className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6">
              <p className="text-sm text-emerald-300">Comparison summary</p>
              <h2 className="mt-2 text-2xl font-semibold text-zinc-50">
                {comparison.summary}
              </h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-zinc-800 bg-black/40 p-4">
                  <p className="text-xs text-zinc-500">Baseline</p>
                  <p className="mt-1 font-semibold text-zinc-100">
                    #{comparison.baselineSessionId} · {comparison.baselineLabel}
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-black/40 p-4">
                  <p className="text-xs text-zinc-500">Comparison</p>
                  <p className="mt-1 font-semibold text-zinc-100">
                    #{comparison.comparisonSessionId} ·{" "}
                    {comparison.comparisonLabel}
                  </p>
                </div>
              </div>
            </section>

            <section className="mt-6">
              <h2 className="mb-4 text-xl font-semibold">
                Performance metrics
              </h2>

              <div className="grid gap-4 md:grid-cols-2">
                {comparison.metrics.map((metric) => (
                  <MetricComparisonCard
                    key={metric.metricName}
                    metric={metric}
                  />
                ))}
              </div>
            </section>

            <section className="mt-8">
              <h2 className="mb-4 text-xl font-semibold">Sensor metrics</h2>

              {comparison.sensorMetrics.length === 0 ? (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6">
                  <p className="text-sm text-zinc-500">
                    No sensor summaries found for both sessions. Import HWiNFO
                    CSV data for each session to compare temperatures, power and
                    load.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {comparison.sensorMetrics.map((metric) => (
                    <MetricComparisonCard
                      key={metric.metricName}
                      metric={metric}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
