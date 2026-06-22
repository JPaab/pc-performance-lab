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

type HealthTone = "good" | "warning" | "bad" | "info";

type Decision = {
  title: string;
  description: string;
  tone: HealthTone;
  score: number;
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

function formatFps(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "—";
  }

  return `${Math.round(value)} fps`;
}

function formatMetricValue(value: number | null | undefined, unit: string) {
  if (value === null || value === undefined) {
    return "—";
  }

  if (unit.toLowerCase().includes("fps")) {
    return formatFps(value);
  }

  return `${value.toFixed(2)}${unit ? ` ${unit}` : ""}`;
}

function formatDelta(metric: MetricComparison | null) {
  if (!metric || metric.absoluteChange === null) {
    return "—";
  }

  const sign = metric.absoluteChange > 0 ? "+" : "";

  if (metric.unit.toLowerCase().includes("fps")) {
    return `${sign}${metric.absoluteChange.toFixed(1)} fps`;
  }

  return `${sign}${metric.absoluteChange.toFixed(2)}${
    metric.unit ? ` ${metric.unit}` : ""
  }`;
}

function formatPercentDelta(metric: MetricComparison | null) {
  if (!metric || metric.percentageChange === null) {
    return "—";
  }

  const sign = metric.percentageChange > 0 ? "+" : "";

  return `${sign}${metric.percentageChange.toFixed(1)}%`;
}

function findSessionById(sessions: PerformanceSession[], id?: string) {
  if (!id) {
    return null;
  }

  return sessions.find((session) => String(session.id) === id) ?? null;
}

function findMetric(metrics: MetricComparison[], names: string[]) {
  return (
    metrics.find((metric) => {
      const metricName = metric.metricName.toLowerCase();

      return names.some((name) => metricName.includes(name.toLowerCase()));
    }) ?? null
  );
}

