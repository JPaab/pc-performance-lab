"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { uploadFile } from "@/lib/uploads";

type PcBuild = {
  id: number;
  name: string;
  cpu: string;
  gpu: string;
  ramGb: number;
};

type HardwareSnapshot = {
  id: number;
  buildId: number;
  name: string;
  operatingSystemProfile: string | null;
  powerPlan: string | null;
  hagsEnabled: boolean | null;
  gpuDriver: string | null;
};

type PerformanceSession = {
  id: number;
  snapshotId: number;
  snapshotName: string;
  buildId: number;
  buildName: string;
  gameName: string;
  scenario: string | null;
  sourceType: string;
  averageFps: number | null;
  p99FrameTimeMs: number | null;
  hasSensorSummary: boolean;
  createdAt: string;
};

type UploadStatus = {
  tone: "idle" | "success" | "error";
  message: string;
};

export function ImportForms({
  builds,
  snapshots,
  sessions,
}: {
  builds: PcBuild[];
  snapshots: HardwareSnapshot[];
  sessions: PerformanceSession[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const querySnapshotId = searchParams.get("snapshotId");

  const initialSnapshotId =
    querySnapshotId &&
    snapshots.some((snapshot) => String(snapshot.id) === querySnapshotId)
      ? querySnapshotId
      : snapshots[0]
        ? String(snapshots[0].id)
        : "";

  const [availableSessions, setAvailableSessions] =
    useState<PerformanceSession[]>(sessions);

  const [selectedSnapshotId, setSelectedSnapshotId] =
    useState(initialSnapshotId);

  const [selectedSessionId, setSelectedSessionId] = useState(
    sessions[0] ? String(sessions[0].id) : "",
  );

  const [latestImportedSession, setLatestImportedSession] =
    useState<PerformanceSession | null>(null);

  const [capFrameXFile, setCapFrameXFile] = useState<File | null>(null);
  const [hwInfoFile, setHwInfoFile] = useState<File | null>(null);

  const [capFrameXStatus, setCapFrameXStatus] = useState<UploadStatus>({
    tone: "idle",
    message: "",
  });

  const [hwInfoStatus, setHwInfoStatus] = useState<UploadStatus>({
    tone: "idle",
    message: "",
  });

  const [capFrameXInputKey, setCapFrameXInputKey] = useState(0);
  const [hwInfoInputKey, setHwInfoInputKey] = useState(0);

  const [isUploadingCapFrameX, setIsUploadingCapFrameX] = useState(false);
  const [isUploadingHwInfo, setIsUploadingHwInfo] = useState(false);

  const buildNameById = useMemo(() => {
    return new Map(builds.map((build) => [build.id, build.name]));
  }, [builds]);

  const snapshotById = useMemo(() => {
    return new Map(
      snapshots.map((snapshot) => [String(snapshot.id), snapshot]),
    );
  }, [snapshots]);

  const selectedSnapshot = selectedSnapshotId
    ? (snapshotById.get(selectedSnapshotId) ?? null)
    : null;

  const selectedSession =
    availableSessions.find(
      (session) => String(session.id) === selectedSessionId,
    ) ?? null;

  useEffect(() => {
    setAvailableSessions(sessions);

    setSelectedSessionId((currentValue) => {
      if (
        currentValue &&
        sessions.some((session) => String(session.id) === currentValue)
      ) {
        return currentValue;
      }

      return sessions[0] ? String(sessions[0].id) : "";
    });
  }, [sessions]);

  useEffect(() => {
    setSelectedSnapshotId((currentValue) => {
      if (
        currentValue &&
        snapshots.some((snapshot) => String(snapshot.id) === currentValue)
      ) {
        return currentValue;
      }

      if (
        querySnapshotId &&
        snapshots.some((snapshot) => String(snapshot.id) === querySnapshotId)
      ) {
        return querySnapshotId;
      }

      return snapshots[0] ? String(snapshots[0].id) : "";
    });
  }, [snapshots, querySnapshotId]);

  async function handleCapFrameXUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedSnapshotId) {
      setCapFrameXStatus({
        tone: "error",
        message: "Select a tuning state before importing CapFrameX.",
      });
      return;
    }

    if (!capFrameXFile) {
      setCapFrameXStatus({
        tone: "error",
        message: "Choose a CapFrameX JSON file first.",
      });
      return;
    }

    try {
      setIsUploadingCapFrameX(true);
      setCapFrameXStatus({
        tone: "idle",
        message: "Importing CapFrameX run...",
      });

      const createdSession = (await uploadFile(
        `/api/snapshots/${selectedSnapshotId}/sessions/import/capframex`,
        capFrameXFile,
      )) as PerformanceSession;

      setAvailableSessions((currentSessions) => [
        createdSession,
        ...currentSessions.filter(
          (session) => session.id !== createdSession.id,
        ),
      ]);

      setSelectedSessionId(String(createdSession.id));
      setLatestImportedSession(createdSession);
      setCapFrameXFile(null);
      setCapFrameXInputKey((currentKey) => currentKey + 1);

      setCapFrameXStatus({
        tone: "success",
        message: `Session #${createdSession.id} created. HWiNFO target switched to this run.`,
      });

      router.refresh();
    } catch (error) {
      setCapFrameXStatus({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Could not import CapFrameX file.",
      });
    } finally {
      setIsUploadingCapFrameX(false);
    }
  }

  async function handleHwInfoUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedSessionId) {
      setHwInfoStatus({
        tone: "error",
        message: "Select a performance session before importing HWiNFO.",
      });
      return;
    }

    if (!hwInfoFile) {
      setHwInfoStatus({
        tone: "error",
        message: "Choose a HWiNFO CSV file first.",
      });
      return;
    }

    try {
      setIsUploadingHwInfo(true);
      setHwInfoStatus({
        tone: "idle",
        message: "Importing HWiNFO sensor summary...",
      });

      await uploadFile(
        `/api/sessions/${selectedSessionId}/sensor-summaries/import/hwinfo`,
        hwInfoFile,
      );

      setAvailableSessions((currentSessions) =>
        currentSessions.map((session) =>
          String(session.id) === selectedSessionId
            ? {
                ...session,
                hasSensorSummary: true,
              }
            : session,
        ),
      );

      setLatestImportedSession((currentSession) =>
        currentSession && String(currentSession.id) === selectedSessionId
          ? {
              ...currentSession,
              hasSensorSummary: true,
            }
          : currentSession,
      );

      setHwInfoFile(null);
      setHwInfoInputKey((currentKey) => currentKey + 1);

      setHwInfoStatus({
        tone: "success",
        message: `HWiNFO sensor summary attached to session #${selectedSessionId}.`,
      });

      router.refresh();
    } catch (error) {
      setHwInfoStatus({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Could not import HWiNFO file.",
      });
    } finally {
      setIsUploadingHwInfo(false);
    }
  }

  return (
    <section className="mt-8 rounded-3xl border border-violet-950/70 bg-[#0d0716]/80 p-6 shadow-2xl shadow-black/25">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-violet-300">
            Import files
          </p>

          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
            Build the session
          </h2>
        </div>

        <p className="max-w-xl text-sm leading-6 text-zinc-500">
          Click a tuning state, import CapFrameX, then attach HWiNFO to the
          selected run.
        </p>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <form onSubmit={handleCapFrameXUpload} className="grid gap-5">
          <ImportBlock
            step="01"
            title="Create performance session"
            description="CapFrameX JSON creates the run with FPS, lows, frametime and dropped-frame data."
          >
            <CardSelectorHeader
              label="Target tuning state"
              value={
                selectedSnapshot
                  ? `Snapshot #${selectedSnapshot.id} selected`
                  : "No snapshot selected"
              }
            />

            {snapshots.length === 0 ? (
              <EmptyChoice
                title="No tuning states yet"
                text="Create a build snapshot before importing a benchmark."
                href="/builds"
                action="Go to hardware"
              />
            ) : (
              <div className="grid max-h-[420px] gap-3 overflow-y-auto pr-1">
                {snapshots.map((snapshot) => (
                  <SnapshotChoiceCard
                    key={snapshot.id}
                    snapshot={snapshot}
                    buildName={
                      buildNameById.get(snapshot.buildId) ??
                      `Build #${snapshot.buildId}`
                    }
                    selected={String(snapshot.id) === selectedSnapshotId}
                    onSelect={() => setSelectedSnapshotId(String(snapshot.id))}
                  />
                ))}
              </div>
            )}

            <FileInput
              key={capFrameXInputKey}
              label="CapFrameX JSON file"
              accept=".json,application/json"
              onChange={setCapFrameXFile}
            />

            <button
              type="submit"
              disabled={
                isUploadingCapFrameX ||
                snapshots.length === 0 ||
                !selectedSnapshotId
              }
              className="rounded-2xl bg-violet-300 px-6 py-3 font-semibold text-black transition hover:bg-violet-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUploadingCapFrameX ? "Importing..." : "Import CapFrameX"}
            </button>

            <StatusMessage status={capFrameXStatus} />
          </ImportBlock>
        </form>

        <form onSubmit={handleHwInfoUpload} className="grid gap-5">
          <ImportBlock
            step="02"
            title="Attach sensor diagnostics"
            description="HWiNFO CSV adds thermals, power, clocks, load and limiter context to the selected session."
          >
            <CardSelectorHeader
              label="Target run"
              value={
                selectedSession
                  ? `Session #${selectedSession.id} · ${getSensorLabel(selectedSession)}`
                  : "No session selected"
              }
            />

            {availableSessions.length === 0 ? (
              <EmptyChoice
                title="No runs yet"
                text="Import a CapFrameX JSON first. HWiNFO attaches after a session exists."
                href="/import"
                action="Import CapFrameX"
              />
            ) : (
              <div className="grid max-h-[420px] gap-3 overflow-y-auto pr-1">
                {availableSessions.map((session, index) => (
                  <SessionChoiceCard
                    key={session.id}
                    session={session}
                    selected={String(session.id) === selectedSessionId}
                    latest={index === 0}
                    freshlyImported={Boolean(
                      latestImportedSession &&
                      latestImportedSession.id === session.id,
                    )}
                    onSelect={() => setSelectedSessionId(String(session.id))}
                  />
                ))}
              </div>
            )}

            <FileInput
              key={hwInfoInputKey}
              label="HWiNFO CSV file"
              accept=".csv,text/csv"
              onChange={setHwInfoFile}
            />

            <button
              type="submit"
              disabled={
                isUploadingHwInfo ||
                availableSessions.length === 0 ||
                !selectedSessionId
              }
              className="rounded-2xl bg-violet-300 px-6 py-3 font-semibold text-black transition hover:bg-violet-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUploadingHwInfo ? "Importing..." : "Attach HWiNFO"}
            </button>

            <StatusMessage status={hwInfoStatus} />
          </ImportBlock>
        </form>
      </div>
    </section>
  );
}

