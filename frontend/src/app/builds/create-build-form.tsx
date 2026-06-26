"use client";

import type { ReactNode } from "react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { buildApiUrl, postJson } from "@/lib/api";

type CreateBuildRequest = {
  name: string;
  cpu: string;
  gpu: string;
  ramGb: number;
  motherboard: string;
  storage: string;
  monitor: string;
  operatingSystem: string;
  gpuDriver: string;
};

type DetectedHardwareResponse = {
  name: string | null;
  cpu: string | null;
  gpu: string | null;
  ramGb: number | null;
  motherboard: string | null;
  storage: string | null;
  monitor: string | null;
  operatingSystem: string | null;
  gpuDriver: string | null;
  biosVersion: string | null;
};

type PcBuild = CreateBuildRequest & {
  id: number;
  createdAt: string;
};

type FormStatus = {
  tone: "idle" | "success" | "error";
  message: string;
};

const initialForm: CreateBuildRequest = {
  name: "",
  cpu: "",
  gpu: "",
  ramGb: 32,
  motherboard: "",
  storage: "",
  monitor: "",
  operatingSystem: "",
  gpuDriver: "",
};

export function CreateBuildForm() {
  const router = useRouter();

  const [form, setForm] = useState<CreateBuildRequest>(initialForm);
  const [status, setStatus] = useState<FormStatus>({
    tone: "idle",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDetectingHardware, setIsDetectingHardware] = useState(false);
  const [detectedBiosVersion, setDetectedBiosVersion] = useState<string | null>(
    null,
  );

  function updateField(
    field: keyof CreateBuildRequest,
    value: string | number,
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  async function handleDetectHardware() {
    try {
      setIsDetectingHardware(true);
      setStatus({
        tone: "idle",
        message: "Detecting local hardware...",
      });

      const response = await fetch(buildApiUrl("/api/hardware/local"), {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Could not detect local hardware.");
      }

      const detectedHardware =
        (await response.json()) as DetectedHardwareResponse;

      setForm((currentForm) => ({
        ...currentForm,
        name: detectedHardware.name ?? currentForm.name,
        cpu: detectedHardware.cpu ?? currentForm.cpu,
        gpu: detectedHardware.gpu ?? currentForm.gpu,
        ramGb: detectedHardware.ramGb ?? currentForm.ramGb,
        motherboard: detectedHardware.motherboard ?? currentForm.motherboard,
        storage: detectedHardware.storage ?? currentForm.storage,
        monitor: detectedHardware.monitor ?? currentForm.monitor,
        operatingSystem:
          detectedHardware.operatingSystem ?? currentForm.operatingSystem,
        gpuDriver: "",
      }));

      setDetectedBiosVersion(detectedHardware.biosVersion);

      setStatus({
        tone: "success",
        message:
          "Hardware detected. Add a build name and review before saving.",
      });
    } catch (error) {
      setStatus({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Could not detect local hardware.",
      });
    } finally {
      setIsDetectingHardware(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name || !form.cpu || !form.gpu) {
      setStatus({
        tone: "error",
        message: "Build name, CPU and GPU are required.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setStatus({
        tone: "idle",
        message: "Creating hardware profile...",
      });

      await postJson<PcBuild, CreateBuildRequest>("/api/builds", form);

      setStatus({
        tone: "success",
        message: "Hardware profile created. Tuning state unlocked.",
      });

      setForm(initialForm);
      setDetectedBiosVersion(null);
      router.refresh();
    } catch (error) {
      setStatus({
        tone: "error",
        message:
          error instanceof Error ? error.message : "Could not create build.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="w-full rounded-3xl border border-violet-950/70 bg-[#0d0716]/85 p-6 shadow-2xl shadow-black/30">
      <p className="text-sm font-medium uppercase tracking-[0.25em] text-violet-300">
        New hardware
      </p>

      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
        Register build
      </h2>

      <p className="mt-2 text-sm leading-6 text-zinc-500">
        Fixed physical machine only. Tweaks go in snapshots.
      </p>

      <div className="mt-5 rounded-2xl border border-violet-950/70 bg-black/25 p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-200">
              Detect this PC automatically
            </p>

            <p className="mt-1 text-sm leading-6 text-zinc-600">
              Pull CPU, GPU, RAM, motherboard, storage, monitor and OS from the
              local backend.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDetectHardware}
            disabled={isDetectingHardware || isSubmitting}
            className="shrink-0 rounded-full border border-violet-900/80 bg-violet-950/20 px-5 py-3 text-sm font-medium text-zinc-300 transition hover:border-violet-300 hover:text-violet-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDetectingHardware ? "Detecting..." : "Detect local PC"}
          </button>
        </div>
      </div>

      {detectedBiosVersion && (
        <p className="mt-4 rounded-2xl border border-violet-950/70 bg-black/25 p-4 text-sm text-zinc-500">
          Detected BIOS version:{" "}
          <span className="font-medium text-violet-200">
            {detectedBiosVersion}
          </span>
          . Save this later in the tuning state.
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-6 grid gap-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <TextInput
              label="Build name"
              value={form.name}
              onChange={(value) => updateField("name", value)}
              placeholder="Main 12700K / 3080 Ti"
              required
            />
          </div>

          <TextInput
            label="CPU"
            value={form.cpu}
            onChange={(value) => updateField("cpu", value)}
            placeholder="Intel Core i7-12700K"
            required
          />

          <TextInput
            label="GPU"
            value={form.gpu}
            onChange={(value) => updateField("gpu", value)}
            placeholder="MSI RTX 3080 Ti Gaming X Trio"
            required
          />

          <div className="md:max-w-xs">
            <NumberInput
              label="RAM GB"
              value={form.ramGb}
              onChange={(value) => updateField("ramGb", value)}
            />
          </div>
        </div>

        <details className="group rounded-2xl border border-violet-950/70 bg-black/25 p-4">
          <summary className="cursor-pointer list-none text-sm font-medium text-zinc-300 transition hover:text-violet-200">
            Optional context
            <span className="ml-2 text-zinc-600 group-open:hidden">+</span>
            <span className="ml-2 hidden text-zinc-600 group-open:inline">
              −
            </span>
          </summary>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <TextInput
              label="Motherboard"
              value={form.motherboard}
              onChange={(value) => updateField("motherboard", value)}
              placeholder="MSI MAG Z690 Tomahawk WIFI DDR4"
            />

            <TextInput
              label="Storage"
              value={form.storage}
              onChange={(value) => updateField("storage", value)}
              placeholder="Corsair MP600 Pro XT 1TB"
            />

            <TextInput
              label="Monitor"
              value={form.monitor}
              onChange={(value) => updateField("monitor", value)}
              placeholder="AOC 240Hz 1080p"
            />

            <TextInput
              label="OS base"
              value={form.operatingSystem}
              onChange={(value) => updateField("operatingSystem", value)}
              placeholder="Windows 11 AtlasOS 25H2"
            />
          </div>
        </details>

        <button
          type="submit"
          disabled={isSubmitting || isDetectingHardware}
          className="rounded-2xl bg-violet-300 px-6 py-3 font-semibold text-black transition hover:bg-violet-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Creating..." : "Create hardware profile"}
        </button>

        <StatusMessage status={status} />

        <a
          href="#registered-machines"
          className="text-center text-sm font-medium text-violet-300 transition hover:text-violet-200 lg:hidden"
        >
          View builds ↓
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
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <FieldShell label={label}>
      <input
        type="number"
        min={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
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
