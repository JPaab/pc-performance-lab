import Link from "next/link";
import { AppHeader } from "@/components/app-header";
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

type VerdictStats = {
  improved: number;
  regressed: number;
  neutral: number;
  noData: number;
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

function formatMetricValue(value: number | null, unit: string) {
  if (value === null || value === undefined) {
    return "—";
  }

  return `${value.toFixed(2)}${unit ? ` ${unit}` : ""}`;
}

function getVerdictStats(metrics: MetricComparison[]): VerdictStats {
  return metrics.reduce(
    (stats, metric) => {
      if (metric.verdict === "IMPROVED") {
        return { ...stats, improved: stats.improved + 1 };
      }

      if (metric.verdict === "REGRESSED") {
        return { ...stats, regressed: stats.regressed + 1 };
      }

      if (metric.verdict === "NO_DATA") {
        return { ...stats, noData: stats.noData + 1 };
      }

      return { ...stats, neutral: stats.neutral + 1 };
    },
    {
      improved: 0,
      regressed: 0,
      neutral: 0,
      noData: 0,
    },
  );
}

function getVerdictClass(verdict: string) {
  if (verdict === "IMPROVED") {
    return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
  }

  if (verdict === "REGRESSED") {
    return "border-rose-500/40 bg-rose-500/10 text-rose-300";
  }

  if (verdict === "INFO") {
    return "border-violet-500/40 bg-violet-500/10 text-violet-200";
  }

  if (verdict === "NO_DATA") {
    return "border-zinc-800 bg-black/30 text-zinc-600";
  }

  return "border-zinc-800 bg-black/30 text-zinc-400";
}

function findSessionById(sessions: PerformanceSession[], id?: string) {
  if (!id) {
    return null;
  }

  return sessions.find((session) => String(session.id) === id) ?? null;
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ s1?: string; s2?: string }>;
}) {
  const params = await searchParams;

  const [sessions, comparison] = await Promise.all([
    getSessions(),
    getComparison(params.s1, params.s2),
  ]);

  const baselineSession = findSessionById(sessions, params.s1);
  const comparisonSession = findSessionById(sessions, params.s2);

  return (
    <>
      <AppHeader />

      <main className="min-h-screen px-6 py-10 text-zinc-100">
        <div className="mx-auto max-w-7xl">
          <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-violet-300">
                Compare
              </p>

              <h1 className="mt-3 max-w-4xl text-5xl font-black tracking-[-0.06em] md:text-7xl">
                A/B benchmark check
              </h1>

              <p className="mt-4 max-w-2xl text-zinc-400">
                Pick a baseline and a candidate run. The comparison should tell
                you if the tweak really improved FPS, lows, frametime and sensor
                behavior.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <NavButton href="/sessions">Sessions</NavButton>
              <NavButton href="/import">Import run</NavButton>
            </div>
          </header>

          <CompareSelector
            sessions={sessions}
            baselineId={params.s1}
            comparisonId={params.s2}
          />

          {!comparison ? (
            <EmptyComparison sessions={sessions} />
          ) : (
            <>
              <ComparisonHero
                comparison={comparison}
                baselineSession={baselineSession}
                comparisonSession={comparisonSession}
              />

              <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
                <MetricTable
                  title="Performance"
                  description="FPS, lows, frametime and stability metrics from the selected sessions."
                  metrics={comparison.metrics}
                />

                <MetricTable
                  title="Sensors"
                  description="Temperatures, power and load. This becomes more valuable once both sessions have HWiNFO data."
                  metrics={comparison.sensorMetrics}
                  emptyText="No matching sensor summaries found for both sessions."
                />
              </section>
            </>
          )}
        </div>
      </main>
    </>
  );
}

