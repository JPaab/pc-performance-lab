import Link from "next/link";
import { AppHeader } from "@/components/app-header";
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

    const builds = (await response.json()) as PcBuild[];

    return builds.sort((a, b) => b.id - a.id);
  } catch {
    return [];
  }
}

export default async function BuildsPage() {
  const builds = await getBuilds();

  return (
    <>
      <AppHeader />

      <main className="min-h-screen px-6 py-10 text-zinc-100">
        <div className="mx-auto max-w-7xl">
          <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-violet-300">
                Builds
              </p>

              <h1 className="mt-3 max-w-4xl text-5xl font-black tracking-[-0.06em] md:text-7xl">
                Hardware library
              </h1>

              <p className="mt-4 max-w-2xl text-zinc-400">
                Register fixed PC hardware once, then create snapshots for BIOS,
                OS, driver and tweak states.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <NavButton href="/import">Import run</NavButton>
              <NavButton href="/sessions">Sessions</NavButton>
            </div>
          </header>

          <section className="mt-8 grid overflow-hidden rounded-3xl border border-violet-950/70 bg-[#0d0716]/70 sm:grid-cols-3">
            <SummaryItem label="Registered builds" value={builds.length} />
            <SummaryText label="Latest build" value={builds[0]?.name ?? "—"} />
            <SummaryText label="Main GPU" value={builds[0]?.gpu ?? "—"} />
          </section>

          <div className="mt-8 grid gap-6 lg:grid-cols-[390px_1fr] lg:items-start">
            <CreateBuildForm />

            <section id="registered-machines">
              <div className="mb-5 rounded-3xl border border-violet-950/70 bg-[#0d0716]/70 p-5">
                <p className="text-sm font-medium uppercase tracking-[0.25em] text-violet-300">
                  Registered machines
                </p>

                <h2 className="mt-2 text-2xl font-semibold">
                  Hardware states start here
                </h2>

                <p className="mt-2 max-w-2xl text-sm text-zinc-500">
                  Keep hardware stable here. Use snapshots for the changes:
                  BIOS, RAM timings, OS tweaks, driver versions and power plans.
                </p>
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
    </>
  );
}

function BuildCard({ build }: { build: PcBuild }) {
  return (
    <article className="group min-w-0 rounded-3xl border border-violet-950/70 bg-[#0d0716]/80 p-5 shadow-2xl shadow-black/25 transition hover:border-violet-700/80">
      <div className="flex min-w-0 items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-600">
            Build #{build.id}
          </p>

          <h3 className="mt-2 truncate text-2xl font-semibold text-zinc-50">
            {build.name}
          </h3>

          <p className="mt-2 text-sm text-zinc-500">
            Created at {build.createdAt}
          </p>
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

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Spec label="RAM" value={`${build.ramGb} GB`} />
        <Spec label="Motherboard" value={build.motherboard} />
        <Spec label="Storage" value={build.storage} />
        <Spec label="Monitor" value={build.monitor} />
        <Spec label="OS base" value={build.operatingSystem} />
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
    <div className="min-w-0 rounded-2xl border border-violet-900/60 bg-violet-950/20 p-4">
      <p className="text-xs text-zinc-600">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-zinc-100">
        {value ?? "—"}
      </p>
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
    <div className="min-w-0 rounded-2xl border border-violet-950/60 bg-black/25 p-4">
      <p className="text-xs text-zinc-600">{label}</p>
      <p className="mt-1 truncate text-sm font-medium text-zinc-100">
        {value ?? "—"}
      </p>
    </div>
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

function SummaryText({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-b border-violet-950/70 p-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <p className="text-xs uppercase tracking-[0.22em] text-zinc-600">
        {label}
      </p>

      <p className="mt-2 truncate text-lg font-semibold text-zinc-50">
        {value}
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <section className="rounded-3xl border border-violet-950/70 bg-[#0d0716]/80 p-8">
      <h2 className="text-2xl font-semibold text-zinc-50">
        No builds registered
      </h2>

      <p className="mt-3 max-w-xl text-zinc-500">
        Create your first hardware profile on the left. After that, add
        snapshots for each BIOS, OS or tweak state.
      </p>
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
