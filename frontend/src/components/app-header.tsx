import Link from "next/link";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/builds", label: "Builds" },
  { href: "/sessions", label: "Sessions" },
  { href: "/compare", label: "Compare" },
  { href: "/import", label: "Import" },
];

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-violet-950/70 bg-[#05020a]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-violet-300 shadow-[0_0_20px_rgba(167,139,250,0.9)]" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-zinc-100">
                PC LAB
              </p>
              <p className="text-xs text-zinc-600">benchmark control</p>
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item, index) => (
            <div key={item.href} className="flex items-center gap-1">
              {index > 0 && <span className="text-zinc-700">/</span>}

              <Link
                href={item.href}
                className="px-3 py-2 text-sm font-medium text-zinc-500 transition hover:text-violet-200"
              >
                {item.label}
              </Link>
            </div>
          ))}
        </nav>

        <Link
          href="/import"
          className="border border-violet-900/80 px-4 py-2 text-sm font-medium text-violet-200 transition hover:border-violet-300"
        >
          Import run
        </Link>
      </div>
    </header>
  );
}
