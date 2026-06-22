import Link from "next/link";
import { AppHeader } from "@/components/app-header";
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

  const latestSnapshot = snapshots[0] ?? null;

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
              Build #{build.id}
            </p>

            <h1 className="mt-3 text-5xl font-black tracking-[-0.06em] md:text-7xl">
              Tuning states
            </h1>

            <p className="mt-4 max-w-2xl text-zinc-400">
              {build.name} · {build.cpu} · {build.gpu} · {build.ramGb} GB RAM
            </p>
          </header>

          <section className="mt-8 grid gap-6 lg:grid-cols-[390px_1fr] lg:items-start">
            <div className="grid gap-6">
              <CreateSnapshotForm buildId={build.id} />

              <SnapshotWorkflow
                build={build}
                latestSnapshot={latestSnapshot}
                snapshotCount={snapshots.length}
              />
            </div>

            <section id="hardware-snapshots">
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

              {snapshots.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="grid gap-4">
                  {snapshots.map((snapshot) => (
                    <SnapshotCard key={snapshot.id} snapshot={snapshot} />
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

function SnapshotWorkflow({
  build,
  latestSnapshot,
  snapshotCount,
}: {
  build: PcBuild;
  latestSnapshot: HardwareSnapshot | null;
  snapshotCount: number;
}) {
  const hasSnapshot = Boolean(latestSnapshot);

  return (
    <section className="rounded-3xl border border-violet-950/70 bg-[#0d0716]/80 p-5 shadow-2xl shadow-black/25">
      <p className="text-sm font-medium uppercase tracking-[0.25em] text-violet-300">
        Workflow
      </p>

      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
        State before run
      </h2>

      <p className="mt-2 text-sm leading-6 text-zinc-500">
        Save the tuning state first. Then imports and comparisons make sense.
      </p>

      <div className="mt-5 grid gap-3">
        <WorkflowStep
          number="01"
          title="Hardware ready"
          text={build.name}
          status="Done"
          done
          locked={false}
          href="/builds"
        />

        <WorkflowStep
          number="02"
          title="Create tuning state"
          text={
            latestSnapshot
              ? latestSnapshot.name
              : "BIOS, OS, driver, RAM and tweak state"
          }
          status={hasSnapshot ? "Done" : "Start"}
          done={hasSnapshot}
          locked={false}
          href={`/builds/${build.id}/snapshots`}
        />

        <WorkflowStep
          number="03"
          title="Import benchmark"
          text={
            hasSnapshot
              ? "CapFrameX run + HWiNFO sensors"
              : "Create a tuning state first"
          }
          status={hasSnapshot ? "Next" : "Locked"}
          done={false}
          locked={!hasSnapshot}
          href={
            latestSnapshot
              ? `/import?snapshotId=${latestSnapshot.id}`
              : `/builds/${build.id}/snapshots`
          }
        />

        <WorkflowStep
          number="04"
          title="Compare decision"
          text={
            hasSnapshot
              ? "After importing runs, decide what stays"
              : "Benchmark import unlocks this step"
          }
          status={hasSnapshot ? "After run" : "Locked"}
          done={false}
          locked={!hasSnapshot}
          href="/compare"
        />
      </div>

      <div className="mt-5 rounded-2xl border border-violet-950/70 bg-black/20 p-4">
        <p className="text-xs uppercase tracking-[0.22em] text-zinc-700">
          Current tuning states
        </p>
        <p className="mt-1 text-3xl font-black tracking-[-0.05em] text-zinc-50">
          {snapshotCount}
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

function SnapshotCard({ snapshot }: { snapshot: HardwareSnapshot }) {
  const tags = snapshot.tweakTags ?? [];

  return (
    <article className="group rounded-3xl border border-violet-950/70 bg-[#0d0716]/80 p-5 shadow-2xl shadow-black/20 transition hover:border-violet-700/80">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-600">
            Snapshot #{snapshot.id}
          </p>

          <h3 className="mt-2 truncate text-2xl font-semibold tracking-[-0.04em] text-zinc-50">
            {snapshot.name}
          </h3>

          <p className="mt-2 text-sm text-zinc-500">
            Registered {formatDateLabel(snapshot.createdAt)}
          </p>
        </div>

        <Link
          href={`/import?snapshotId=${snapshot.id}`}
          className="shrink-0 rounded-full border border-violet-900/80 bg-violet-950/20 px-4 py-2 text-sm font-medium text-zinc-300 transition group-hover:border-violet-300 group-hover:text-violet-200"
        >
          Import run
        </Link>
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

function EmptyState() {
  return (
    <section className="rounded-3xl border border-violet-950/70 bg-[#0d0716]/80 p-8">
      <h2 className="text-2xl font-semibold text-zinc-50">
        No tuning states yet
      </h2>

      <p className="mt-3 max-w-xl text-zinc-500">
        Create the first snapshot. After that, importing a benchmark becomes the
        next step.
      </p>
    </section>
  );
}
