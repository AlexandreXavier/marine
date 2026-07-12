"use client";

import { useEffect, useState } from "react";

// Relógio reativo: lê a hora num efeito (nunca durante o render, que deve ser
// puro e é pré-renderizado no servidor) e volta a atualizar periodicamente,
// para que rótulos de frescura como "há X s" avancem sozinhos.
export function useNow(intervalMs = 10_000): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    // Primeiro tick assíncrono (não setState síncrono no efeito) e depois periódico.
    const first = setTimeout(tick, 0);
    const interval = setInterval(tick, intervalMs);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
    };
  }, [intervalMs]);
  return now;
}
