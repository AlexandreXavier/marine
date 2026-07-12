"use client";

import Link from "next/link";
import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { SignInButton } from "@clerk/nextjs";
import { api } from "../../../convex/_generated/api";
import { AppShell } from "@/components/AppShell";
import { formatRelativeTime } from "@/lib/format";
import { useNow } from "@/lib/useNow";
import { shipTypeLabel } from "@/lib/shipTypes";

function flagEmoji(iso?: string): string {
  if (!iso || iso.length !== 2) return "";
  return String.fromCodePoint(
    ...[...iso.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
  );
}

function FleetList() {
  const fleet = useQuery(api.fleet.list);
  const now = useNow();

  if (fleet && fleet.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        A tua frota está vazia. Abre um navio e usa “Adicionar à frota”.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fleet?.map((vessel) => (
        <Link
          key={vessel._id}
          href={`/vessel/${vessel.mmsi}`}
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:border-[#136FD5]"
        >
          <div className="mb-2 flex items-baseline gap-2">
            <span>{flagEmoji(vessel.flag)}</span>
            <h2 className="font-bold">{vessel.name ?? "—"}</h2>
            <span className="text-xs uppercase tracking-wide text-gray-500">
              {shipTypeLabel(vessel.shipType)}
            </span>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <dt className="text-gray-500">Velocidade</dt>
            <dd className="text-right">
              {vessel.sog != null ? `${vessel.sog} nós` : "—"}
            </dd>
            <dt className="text-gray-500">Destino</dt>
            <dd className="text-right">{vessel.destination ?? "—"}</dd>
            <dt className="text-gray-500">Recebida</dt>
            <dd className="text-right text-gray-500">
              {now != null ? formatRelativeTime(vessel.lastSeen, now) : "…"}
            </dd>
          </dl>
        </Link>
      ))}
    </div>
  );
}

export default function FleetPage() {
  return (
    <AppShell>
      <div className="h-full overflow-y-auto bg-gray-50">
        <div className="mx-auto max-w-4xl px-6 py-6">
          <h1 className="mb-4 text-2xl font-bold">A minha frota</h1>
          <Authenticated>
            <FleetList />
          </Authenticated>
          <Unauthenticated>
            <p className="text-sm text-gray-500">
              <SignInButton mode="modal">
                <button className="font-medium text-[#136FD5] hover:underline">
                  Inicia sessão
                </button>
              </SignInButton>{" "}
              para acompanhar a tua frota de navios.
            </p>
          </Unauthenticated>
        </div>
      </div>
    </AppShell>
  );
}
