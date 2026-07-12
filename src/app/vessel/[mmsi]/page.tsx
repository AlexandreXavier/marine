"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { AppShell } from "@/components/AppShell";
import { VesselSilhouette } from "@/components/VesselSilhouette";
import { formatRelativeTime } from "@/lib/format";
import { navStatusLabel, shipTypeLabel } from "@/lib/shipTypes";

function flagEmoji(iso?: string): string {
  if (!iso || iso.length !== 2) return "";
  return String.fromCodePoint(
    ...[...iso.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-gray-100 py-2 last:border-0">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-600">
        {title}
      </h2>
      {children}
    </section>
  );
}

const DASH = "—";

export default function VesselDetailPage() {
  const params = useParams<{ mmsi: string }>();
  const mmsi = Number(params.mmsi);
  const valid = Number.isInteger(mmsi) && mmsi > 0;
  const vessel = useQuery(api.vessels.getByMmsi, valid ? { mmsi } : "skip");

  return (
    <AppShell>
      <div className="h-full overflow-y-auto bg-gray-50">
        <div className="mx-auto max-w-4xl px-6 py-6">
          <Link
            href="/"
            className="mb-4 inline-block text-sm text-[#136FD5] hover:underline"
          >
            ← Voltar ao mapa
          </Link>

          {vessel === undefined && valid && (
            <p className="text-sm text-gray-400">A carregar navio…</p>
          )}

          {(vessel === null || !valid) && (
            <div className="rounded-lg border border-gray-200 bg-white p-10 text-center">
              <h1 className="mb-1 text-xl font-bold">Navio não encontrado</h1>
              <p className="text-sm text-gray-500">
                Não há dados AIS para o MMSI {params.mmsi}. Pode estar fora da
                área de cobertura ou não ter transmitido recentemente.
              </p>
            </div>
          )}

          {vessel && (
            <>
              <header className="mb-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-2xl">{flagEmoji(vessel.flag)}</span>
                <h1 className="text-2xl font-bold">{vessel.name ?? DASH}</h1>
                <span className="rounded bg-gray-200 px-2 py-0.5 text-xs uppercase tracking-wide text-gray-600">
                  {shipTypeLabel(vessel.shipType)}
                </span>
                <span className="text-sm text-gray-500">
                  MMSI {vessel.mmsi}
                </span>
              </header>

              <div className="grid gap-5 md:grid-cols-2">
                <Card title="Última informação AIS">
                  <dl className="text-sm">
                    <Field
                      label="Estado de navegação"
                      value={navStatusLabel(vessel.navStatus)}
                    />
                    <Field
                      label="Posição recebida"
                      value={formatRelativeTime(vessel.lastSeen, Date.now())}
                    />
                    <Field
                      label="Latitude / Longitude"
                      value={`${vessel.lat.toFixed(4)}, ${vessel.lng.toFixed(4)}`}
                    />
                    <Field
                      label="Velocidade"
                      value={vessel.sog != null ? `${vessel.sog} nós` : DASH}
                    />
                    <Field
                      label="Rumo (COG)"
                      value={vessel.cog != null ? `${vessel.cog}°` : DASH}
                    />
                    <Field
                      label="Adornamento (heading)"
                      value={
                        vessel.heading != null ? `${vessel.heading}°` : DASH
                      }
                    />
                    <Field label="Destino" value={vessel.destination ?? DASH} />
                  </dl>
                </Card>

                <Card title="Características">
                  <dl className="text-sm">
                    <Field label="Nome" value={vessel.name ?? DASH} />
                    <Field label="MMSI" value={vessel.mmsi} />
                    <Field label="Indicativo" value={vessel.callSign ?? DASH} />
                    <Field
                      label="Bandeira"
                      value={
                        vessel.flag
                          ? `${flagEmoji(vessel.flag)} ${vessel.flag}`
                          : DASH
                      }
                    />
                    <Field
                      label="Tipo"
                      value={shipTypeLabel(vessel.shipType)}
                    />
                    <Field
                      label="Comprimento"
                      value={vessel.length != null ? `${vessel.length} m` : DASH}
                    />
                    <Field
                      label="Boca"
                      value={vessel.width != null ? `${vessel.width} m` : DASH}
                    />
                  </dl>
                </Card>

                <Card title="Silhueta">
                  <VesselSilhouette shipType={vessel.shipType} />
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
