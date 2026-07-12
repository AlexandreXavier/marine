"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";

type NavItem = { href: string; label: string; icon: React.ReactNode };

const NAV: NavItem[] = [
  {
    href: "/",
    label: "Mapa",
    icon: (
      <path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
    ),
  },
  {
    href: "/vessels",
    label: "Navios",
    icon: (
      <path d="M3 14l9-4 9 4-9 4-9-4zm9-9l7 3-7 3-7-3 7-3zm-9 13l9 4 9-4" />
    ),
  },
  {
    href: "/fleet",
    label: "A minha frota",
    icon: (
      <path d="M12 21s-7-4.35-9.5-8.5C1 9 3 5.5 6.5 5.5c2 0 3.5 1.5 5.5 3 2-1.5 3.5-3 5.5-3C21 5.5 23 9 21.5 12.5 19 16.65 12 21 12 21z" />
    ),
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div
      className="grid h-screen w-full overflow-hidden"
      style={{ gridTemplateColumns: "3.5rem 1fr" }}
    >
      <aside className="flex flex-col items-center gap-1 bg-[#1B252E] py-3 text-white">
        <Link
          href="/"
          className="mb-3 text-2xl leading-none"
          aria-label="VELA Marine"
        >
          ⛵
        </Link>
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              aria-label={item.label}
              className={`flex h-10 w-10 items-center justify-center rounded-md transition-colors ${
                active
                  ? "bg-[#136FD5] text-white"
                  : "text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {item.icon}
              </svg>
            </Link>
          );
        })}
      </aside>

      <div
        className="grid min-h-0 min-w-0"
        style={{ gridTemplateRows: "auto 1fr" }}
      >
        <header className="flex items-center gap-4 border-b border-gray-200 bg-white px-4 py-2">
          <span className="hidden text-lg font-bold tracking-wide sm:block">
            VELA <span className="text-[#00ADEE]">Marine</span>
          </span>
          <div className="relative flex-1 max-w-xl">
            <svg
              viewBox="0 0 24 24"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4-4" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              placeholder="Pesquisar navios…"
              className="w-full rounded-full border border-gray-200 bg-gray-50 py-1.5 pl-9 pr-4 text-sm outline-none focus:border-[#136FD5]"
            />
          </div>
          <Show
            when="signed-in"
            fallback={
              <SignInButton mode="modal">
                <button className="rounded-full bg-[#136FD5] px-4 py-1.5 text-sm font-medium text-white shadow-sm">
                  Iniciar sessão
                </button>
              </SignInButton>
            }
          >
            <UserButton />
          </Show>
        </header>

        <main className="relative min-h-0 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
