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

function formatDateLabel(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function BuildsPage() {
  const builds = await getBuilds();
  const latestBuild = builds[0] ?? null;

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
                Hardware base
              </h1>

              <p className="mt-4 max-w-2xl text-zinc-400">
                Register the physical machine once. BIOS, OS, driver, RAM
                timings and tweak changes belong to snapshots.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <NavButton href="/import">Import run</NavButton>
              <NavButton href="/sessions">Sessions</NavButton>
            </div>
          </header>

          <section className="mt-8 grid overflow-hidden rounded-3xl border border-violet-950/70 bg-[#0d0716]/70 sm:grid-cols-3">
            <SummaryItem label="Registered builds" value={builds.length} />
            <SummaryText
              label="Latest machine"
              value={latestBuild?.name ?? "—"}
            />
            <SummaryText
              label="Main platform"
              value={
                latestBuild ? `${latestBuild.cpu} · ${latestBuild.gpu}` : "—"
              }
            />
          </section>

          <section className="mt-8 rounded-3xl border border-violet-950/70 bg-[#0d0716]/80 p-6 shadow-2xl shadow-black/25">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.25em] text-violet-300">
                  Hardware model
                </p>

                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
                  Build → Snapshot → Session
                </h2>
              </div>

              <p className="max-w-xl text-sm leading-6 text-zinc-500">
                Build is fixed hardware. Snapshot is the tuning state. Session
                is the benchmark result captured from that state.
              </p>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <ConceptCard
                number="01"
                title="Build"
                text="CPU, GPU, RAM, motherboard, monitor and storage."
              />
              <ConceptCard
                number="02"
                title="Snapshot"
                text="BIOS, OS, drivers, power plan, HAGS and tweak state."
              />
              <ConceptCard
                number="03"
                title="Session"
                text="CapFrameX and HWiNFO data attached to a snapshot."
              />
            </div>
          </section>

          <div className="mt-8 grid gap-6 lg:grid-cols-[390px_1fr] lg:items-start">
            <CreateBuildForm />

            <section id="registered-machines">
              <div className="mb-5 flex flex-col gap-3 rounded-3xl border border-violet-950/70 bg-[#0d0716]/70 p-5 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.25em] text-violet-300">
                    Registered machines
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold">
                    Fixed hardware profiles
                  </h2>
                </div>

                <p className="max-w-xl text-sm leading-6 text-zinc-500">
                  Do not duplicate builds for every tweak. Create a new snapshot
                  instead.
                </p>
              </div>

              {builds.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="grid gap-5">
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
    <article className="group min-w-0 rounded-3xl border border-violet-950/70 bg-[#0d0716]/80 p-6 shadow-2xl shadow-black/25 transition hover:border-violet-700/80">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-600">
            Build #{build.id} · fixed hardware
          </p>

          <h3 className="mt-2 truncate text-3xl font-semibold tracking-[-0.04em] text-zinc-50">
            {build.name}
          </h3>

          <p className="mt-2 text-sm text-zinc-500">
            Registered {formatDateLabel(build.createdAt)}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href={`/builds/${build.id}/snapshots`}
            className="rounded-full border border-violet-900/80 bg-violet-950/20 px-4 py-2 text-sm font-medium text-zinc-300 transition group-hover:border-violet-300 group-hover:text-violet-200"
          >
            Tweak snapshots
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <MainSpec label="CPU" value={build.cpu} />
        <MainSpec label="GPU" value={build.gpu} />
        <MainSpec label="RAM" value={`${build.ramGb} GB`} />
      </div>

      <div className="mt-5 rounded-2xl border border-violet-950/70 bg-black/20 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">
          Platform context
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <InlineSpec label="Motherboard" value={build.motherboard} />
          <InlineSpec label="Storage" value={build.storage} />
          <InlineSpec label="Monitor" value={build.monitor} />
          <InlineSpec label="OS base" value={build.operatingSystem} />
          <InlineSpec label="GPU driver" value={build.gpuDriver} />
        </div>
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
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-600">
        {label}
      </p>
      <p className="mt-2 truncate text-base font-semibold text-zinc-100">
        {value ?? "—"}
      </p>
    </div>
  );
}

function InlineSpec({
  label,
  value,
}: {
  label: string;
  value: string | number | null;
}) {
  return (
    <div className="min-w-0 border-l border-violet-950/70 pl-3">
      <p className="text-xs text-zinc-600">{label}</p>
      <p className="mt-1 truncate text-sm font-medium text-zinc-300">
        {value ?? "—"}
      </p>
    </div>
  );
}

function ConceptCard({
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
        Create your first fixed hardware profile on the left. After that, add
        snapshots for each BIOS, OS, driver or tweak state.
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
