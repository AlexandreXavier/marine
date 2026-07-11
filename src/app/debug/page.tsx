"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

function age(lastSeen: number): string {
  const seconds = Math.round((Date.now() - lastSeen) / 1000);
  if (seconds < 60) return `há ${seconds}s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `há ${minutes} min`;
  return `há ${Math.round(minutes / 60)} h`;
}

export default function DebugPage() {
  const vessels = useQuery(api.vessels.list);
  const sorted = vessels
    ? [...vessels].sort((a, b) => b.lastSeen - a.lastSeen)
    : undefined;

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8">
      <h1 className="mb-1 text-2xl font-bold">Debug — ingestão AIS</h1>
      <p className="mb-6 text-sm text-gray-500">
        {sorted === undefined
          ? "A carregar…"
          : `${sorted.length} navio(s) na base de dados, em tempo real.`}
      </p>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-300 text-left text-xs uppercase tracking-wide text-gray-500">
            <th className="py-2 pr-4">Nome</th>
            <th className="py-2 pr-4">MMSI</th>
            <th className="py-2 pr-4">Bandeira</th>
            <th className="py-2 pr-4">Tipo</th>
            <th className="py-2 pr-4">Posição</th>
            <th className="py-2 pr-4">Vel.</th>
            <th className="py-2">Última receção</th>
          </tr>
        </thead>
        <tbody>
          {sorted?.slice(0, 100).map((vessel) => (
            <tr key={vessel._id} className="border-b border-gray-100">
              <td className="py-1.5 pr-4 font-medium">{vessel.name ?? "—"}</td>
              <td className="py-1.5 pr-4">{vessel.mmsi}</td>
              <td className="py-1.5 pr-4">{vessel.flag ?? "—"}</td>
              <td className="py-1.5 pr-4">{vessel.shipType ?? "—"}</td>
              <td className="py-1.5 pr-4 tabular-nums">
                {vessel.lat.toFixed(3)}, {vessel.lng.toFixed(3)}
              </td>
              <td className="py-1.5 pr-4 tabular-nums">
                {vessel.sog != null ? `${vessel.sog} nós` : "—"}
              </td>
              <td className="py-1.5 tabular-nums">{age(vessel.lastSeen)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