function getMetricTone(metric: MetricComparison | null): HealthTone {
  if (!metric) {
    return "info";
  }

  if (metric.verdict === "IMPROVED") {
    return "good";
  }

  if (metric.verdict === "REGRESSED") {
    return "bad";
  }

  if (metric.verdict === "NO_DATA") {
    return "info";
  }

  return "info";
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

function getToneBorderClass(tone: HealthTone) {
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

function getMetricWeight(metricName: string) {
  const name = metricName.toLowerCase();

  if (name.includes("dropped")) {
    return 4;
  }

  if (name.includes("0.1") || name.includes("p99")) {
    return 3;
  }

  if (name.includes("1%") || name.includes("stutter")) {
    return 2;
  }

  if (name.includes("average") || name.includes("fps")) {
    return 1;
  }

  return 1;
}

function getDecision(comparison: PerformanceComparisonResult): Decision {
  const score = comparison.metrics.reduce((total, metric) => {
    const weight = getMetricWeight(metric.metricName);

    if (metric.verdict === "IMPROVED") {
      return total + weight;
    }

    if (metric.verdict === "REGRESSED") {
      return total - weight;
    }

    return total;
  }, 0);

  const sensorScore = comparison.sensorMetrics.reduce((total, metric) => {
    if (metric.verdict === "IMPROVED") {
      return total + 1;
    }

    if (metric.verdict === "REGRESSED") {
      return total - 1;
    }

    return total;
  }, 0);

  const finalScore = score + Math.max(Math.min(sensorScore, 2), -2);

  if (finalScore >= 4) {
    return {
      title: "Candidate wins",
      description:
        "The candidate run looks meaningfully better. Keep it unless a specific game feel issue says otherwise.",
      tone: "good",
      score: finalScore,
    };
  }

  if (finalScore <= -4) {
    return {
      title: "Baseline holds",
      description:
        "The candidate regresses too much. This tweak does not look worth keeping.",
      tone: "bad",
      score: finalScore,
    };
  }

  if (finalScore > 0) {
    return {
      title: "Small candidate edge",
      description:
        "The candidate is slightly better, but the result is not dominant. Validate with another run.",
      tone: "warning",
      score: finalScore,
    };
  }

  if (finalScore < 0) {
    return {
      title: "Small baseline edge",
      description:
        "The baseline is slightly safer. The candidate needs another run before trusting it.",
      tone: "warning",
      score: finalScore,
    };
  }

  return {
    title: "Too close to call",
    description:
      "The result is basically tied. Treat it as noise unless repeated captures confirm it.",
    tone: "info",
    score: finalScore,
  };
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
                Tweak verdict
              </h1>

              <p className="mt-4 max-w-2xl text-zinc-400">
                Compare a trusted baseline against a candidate tweak. The goal
                is not more numbers — it is deciding what deserves to stay.
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
              <ComparisonDecision
                comparison={comparison}
                baselineSession={baselineSession}
                comparisonSession={comparisonSession}
              />

              <section className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <PerformanceImpact comparison={comparison} />
                <SensorImpact comparison={comparison} />
              </section>

              <DetailedDeltas comparison={comparison} />
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
          Baseline is the known-good state. Candidate is the tweak being judged.
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

function ComparisonDecision({
  comparison,
  baselineSession,
  comparisonSession,
}: {
  comparison: PerformanceComparisonResult;
  baselineSession: PerformanceSession | null;
  comparisonSession: PerformanceSession | null;
}) {
  const decision = getDecision(comparison);

  return (
    <section
      className={`mt-8 overflow-hidden rounded-3xl border bg-[#0d0716]/80 shadow-2xl shadow-black/25 ${getToneBorderClass(
        decision.tone,
      )}`}
    >
      <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="p-7">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-violet-300">
            A/B verdict
          </p>

          <h2
            className={`mt-3 text-5xl font-black tracking-[-0.06em] ${getToneClass(decision.tone)}`}
          >
            {decision.title}
          </h2>

          <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400">
            {decision.description}
          </p>

          <p className="mt-5 text-sm text-zinc-600">
            Decision score: {decision.score > 0 ? "+" : ""}
            {decision.score}
          </p>
        </div>

        <div className="grid border-t border-violet-950/70 bg-black/20 lg:grid-cols-2 lg:border-l lg:border-t-0">
          <RunSummaryCard
            label="Baseline"
            sessionId={comparison.baselineSessionId}
            title={comparison.baselineLabel}
            session={baselineSession}
          />

          <RunSummaryCard
            label="Candidate"
            sessionId={comparison.comparisonSessionId}
            title={comparison.comparisonLabel}
            session={comparisonSession}
            highlighted
          />
        </div>
      </div>
    </section>
  );
}

function RunSummaryCard({
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
          ? "border-t border-violet-950/70 lg:border-l lg:border-t-0"
          : ""
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-[0.26em] text-zinc-600">
        {label}
      </p>

      <div className="mt-3 flex min-w-0 items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-xl font-semibold text-zinc-50">
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

      <div className="mt-5 grid gap-3">
        <RunMetric label="Average" value={formatFps(session?.averageFps)} />
        <RunMetric
          label="1% Low"
          value={formatFps(session?.onePercentLowFps)}
        />
        <RunMetric
          label="P99"
          value={formatNumber(session?.p99FrameTimeMs, " ms")}
        />
      </div>
    </section>
  );
}

function PerformanceImpact({
  comparison,
}: {
  comparison: PerformanceComparisonResult;
}) {
  const averageFps = findMetric(comparison.metrics, ["average fps"]);
  const onePercentLow = findMetric(comparison.metrics, ["1% low"]);
  const zeroPointOneLow = findMetric(comparison.metrics, ["0.1% low"]);
  const p99 = findMetric(comparison.metrics, ["p99"]);
  const droppedFrames = findMetric(comparison.metrics, ["dropped"]);
  const stutters = findMetric(comparison.metrics, ["stutter"]);

  return (
    <section className="rounded-3xl border border-violet-950/70 bg-[#0d0716]/80 p-6 shadow-2xl shadow-black/25">
      <p className="text-sm font-medium uppercase tracking-[0.25em] text-violet-300">
        Performance impact
      </p>

      <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
        Did it feel better?
      </h2>

      <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
        Focus on lows, P99 and dropped frames. Average FPS alone can lie.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <ImpactCard
          label="Average FPS"
          value={formatDelta(averageFps)}
          detail={`Candidate changed by ${formatPercentDelta(averageFps)}.`}
          tone={getMetricTone(averageFps)}
        />

        <ImpactCard
          label="1% low stability"
          value={formatDelta(onePercentLow)}
          detail={`1% low changed by ${formatPercentDelta(onePercentLow)}.`}
          tone={getMetricTone(onePercentLow)}
        />

        <ImpactCard
          label="0.1% low"
          value={formatDelta(zeroPointOneLow)}
          detail={`Worst-low region changed by ${formatPercentDelta(
            zeroPointOneLow,
          )}.`}
          tone={getMetricTone(zeroPointOneLow)}
        />

        <ImpactCard
          label="P99 frame pacing"
          value={formatDelta(p99)}
          detail="Lower P99 is better. This is one of the most important feel metrics."
          tone={getMetricTone(p99)}
        />

        <ImpactCard
          label="Dropped frames"
          value={formatDelta(droppedFrames)}
          detail="Any increase here matters more than a small average FPS gain."
          tone={getMetricTone(droppedFrames)}
        />

        <ImpactCard
          label="Hitch events"
          value={formatDelta(stutters)}
          detail="Treat this as spike risk, not just a raw stutter count."
          tone={getMetricTone(stutters)}
        />
      </div>
    </section>
  );
}

function SensorImpact({
  comparison,
}: {
  comparison: PerformanceComparisonResult;
}) {
  const cpuTemp = findMetric(comparison.sensorMetrics, [
    "cpu package temp max",
    "cpu temp max",
    "package temp",
  ]);
  const gpuTemp = findMetric(comparison.sensorMetrics, [
    "gpu temperature max",
    "gpu temp max",
  ]);
  const gpuHotspot = findMetric(comparison.sensorMetrics, [
    "hot spot",
    "hotspot",
  ]);
  const cpuPower = findMetric(comparison.sensorMetrics, [
    "cpu package power",
    "cpu power",
  ]);
  const gpuPower = findMetric(comparison.sensorMetrics, ["gpu power"]);
  const gpuLoad = findMetric(comparison.sensorMetrics, [
    "gpu core load",
    "gpu load",
  ]);

  return (
    <section className="rounded-3xl border border-violet-950/70 bg-[#0d0716]/80 p-6 shadow-2xl shadow-black/25">
      <p className="text-sm font-medium uppercase tracking-[0.25em] text-violet-300">
        Sensor impact
      </p>

      <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
        What did it cost?
      </h2>

      <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
        A tweak is not free if it adds heat, power draw or worse limiter
        behavior for tiny FPS gains.
      </p>

      {comparison.sensorMetrics.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-violet-950/70 bg-black/25 p-5 text-sm text-zinc-500">
          No matching HWiNFO summaries found for both sessions.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <ImpactCard
            label="CPU temperature"
            value={formatDelta(cpuTemp)}
            detail="Lower or equal is better if performance is similar."
            tone={getMetricTone(cpuTemp)}
          />

          <ImpactCard
            label="GPU temperature"
            value={formatDelta(gpuTemp)}
            detail="Main GPU temperature delta."
            tone={getMetricTone(gpuTemp)}
          />

          <ImpactCard
            label="GPU hotspot"
            value={formatDelta(gpuHotspot)}
            detail="Hotspot is often more useful than average GPU temp."
            tone={getMetricTone(gpuHotspot)}
          />

          <ImpactCard
            label="CPU package power"
            value={formatDelta(cpuPower)}
            detail="Useful for checking whether CPU-side cost increased."
            tone={getMetricTone(cpuPower)}
          />

          <ImpactCard
            label="GPU power"
            value={formatDelta(gpuPower)}
            detail="Useful for undervolt and efficiency checks."
            tone={getMetricTone(gpuPower)}
          />

          <ImpactCard
            label="GPU load"
            value={formatDelta(gpuLoad)}
            detail="Helps spot CPU-bound or engine-bound runs."
            tone={getMetricTone(gpuLoad)}
          />
        </div>
      )}
    </section>
  );
}

function DetailedDeltas({
  comparison,
}: {
  comparison: PerformanceComparisonResult;
}) {
  return (
    <section className="mt-8 rounded-3xl border border-violet-950/70 bg-[#0d0716]/80 p-6 shadow-2xl shadow-black/25">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-violet-300">
            Details
          </p>

          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
            Full metric deltas
          </h2>
        </div>

        <p className="max-w-xl text-sm leading-6 text-zinc-500">
          Kept for auditability. The cards above are the decision layer.
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <DeltaGroup title="Performance" metrics={comparison.metrics} />

        <DeltaGroup
          title="Sensors"
          metrics={comparison.sensorMetrics}
          emptyText="No matching sensor summaries found for both sessions."
        />
      </div>
    </section>
  );
}

function DeltaGroup({
  title,
  metrics,
  emptyText = "No metrics available.",
}: {
  title: string;
  metrics: MetricComparison[];
  emptyText?: string;
}) {
  return (
    <section>
      <p className="text-sm font-semibold text-zinc-100">{title}</p>

      {metrics.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-violet-950/70 bg-black/25 p-5 text-sm text-zinc-500">
          {emptyText}
        </p>
      ) : (
        <div className="mt-4 divide-y divide-violet-950/70 overflow-hidden rounded-2xl border border-violet-950/70 bg-black/20">
          {metrics.map((metric) => (
            <DeltaRow key={metric.metricName} metric={metric} />
          ))}
        </div>
      )}
    </section>
  );
}

function DeltaRow({ metric }: { metric: MetricComparison }) {
  return (
    <article className="grid gap-3 p-4 md:grid-cols-[1fr_auto] md:items-center">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-zinc-100">
          {metric.metricName}
        </p>

        <p className="mt-1 text-sm text-zinc-500">
          {formatMetricValue(metric.baselineValue, metric.unit)} →{" "}
          {formatMetricValue(metric.comparisonValue, metric.unit)}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 md:justify-end">
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${getToneClass(getMetricTone(metric))}`}
        >
          {formatDelta(metric)}
        </span>

        <span className="rounded-full border border-violet-950/70 bg-black/25 px-3 py-1 text-xs text-zinc-500">
          {metric.verdict}
        </span>
      </div>
    </article>
  );
}

function ImpactCard({
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
    <div className={`rounded-3xl border p-5 ${getToneBorderClass(tone)}`}>
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

function RunMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-violet-950/70 bg-black/25 p-4">
      <p className="text-xs text-zinc-600">{label}</p>
      <p className="mt-1 truncate text-lg font-semibold text-zinc-100">
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
        Choose a known-good baseline and a candidate tweak. Best results come
        from the same game, same scenario and same capture method.
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
