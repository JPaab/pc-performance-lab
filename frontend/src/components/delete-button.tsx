"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { buildApiUrl } from "@/lib/api";

const pillTextStyle = {
  fontFamily: "inherit",
  fontSize: "0.875rem",
  fontWeight: 500,
  lineHeight: "1.25rem",
} as const;

export function DeleteButton({
  endpoint,
  confirmMessage,
  redirectTo,
  className,
  children = "Delete",
}: {
  endpoint: string;
  confirmMessage: string;
  redirectTo?: string;
  className: string;
  children?: string;
}) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  async function handleDelete() {
    try {
      setIsDeleting(true);
      setErrorMessage("");

      const response = await fetch(buildApiUrl(endpoint), {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Delete failed with status ${response.status}`);
      }

      setIsOpen(false);

      if (redirectTo) {
        router.push(redirectTo);
        router.refresh();
        return;
      }

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not delete item.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        disabled={isDeleting}
        onClick={() => {
          setErrorMessage("");
          setIsOpen(true);
        }}
        style={pillTextStyle}
        className={`inline-flex cursor-pointer appearance-none items-center justify-center whitespace-nowrap ${className} disabled:cursor-not-allowed`}
      >
        {isDeleting ? "Deleting..." : children}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
          <button
            type="button"
            aria-label="Close delete modal"
            className="absolute inset-0 cursor-pointer bg-black/70 backdrop-blur-sm"
            onClick={() => {
              if (!isDeleting) {
                setIsOpen(false);
              }
            }}
          />

          <section className="relative w-full max-w-md rounded-3xl border border-violet-950/80 bg-[#0d0716] p-6 shadow-2xl shadow-black/50">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-rose-300">
              Delete
            </p>

            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-zinc-50">
              Are you sure?
            </h2>

            <p className="mt-3 text-sm leading-6 text-zinc-500">
              {confirmMessage}
            </p>

            {errorMessage && (
              <p className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
                {errorMessage}
              </p>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setIsOpen(false)}
                style={pillTextStyle}
                className="inline-flex h-11 cursor-pointer items-center justify-center whitespace-nowrap rounded-full border border-violet-900/80 bg-violet-950/20 px-5 text-zinc-300 transition hover:border-violet-300 hover:text-violet-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                style={pillTextStyle}
                className="inline-flex h-11 cursor-pointer items-center justify-center whitespace-nowrap rounded-full border border-rose-900/70 bg-rose-950/20 px-5 text-rose-300 transition hover:border-rose-400 hover:bg-rose-950/30 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
