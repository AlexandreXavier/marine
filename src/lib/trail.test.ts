import { describe, expect, test } from "vitest";
import { toTrailFeature, type TrailPoint } from "./trail";

const points: TrailPoint[] = [
  { lat: 40.6, lng: -8.7, timestamp: 1 },
  { lat: 40.7, lng: -8.6, timestamp: 2 },
  { lat: 40.8, lng: -8.5, timestamp: 3 },
];

describe("toTrailFeature", () => {
  test("produz um LineString com coordenadas em ordem [lng, lat]", () => {
    const feature = toTrailFeature(points);
    expect(feature.geometry.type).toBe("LineString");
    expect(feature.geometry.coordinates).toEqual([
      [-8.7, 40.6],
      [-8.6, 40.7],
      [-8.5, 40.8],
    ]);
  });

  test("preserva a ordem cronológica recebida", () => {
    const feature = toTrailFeature(points);
    expect(feature.geometry.coordinates[0]).toEqual([-8.7, 40.6]);
    expect(feature.geometry.coordinates.at(-1)).toEqual([-8.5, 40.8]);
  });

  test("lista vazia produz uma linha sem coordenadas (nada a desenhar)", () => {
    expect(toTrailFeature([]).geometry.coordinates).toEqual([]);
  });
});
