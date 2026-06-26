"use client";

import Link from "next/link";
import { useState } from "react";

type SessionSummary = {
  id: number;
  snapshotId: number;
  snapshotName?: string;
  buildId?: number;
  buildName?: string;
  gameName: string;
  scenario: string | null;
  sourceType: string;
  averageFps: number | null;
  onePercentLowFps: number | null;
  p99FrameTimeMs: number | null;
  stutterCount: number | null;
  hasSensorSummary?: boolean;
  createdAt: string;
};

type CardMode = "winner" | "about";

export function DashboardBestOverallCard({
  session,
}: {
  session: SessionSummary | null;
}) {
  const [mode, setMode] = useState<CardMode>("winner");

  if (!session) {
    return (
      <aside className="min-w-0 border-t border-violet-950/70 bg-black/25 p-8 md:p-10 lg:border-l lg:border-t-0">
        <AppExplanation />
      </aside>
    );
  }

  return (
    <aside className="relative min-w-0 border-t border-violet-950/70 bg-black/25 p-8 md:p-10 lg:rounded-r-[2rem] lg:border-l lg:border-t-0">
      <button
        type="button"
        aria-label={
          mode === "winner" ? "Show app explanation" : "Show best run"
        }
        title={mode === "winner" ? "Show app explanation" : "Show best run"}
        onClick={() =>
          setMode((currentMode) =>
            currentMode === "winner" ? "about" : "winner",
          )
        }
        className="absolute right-0 top-1/2 z-30 flex h-12 w-12 translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-violet-900/80 bg-[#0d0716] text-xl shadow-2xl shadow-black/50 ring-[6px] ring-[#05010c] transition hover:border-violet-300 hover:bg-[#0d0716]"
      >
        {mode === "winner" ? "📖" : "🏆"}
      </button>

      {mode === "winner" ? (
        <BestRunView session={session} />
      ) : (
        <AppExplanation compact />
      )}
    </aside>
  );
}

function BestRunView({ session }: { session: SessionSummary }) {
  const hardwareLine = getSessionHardwareLine(session);

  return (
    <>
      <div className="flex items-start justify-between gap-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-zinc-600">
            Best overall run
          </p>

          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-zinc-50">
            Current winner
          </h2>
        </div>

        <Link
          href={`/sessions/${session.id}`}
          className="shrink-0 rounded-full border border-violet-900/80 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-violet-300 hover:text-violet-200"
        >
          Open
        </Link>
      </div>

      <div className="mt-6">
        <p className="truncate text-2xl font-semibold text-zinc-50">
          {session.gameName}
        </p>

        <p className="mt-2 line-clamp-2 text-sm text-zinc-500">
          {session.scenario ?? "No scenario"} · Session #{session.id}
        </p>

        {hardwareLine && (
          <p className="mt-2 line-clamp-1 text-sm text-zinc-600">
            {hardwareLine}
          </p>
        )}
      </div>

      <div className="mt-7">
        <p className="text-xs uppercase tracking-[0.22em] text-zinc-600">
          average fps
        </p>

        <p className="mt-1 text-6xl font-black tracking-[-0.06em] text-violet-300">
          {formatNumber(session.averageFps)}
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <MiniInfo label="1% low" value={formatFps(session.onePercentLowFps)} />

        <MiniInfo
          label="P99"
          value={formatNumber(session.p99FrameTimeMs, " ms")}
        />

        <MiniInfo label="Stutters" value={session.stutterCount ?? "—"} />
      </div>
    </>
  );
}

function AppExplanation({ compact = false }: { compact?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.28em] text-violet-300">
        What this tracks
      </p>

      <h2
        className={`mt-3 font-semibold tracking-[-0.04em] text-zinc-50 ${
          compact ? "text-2xl" : "text-3xl"
        }`}
      >
        A lab for PC tuning decisions
      </h2>

      <p className="mt-4 text-sm leading-6 text-zinc-500">
        Register your hardware, save each tuning state, import benchmark runs
        and attach sensor logs. The goal is simple: compare changes with real
        data and keep only the tweaks that actually improve the system.
      </p>

      <div className="mt-5 grid gap-3">
        <MiniInfo label="Step 1" value="Hardware profile" />
        <MiniInfo label="Step 2" value="Tuning snapshot" />
        <MiniInfo label="Step 3" value="Benchmark + sensors" />
      </div>
    </div>
  );
}

function MiniInfo({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-0 rounded-2xl border border-violet-950/70 bg-black/25 p-4">
      <p className="text-xs text-zinc-600">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-zinc-100">
        {value}
      </p>
    </div>
  );
}

function getSessionHardwareLine(session: SessionSummary | null) {
  if (!session) {
    return "";
  }

  const parts: string[] = [];

  if (session.snapshotName) {
    parts.push(session.snapshotName);
  }

  if (session.buildName) {
    parts.push(session.buildName);
  }

  if (typeof session.hasSensorSummary === "boolean") {
    parts.push(session.hasSensorSummary ? "HWiNFO" : "No sensors");
  }

  return parts.join(" · ");
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
