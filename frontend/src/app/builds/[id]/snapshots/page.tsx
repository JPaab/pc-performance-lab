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

  return (
    <>
      <AppHeader />

      <main className="min-h-screen px-6 py-10 text-zinc-100">
        <div className="mx-auto max-w-7xl">
          <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <Link
                href="/builds"
                className="text-sm font-medium text-violet-300 transition hover:text-violet-200"
              >
                ← Back to builds
              </Link>

              <p className="mt-8 text-sm font-medium uppercase tracking-[0.3em] text-violet-300">
                Build #{build.id}
              </p>

              <h1 className="mt-3 max-w-4xl text-5xl font-black tracking-[-0.06em] md:text-7xl">
                {build.name}
              </h1>

              <p className="mt-4 max-w-2xl text-zinc-400">
                {build.cpu} · {build.gpu} · {build.ramGb} GB RAM
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <NavButton href="/import">Import run</NavButton>
              <NavButton href="/sessions">Sessions</NavButton>
            </div>
          </header>

          <section className="mt-8 grid overflow-hidden rounded-3xl border border-violet-950/70 bg-[#0d0716]/70 sm:grid-cols-3">
            <SummaryItem label="Snapshots" value={snapshots.length} />
            <SummaryText label="GPU driver" value={build.gpuDriver ?? "—"} />
            <SummaryText label="OS" value={build.operatingSystem ?? "—"} />
          </section>

          <div className="mt-8 grid gap-6 lg:grid-cols-[390px_1fr] lg:items-start">
            <CreateSnapshotForm buildId={build.id} />

            <section id="hardware-snapshots">
              <div className="mb-5 rounded-3xl border border-violet-950/70 bg-[#0d0716]/70 p-5">
                <p className="text-sm font-medium uppercase tracking-[0.25em] text-violet-300">
                  Hardware snapshots
                </p>

                <h2 className="mt-2 text-2xl font-semibold">
                  Registered states
                </h2>

                <p className="mt-2 max-w-2xl text-sm text-zinc-500">
                  Each snapshot is a specific BIOS, OS, driver and tweak state.
                  Import benchmark data against the exact state you tested.
                </p>
              </div>

              {snapshots.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="grid gap-5 xl:grid-cols-2">
                  {snapshots.map((snapshot) => (
                    <SnapshotCard key={snapshot.id} snapshot={snapshot} />
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

function SnapshotCard({ snapshot }: { snapshot: HardwareSnapshot }) {
  return (
    <article className="group min-w-0 rounded-3xl border border-violet-950/70 bg-[#0d0716]/80 p-5 shadow-2xl shadow-black/25 transition hover:border-violet-700/80">
      <div className="flex min-w-0 items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-600">
            Snapshot #{snapshot.id}
          </p>

          <h3 className="mt-2 truncate text-2xl font-semibold text-zinc-50">
            {snapshot.name}
          </h3>

          <p className="mt-2 text-sm text-zinc-500">
            Created at {snapshot.createdAt}
          </p>
        </div>

        <Link
          href="/import"
          className="shrink-0 rounded-full border border-violet-900/80 px-4 py-2 text-sm font-medium text-zinc-300 transition group-hover:border-violet-300 group-hover:text-violet-200"
        >
          Import
        </Link>
      </div>

      <div className="mt-5 grid gap-3">
        <MainSpec label="CPU OC" value={snapshot.cpuOverclock} />
        <MainSpec label="RAM profile" value={snapshot.ramProfile} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Spec label="OS profile" value={snapshot.operatingSystemProfile} />
        <Spec label="Power plan" value={snapshot.powerPlan} />
        <Spec
          label="HAGS"
          value={
            snapshot.hagsEnabled === null
              ? "—"
              : snapshot.hagsEnabled
                ? "Enabled"
                : "Disabled"
          }
        />
        <Spec label="GPU driver" value={snapshot.gpuDriver} />
      </div>

      {snapshot.tweakTags.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {snapshot.tweakTags.slice(0, 6).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-violet-950/70 bg-black/25 px-3 py-1 text-xs text-zinc-400"
            >
              {tag}
            </span>
          ))}

          {snapshot.tweakTags.length > 6 && (
            <span className="rounded-full border border-violet-950/70 bg-black/25 px-3 py-1 text-xs text-zinc-600">
              +{snapshot.tweakTags.length - 6}
            </span>
          )}
        </div>
      )}

      <details className="mt-5 rounded-2xl border border-violet-950/70 bg-black/20">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-zinc-400 transition hover:text-violet-200">
          Advanced snapshot details
        </summary>

        <div className="grid gap-3 border-t border-violet-950/70 p-4 sm:grid-cols-2">
          <Spec label="RAM timings" value={snapshot.ramTimings} />
          <Spec label="tRFC" value={snapshot.trfc} />
          <Spec label="tREFI" value={snapshot.trefi} />
          <Spec label="Command rate" value={snapshot.commandRate} />
          <Spec label="Gear mode" value={snapshot.gearMode} />
          <Spec label="BIOS version" value={snapshot.biosVersion} />
        </div>

        {snapshot.notes && (
          <p className="border-t border-violet-950/70 px-4 py-4 text-sm leading-6 text-zinc-500">
            {snapshot.notes}
          </p>
        )}
      </details>
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
      <h2 className="text-2xl font-semibold text-zinc-50">No snapshots yet</h2>

      <p className="mt-3 max-w-xl text-zinc-500">
        Create the first hardware state on the left. After that, import
        CapFrameX and HWiNFO data against this snapshot.
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