function CompareSelector({
  sessions,
  baselineId,
  comparisonId,
}: {
  sessions: PerformanceSession[];
  baselineId?: string;
  comparisonId?: string;
}) {
  return (
    <section className="mt-8 rounded-3xl border border-violet-950/70 bg-[#0d0716]/80 p-6 shadow-2xl shadow-black/25">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-violet-300">
            Select runs
          </p>

          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
            Baseline vs candidate
          </h2>
        </div>

        <p className="max-w-xl text-sm leading-6 text-zinc-500">
          Baseline is the state you trust. Candidate is the tweak you want to
          judge.
        </p>
      </div>

      <form className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
        <SessionSelect
          label="Baseline"
          name="s1"
          sessions={sessions}
          defaultValue={baselineId ?? ""}
        />

        <SessionSelect
          label="Candidate"
          name="s2"
          sessions={sessions}
          defaultValue={comparisonId ?? ""}
        />

        <button
          type="submit"
          className="rounded-2xl bg-violet-300 px-6 py-3 font-semibold text-black transition hover:bg-violet-200"
        >
          Compare
        </button>
      </form>
    </section>
  );
}

function SessionSelect({
  label,
  name,
  sessions,
  defaultValue,
}: {
  label: string;
  name: string;
  sessions: PerformanceSession[];
  defaultValue: string;
}) {
  return (
    <label className="grid min-w-0 gap-2">
      <span className="text-sm text-zinc-500">{label}</span>

      <select
        name={name}
        defaultValue={defaultValue}
        className="w-full min-w-0 rounded-2xl border border-violet-950/80 bg-black/40 px-4 py-3 text-zinc-100 outline-none transition focus:border-violet-300"
      >
        <option value="">Select session</option>

        {sessions.map((session) => (
          <option key={session.id} value={session.id}>
            #{session.id} · {session.gameName} ·{" "}
            {session.scenario ?? "No scenario"}
          </option>
        ))}
      </select>
    </label>
  );
}

function ComparisonHero({
  comparison,
  baselineSession,
  comparisonSession,
}: {
  comparison: PerformanceComparisonResult;
  baselineSession: PerformanceSession | null;
  comparisonSession: PerformanceSession | null;
}) {
  const performanceStats = getVerdictStats(comparison.metrics);
  const sensorStats = getVerdictStats(comparison.sensorMetrics);

  return (
    <section className="mt-8 overflow-hidden rounded-3xl border border-violet-950/70 bg-[#0d0716]/80 shadow-2xl shadow-black/25">
      <div className="grid gap-0 lg:grid-cols-[1fr_1fr]">
        <RunPanel
          label="Baseline"
          sessionId={comparison.baselineSessionId}
          title={comparison.baselineLabel}
          session={baselineSession}
        />

        <RunPanel
          label="Candidate"
          sessionId={comparison.comparisonSessionId}
          title={comparison.comparisonLabel}
          session={comparisonSession}
          highlighted
        />
      </div>

      <div className="border-t border-violet-950/70 p-6">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-violet-300">
          Result
        </p>

        <h2 className="mt-3 max-w-4xl text-3xl font-semibold tracking-[-0.04em] text-zinc-50">
          {comparison.summary}
        </h2>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryPill
            label="Performance improved"
            value={performanceStats.improved}
          />
          <SummaryPill
            label="Performance regressed"
            value={performanceStats.regressed}
            tone="danger"
          />
          <SummaryPill label="Sensor improved" value={sensorStats.improved} />
          <SummaryPill
            label="Sensor regressed"
            value={sensorStats.regressed}
            tone="danger"
          />
        </div>
      </div>
    </section>
  );
}

