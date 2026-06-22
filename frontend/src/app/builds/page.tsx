import Link from "next/link";
import { buildApiUrl } from "@/lib/api";
import { CreateBuildForm } from "./create-build-form";

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

async function getBuilds(): Promise<PcBuild[]> {
  try {
    const response = await fetch(buildApiUrl("/api/builds"), {
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

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | number | null;
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

export default async function BuildsPage() {
  const builds = await getBuilds();

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-zinc-100">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-emerald-400">
              Builds
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-6xl">
              PC builds
            </h1>
            <p className="mt-4 max-w-2xl text-zinc-400">
              Register the machines you benchmark so every snapshot and
              performance session has proper hardware context.
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
              href="/import"
              className="rounded-full border border-zinc-800 px-5 py-3 text-sm font-medium text-zinc-300 transition hover:border-emerald-400 hover:text-emerald-400"
            >
              Import data
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <CreateBuildForm />

          <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6">
            <h2 className="text-xl font-semibold">Registered builds</h2>

            {builds.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-500">
                No PC builds registered yet. Create your first build using the
                form.
              </p>
            ) : (
              <div className="mt-5 grid gap-4">
                {builds.map((build) => (
                  <article
                    key={build.id}
                    className="rounded-2xl border border-zinc-900 bg-black/40 p-5"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-xs text-zinc-500">
                          Build #{build.id}
                        </p>
                        <h3 className="mt-1 text-2xl font-semibold text-zinc-50">
                          {build.name}
                        </h3>
                      </div>

                      <Link
                        href={`/builds/${build.id}/snapshots`}
                        className="rounded-full border border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-emerald-400 hover:text-emerald-400"
                      >
                        View snapshots
                      </Link>
                    </div>

                    <div className="mt-5">
                      <InfoRow label="CPU" value={build.cpu} />
                      <InfoRow label="GPU" value={build.gpu} />
                      <InfoRow label="RAM" value={`${build.ramGb} GB`} />
                      <InfoRow label="Motherboard" value={build.motherboard} />
                      <InfoRow label="Storage" value={build.storage} />
                      <InfoRow label="Monitor" value={build.monitor} />
                      <InfoRow label="OS" value={build.operatingSystem} />
                      <InfoRow label="GPU driver" value={build.gpuDriver} />
                    </div>
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
