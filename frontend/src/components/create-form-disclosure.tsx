"use client";

import type { ReactNode, SyntheticEvent } from "react";
import { useRef } from "react";

export function CreateFormDisclosure({
  ariaLabel,
  contentClassName,
  children,
}: {
  ariaLabel: string;
  contentClassName: string;
  children: ReactNode;
}) {
  const formContainerRef = useRef<HTMLDivElement>(null);

  function handleToggle(event: SyntheticEvent<HTMLDetailsElement>) {
    if (!event.currentTarget.open) {
      return;
    }

    window.setTimeout(() => {
      formContainerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
  }

  return (
    <details className="group mt-5" onToggle={handleToggle}>
      <summary
        aria-label={ariaLabel}
        className="flex cursor-pointer list-none items-center justify-center rounded-3xl border border-dashed border-violet-950/80 bg-[#0d0716]/50 py-5 transition hover:border-violet-500/70 hover:bg-[#0d0716]/80"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-violet-900/80 bg-violet-950/20 text-zinc-300 transition group-open:rotate-45 group-hover:border-violet-300 group-hover:text-violet-200">
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
        </span>
      </summary>

      <div
        ref={formContainerRef}
        className={`mx-auto mt-5 scroll-mt-28 ${contentClassName}`}
      >
        {children}
      </div>
    </details>
  );
}