function ImportBlock({
  step,
  title,
  description,
  children,
}: {
  step: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-violet-950/70 bg-black/20 p-5">
      <div className="flex items-start gap-4">
        <p className="font-mono text-sm text-violet-300">{step}</p>

        <div>
          <p className="text-xl font-semibold text-zinc-100">{title}</p>
          <p className="mt-1 text-sm leading-6 text-zinc-500">{description}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4">{children}</div>
    </section>
  );
}

function CardSelectorHeader({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="shrink-0 text-xs font-medium uppercase tracking-[0.18em] text-violet-300">
        {value}
      </p>
    </div>
  );
}

function SnapshotChoiceCard({
  snapshot,
  buildName,
  selected,
  onSelect,
}: {
  snapshot: HardwareSnapshot;
  buildName: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`min-w-0 rounded-2xl border p-4 text-left transition ${
        selected
          ? "border-violet-300 bg-violet-500/10"
          : "border-violet-950/70 bg-black/25 hover:border-violet-500/70"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-600">
            Snapshot #{snapshot.id}
          </p>

          <p className="mt-2 truncate font-semibold text-zinc-100">
            {snapshot.name}
          </p>

          <p className="mt-1 truncate text-sm text-zinc-500">{buildName}</p>
        </div>

        <span
          className={`rounded-full border px-3 py-1 text-xs font-medium ${
            selected
              ? "border-violet-300/50 bg-violet-300/10 text-violet-200"
              : "border-violet-950/80 bg-black/30 text-zinc-600"
          }`}
        >
          {selected ? "Selected" : "Pick"}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <MiniChip label="OS" value={snapshot.operatingSystemProfile} />
        <MiniChip label="Power" value={snapshot.powerPlan} />
        <MiniChip
          label="HAGS"
          value={
            snapshot.hagsEnabled === null
              ? null
              : snapshot.hagsEnabled
                ? "Enabled"
                : "Disabled"
          }
        />
        <MiniChip label="Driver" value={snapshot.gpuDriver} />
      </div>
    </button>
  );
}

function SessionChoiceCard({
  session,
  selected,
  latest,
  freshlyImported,
  onSelect,
}: {
  session: PerformanceSession;
  selected: boolean;
  latest: boolean;
  freshlyImported: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`min-w-0 rounded-2xl border p-4 text-left transition ${
        selected
          ? freshlyImported
            ? "border-green-400/60 bg-green-500/10"
            : "border-violet-300 bg-violet-500/10"
          : "border-violet-950/70 bg-black/25 hover:border-violet-500/70"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-600">
            Session #{session.id}
          </p>

          <p className="mt-2 truncate font-semibold text-zinc-100">
            {session.gameName}
          </p>

          <p className="mt-1 line-clamp-1 text-sm text-zinc-500">
            {session.scenario ?? "No scenario"} ·{" "}
            {formatDateLabel(session.createdAt)}
          </p>

          <p className="mt-1 line-clamp-1 text-sm text-zinc-600">
            {getSessionHardwareLine(session)}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          {freshlyImported && (
            <span className="rounded-full border border-green-400/40 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-300">
              Fresh
            </span>
          )}

          {!freshlyImported && latest && (
            <span className="rounded-full border border-violet-300/40 bg-violet-300/10 px-3 py-1 text-xs font-medium text-violet-200">
              Latest
            </span>
          )}

          <span
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              session.hasSensorSummary
                ? "border-green-500/30 bg-green-500/10 text-green-300"
                : "border-violet-950/80 bg-black/30 text-zinc-600"
            }`}
          >
            {getSensorLabel(session)}
          </span>

          <span
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              selected
                ? "border-violet-300/50 bg-violet-300/10 text-violet-200"
                : "border-violet-950/80 bg-black/30 text-zinc-600"
            }`}
          >
            {selected ? "Selected" : "Pick"}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <MiniMetric label="Average" value={formatFps(session.averageFps)} />

        <MiniMetric
          label="P99"
          value={formatNumber(session.p99FrameTimeMs, " ms")}
        />
      </div>
    </button>
  );
}

