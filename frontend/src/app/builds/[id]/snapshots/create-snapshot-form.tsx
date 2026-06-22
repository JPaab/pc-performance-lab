"use client";

import type { ReactNode } from "react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { postJson } from "@/lib/api";

type CreateHardwareSnapshotRequest = {
  name: string;
  cpuOverclock: string;
  ramProfile: string;
  ramTimings: string;
  trfc: number | null;
  trefi: number | null;
  commandRate: string;
  gearMode: string;
  biosVersion: string;
  operatingSystemProfile: string;
  powerPlan: string;
  hagsEnabled: boolean;
  gpuDriver: string;
  tweakTags: string[];
  notes: string;
};

type HardwareSnapshot = CreateHardwareSnapshotRequest & {
  id: number;
  buildId: number;
  createdAt: string;
};

type FormStatus = {
  tone: "idle" | "success" | "error";
  message: string;
};

const initialForm: CreateHardwareSnapshotRequest = {
  name: "",
  cpuOverclock: "",
  ramProfile: "",
  ramTimings: "",
  trfc: 530,
  trefi: 65535,
  commandRate: "1N",
  gearMode: "Gear 1",
  biosVersion: "",
  operatingSystemProfile: "",
  powerPlan: "",
  hagsEnabled: true,
  gpuDriver: "",
  tweakTags: [],
  notes: "",
};

