// Transformação pura: pontos do histórico → GeoJSON LineString para o mapa.

export type TrailPoint = { lat: number; lng: number; timestamp: number };

export type TrailFeature = {
  type: "Feature";
  geometry: { type: "LineString"; coordinates: [number, number][] };
  properties: Record<string, never>;
};

export function toTrailFeature(points: TrailPoint[]): TrailFeature {
  return {
    type: "Feature",
    geometry: {
      type: "LineString",
      coordinates: points.map((p) => [p.lng, p.lat]),
    },
    properties: {},
  };
}
