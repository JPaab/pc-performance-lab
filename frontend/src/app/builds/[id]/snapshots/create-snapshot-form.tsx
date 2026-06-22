"use client";

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
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(
    field: keyof CreateHardwareSnapshotRequest,
    value: string | number | boolean | null | string[],
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
      setStatus("Snapshot name is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setStatus("Creating snapshot...");

      const requestBody = {
        ...form,
        tweakTags: parseTags(tagsInput),
      };

      const createdSnapshot = await postJson<
        HardwareSnapshot,
        CreateHardwareSnapshotRequest
      >(`/api/builds/${buildId}/snapshots`, requestBody);

      setStatus(`Snapshot #${createdSnapshot.id} created successfully.`);
      setForm(initialForm);
      setTagsInput("");
      router.refresh();
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Could not create snapshot.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6">
      <p className="text-sm font-medium uppercase tracking-[0.25em] text-emerald-400">
        New snapshot
      </p>

      <h2 className="mt-3 text-2xl font-semibold">Register hardware state</h2>

      <p className="mt-3 text-sm text-zinc-500">
        Save a specific BIOS, Windows and tweak state before importing benchmark
        data.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
        <TextInput
          label="Snapshot name"
          value={form.name}
          onChange={(value) => updateField("name", value)}
          placeholder="AtlasOS + 5B Lite"
        />

        <TextInput
          label="CPU overclock"
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
          label="RAM timings"
          value={form.ramTimings}
          onChange={(value) => updateField("ramTimings", value)}
          placeholder="16-19-19-38"
        />

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

        <TextInput
          label="BIOS version"
          value={form.biosVersion}
          onChange={(value) => updateField("biosVersion", value)}
          placeholder="E7D32IMS.1M0"
        />

        <TextInput
          label="Operating system profile"
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

        <TextInput
          label="GPU driver"
          value={form.gpuDriver}
          onChange={(value) => updateField("gpuDriver", value)}
          placeholder="596.36"
        />

        <label className="flex min-w-0 items-center gap-3 rounded-xl border border-zinc-800 bg-black px-4 py-3">
          <input
            type="checkbox"
            checked={form.hagsEnabled}
            onChange={(event) =>
              updateField("hagsEnabled", event.target.checked)
            }
            className="h-4 w-4 shrink-0 accent-emerald-400"
          />
          <span className="text-sm text-zinc-300">HAGS enabled</span>
        </label>

        <TextInput
          label="Tweak tags"
          value={tagsInput}
          onChange={setTagsInput}
          placeholder="ATLASOS, 5B_LITE, DEFENDER_ENABLED, WINDOWS_UPDATE_USABLE"
        />

        <label className="grid min-w-0 gap-2">
          <span className="text-sm text-zinc-500">Notes</span>
          <textarea
            value={form.notes}
            onChange={(event) => updateField("notes", event.target.value)}
            placeholder="Stable checkpoint with timer/kernel/lazywrite tweaks..."
            rows={4}
            className="w-full min-w-0 resize-none rounded-xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-emerald-400"
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Creating..." : "Create snapshot"}
        </button>

        {status && (
          <p className="rounded-xl border border-zinc-800 bg-black/40 p-4 text-sm text-zinc-300">
            {status}
          </p>
        )}
      </form>
    </section>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="grid min-w-0 gap-2">
      <span className="text-sm text-zinc-500">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full min-w-0 rounded-xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-emerald-400"
      />
    </label>
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
    <label className="grid min-w-0 gap-2">
      <span className="text-sm text-zinc-500">{label}</span>
      <input
        type="number"
        value={value ?? ""}
        onChange={(event) =>
          onChange(event.target.value ? Number(event.target.value) : null)
        }
        className="w-full min-w-0 rounded-xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100 outline-none transition focus:border-emerald-400"
      />
    </label>
  );
}
