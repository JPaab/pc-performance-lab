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

export default async function BuildsPage() {
  const builds = await getBuilds();

  return (
    <main className="min-h-screen px-6 py-10 text-zinc-100">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-violet-300">
              Builds
            </p>

            <h1 className="mt-3 max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
              PC builds
            </h1>

            <p className="mt-4 max-w-2xl text-zinc-400">
              Register the base machine once. Then create snapshots for BIOS,
              Windows, drivers and tweak states.
            </p>
          </div>

          <nav className="flex flex-wrap gap-3">
            <NavButton href="/">Dashboard</NavButton>
            <NavButton href="/import">Import</NavButton>
            <NavButton href="/sessions">Sessions</NavButton>
          </nav>
        </header>

        <div className="mt-10 grid gap-6 lg:grid-cols-[390px_1fr] lg:items-start">
          <CreateBuildForm />

          <section id="registered-machines">
            <div className="mb-5 rounded-3xl border border-violet-950/70 bg-[#0d0716]/70 p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.25em] text-violet-300">
                    Registered machines
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold">
                    Hardware saved
                  </h2>
                </div>

                <p className="max-w-xl text-sm text-zinc-500">
                  Pick a build to register snapshots and attach benchmark data
                  to the right hardware context.
                </p>
              </div>
            </div>

            {builds.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid gap-5 xl:grid-cols-2">
                {builds.map((build) => (
                  <BuildCard key={build.id} build={build} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function BuildCard({ build }: { build: PcBuild }) {
  return (
    <article className="group rounded-3xl border border-violet-950/70 bg-[#0d0716]/85 p-5 shadow-2xl shadow-black/30 transition hover:border-violet-700/80">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
            Build #{build.id}
          </p>

          <h3 className="mt-2 text-2xl font-semibold text-zinc-50">
            {build.name}
          </h3>
        </div>

        <Link
          href={`/builds/${build.id}/snapshots`}
          className="shrink-0 rounded-full border border-violet-900/80 px-4 py-2 text-sm font-medium text-zinc-300 transition group-hover:border-violet-300 group-hover:text-violet-200"
        >
          Snapshots
        </Link>
      </div>

      <div className="mt-5 grid gap-3">
        <MainSpec label="CPU" value={build.cpu} />
        <MainSpec label="GPU" value={build.gpu} />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Spec label="RAM" value={`${build.ramGb} GB`} />
        <Spec label="Motherboard" value={build.motherboard} />
        <Spec label="Storage" value={build.storage} />
        <Spec label="Monitor" value={build.monitor} />
        <Spec label="OS" value={build.operatingSystem} />
        <Spec label="GPU driver" value={build.gpuDriver} />
      </div>
    </article>
  );
}

function MainSpec({
  label,
  value,
}: {
  label: string;
  value: string | number | null;
}) {
  return (
    <div className="rounded-2xl border border-violet-900/60 bg-violet-950/20 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-zinc-100">{value ?? "—"}</p>
    </div>
  );
}

function Spec({
  label,
  value,
}: {
  label: string;
  value: string | number | null;
}) {
  return (
    <div className="rounded-2xl border border-violet-950/60 bg-black/25 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-zinc-100">{value ?? "—"}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <section className="rounded-3xl border border-violet-950/70 bg-[#0d0716]/85 p-8">
      <h2 className="text-2xl font-semibold">No builds yet</h2>
      <p className="mt-3 max-w-xl text-zinc-500">
        Create your first PC build on the left. After that you can register
        snapshots, import benchmark data and compare sessions.
      </p>
    </section>
  );
}

function NavButton({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="inline-flex rounded-full border border-violet-950/80 px-5 py-3 text-sm font-medium text-zinc-300 transition hover:border-violet-300 hover:text-violet-200"
    >
      {children}
    </Link>
  );
}
