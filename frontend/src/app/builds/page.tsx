import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { CreateFormDisclosure } from "@/components/create-form-disclosure";
import { buildApiUrl } from "@/lib/api";
import { CreateBuildForm } from "./create-build-form";
import { DeleteButton } from "@/components/delete-button";

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

          {builds.length === 0 ? (
            <section className="mx-auto mt-8 max-w-3xl">
              <CreateBuildForm />
            </section>
          ) : (
            <section id="registered-machines" className="mt-8">
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

              <div className="grid gap-4">
                {builds.map((build, index) => (
                  <BuildCard
                    key={build.id}
                    build={build}
                    displayNumber={index + 1}
                  />
                ))}
              </div>

              <CreateFormDisclosure
                ariaLabel="Create new build"
                contentClassName="max-w-3xl"
              >
                <CreateBuildForm />
              </CreateFormDisclosure>
            </section>
          )}
        </div>
      </main>
    </>
  );
}

function BuildCard({
  build,
  displayNumber,
}: {
  build: PcBuild;
  displayNumber: number;
}) {
  return (
    <article className="group rounded-3xl border border-violet-950/70 bg-[#0d0716]/80 p-5 shadow-2xl shadow-black/20 transition hover:border-violet-700/80">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-600">
            Build #{displayNumber}
          </p>

          <h3 className="mt-2 truncate text-2xl font-semibold tracking-[-0.04em] text-zinc-50">
            {build.name}
          </h3>

          <p className="mt-2 text-sm text-zinc-500">
            Registered {formatDateLabel(build.createdAt)}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href={`/builds/${build.id}/snapshots`}
            className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-full border border-violet-900/80 bg-violet-950/20 px-4 text-sm font-medium leading-5 text-zinc-300 transition hover:border-violet-300 hover:text-violet-200"
          >
            Tuning states
          </Link>

          <DeleteButton
            endpoint={`/api/builds/${build.id}`}
            confirmMessage={`Delete build #${displayNumber} "${build.name}"?`}
            className="h-10 rounded-full border border-rose-900/70 bg-rose-950/20 px-4 text-rose-300 transition hover:border-rose-400 hover:bg-rose-950/30 hover:text-rose-200 disabled:opacity-50"
          />
        </div>
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
