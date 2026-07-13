"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { VoyageMap } from "@/components/VoyageMap";
import { segmentVoyages, type TrackPoint } from "@/lib/voyages";

const PLAYBACK_DURATION_MS = 20_000; // uma viagem reproduz em ~20s

function formatUtc(ms: number): string {
  return new Date(ms).toISOString().slice(0, 16).replace("T", " ") + " UTC";
}

function formatDay(ms: number): string {
  return new Date(ms).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "short",
  });
}

function Toggle({
  label,
  on,
  onClick,
}: {
  label: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        on
          ? "border-[#136FD5] bg-[#136FD5] text-white"
          : "border-gray-300 bg-white text-gray-600"
      }`}
    >
      {on ? "✓ " : ""}
      {label}
    </button>
  );
}

export default function PercursoPage() {
  const params = useParams<{ mmsi: string }>();
  const mmsi = Number(params.mmsi);
  const valid = Number.isInteger(mmsi) && mmsi > 0;

  const vessel = useQuery(
    api.vessels.getByMmsi,
    valid ? { mmsi } : "skip",
  );
  const track = useQuery(
    api.positions.fullTrack,
    valid ? { mmsi } : "skip",
  );

  const voyages = useMemo(
    () => (track ? segmentVoyages(track as TrackPoint[]) : []),
    [track],
  );

  // Viagem escolhida pelo utilizador (null = por defeito a mais recente).
  // Derivamos o índice efectivo em vez de sincronizar estado num efeito.
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const voyageIdx =
    voyages.length === 0
      ? null
      : selectedIdx !== null
        ? selectedIdx
        : voyages.length - 1;

  const voyage = voyageIdx !== null ? voyages[voyageIdx] : undefined;

  const [showSpeed, setShowSpeed] = useState(true);
  const [showName, setShowName] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(1); // 0..1 ao longo da viagem
  const rafRef = useRef<number | null>(null);

  // Loop de reprodução.
  useEffect(() => {
    if (!playing || !voyage) return;
    let start: number | null = null;
    const from = progress >= 1 ? 0 : progress;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const elapsed = ts - start;
      const p = Math.min(1, from + elapsed / PLAYBACK_DURATION_MS);
      setProgress(p);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setPlaying(false);
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, voyage]);

  // Reset ao trocar de viagem.
  function goToVoyage(idx: number) {
    setSelectedIdx(idx);
    setProgress(1);
    setPlaying(false);
  }

  if (!valid) {
    return <FullMessage>MMSI inválido.</FullMessage>;
  }
  if (track === undefined || vessel === undefined) {
    return <FullMessage>A carregar percurso…</FullMessage>;
  }
  if (!voyage) {
    return (
      <FullMessage>
        Ainda não há percurso registado para este navio.{" "}
        <Link href={`/vessel/${mmsi}`} className="text-[#136FD5] underline">
          Voltar ao detalhe
        </Link>
      </FullMessage>
    );
  }

  const currentTime =
    voyage.startedAt + (voyage.endedAt - voyage.startedAt) * progress;
  const vesselName = vessel?.name ?? `MMSI ${mmsi}`;

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <VoyageMap
        voyage={voyage}
        currentTime={currentTime}
        showSpeed={showSpeed}
        showName={showName}
        vesselName={vesselName}
        fitKey={`${voyageIdx}`}
      />

      {/* Cabeçalho flutuante */}
      <div className="absolute left-4 top-4 flex items-center gap-3 rounded-lg bg-white/90 px-4 py-2 shadow">
        <Link
          href={`/vessel/${mmsi}`}
          className="text-sm text-[#136FD5] hover:underline"
        >
          ← {vesselName}
        </Link>
      </div>

      {/* Navegação de viagens */}
      <div className="absolute right-4 top-4 flex items-center gap-2 rounded-lg bg-white/90 px-3 py-2 shadow">
        <button
          onClick={() => goToVoyage(voyageIdx! - 1)}
          disabled={voyageIdx === 0}
          className="px-2 text-lg text-gray-600 disabled:opacity-30"
          aria-label="Viagem anterior"
        >
          ‹
        </button>
        <div className="text-center text-xs">
          <div className="font-medium">Viagem {voyageIdx! + 1}/{voyages.length}</div>
          <div className="text-gray-500">
            {formatDay(voyage.startedAt)} → {formatDay(voyage.endedAt)}
          </div>
        </div>
        <button
          onClick={() => goToVoyage(voyageIdx! + 1)}
          disabled={voyageIdx === voyages.length - 1}
          className="px-2 text-lg text-gray-600 disabled:opacity-30"
          aria-label="Viagem seguinte"
        >
          ›
        </button>
      </div>

      {/* Barra de controlo inferior */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-white/95 px-4 py-3 shadow-[0_-2px_8px_rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPlaying((p) => !p)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#136FD5] text-white"
            aria-label={playing ? "Pausa" : "Reproduzir"}
          >
            {playing ? "❚❚" : "▶"}
          </button>
          <span className="shrink-0 text-xs tabular-nums text-gray-600">
            {formatUtc(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={1000}
            value={Math.round(progress * 1000)}
            onChange={(e) => {
              setPlaying(false);
              setProgress(Number(e.target.value) / 1000);
            }}
            className="h-1 flex-1 cursor-pointer accent-[#136FD5]"
            aria-label="Linha de tempo"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Toggle label="Velocidade" on={showSpeed} onClick={() => setShowSpeed((v) => !v)} />
          <Toggle label="Nome" on={showName} onClick={() => setShowName((v) => !v)} />
          <Toggle
            label="Ver viagem inteira"
            on={progress >= 1 && !playing}
            onClick={() => {
              setPlaying(false);
              setProgress(1);
            }}
          />
        </div>
      </div>
    </div>
  );
}

function FullMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-50 px-6 text-center text-sm text-gray-600">
      <p>{children}</p>
    </div>
  );
}
