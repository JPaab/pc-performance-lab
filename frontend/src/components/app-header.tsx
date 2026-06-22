import Link from "next/link";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/builds", label: "Hardware" },
  { href: "/sessions", label: "Runs" },
  { href: "/compare", label: "Compare" },
  { href: "/import", label: "Import" },
];

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-violet-950/70 bg-[#05020a]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="group shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-2.5 w-2.5 rounded-full bg-violet-300 shadow-[0_0_24px_rgba(167,139,250,0.95)] transition group-hover:scale-125" />
              <div className="absolute inset-0 rounded-full bg-violet-300/30 blur-md" />
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-zinc-100">
                PC LAB
              </p>
              <p className="text-xs text-zinc-600">tweak decision system</p>
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map((item, index) => (
            <div key={item.href} className="flex items-center gap-2">
              {index > 0 && <span className="text-zinc-800">/</span>}

              <Link
                href={item.href}
                className="px-2 py-2 text-sm font-medium text-zinc-500 transition hover:text-violet-200 hover:[text-shadow:0_0_16px_rgba(196,181,253,0.85)]"
              >
                {item.label}
              </Link>
            </div>
          ))}
        </nav>

        <div className="hidden text-xs uppercase tracking-[0.24em] text-zinc-700 lg:block">
          Benchmark control
        </div>
      </div>

      <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-6 pb-4 md:hidden">
        {navItems.map((item, index) => (
          <div key={item.href} className="flex shrink-0 items-center gap-2">
            {index > 0 && <span className="text-zinc-800">/</span>}

            <Link
              href={item.href}
              className="text-sm font-medium text-zinc-500 transition hover:text-violet-200 hover:[text-shadow:0_0_16px_rgba(196,181,253,0.85)]"
            >
              {item.label}
            </Link>
          </div>
        ))}
      </nav>
    </header>
  );
}
