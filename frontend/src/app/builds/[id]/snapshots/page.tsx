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
          <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <Link
                href="/builds"
                className="text-sm font-medium text-violet-300 transition hover:text-violet-200"
              >
                ← Back to builds
              </Link>

              <p className="mt-8 text-sm font-medium uppercase tracking-[0.3em] text-violet-300">
                Build #{build.id} · tuning states
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
            <SummaryItem label="Tuning states" value={snapshots.length} />
            <SummaryText
              label="Latest state"
              value={latestSnapshot?.name ?? "—"}
            />
            <SummaryText
              label="Latest OS profile"
              value={latestSnapshot?.operatingSystemProfile ?? "—"}
            />
          </section>

          <section className="mt-8 rounded-3xl border border-violet-950/70 bg-[#0d0716]/80 p-6 shadow-2xl shadow-black/25">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.25em] text-violet-300">
                  Snapshot rule
                </p>

                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
                  Every benchmark needs a state
                </h2>
              </div>

              <p className="max-w-xl text-sm leading-6 text-zinc-500">
                A snapshot is the exact tuning context that produced a run:
                clocks, RAM, BIOS, OS, driver, power plan and tweak tags.
              </p>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <ConceptCard
                number="01"
                title="Document state"
                text="Save CPU, RAM, BIOS, OS, driver and tweak notes."
              />
              <ConceptCard
                number="02"
                title="Run benchmark"
                text="Import CapFrameX against this exact snapshot."
              />
              <ConceptCard
                number="03"
                title="Compare honestly"
                text="Use sessions to decide whether the tweak stays."
              />
            </div>
          </section>

          <div className="mt-8 grid gap-6 lg:grid-cols-[390px_1fr] lg:items-start">
            <CreateSnapshotForm buildId={build.id} />

            <section id="hardware-snapshots">
              <div className="mb-5 flex flex-col gap-3 rounded-3xl border border-violet-950/70 bg-[#0d0716]/70 p-5 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.25em] text-violet-300">
                    Registered states
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold">
                    Tuning snapshots
                  </h2>
                </div>

                <p className="max-w-xl text-sm leading-6 text-zinc-500">
                  Create a new snapshot whenever BIOS, RAM, OS, driver, power
                  plan or tweak stack changes.
                </p>
              </div>

              {snapshots.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="grid gap-5">
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
  const tags = snapshot.tweakTags ?? [];

  return (
    <article className="group min-w-0 rounded-3xl border border-violet-950/70 bg-[#0d0716]/80 p-6 shadow-2xl shadow-black/25 transition hover:border-violet-700/80">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-600">
            Snapshot #{snapshot.id} · tuning state
          </p>

          <h3 className="mt-2 truncate text-3xl font-semibold tracking-[-0.04em] text-zinc-50">
            {snapshot.name}
          </h3>

          <p className="mt-2 text-sm text-zinc-500">
            Registered {formatDateLabel(snapshot.createdAt)}
          </p>
        </div>

        <Link
          href="/import"
          className="shrink-0 rounded-full border border-violet-900/80 bg-violet-950/20 px-4 py-2 text-sm font-medium text-zinc-300 transition group-hover:border-violet-300 group-hover:text-violet-200"
        >
          Import run
        </Link>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <MainSpec label="CPU state" value={snapshot.cpuOverclock} />
        <MainSpec label="RAM state" value={snapshot.ramProfile} />
        <MainSpec label="OS profile" value={snapshot.operatingSystemProfile} />
      </div>

      <div className="mt-5 rounded-2xl border border-violet-950/70 bg-black/20 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">
          Import-critical context
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <InlineSpec label="Power plan" value={snapshot.powerPlan} />
          <InlineSpec
            label="HAGS"
            value={
              snapshot.hagsEnabled === null
                ? "—"
                : snapshot.hagsEnabled
                  ? "Enabled"
                  : "Disabled"
            }
          />
          <InlineSpec label="GPU driver" value={snapshot.gpuDriver} />
          <InlineSpec label="BIOS" value={snapshot.biosVersion} />
        </div>
      </div>

      {tags.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {tags.slice(0, 8).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-violet-950/70 bg-black/25 px-3 py-1 text-xs text-zinc-400"
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

      <details className="mt-5 rounded-2xl border border-violet-950/70 bg-black/20">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-zinc-400 transition hover:text-violet-200">
          Advanced state details
        </summary>

        <div className="grid gap-3 border-t border-violet-950/70 p-4 sm:grid-cols-2 xl:grid-cols-3">
          <Spec label="RAM timings" value={snapshot.ramTimings} />
          <Spec label="tRFC" value={snapshot.trfc} />
          <Spec label="tREFI" value={snapshot.trefi} />
          <Spec label="Command rate" value={snapshot.commandRate} />
          <Spec label="Gear mode" value={snapshot.gearMode} />
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
        No tuning states yet
      </h2>

      <p className="mt-3 max-w-xl text-zinc-500">
        Create the first snapshot on the left. After that, import CapFrameX and
        HWiNFO data against this exact state.
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
