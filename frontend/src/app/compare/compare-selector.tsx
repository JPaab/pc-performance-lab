"use client";

import { useMemo, useState } from "react";

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
  onePercentLowFps: number | null;
  zeroPointOnePercentLowFps: number | null;
  p99FrameTimeMs: number | null;
  stutterCount: number | null;
  droppedFrames: number | null;
  hasSensorSummary: boolean;
  createdAt: string;
};

export function CompareSelector({
  sessions,
  baselineId,
  comparisonId,
}: {
  sessions: PerformanceSession[];
  baselineId?: string;
  comparisonId?: string;
}) {
  const [selectedBaselineId, setSelectedBaselineId] = useState(
    baselineId && baselineId !== comparisonId ? baselineId : "",
  );

  const [selectedComparisonId, setSelectedComparisonId] = useState(
    comparisonId && comparisonId !== baselineId ? comparisonId : "",
  );

  const displayNumberById = useMemo(() => {
    return new Map(sessions.map((session, index) => [session.id, index + 1]));
  }, [sessions]);

  const baselineOptions = sessions.filter(
    (session) => String(session.id) !== selectedComparisonId,
  );

  const comparisonOptions = sessions.filter(
    (session) => String(session.id) !== selectedBaselineId,
  );

  return (
    <section className="mt-8 rounded-3xl border border-violet-950/70 bg-[#0d0716]/80 p-6 shadow-2xl shadow-black/25">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-violet-300">
            Select runs
          </p>

          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
            Baseline vs candidate
          </h2>
        </div>

        <p className="max-w-xl text-sm leading-6 text-zinc-500">
          Baseline is the known-good state. Candidate is the tweak being judged.
        </p>
      </div>

      <form className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
        <SessionSelect
          label="Baseline"
          name="s1"
          sessions={baselineOptions}
          displayNumberById={displayNumberById}
          value={selectedBaselineId}
          onChange={setSelectedBaselineId}
        />

        <SessionSelect
          label="Candidate"
          name="s2"
          sessions={comparisonOptions}
          displayNumberById={displayNumberById}
          value={selectedComparisonId}
          onChange={setSelectedComparisonId}
        />

        <button
          type="submit"
          disabled={
            sessions.length < 2 || !selectedBaselineId || !selectedComparisonId
          }
          className="rounded-2xl bg-violet-300 px-6 py-3 font-semibold text-black transition hover:bg-violet-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Compare
        </button>
      </form>
    </section>
  );
}

function SessionSelect({
  label,
  name,
  sessions,
  displayNumberById,
  value,
  onChange,
}: {
  label: string;
  name: string;
  sessions: PerformanceSession[];
  displayNumberById: Map<number, number>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid min-w-0 gap-2">
      <span className="text-sm text-zinc-500">{label}</span>

      <select
        name={name}
        value={value}
        disabled={sessions.length === 0}
        onChange={(event) => onChange(event.target.value)}
        className="w-full min-w-0 rounded-2xl border border-violet-950/80 bg-black/40 px-4 py-3 text-zinc-100 outline-none transition focus:border-violet-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">Select session</option>

        {sessions.map((session) => (
          <option key={session.id} value={session.id}>
            {getSessionOptionLabel(session, displayNumberById)}
          </option>
        ))}
      </select>
    </label>
  );
}

function getSessionOptionLabel(
  session: PerformanceSession,
  displayNumberById: Map<number, number>,
) {
  return `Run #${displayNumberById.get(session.id) ?? session.id} · ${
    session.snapshotName
  } · ${session.buildName} · ${session.gameName} · ${
    session.hasSensorSummary ? "HWiNFO" : "No sensors"
  }`;
}
