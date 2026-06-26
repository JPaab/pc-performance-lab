import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { CreateFormDisclosure } from "@/components/create-form-disclosure";
import { buildApiUrl } from "@/lib/api";
import { CreateSnapshotForm } from "./create-snapshot-form";
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

    const snapshots = (await response.json()) as HardwareSnapshot[];

    return snapshots.sort((a, b) => b.id - a.id);
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

function getDisplayNumberById(items: { id: number }[], id: number) {
  const index = items.findIndex((item) => item.id === id);

  return index === -1 ? null : index + 1;
}

export default async function BuildSnapshotsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [build, snapshots, builds] = await Promise.all([
    getBuild(id),
    getSnapshots(id),
    getBuilds(),
  ]);

  if (!build) {
    return (
      <>
        <AppHeader />

        <main className="min-h-screen px-6 py-10 text-zinc-100">
          <div className="mx-auto max-w-7xl">
            <Link
              href="/builds"
              className="text-sm font-medium text-violet-300 transition hover:text-violet-200"
            >
              ← Back to builds
            </Link>

            <section className="mt-8 rounded-3xl border border-violet-950/70 bg-[#0d0716]/80 p-8">
              <h1 className="text-3xl font-semibold">Build not found</h1>

              <p className="mt-3 text-zinc-500">
                The backend did not return a PC build for this ID.
              </p>
            </section>
          </div>
        </main>
      </>
    );
  }

  const buildDisplayNumber = getDisplayNumberById(builds, build.id);

  return (
    <>
      <AppHeader />

      <main className="min-h-screen px-6 py-10 text-zinc-100">
        <div className="mx-auto max-w-7xl">
          <header className="max-w-4xl">
            <Link
              href="/builds"
              className="text-sm font-medium text-violet-300 transition hover:text-violet-200"
            >
              ← Back to builds
            </Link>

            <p className="mt-8 text-sm font-medium uppercase tracking-[0.3em] text-violet-300">
              Build #{buildDisplayNumber ?? "—"}
            </p>

            <h1 className="mt-3 text-5xl font-black tracking-[-0.06em] md:text-7xl">
              Tuning states
            </h1>

            <p className="mt-4 max-w-2xl text-zinc-400">
              {build.name} · {build.cpu} · {build.gpu} · {build.ramGb} GB RAM
            </p>
          </header>

          {snapshots.length === 0 ? (
            <section className="mx-auto mt-8 max-w-4xl">
              <CreateSnapshotForm buildId={build.id} />
            </section>
          ) : (
            <section id="hardware-snapshots" className="mt-8">
              <div className="mb-5 flex flex-col gap-2 rounded-3xl border border-violet-950/70 bg-[#0d0716]/70 p-5 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.25em] text-violet-300">
                    Registered states
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold">
                    Tuning snapshots
                  </h2>
                </div>

                <p className="text-sm text-zinc-600">
                  {snapshots.length}{" "}
                  {snapshots.length === 1 ? "snapshot" : "snapshots"}
                </p>
              </div>

              <div className="grid gap-4">
                {snapshots.map((snapshot, index) => (
                  <SnapshotCard
                    key={snapshot.id}
                    snapshot={snapshot}
                    displayNumber={index + 1}
                  />
                ))}
              </div>

              <CreateFormDisclosure
                ariaLabel="Create new snapshot"
                contentClassName="max-w-4xl"
              >
                <CreateSnapshotForm buildId={build.id} />
              </CreateFormDisclosure>
            </section>
          )}
        </div>
      </main>
    </>
  );
}

function SnapshotCard({
  snapshot,
  displayNumber,
}: {
  snapshot: HardwareSnapshot;
  displayNumber: number;
}) {
  const tags = snapshot.tweakTags ?? [];

  return (
    <article className="group rounded-3xl border border-violet-950/70 bg-[#0d0716]/80 p-5 shadow-2xl shadow-black/20 transition hover:border-violet-700/80">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-600">
            Tuning state #{displayNumber}
          </p>

          <h3 className="mt-2 truncate text-2xl font-semibold tracking-[-0.04em] text-zinc-50">
            {snapshot.name}
          </h3>

          <p className="mt-2 text-sm text-zinc-500">
            Registered {formatDateLabel(snapshot.createdAt)}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href={`/import?snapshotId=${snapshot.id}`}
            className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-full border border-violet-900/80 bg-violet-950/20 px-4 text-sm font-medium leading-5 text-zinc-300 transition hover:border-violet-300 hover:text-violet-200"
          >
            Import run
          </Link>

          <DeleteButton
            endpoint={`/api/snapshots/${snapshot.id}`}
            confirmMessage={`Delete tuning state #${displayNumber} "${snapshot.name}"?`}
            className="h-10 rounded-full border border-rose-900/70 bg-rose-950/20 px-4 text-rose-300 transition hover:border-rose-400 hover:bg-rose-950/30 hover:text-rose-200 disabled:opacity-50"
          />
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <MainSpec label="CPU" value={snapshot.cpuOverclock} />
        <MainSpec label="RAM" value={snapshot.ramProfile} />
        <MainSpec label="OS" value={snapshot.operatingSystemProfile} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Chip label="Power" value={snapshot.powerPlan} />

        <Chip
          label="HAGS"
          value={
            snapshot.hagsEnabled === null
              ? null
              : snapshot.hagsEnabled
                ? "Enabled"
                : "Disabled"
          }
        />

        <Chip label="Driver" value={snapshot.gpuDriver} />
        <Chip label="BIOS" value={snapshot.biosVersion} />
        <Chip label="Timings" value={snapshot.ramTimings} />
        <Chip label="tRFC" value={snapshot.trfc} />
        <Chip label="tREFI" value={snapshot.trefi} />
        <Chip label="CR" value={snapshot.commandRate} />
        <Chip label="Gear" value={snapshot.gearMode} />
      </div>

      {tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.slice(0, 8).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-violet-950/70 bg-black/25 px-3 py-1 text-xs text-violet-200/80"
            >
              {tag}
            </span>
          ))}

          {tags.length > 8 && (
            <span className="rounded-full border border-violet-950/70 bg-black/25 px-3 py-1 text-xs text-zinc-600">
              +{tags.length - 8}
            </span>
          )}
        </div>
      )}

      {snapshot.notes && (
        <details className="mt-4 rounded-2xl border border-violet-950/70 bg-black/20">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-zinc-400 transition hover:text-violet-200">
            Notes
          </summary>

          <p className="border-t border-violet-950/70 px-4 py-4 text-sm leading-6 text-zinc-500">
            {snapshot.notes}
          </p>
        </details>
      )}
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
