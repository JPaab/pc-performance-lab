"use client";

import { useState } from "react";
import { uploadFile } from "@/lib/uploads";

type HardwareSnapshot = {
  id: number;
  buildId: number;
  name: string;
  cpuOverclock: string | null;
  ramProfile: string | null;
  operatingSystemProfile: string | null;
  tweakTags: string[];
  createdAt: string;
};

type PerformanceSession = {
  id: number;
  snapshotId: number;
  gameName: string;
  scenario: string | null;
  sourceType: string;
  averageFps: number | null;
  createdAt: string;
};

type ImportFormsProps = {
  snapshots: HardwareSnapshot[];
  sessions: PerformanceSession[];
};

export function ImportForms({ snapshots, sessions }: ImportFormsProps) {
  const [selectedSnapshotId, setSelectedSnapshotId] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState("");

  const [capFrameXFile, setCapFrameXFile] = useState<File | null>(null);
  const [hwInfoFile, setHwInfoFile] = useState<File | null>(null);

  const [capFrameXStatus, setCapFrameXStatus] = useState("");
  const [hwInfoStatus, setHwInfoStatus] = useState("");

  const [isUploadingCapFrameX, setIsUploadingCapFrameX] = useState(false);
  const [isUploadingHwInfo, setIsUploadingHwInfo] = useState(false);

  async function handleCapFrameXUpload() {
    if (!selectedSnapshotId || !capFrameXFile) {
      setCapFrameXStatus("Select a snapshot and a CapFrameX JSON file first.");
      return;
    }

    try {
      setIsUploadingCapFrameX(true);
      setCapFrameXStatus("Uploading CapFrameX JSON...");

      const createdSession = await uploadFile(
        `/api/snapshots/${selectedSnapshotId}/sessions/import/capframex`,
        capFrameXFile,
      );

      setCapFrameXStatus(
        `Imported successfully. Created session #${createdSession.id}.`,
      );
    } catch (error) {
      setCapFrameXStatus(
        error instanceof Error ? error.message : "CapFrameX import failed.",
      );
    } finally {
      setIsUploadingCapFrameX(false);
    }
  }

  async function handleHwInfoUpload() {
    if (!selectedSessionId || !hwInfoFile) {
      setHwInfoStatus("Select a session and a HWiNFO CSV file first.");
      return;
    }

    try {
      setIsUploadingHwInfo(true);
      setHwInfoStatus("Uploading HWiNFO CSV...");

      const createdSummary = await uploadFile(
        `/api/sessions/${selectedSessionId}/sensor-summaries/import/hwinfo`,
        hwInfoFile,
      );

      setHwInfoStatus(
        `Imported successfully. Created sensor summary #${createdSummary.id}.`,
      );
    } catch (error) {
      setHwInfoStatus(
        error instanceof Error ? error.message : "HWiNFO import failed.",
      );
    } finally {
      setIsUploadingHwInfo(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-emerald-400">
          CapFrameX
        </p>

        <h2 className="mt-3 text-2xl font-semibold">
          Import performance session
        </h2>

        <p className="mt-3 text-sm text-zinc-500">
          Select the hardware snapshot used during the benchmark, then upload
          the CapFrameX JSON export.
        </p>

        <div className="mt-6 grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm text-zinc-500">Hardware snapshot</span>
            <select
              value={selectedSnapshotId}
              onChange={(event) => setSelectedSnapshotId(event.target.value)}
              className="rounded-xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100 outline-none transition focus:border-emerald-400"
            >
              <option value="">Select snapshot</option>
              {snapshots.map((snapshot) => (
                <option key={snapshot.id} value={snapshot.id}>
                  #{snapshot.id} · {snapshot.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm text-zinc-500">CapFrameX JSON</span>
            <input
              type="file"
              accept=".json,application/json"
              onChange={(event) =>
                setCapFrameXFile(event.target.files?.[0] ?? null)
              }
              className="rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300 file:mr-4 file:rounded-full file:border-0 file:bg-emerald-400 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-black"
            />
          </label>

          <button
            type="button"
            onClick={handleCapFrameXUpload}
            disabled={isUploadingCapFrameX}
            className="rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUploadingCapFrameX ? "Importing..." : "Import CapFrameX JSON"}
          </button>

          {capFrameXStatus && (
            <p className="rounded-xl border border-zinc-800 bg-black/40 p-4 text-sm text-zinc-300">
              {capFrameXStatus}
            </p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-emerald-400">
          HWiNFO
        </p>

        <h2 className="mt-3 text-2xl font-semibold">Import sensor summary</h2>

        <p className="mt-3 text-sm text-zinc-500">
          Select the performance session, then upload the matching HWiNFO CSV
          log to attach temperatures, power and usage data.
        </p>

        <div className="mt-6 grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm text-zinc-500">Performance session</span>
            <select
              value={selectedSessionId}
              onChange={(event) => setSelectedSessionId(event.target.value)}
              className="rounded-xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100 outline-none transition focus:border-emerald-400"
            >
              <option value="">Select session</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  #{session.id} · {session.gameName} ·{" "}
                  {session.scenario ?? "No scenario"}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm text-zinc-500">HWiNFO CSV</span>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(event) =>
                setHwInfoFile(event.target.files?.[0] ?? null)
              }
              className="rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300 file:mr-4 file:rounded-full file:border-0 file:bg-emerald-400 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-black"
            />
          </label>

          <button
            type="button"
            onClick={handleHwInfoUpload}
            disabled={isUploadingHwInfo}
            className="rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUploadingHwInfo ? "Importing..." : "Import HWiNFO CSV"}
          </button>

          {hwInfoStatus && (
            <p className="rounded-xl border border-zinc-800 bg-black/40 p-4 text-sm text-zinc-300">
              {hwInfoStatus}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
