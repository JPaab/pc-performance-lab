"use client";

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
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6">
      <p className="text-sm font-medium uppercase tracking-[0.25em] text-emerald-400">
        New build
      </p>

      <h2 className="mt-3 text-2xl font-semibold">Register PC build</h2>

      <p className="mt-3 text-sm text-zinc-500">
        Add the base hardware profile. Snapshots will later describe BIOS,
        Windows and tweak states.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
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
          placeholder="NVIDIA GeForce RTX 3080 Ti"
        />

        <label className="grid gap-2">
          <span className="text-sm text-zinc-500">RAM GB</span>
          <input
            type="number"
            min={1}
            value={form.ramGb}
            onChange={(event) =>
              updateField("ramGb", Number(event.target.value))
            }
            className="rounded-xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100 outline-none transition focus:border-emerald-400"
          />
        </label>

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
          placeholder="AOC 240Hz"
        />

        <TextInput
          label="Operating system"
          value={form.operatingSystem}
          onChange={(value) => updateField("operatingSystem", value)}
          placeholder="Windows 11 Pro 25H2 / AtlasOS"
        />

        <TextInput
          label="GPU driver"
          value={form.gpuDriver}
          onChange={(value) => updateField("gpuDriver", value)}
          placeholder="596.36"
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Creating..." : "Create build"}
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
    <label className="grid gap-2">
      <span className="text-sm text-zinc-500">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="rounded-xl border border-zinc-800 bg-black px-4 py-3 text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-emerald-400"
      />
    </label>
  );
}
