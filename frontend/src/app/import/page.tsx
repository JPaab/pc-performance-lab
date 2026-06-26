import { AppHeader } from "@/components/app-header";
import { buildApiUrl } from "@/lib/api";
import { ImportForms } from "./import-forms";

type PcBuild = {
  id: number;
  name: string;
  cpu: string;
  gpu: string;
  ramGb: number;
};

type HardwareSnapshot = {
  id: number;
  buildId: number;
  name: string;
  operatingSystemProfile: string | null;
  powerPlan: string | null;
  hagsEnabled: boolean | null;
  gpuDriver: string | null;
};

type PerformanceSession = {
  id: number;
  snapshotId: number;
  snapshotName: string;
  buildId: number;
  buildName: string;
  gameName: string;
  scenario: string | null;
  sourceType: string;
  averageFps: number | null;
  p99FrameTimeMs: number | null;
  hasSensorSummary: boolean;
  createdAt: string;
};

type DashboardCounts = {
  sensorSummaryCount?: number;
};

type DashboardSummary = {
  counts?: DashboardCounts;
  sensorSummaryCount?: number;
};

async function getBuilds(): Promise<PcBuild[]> {
  try {
    const response = await fetch(buildApiUrl("/api/builds"), {
      cache: "no-store",
    });

    if (!response.ok) {
      return [];
    }

    const builds = (await response.json()) as PcBuild[];

    return builds.sort((a, b) => b.id - a.id);
  } catch {
    return [];
  }
}

async function getSnapshots(): Promise<HardwareSnapshot[]> {
  try {
    const response = await fetch(buildApiUrl("/api/snapshots"), {
      cache: "no-store",
    });

    if (!response.ok) {
      return [];
    }

    const snapshots = (await response.json()) as HardwareSnapshot[];

    return snapshots.sort((a, b) => b.id - a.id);
  } catch {
    return [];
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

export default async function ImportPage() {
  const [builds, snapshots, sessions, dashboardSummary] = await Promise.all([
    getBuilds(),
    getSnapshots(),
    getSessions(),
    getDashboardSummary(),
  ]);

  const hasBuilds = builds.length > 0;
  const hasSnapshots = snapshots.length > 0;
  const hasSessions = sessions.length > 0;
  const sensorSummaryCount =
    dashboardSummary?.counts?.sensorSummaryCount ??
    dashboardSummary?.sensorSummaryCount ??
    0;
  const hasSensorSummaries = sensorSummaryCount > 0;

  return (
    <>
      <AppHeader />

      <main className="min-h-screen px-6 py-10 text-zinc-100">
        <div className="mx-auto max-w-7xl">
          <header className="max-w-4xl">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-violet-300">
              Import
            </p>

            <h1 className="mt-3 text-5xl font-black tracking-[-0.06em] md:text-7xl">
              Capture pipeline
            </h1>

            <p className="mt-4 max-w-2xl text-zinc-400">
              Pick the tuning state, import the CapFrameX run, then attach the
              matching HWiNFO sensor log to that same session.
            </p>
          </header>

          <section className="mt-8 rounded-3xl border border-violet-950/70 bg-[#0d0716]/80 p-6 shadow-2xl shadow-black/25">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.25em] text-violet-300">
                  Correct order
                </p>

                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
                  One run, two files
                </h2>
              </div>

              <p className="max-w-xl text-sm leading-6 text-zinc-500">
                CapFrameX creates the benchmark session. HWiNFO adds thermals,
                power, clocks and limiter context.
              </p>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <PipelineStep
                number="01"
                title="Pick tuning state"
                text={
                  hasSnapshots
                    ? "Choose the snapshot that produced this capture."
                    : hasBuilds
                      ? "Create a tuning snapshot before importing."
                      : "Create hardware first, then add a tuning snapshot."
                }
                status={hasSnapshots ? "Ready" : "Locked"}
                done={hasSnapshots}
                locked={!hasSnapshots}
              />

              <PipelineStep
                number="02"
                title="Import CapFrameX"
                text={
                  hasSessions
                    ? "Run data exists. You can attach sensors or import another capture."
                    : hasSnapshots
                      ? "Creates the run with FPS, lows and frametime data."
                      : "Unlocked after a tuning state exists."
                }
                status={
                  !hasSnapshots ? "Locked" : hasSessions ? "Ready" : "Next"
                }
                done={hasSessions}
                locked={!hasSnapshots}
              />

              <PipelineStep
                number="03"
                title="Attach HWiNFO"
                text={
                  hasSensorSummaries
                    ? "Sensor diagnostics exist for imported runs."
                    : hasSessions
                      ? "Select a run and attach its matching sensor CSV."
                      : "Unlocked after importing a CapFrameX run."
                }
                status={
                  !hasSessions
                    ? "Locked"
                    : hasSensorSummaries
                      ? "Ready"
                      : "Next"
                }
                done={hasSensorSummaries}
                locked={!hasSessions}
              />
            </div>
          </section>

          <ImportForms
            builds={builds}
            snapshots={snapshots}
            sessions={sessions}
          />
        </div>
      </main>
    </>
  );
}

function PipelineStep({
  number,
  title,
  text,
  status,
  done,
  locked,
}: {
  number: string;
  title: string;
  text: string;
  status: string;
  done: boolean;
  locked: boolean;
}) {
  return (
    <article
      className={`rounded-2xl border p-4 ${
        locked
          ? "border-violet-950/40 bg-black/15 opacity-70"
          : "border-violet-950/70 bg-black/25"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <p
          className={`font-mono text-sm ${
            locked ? "text-zinc-700" : "text-violet-300"
          }`}
        >
          {number}
        </p>

        <span
          className={`rounded-full border px-3 py-1 text-xs font-medium ${
            locked
              ? "border-zinc-800 bg-black/20 text-zinc-700"
              : done
                ? "border-green-500/30 bg-green-500/10 text-green-300"
                : "border-violet-950/80 bg-black/30 text-zinc-500"
          }`}
        >
          {status}
        </span>
      </div>

      <p
        className={`mt-3 font-semibold ${
          locked ? "text-zinc-700" : "text-zinc-100"
        }`}
      >
        {title}
      </p>

      <p className="mt-1 text-sm leading-6 text-zinc-500">{text}</p>
    </article>
  );
}
