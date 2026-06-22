import Link from "next/link";
import { buildApiUrl } from "@/lib/api";
import { ImportForms } from "./import-forms";

type HardwareSnapshot = {
  id: number;
  buildId: number;
  name: string;
  cpuOverclock: string | null;
  ramProfile: string | null;
  operatingSystemProfile: string | null;
  tweakTags: string[];
  createdAt: string;
};

type PerformanceSession = {
  id: number;
  snapshotId: number;
  gameName: string;
  scenario: string | null;
  sourceType: string;
  averageFps: number | null;
  createdAt: string;
};

async function getSnapshots(): Promise<HardwareSnapshot[]> {
  try {
    const response = await fetch(buildApiUrl("/api/snapshots"), {
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

export default async function ImportPage() {
  const [snapshots, sessions] = await Promise.all([
    getSnapshots(),
    getSessions(),
  ]);

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-zinc-100">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-emerald-400">
              Import
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-6xl">
              Import benchmark data
            </h1>
            <p className="mt-4 max-w-2xl text-zinc-400">
              Upload CapFrameX JSON files to create performance sessions and
              HWiNFO CSV files to attach sensor summaries.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-full border border-zinc-800 px-5 py-3 text-sm font-medium text-zinc-300 transition hover:border-emerald-400 hover:text-emerald-400"
            >
              Dashboard
            </Link>

            <Link
              href="/sessions"
              className="rounded-full border border-zinc-800 px-5 py-3 text-sm font-medium text-zinc-300 transition hover:border-emerald-400 hover:text-emerald-400"
            >
              Sessions
            </Link>
          </div>
        </div>

        <ImportForms snapshots={snapshots} sessions={sessions} />
      </div>
    </main>
  );
}
