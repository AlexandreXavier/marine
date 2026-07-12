// Decisão pura de amostragem do histórico de posições, isolada para ser
// testável sem Convex nem relógio real.

export const SAMPLE_INTERVAL_MS = 5 * 60_000; // ~5 minutos

export function shouldSamplePosition(
  lastPointAt: number | undefined,
  now: number,
  intervalMs: number = SAMPLE_INTERVAL_MS,
): boolean {
  if (lastPointAt == null) return true;
  return now - lastPointAt >= intervalMs;
}
