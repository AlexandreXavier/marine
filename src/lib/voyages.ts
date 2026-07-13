// Funções puras do domínio de percurso (ver CONTEXT.md: Traçado, Viagem).
// Calculadas on-read a partir dos pontos guardados {lat, lng, timestamp}.

export type TrackPoint = { lat: number; lng: number; timestamp: number };

export type Voyage = {
  startedAt: number;
  endedAt: number;
  points: TrackPoint[];
};

// Fim de uma Viagem quando há um intervalo maior que ~2h sem nova posição
// (AIS fora de alcance/desligado, ou navio parado em porto). Limiar ajustável.
export const VOYAGE_GAP_MS = 2 * 60 * 60_000;

// Divide o Traçado (ordenado por tempo) em Viagens por gap de tempo.
export function segmentVoyages(
  points: TrackPoint[],
  gapMs: number = VOYAGE_GAP_MS,
): Voyage[] {
  if (points.length === 0) return [];

  const voyages: Voyage[] = [];
  let current: TrackPoint[] = [points[0]];

  for (let i = 1; i < points.length; i++) {
    const gap = points[i].timestamp - points[i - 1].timestamp;
    if (gap > gapMs) {
      voyages.push(makeVoyage(current));
      current = [];
    }
    current.push(points[i]);
  }
  voyages.push(makeVoyage(current));
  return voyages;
}

function makeVoyage(points: TrackPoint[]): Voyage {
  return {
    startedAt: points[0].timestamp,
    endedAt: points[points.length - 1].timestamp,
    points,
  };
}

const EARTH_RADIUS_NM = 3440.065; // raio da Terra em milhas náuticas

function haversineNm(a: TrackPoint, b: TrackPoint): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_NM * Math.asin(Math.min(1, Math.sqrt(h)));
}

// Velocidade (nós) de cada troço entre pontos consecutivos.
// speeds[i] refere-se ao troço points[i] → points[i+1].
export function deriveSpeeds(points: TrackPoint[]): number[] {
  const speeds: number[] = [];
  for (let i = 1; i < points.length; i++) {
    const dtHours = (points[i].timestamp - points[i - 1].timestamp) / 3_600_000;
    if (dtHours <= 0) {
      speeds.push(0);
      continue;
    }
    speeds.push(haversineNm(points[i - 1], points[i]) / dtHours);
  }
  return speeds;
}
