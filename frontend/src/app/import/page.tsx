import Link from "next/link";
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
  gameName: string;
  scenario: string | null;
  sourceType: string;
  averageFps: number | null;
  p99FrameTimeMs: number | null;
  createdAt: string;
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

export default async function ImportPage() {
  const [builds, snapshots, sessions] = await Promise.all([
    getBuilds(),
    getSnapshots(),
    getSessions(),
  ]);

  return (
    <>
      <AppHeader />

      <main className="min-h-screen px-6 py-10 text-zinc-100">
        <div className="mx-auto max-w-7xl">
          <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-violet-300">
                Import
              </p>

              <h1 className="mt-3 max-w-4xl text-5xl font-black tracking-[-0.06em] md:text-7xl">
                Capture pipeline
              </h1>

              <p className="mt-4 max-w-2xl text-zinc-400">
                Create the performance run first with CapFrameX, then attach the
                matching HWiNFO CSV to that exact session. Clean input makes
                every comparison more trustworthy.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <NavButton href="/sessions">Sessions</NavButton>
              <NavButton href="/compare">Compare</NavButton>
            </div>
          </header>

          <section className="mt-8 grid overflow-hidden rounded-3xl border border-violet-950/70 bg-[#0d0716]/70 sm:grid-cols-3">
            <SummaryItem
              label="Hardware builds"
              value={builds.length}
              hint={builds.length > 0 ? "Ready" : "Missing"}
            />
            <SummaryItem
              label="Tweak snapshots"
              value={snapshots.length}
              hint={snapshots.length > 0 ? "Ready" : "Needed for imports"}
            />
            <SummaryItem
              label="Benchmark runs"
              value={sessions.length}
              hint={sessions.length > 0 ? "Available" : "No runs yet"}
            />
          </section>

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
                CapFrameX creates the session. HWiNFO enriches that same session
                with thermals, power, clocks and limiter context.
              </p>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <PipelineStep
                number="01"
                title="Pick snapshot"
                text="Choose the BIOS / OS / driver state that produced this capture."
              />
              <PipelineStep
                number="02"
                title="Import CapFrameX"
                text="Creates the performance session with FPS, lows and frametime data."
              />
              <PipelineStep
                number="03"
                title="Attach HWiNFO"
                text="Adds sensor diagnostics to the same session for tuning decisions."
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

function SummaryItem({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="border-b border-violet-950/70 p-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <p className="text-xs uppercase tracking-[0.22em] text-zinc-600">
        {label}
      </p>

      <p className="mt-2 text-4xl font-black tracking-[-0.05em] text-zinc-50">
        {value}
      </p>

      <p className="mt-1 text-sm text-zinc-500">{hint}</p>
    </div>
  );
}

function PipelineStep({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <article className="rounded-2xl border border-violet-950/70 bg-black/25 p-4">
      <p className="font-mono text-sm text-violet-300">{number}</p>
      <p className="mt-3 font-semibold text-zinc-100">{title}</p>
      <p className="mt-1 text-sm leading-6 text-zinc-500">{text}</p>
    </article>
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
