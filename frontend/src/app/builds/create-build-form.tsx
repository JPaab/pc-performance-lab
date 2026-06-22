"use client";

import type { ReactNode } from "react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { postJson } from "@/lib/api";

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

type PcBuild = CreateBuildRequest & {
  id: number;
  createdAt: string;
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
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(
    field: keyof CreateBuildRequest,
    value: string | number,
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name || !form.cpu || !form.gpu || form.ramGb <= 0) {
      setStatus("Name, CPU, GPU and RAM are required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setStatus("Creating build...");

      const createdBuild = await postJson<PcBuild, CreateBuildRequest>(
        "/api/builds",
        form,
      );

      setStatus(`Build #${createdBuild.id} created successfully.`);
      setForm(initialForm);
      router.refresh();
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Could not create build.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-3xl border border-violet-950/70 bg-[#0d0716]/85 p-5 shadow-2xl shadow-black/30">
      <p className="text-sm font-medium uppercase tracking-[0.25em] text-violet-300">
        New build
      </p>

      <h2 className="mt-2 text-2xl font-semibold">Register PC</h2>

      <p className="mt-2 text-sm text-zinc-500">
        Only the fixed hardware. Tweaks go into snapshots.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
        <TextInput
          label="Build name"
          value={form.name}
          onChange={(value) => updateField("name", value)}
          placeholder="Main Gaming PC"
        />

        <TextInput
          label="CPU"
          value={form.cpu}
          onChange={(value) => updateField("cpu", value)}
          placeholder="Intel Core i7-12700K"
        />

        <TextInput
          label="GPU"
          value={form.gpu}
          onChange={(value) => updateField("gpu", value)}
          placeholder="RTX 3080 Ti"
        />

        <NumberInput
          label="RAM GB"
          value={form.ramGb}
          onChange={(value) => updateField("ramGb", value)}
        />

        <details className="group rounded-2xl border border-violet-950/70 bg-black/25 p-4">
          <summary className="cursor-pointer list-none text-sm font-medium text-zinc-300 transition hover:text-violet-200">
            Optional system context
            <span className="ml-2 text-zinc-600 group-open:hidden">+</span>
            <span className="ml-2 hidden text-zinc-600 group-open:inline">
              −
            </span>
          </summary>

          <div className="mt-4 grid gap-4">
            <TextInput
              label="Motherboard"
              value={form.motherboard}
              onChange={(value) => updateField("motherboard", value)}
              placeholder="MSI MAG Z690 Tomahawk"
            />

            <TextInput
              label="Storage"
              value={form.storage}
              onChange={(value) => updateField("storage", value)}
              placeholder="Corsair MP600 Pro XT"
            />

            <TextInput
              label="Monitor"
              value={form.monitor}
              onChange={(value) => updateField("monitor", value)}
              placeholder="AOC 240Hz"
            />

            <TextInput
              label="Operating system"
              value={form.operatingSystem}
              onChange={(value) => updateField("operatingSystem", value)}
              placeholder="Windows 11 / AtlasOS"
            />

            <TextInput
              label="GPU driver"
              value={form.gpuDriver}
              onChange={(value) => updateField("gpuDriver", value)}
              placeholder="596.36"
            />
          </div>
        </details>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-2xl bg-violet-300 px-6 py-3 font-semibold text-black transition hover:bg-violet-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Creating..." : "Create build"}
        </button>

        {status && (
          <p className="rounded-2xl border border-violet-950/80 bg-black/30 p-4 text-sm text-zinc-300">
            {status}
          </p>
        )}

        <a
          href="#registered-machines"
          className="text-center text-sm font-medium text-violet-300 transition hover:text-violet-200 lg:hidden"
        >
          View registered machines ↓
        </a>
      </form>
    </section>
  );
}

function FieldShell({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid min-w-0 gap-2">
      <span className="text-sm text-zinc-500">{label}</span>
      {children}
    </label>
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
    <FieldShell label={label}>
      <input
        type="text"
        value={value}
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
