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
                Feed the lab
              </h1>

              <p className="mt-4 max-w-2xl text-zinc-400">
                Import CapFrameX first to create a performance session. Then
                attach the matching HWiNFO CSV to that exact run.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <NavButton href="/sessions">Sessions</NavButton>
              <NavButton href="/compare">Compare</NavButton>
            </div>
          </header>

          <section className="mt-8 grid overflow-hidden rounded-3xl border border-violet-950/70 bg-[#0d0716]/70 sm:grid-cols-3">
            <SummaryItem label="Builds" value={builds.length} />
            <SummaryItem label="Snapshots" value={snapshots.length} />
            <SummaryItem label="Sessions" value={sessions.length} />
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

function SummaryItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-b border-violet-950/70 p-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <p className="text-xs uppercase tracking-[0.22em] text-zinc-600">
        {label}
      </p>

      <p className="mt-2 text-4xl font-black tracking-[-0.05em] text-zinc-50">
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
