"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { AppShell } from "@/components/AppShell";
import { formatRelativeTime } from "@/lib/format";
import { useNow } from "@/lib/useNow";
import { SHIP_TYPE_CATEGORIES, shipTypeLabel } from "@/lib/shipTypes";

function flagEmoji(iso?: string): string {
  if (!iso || iso.length !== 2) return "";
  return String.fromCodePoint(
    ...[...iso.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
  );
}

function Directory() {
  const initialQuery = useSearchParams().get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [shipType, setShipType] = useState("");
  const now = useNow();

  const vessels = useQuery(api.vessels.search, {
    query,
    shipType: shipType || undefined,
  });

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="mx-auto max-w-5xl px-6 py-6">
        <h1 className="mb-4 text-2xl font-bold">Diretório de navios</h1>

        <div className="mb-4 flex flex-wrap gap-3">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar por nome…"
            className="flex-1 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm outline-none focus:border-[#136FD5]"
          />
          <select
            value={shipType}
            onChange={(e) => setShipType(e.target.value)}
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm outline-none focus:border-[#136FD5]"
          >
            <option value="">Todos os tipos</option>
            {SHIP_TYPE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <p className="mb-2 text-sm text-gray-500">
          {vessels === undefined
            ? "A carregar…"
            : `${vessels.length} navio(s)`}
        </p>

        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-2">Nome</th>
                <th className="px-4 py-2">Bandeira</th>
                <th className="px-4 py-2">Tipo</th>
                <th className="px-4 py-2">MMSI</th>
                <th className="px-4 py-2">Última posição</th>
                <th className="px-4 py-2">Recebida</th>
              </tr>
            </thead>
            <tbody>
              {vessels?.map((vessel) => (
                <tr
                  key={vessel._id}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                >
                  <td className="px-4 py-2 font-medium">
                    <Link
                      href={`/vessel/${vessel.mmsi}`}
                      className="text-[#136FD5] hover:underline"
                    >
                      {vessel.name ?? "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    {vessel.flag ? `${flagEmoji(vessel.flag)} ${vessel.flag}` : "—"}
                  </td>
                  <td className="px-4 py-2">{shipTypeLabel(vessel.shipType)}</td>
                  <td className="px-4 py-2 tabular-nums">{vessel.mmsi}</td>
                  <td className="px-4 py-2 tabular-nums">
                    {vessel.lat.toFixed(3)}, {vessel.lng.toFixed(3)}
                  </td>
                  <td className="px-4 py-2 tabular-nums text-gray-500">
                    {now != null
                      ? formatRelativeTime(vessel.lastSeen, now)
                      : "…"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {vessels?.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-gray-400">
              Sem navios para estes critérios.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VesselsPage() {
  return (
    <AppShell>
      <Suspense>
        <Directory />
      </Suspense>
    </AppShell>
  );
}
