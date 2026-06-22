"use client";

import type { ReactNode } from "react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  gameName: string;
  scenario: string | null;
  sourceType: string;
  averageFps: number | null;
  p99FrameTimeMs: number | null;
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

  const [availableSessions, setAvailableSessions] =
    useState<PerformanceSession[]>(sessions);

  const [selectedSnapshotId, setSelectedSnapshotId] = useState(
    snapshots[0] ? String(snapshots[0].id) : "",
  );

  const [selectedSessionId, setSelectedSessionId] = useState(
    sessions[0] ? String(sessions[0].id) : "",
  );

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

  useEffect(() => {
    setAvailableSessions(sessions);

    setSelectedSessionId((currentValue) => {
      if (currentValue) {
        return currentValue;
      }

      return sessions[0] ? String(sessions[0].id) : "";
    });
  }, [sessions]);

  useEffect(() => {
    setSelectedSnapshotId((currentValue) => {
      if (currentValue) {
        return currentValue;
      }

      return snapshots[0] ? String(snapshots[0].id) : "";
    });
  }, [snapshots]);

  async function handleCapFrameXUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedSnapshotId) {
      setCapFrameXStatus({
        tone: "error",
        message: "Select a hardware snapshot before importing CapFrameX.",
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
      setCapFrameXFile(null);
      setCapFrameXInputKey((currentKey) => currentKey + 1);

      setCapFrameXStatus({
        tone: "success",
        message: `Session #${createdSession.id} imported. You can now attach HWiNFO to it.`,
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
    <section className="mt-8 grid gap-6 lg:grid-cols-2 lg:items-start">
      <ImportPanel
        kicker="Performance file"
        title="CapFrameX JSON"
        description="Creates a new performance session from frametime data, FPS, lows, P99 and dropped frames."
      >
        <form onSubmit={handleCapFrameXUpload} className="grid gap-4">
          <SelectField
            label="Target snapshot"
            value={selectedSnapshotId}
            onChange={setSelectedSnapshotId}
            disabled={snapshots.length === 0}
          >
            {snapshots.length === 0 ? (
              <option value="">No snapshots available</option>
            ) : (
              snapshots.map((snapshot) => (
                <option key={snapshot.id} value={snapshot.id}>
                  #{snapshot.id} · {snapshot.name} ·{" "}
                  {buildNameById.get(snapshot.buildId) ??
                    `Build #${snapshot.buildId}`}
                </option>
              ))
            )}
          </SelectField>

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

          {snapshots.length === 0 && (
            <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm leading-6 text-rose-100/80">
              You need at least one build snapshot before importing a CapFrameX
              run.
            </p>
          )}
        </form>
      </ImportPanel>

      <ImportPanel
        kicker="Sensor file"
        title="HWiNFO CSV"
        description="Attaches sensor data to an existing session. Use the session created by the matching CapFrameX import."
      >
        <form onSubmit={handleHwInfoUpload} className="grid gap-4">
          <SelectField
            label="Target session"
            value={selectedSessionId}
            onChange={setSelectedSessionId}
            disabled={availableSessions.length === 0}
          >
            {availableSessions.length === 0 ? (
              <option value="">No sessions available</option>
            ) : (
              availableSessions.map((session) => (
                <option key={session.id} value={session.id}>
                  #{session.id} · {session.gameName} ·{" "}
                  {session.scenario ?? "No scenario"}
                </option>
              ))
            )}
          </SelectField>

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

          {availableSessions.length === 0 && (
            <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm leading-6 text-rose-100/80">
              You need at least one performance session before attaching HWiNFO
              sensor data.
            </p>
          )}
        </form>
      </ImportPanel>
    </section>
  );
}

function ImportPanel({
  kicker,
  title,
  description,
  children,
}: {
  kicker: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-violet-950/70 bg-[#0d0716]/80 p-6 shadow-2xl shadow-black/25">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-violet-300">
            {kicker}
          </p>

          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
            {title}
          </h2>
        </div>

        <p className="max-w-md text-sm leading-6 text-zinc-500">
          {description}
        </p>
      </div>

      <div className="mt-6">{children}</div>
    </section>
  );
}

function SelectField({
  label,
  value,
  onChange,
  disabled,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="grid min-w-0 gap-2">
      <span className="text-sm text-zinc-500">{label}</span>

      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="w-full min-w-0 rounded-2xl border border-violet-950/80 bg-black/40 px-4 py-3 text-zinc-100 outline-none transition focus:border-violet-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {children}
      </select>
    </label>
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
      ? "border-violet-500/30 bg-violet-500/10 text-violet-100"
      : status.tone === "error"
        ? "border-rose-500/30 bg-rose-500/10 text-rose-100"
        : "border-violet-950/80 bg-black/30 text-zinc-300";

  return (
    <p className={`rounded-2xl border p-4 text-sm ${toneClass}`}>
      {status.message}
    </p>
  );
}