export function CreateSnapshotForm({ buildId }: { buildId: number }) {
  const router = useRouter();

  const [form, setForm] = useState<CreateHardwareSnapshotRequest>(initialForm);
  const [tagsInput, setTagsInput] = useState("");
  const [status, setStatus] = useState<FormStatus>({
    tone: "idle",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(
    field: keyof CreateHardwareSnapshotRequest,
    value: string | number | boolean | null,
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  function parseTags(value: string) {
    return value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name) {
      setStatus({
        tone: "error",
        message: "Snapshot name is required.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setStatus({
        tone: "idle",
        message: "Creating tuning state...",
      });

      const requestBody: CreateHardwareSnapshotRequest = {
        ...form,
        tweakTags: parseTags(tagsInput),
      };

      const createdSnapshot = await postJson<
        HardwareSnapshot,
        CreateHardwareSnapshotRequest
      >(`/api/builds/${buildId}/snapshots`, requestBody);

      setStatus({
        tone: "success",
        message: `Snapshot #${createdSnapshot.id} created. Benchmark import unlocked.`,
      });

      setForm(initialForm);
      setTagsInput("");
      router.refresh();
    } catch (error) {
      setStatus({
        tone: "error",
        message:
          error instanceof Error ? error.message : "Could not create snapshot.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-3xl border border-violet-950/70 bg-[#0d0716]/85 p-5 shadow-2xl shadow-black/30">
      <p className="text-sm font-medium uppercase tracking-[0.25em] text-violet-300">
        New state
      </p>

      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
        Register snapshot
      </h2>

      <p className="mt-2 text-sm leading-6 text-zinc-500">
        Save the exact tuning state before importing a run.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
        <TextInput
          label="Snapshot name"
          value={form.name}
          onChange={(value) => updateField("name", value)}
          placeholder="AtlasOS + 5B Lite"
          required
        />

        <TextInput
          label="CPU state"
          value={form.cpuOverclock}
          onChange={(value) => updateField("cpuOverclock", value)}
          placeholder="P48 / E38 / Ring42"
        />

        <TextInput
          label="RAM profile"
          value={form.ramProfile}
          onChange={(value) => updateField("ramProfile", value)}
          placeholder="DDR4 3600 Gear1 1N"
        />

        <TextInput
          label="OS profile"
          value={form.operatingSystemProfile}
          onChange={(value) => updateField("operatingSystemProfile", value)}
          placeholder="Windows 11 AtlasOS 25H2"
        />

        <TextInput
          label="Power plan"
          value={form.powerPlan}
          onChange={(value) => updateField("powerPlan", value)}
          placeholder="Atlas Performance"
        />

        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <TextInput
            label="GPU driver"
            value={form.gpuDriver}
            onChange={(value) => updateField("gpuDriver", value)}
            placeholder="596.36"
          />

          <label className="flex min-w-0 items-center gap-3 rounded-2xl border border-violet-950/80 bg-black/40 px-4 py-3">
            <input
              type="checkbox"
              checked={form.hagsEnabled}
              onChange={(event) =>
                updateField("hagsEnabled", event.target.checked)
              }
              className="h-4 w-4 shrink-0 accent-violet-300"
            />

            <span className="whitespace-nowrap text-sm text-zinc-300">
              HAGS enabled
            </span>
          </label>
        </div>

        <details className="group rounded-2xl border border-violet-950/70 bg-black/25 p-4">
          <summary className="cursor-pointer list-none text-sm font-medium text-zinc-300 transition hover:text-violet-200">
            Advanced tuning details
            <span className="ml-2 text-zinc-600 group-open:hidden">+</span>
            <span className="ml-2 hidden text-zinc-600 group-open:inline">
              −
            </span>
          </summary>

          <div className="mt-4 grid gap-4">
            <TextInput
              label="RAM timings"
              value={form.ramTimings}
              onChange={(value) => updateField("ramTimings", value)}
              placeholder="16-19-19-38"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <NumberInput
                label="tRFC"
                value={form.trfc}
                onChange={(value) => updateField("trfc", value)}
              />

              <NumberInput
                label="tREFI"
                value={form.trefi}
                onChange={(value) => updateField("trefi", value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput
                label="Command rate"
                value={form.commandRate}
                onChange={(value) => updateField("commandRate", value)}
                placeholder="1N"
              />

              <TextInput
                label="Gear mode"
                value={form.gearMode}
                onChange={(value) => updateField("gearMode", value)}
                placeholder="Gear 1"
              />
            </div>

            <TextInput
              label="BIOS version"
              value={form.biosVersion}
              onChange={(value) => updateField("biosVersion", value)}
              placeholder="E7D32IMS.1M0"
            />

            <TextInput
              label="Tweak tags"
              value={tagsInput}
              onChange={setTagsInput}
              placeholder="ATLASOS, 5B_LITE, DEFENDER_ENABLED"
            />

            <label className="grid min-w-0 gap-2">
              <span className="text-sm text-zinc-500">Notes</span>

              <textarea
                value={form.notes}
                onChange={(event) => updateField("notes", event.target.value)}
                placeholder="Stable checkpoint, rollback notes, benchmark context..."
                rows={4}
                className="w-full min-w-0 resize-none rounded-2xl border border-violet-950/80 bg-black/40 px-4 py-3 text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-violet-300"
              />
            </label>
          </div>
        </details>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-2xl bg-violet-300 px-6 py-3 font-semibold text-black transition hover:bg-violet-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Creating..." : "Create tuning state"}
        </button>

        <StatusMessage status={status} />

        <a
          href="#hardware-snapshots"
          className="text-center text-sm font-medium text-violet-300 transition hover:text-violet-200 lg:hidden"
        >
          View tuning states ↓
        </a>
      </form>
    </section>
  );
}

function FieldShell({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="grid min-w-0 gap-2">
      <span className="text-sm text-zinc-500">
        {label}
        {required && <span className="text-violet-300"> *</span>}
      </span>
      {children}
    </label>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <FieldShell label={label} required={required}>
      <input
        type="text"
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full min-w-0 rounded-2xl border border-violet-950/80 bg-black/40 px-4 py-3 text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-violet-300"
      />
    </FieldShell>
  );
}

function NumberInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <FieldShell label={label}>
      <input
        type="number"
        value={value ?? ""}
        onChange={(event) =>
          onChange(event.target.value ? Number(event.target.value) : null)
        }
        className="w-full min-w-0 rounded-2xl border border-violet-950/80 bg-black/40 px-4 py-3 text-zinc-100 outline-none transition focus:border-violet-300"
      />
    </FieldShell>
  );
}

function StatusMessage({ status }: { status: FormStatus }) {
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
