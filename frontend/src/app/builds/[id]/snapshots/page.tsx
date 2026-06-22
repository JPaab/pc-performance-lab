import Link from "next/link";
import { buildApiUrl } from "@/lib/api";
import { CreateSnapshotForm } from "./create-snapshot-form";

type PcBuild = {
  id: number;
  name: string;
  cpu: string;
  gpu: string;
  ramGb: number;
  motherboard: string | null;
  storage: string | null;
  monitor: string | null;
  operatingSystem: string | null;
  gpuDriver: string | null;
  createdAt: string;
};

type HardwareSnapshot = {
  id: number;
  buildId: number;
  name: string;
  cpuOverclock: string | null;
  ramProfile: string | null;
  ramTimings: string | null;
  trfc: number | null;
  trefi: number | null;
  commandRate: string | null;
  gearMode: string | null;
  biosVersion: string | null;
  operatingSystemProfile: string | null;
  powerPlan: string | null;
  hagsEnabled: boolean | null;
  gpuDriver: string | null;
  tweakTags: string[];
  notes: string | null;
  createdAt: string;
};

async function getBuild(id: string): Promise<PcBuild | null> {
  try {
    const response = await fetch(buildApiUrl(`/api/builds/${id}`), {
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

async function getSnapshots(buildId: string): Promise<HardwareSnapshot[]> {
  try {
    const response = await fetch(
      buildApiUrl(`/api/builds/${buildId}/snapshots`),
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

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | number | boolean | null | undefined;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-zinc-900 py-3 last:border-b-0">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className="text-right text-sm font-medium text-zinc-200">
        {value === null || value === undefined ? "—" : String(value)}
      </span>
    </div>
  );
}

export default async function BuildSnapshotsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [build, snapshots] = await Promise.all([
    getBuild(id),
    getSnapshots(id),
  ]);

  if (!build) {
    return (
      <main className="min-h-screen bg-black px-6 py-10 text-zinc-100">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/builds"
            className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
          >
            ← Back to builds
          </Link>

          <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-8">
            <h1 className="text-3xl font-bold">Build not found</h1>
            <p className="mt-3 text-zinc-500">
              The backend did not return a PC build for this ID.
            </p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-zinc-100">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10">
          <Link
            href="/builds"
            className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
          >
            ← Back to builds
          </Link>

          <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-emerald-400">
                Build #{build.id}
              </p>

              <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-6xl">
                {build.name}
              </h1>

              <p className="mt-4 max-w-2xl text-zinc-400">
                {build.cpu} · {build.gpu} · {build.ramGb} GB RAM
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/import"
                className="rounded-full border border-zinc-800 px-5 py-3 text-sm font-medium text-zinc-300 transition hover:border-emerald-400 hover:text-emerald-400"
              >
                Import data
              </Link>

              <Link
                href="/sessions"
                className="rounded-full border border-zinc-800 px-5 py-3 text-sm font-medium text-zinc-300 transition hover:border-emerald-400 hover:text-emerald-400"
              >
                Sessions
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <CreateSnapshotForm buildId={build.id} />

          <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6">
            <h2 className="text-xl font-semibold">Hardware snapshots</h2>

            {snapshots.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-500">
                No snapshots registered for this build yet. Create the first
                snapshot using the form.
              </p>
            ) : (
              <div className="mt-5 grid gap-4">
                {snapshots.map((snapshot) => (
                  <article
                    key={snapshot.id}
                    className="rounded-2xl border border-zinc-900 bg-black/40 p-5"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-xs text-zinc-500">
                          Snapshot #{snapshot.id}
                        </p>
                        <h3 className="mt-1 text-2xl font-semibold text-zinc-50">
                          {snapshot.name}
                        </h3>
                      </div>

                      <Link
                        href="/import"
                        className="rounded-full border border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-emerald-400 hover:text-emerald-400"
                      >
                        Import benchmark
                      </Link>
                    </div>

                    <div className="mt-5">
                      <InfoRow
                        label="CPU overclock"
                        value={snapshot.cpuOverclock}
                      />
                      <InfoRow
                        label="RAM profile"
                        value={snapshot.ramProfile}
                      />
                      <InfoRow
                        label="RAM timings"
                        value={snapshot.ramTimings}
                      />
                      <InfoRow label="tRFC" value={snapshot.trfc} />
                      <InfoRow label="tREFI" value={snapshot.trefi} />
                      <InfoRow
                        label="Command rate"
                        value={snapshot.commandRate}
                      />
                      <InfoRow label="Gear mode" value={snapshot.gearMode} />
                      <InfoRow
                        label="BIOS version"
                        value={snapshot.biosVersion}
                      />
                      <InfoRow
                        label="OS profile"
                        value={snapshot.operatingSystemProfile}
                      />
                      <InfoRow label="Power plan" value={snapshot.powerPlan} />
                      <InfoRow
                        label="HAGS enabled"
                        value={snapshot.hagsEnabled}
                      />
                      <InfoRow label="GPU driver" value={snapshot.gpuDriver} />
                    </div>

                    {snapshot.tweakTags.length > 0 && (
                      <div className="mt-5 flex flex-wrap gap-2">
                        {snapshot.tweakTags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-zinc-900 px-3 py-1 text-xs text-zinc-400"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {snapshot.notes && (
                      <p className="mt-5 border-t border-zinc-900 pt-4 text-sm text-zinc-500">
                        {snapshot.notes}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
