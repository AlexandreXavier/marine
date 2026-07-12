"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { shipTypeLabel } from "@/lib/shipTypes";

const MAX_RESULTS = 8;

// Pesquisa do topo: dropdown ao vivo de navios que navega para o detalhe;
// Enter abre o diretório completo com o termo.
export function HeaderSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const term = query.trim();

  const results = useQuery(
    api.vessels.search,
    term ? { query: term } : "skip",
  );

  function submit() {
    if (!term) return;
    setOpen(false);
    router.push(`/vessels?q=${encodeURIComponent(term)}`);
  }

  return (
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
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder="Pesquisar navios…"
        className="w-full rounded-full border border-gray-200 bg-gray-50 py-1.5 pl-9 pr-4 text-sm outline-none focus:border-[#136FD5]"
      />

      {open && term && results && results.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          {results.slice(0, MAX_RESULTS).map((vessel) => (
            <li key={vessel._id}>
              <Link
                href={`/vessel/${vessel.mmsi}`}
                onClick={() => {
                  setOpen(false);
                  setQuery("");
                }}
                className="flex items-baseline justify-between gap-3 px-4 py-2 text-sm hover:bg-gray-50"
              >
                <span className="font-medium">{vessel.name ?? "—"}</span>
                <span className="text-xs text-gray-500">
                  {shipTypeLabel(vessel.shipType)} · {vessel.mmsi}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {open && term && results && results.length === 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-400 shadow-lg">
          Sem resultados para “{term}”.
        </div>
      )}
    </div>
  );
}