function RunPanel({
  label,
  sessionId,
  title,
  session,
  highlighted = false,
}: {
  label: string;
  sessionId: number;
  title: string;
  session: PerformanceSession | null;
  highlighted?: boolean;
}) {
  return (
    <section
      className={`min-w-0 p-6 ${
        highlighted
          ? "border-t border-violet-950/70 bg-violet-950/20 lg:border-l lg:border-t-0"
          : ""
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-[0.26em] text-zinc-600">
        {label}
      </p>

      <div className="mt-3 flex min-w-0 items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-2xl font-semibold text-zinc-50">
            {title}
          </h3>

          <p className="mt-2 text-sm text-zinc-500">Session #{sessionId}</p>
        </div>

        <Link
          href={`/sessions/${sessionId}`}
          className="shrink-0 rounded-full border border-violet-900/80 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-violet-300 hover:text-violet-200"
        >
          Open
        </Link>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <RunMetric label="AVG" value={formatNumber(session?.averageFps)} />
        <RunMetric
          label="1% Low"
          value={formatNumber(session?.onePercentLowFps)}
        />
        <RunMetric
          label="P99"
          value={formatNumber(session?.p99FrameTimeMs, " ms")}
        />
      </div>
    </section>
  );
}

function MetricTable({
  title,
  description,
  metrics,
  emptyText = "No metrics available.",
}: {
  title: string;
  description: string;
  metrics: MetricComparison[];
  emptyText?: string;
}) {
  return (
    <section className="rounded-3xl border border-violet-950/70 bg-[#0d0716]/80 p-6 shadow-2xl shadow-black/25">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-violet-300">
          {title}
        </p>

        <h2 className="text-3xl font-semibold tracking-[-0.04em]">
          Metric verdicts
        </h2>

        <p className="max-w-xl text-sm leading-6 text-zinc-500">
          {description}
        </p>
      </div>

      {metrics.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-violet-950/70 bg-black/25 p-5 text-sm text-zinc-500">
          {emptyText}
        </p>
      ) : (
        <div className="mt-6 divide-y divide-violet-950/70 overflow-hidden rounded-2xl border border-violet-950/70 bg-black/20">
          {metrics.map((metric) => (
            <MetricRow key={metric.metricName} metric={metric} />
          ))}
        </div>
      )}
    </section>
  );
}

function MetricRow({ metric }: { metric: MetricComparison }) {
  return (
    <article className="grid gap-4 p-5 lg:grid-cols-[1.2fr_1fr_auto] lg:items-center">
      <div className="min-w-0">
        <h3 className="truncate font-semibold text-zinc-100">
          {metric.metricName}
        </h3>

        <p className="mt-1 text-sm text-zinc-500">
          {formatMetricValue(metric.baselineValue, metric.unit)} →{" "}
          {formatMetricValue(metric.comparisonValue, metric.unit)}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <DeltaBox
          label="Delta"
          value={formatMetricValue(metric.absoluteChange, metric.unit)}
        />

        <DeltaBox
          label="Change"
          value={formatNumber(metric.percentageChange, " %")}
        />
      </div>

      <span
        className={`inline-flex justify-center rounded-full border px-3 py-1 text-xs font-medium ${getVerdictClass(
          metric.verdict,
        )}`}
      >
        {metric.verdict}
      </span>
    </article>
  );
}

function DeltaBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-l border-violet-950/70 pl-3">
      <p className="text-xs text-zinc-600">{label}</p>
      <p className="mt-1 truncate text-sm font-medium text-zinc-100">{value}</p>
    </div>
  );
}

function SummaryPill({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "danger";
}) {
  return (
    <div className="rounded-2xl border border-violet-950/70 bg-black/25 p-4">
      <p className="text-xs text-zinc-600">{label}</p>
      <p
        className={`mt-1 text-3xl font-black tracking-[-0.04em] ${
          tone === "danger" ? "text-rose-300" : "text-violet-300"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function RunMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-violet-950/70 bg-black/25 p-4">
      <p className="text-xs text-zinc-600">{label}</p>
      <p className="mt-1 truncate text-xl font-semibold text-zinc-100">
        {value}
      </p>
    </div>
  );
}

function EmptyComparison({ sessions }: { sessions: PerformanceSession[] }) {
  return (
    <section className="mt-8 rounded-3xl border border-violet-950/70 bg-[#0d0716]/80 p-8 shadow-2xl shadow-black/25">
      <h2 className="text-3xl font-semibold tracking-[-0.04em]">
        Select two runs to compare
      </h2>

      <p className="mt-3 max-w-2xl text-zinc-500">
        You need a baseline and a candidate session. A good comparison is only
        useful when both runs share the same game, scenario and capture method.
      </p>

      {sessions.length > 0 && (
        <div className="mt-6 grid gap-3 lg:grid-cols-2">
          {sessions.slice(0, 4).map((session) => (
            <Link
              key={session.id}
              href={`/sessions/${session.id}`}
              className="rounded-2xl border border-violet-950/70 bg-black/25 p-4 transition hover:border-violet-400"
            >
              <p className="text-sm font-semibold text-zinc-100">
                #{session.id} · {session.gameName}
              </p>

              <p className="mt-1 line-clamp-1 text-sm text-zinc-500">
                {session.scenario ?? "No scenario"}
              </p>
            </Link>
          ))}
        </div>
      )}
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
