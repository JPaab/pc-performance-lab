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
          <header className="max-w-4xl">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-violet-300">
              Hardware
            </p>

            <h1 className="mt-3 text-5xl font-black tracking-[-0.06em] md:text-7xl">
              Builds
            </h1>

            <p className="mt-4 max-w-2xl text-zinc-400">
              Register the physical PC once. Every BIOS, OS, driver or tweak
              change belongs to a tuning snapshot.
            </p>
          </header>

          <section className="mt-8 grid gap-6 lg:grid-cols-[390px_1fr] lg:items-start">
            <div className="grid gap-6">
              <CreateBuildForm />
              <BuildWorkflow
                latestBuild={latestBuild}
                buildCount={builds.length}
              />
            </div>

            <section>
              <div className="mb-5 flex flex-col gap-2 rounded-3xl border border-violet-950/70 bg-[#0d0716]/70 p-5 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.25em] text-violet-300">
                    Registered machines
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold">
                    Fixed hardware profiles
                  </h2>
                </div>

                <p className="text-sm text-zinc-600">
                  {builds.length} {builds.length === 1 ? "build" : "builds"}
                </p>
              </div>

              {builds.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="grid gap-4">
                  {builds.map((build) => (
                    <BuildCard key={build.id} build={build} />
                  ))}
                </div>
              )}
            </section>
          </section>
        </div>
      </main>
    </>
  );
}

function BuildWorkflow({
  latestBuild,
  buildCount,
}: {
  latestBuild: PcBuild | null;
  buildCount: number;
}) {
  const hasBuild = Boolean(latestBuild);

  return (
    <section className="rounded-3xl border border-violet-950/70 bg-[#0d0716]/80 p-5 shadow-2xl shadow-black/25">
      <p className="text-sm font-medium uppercase tracking-[0.25em] text-violet-300">
        Workflow
      </p>

      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
        Hardware first
      </h2>

      <p className="mt-2 text-sm leading-6 text-zinc-500">
        Create the machine, then unlock snapshots and imports.
      </p>

      <div className="mt-5 grid gap-3">
        <WorkflowStep
          number="01"
          title="Register hardware"
          text={
            hasBuild
              ? (latestBuild?.name ?? "Hardware ready")
              : "CPU, GPU, RAM and base platform"
          }
          status={hasBuild ? "Done" : "Start"}
          done={hasBuild}
          locked={false}
          href="/builds"
        />

        <WorkflowStep
          number="02"
          title="Create tuning state"
          text={
            hasBuild
              ? "BIOS, OS, driver and tweak state"
              : "Register hardware first"
          }
          status={hasBuild ? "Next" : "Locked"}
          done={false}
          locked={!hasBuild}
          href={latestBuild ? `/builds/${latestBuild.id}/snapshots` : "/builds"}
        />

        <WorkflowStep
          number="03"
          title="Import benchmark"
          text={
            hasBuild
              ? "CapFrameX run + HWiNFO sensors"
              : "Snapshots unlock this step"
          }
          status={hasBuild ? "After snapshot" : "Locked"}
          done={false}
          locked={!hasBuild}
          href="/import"
        />
      </div>

      <div className="mt-5 rounded-2xl border border-violet-950/70 bg-black/20 p-4">
        <p className="text-xs uppercase tracking-[0.22em] text-zinc-700">
          Current hardware count
        </p>
        <p className="mt-1 text-3xl font-black tracking-[-0.05em] text-zinc-50">
          {buildCount}
        </p>
      </div>
    </section>
  );
}

function WorkflowStep({
  number,
  title,
  text,
  status,
  done,
  locked,
  href,
}: {
  number: string;
  title: string;
  text: string;
  status: string;
  done: boolean;
  locked: boolean;
  href: string;
}) {
  const content = (
    <>
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

      <p className="mt-1 line-clamp-2 text-sm leading-6 text-zinc-500">
        {text}
      </p>
    </>
  );

  if (locked) {
    return (
      <article className="cursor-not-allowed rounded-2xl border border-violet-950/40 bg-black/15 p-4 opacity-70">
        {content}
      </article>
    );
  }

  return (
    <Link
      href={href}
      className="rounded-2xl border border-violet-950/70 bg-black/25 p-4 transition hover:border-violet-400/70"
    >
      {content}
    </Link>
  );
}

function BuildCard({ build }: { build: PcBuild }) {
  return (
    <article className="group rounded-3xl border border-violet-950/70 bg-[#0d0716]/80 p-5 shadow-2xl shadow-black/20 transition hover:border-violet-700/80">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-600">
            Build #{build.id}
          </p>

          <h3 className="mt-2 truncate text-2xl font-semibold tracking-[-0.04em] text-zinc-50">
            {build.name}
          </h3>

          <p className="mt-2 text-sm text-zinc-500">
            Registered {formatDateLabel(build.createdAt)}
          </p>
        </div>

        <Link
          href={`/builds/${build.id}/snapshots`}
          className="shrink-0 rounded-full border border-violet-900/80 bg-violet-950/20 px-4 py-2 text-sm font-medium text-zinc-300 transition group-hover:border-violet-300 group-hover:text-violet-200"
        >
          Tuning states
        </Link>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <MainSpec label="CPU" value={build.cpu} />
        <MainSpec label="GPU" value={build.gpu} />
        <MainSpec label="RAM" value={`${build.ramGb} GB`} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Chip label="Motherboard" value={build.motherboard} />
        <Chip label="Storage" value={build.storage} />
        <Chip label="Monitor" value={build.monitor} />
        <Chip label="OS" value={build.operatingSystem} />
        <Chip label="Driver" value={build.gpuDriver} />
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
    <div className="min-w-0 rounded-2xl border border-violet-950/70 bg-black/25 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-600">
        {label}
      </p>
      <p className="mt-2 truncate text-sm font-semibold text-zinc-100">
        {value ?? "—"}
      </p>
    </div>
  );
}

function Chip({
  label,
  value,
}: {
  label: string;
  value: string | number | null;
}) {
  if (!value) {
    return null;
  }

  return (
    <span className="rounded-full border border-violet-950/70 bg-black/25 px-3 py-1 text-xs text-zinc-500">
      <span className="text-zinc-700">{label}: </span>
      <span className="text-zinc-400">{value}</span>
    </span>
  );
}

function EmptyState() {
  return (
    <section className="rounded-3xl border border-violet-950/70 bg-[#0d0716]/80 p-8">
      <h2 className="text-2xl font-semibold text-zinc-50">
        No builds registered
      </h2>

      <p className="mt-3 max-w-xl text-zinc-500">
        Create the first hardware profile. After that, the next step is a tuning
        snapshot for BIOS, OS, driver and tweak state.
      </p>
    </section>
  );
}
