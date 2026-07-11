"use client";

import { useQuery } from "convex/react";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { api } from "../../convex/_generated/api";

export default function Home() {
  const vessels = useQuery(api.vessels.list);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between bg-[#1B252E] px-6 py-3 text-white">
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden>
            ⛵
          </span>
          <span className="text-lg font-bold tracking-wide">
            VELA <span className="text-[#00ADEE]">Marine</span>
          </span>
        </div>
        <div>
          <Show
            when="signed-in"
            fallback={
              <SignInButton mode="modal">
                <button className="rounded-full bg-[#136FD5] px-5 py-1.5 text-sm font-medium text-white shadow-md">
                  Iniciar sessão
                </button>
              </SignInButton>
            }
          >
            <UserButton />
          </Show>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <h1 className="mb-1 text-2xl font-bold">Navios</h1>
        <p className="mb-6 text-sm text-gray-500">
          Posições AIS na costa ibérica — em breve num mapa live.
        </p>

        {vessels === undefined && (
          <p className="text-sm text-gray-400">A carregar navios…</p>
        )}

        {vessels?.map((vessel) => (
          <article
            key={vessel._id}
            className="mb-4 rounded border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-2 flex items-baseline gap-3">
              <h2 className="text-lg font-bold">{vessel.name ?? "—"}</h2>
              <span className="text-xs uppercase tracking-wide text-gray-500">
                {vessel.shipType === "sailing" ? "Veleiro" : vessel.shipType}
              </span>
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-gray-500">MMSI</dt>
                <dd>{vessel.mmsi}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Indicativo</dt>
                <dd>{vessel.callSign ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Bandeira</dt>
                <dd>{vessel.flag ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Destino</dt>
                <dd>{vessel.destination ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Velocidade</dt>
                <dd>{vessel.sog != null ? `${vessel.sog} nós` : "—"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Rumo</dt>
                <dd>{vessel.cog != null ? `${vessel.cog}°` : "—"}</dd>
              </div>
            </dl>
          </article>
        ))}

        {vessels?.length === 0 && (
          <p className="text-sm text-gray-400">
            Sem navios ainda — o seed corre no arranque do deployment.
          </p>
        )}
      </main>
    </div>
  );
}