function EmptyChoice({
  title,
  text,
  href,
  action,
}: {
  title: string;
  text: string;
  href: string;
  action: string;
}) {
  return (
    <div className="rounded-2xl border border-violet-950/70 bg-black/25 p-4">
      <p className="font-semibold text-zinc-100">{title}</p>
      <p className="mt-1 text-sm leading-6 text-zinc-500">{text}</p>

      <Link
        href={href}
        className="mt-4 inline-flex rounded-full border border-violet-900/80 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-violet-300 hover:text-violet-200"
      >
        {action}
      </Link>
    </div>
  );
}

function MiniChip({
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

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-violet-950/70 bg-black/25 px-3 py-2">
      <p className="text-xs text-zinc-600">{label}</p>
      <p className="mt-1 text-sm font-semibold text-zinc-100">{value}</p>
    </div>
  );
}

function FileInput({
  label,
  accept,
  onChange,
}: {
  label: string;
  accept: string;
  onChange: (file: File | null) => void;
}) {
  return (
    <label className="grid min-w-0 gap-2">
      <span className="text-sm text-zinc-500">{label}</span>

      <input
        type="file"
        accept={accept}
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
        className="w-full min-w-0 rounded-2xl border border-violet-950/80 bg-black/40 px-4 py-3 text-sm text-zinc-300 outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-violet-300 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-black hover:file:bg-violet-200 focus:border-violet-300"
      />
    </label>
  );
}

function StatusMessage({ status }: { status: UploadStatus }) {
  if (!status.message) {
    return null;
  }

  const toneClass =
    status.tone === "success"
      ? "border-green-500/30 bg-green-500/10 text-green-100"
      : status.tone === "error"
        ? "border-rose-500/30 bg-rose-500/10 text-rose-100"
        : "border-violet-950/80 bg-black/30 text-zinc-300";

  return (
    <p className={`rounded-2xl border p-4 text-sm ${toneClass}`}>
      {status.message}
    </p>
  );
}

function getSensorLabel(session: PerformanceSession) {
  return session.hasSensorSummary ? "HWiNFO" : "No sensors";
}

function getSessionHardwareLine(session: PerformanceSession) {
  return `${session.snapshotName} · ${session.buildName} · ${getSensorLabel(
    session,
  )}`;
}

function formatNumber(value: number | null | undefined, suffix = "") {
  if (value === null || value === undefined) {
    return "—";
  }

  return `${value.toFixed(2)}${suffix}`;
}

function formatFps(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "—";
  }

  return `${Math.round(value)} fps`;
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
  });
}
