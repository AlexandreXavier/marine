import { describe, expect, test } from "vitest";
import {
  segmentVoyages,
  deriveSpeeds,
  VOYAGE_GAP_MS,
  type TrackPoint,
} from "./voyages";

const MIN = 60_000;

function pointsEvery(count: number, stepMs: number, from = 0): TrackPoint[] {
  return Array.from({ length: count }, (_, i) => ({
    lat: 40 + i * 0.01,
    lng: -8,
    timestamp: from + i * stepMs,
  }));
}

describe("segmentVoyages", () => {
  test("pontos contínuos (sem gaps grandes) formam uma só Viagem", () => {
    const voyages = segmentVoyages(pointsEvery(5, 5 * MIN));
    expect(voyages).toHaveLength(1);
    expect(voyages[0].points).toHaveLength(5);
  });

  test("um gap acima do limiar parte em duas Viagens", () => {
    const first = pointsEvery(3, 5 * MIN, 0);
    const last = first[first.length - 1].timestamp;
    const second = pointsEvery(2, 5 * MIN, last + VOYAGE_GAP_MS + 1);
    const voyages = segmentVoyages([...first, ...second]);
    expect(voyages).toHaveLength(2);
    expect(voyages[0].points).toHaveLength(3);
    expect(voyages[1].points).toHaveLength(2);
  });

  test("um gap exactamente no limiar ainda pertence à mesma Viagem", () => {
    const a: TrackPoint = { lat: 40, lng: -8, timestamp: 0 };
    const b: TrackPoint = { lat: 41, lng: -8, timestamp: VOYAGE_GAP_MS };
    expect(segmentVoyages([a, b])).toHaveLength(1);
  });

  test("cada Viagem expõe as suas datas de partida e chegada", () => {
    const voyages = segmentVoyages(pointsEvery(3, 5 * MIN, 1000));
    expect(voyages[0].startedAt).toBe(1000);
    expect(voyages[0].endedAt).toBe(1000 + 2 * 5 * MIN);
  });

  test("lista vazia → nenhuma Viagem", () => {
    expect(segmentVoyages([])).toEqual([]);
  });

  test("um único ponto → uma Viagem com esse ponto", () => {
    const voyages = segmentVoyages([{ lat: 40, lng: -8, timestamp: 5 }]);
    expect(voyages).toHaveLength(1);
    expect(voyages[0].points).toHaveLength(1);
  });

  test("o limiar por omissão é ~2 horas", () => {
    expect(VOYAGE_GAP_MS).toBe(2 * 60 * 60_000);
  });
});

describe("deriveSpeeds", () => {
  test("velocidade em nós a partir de distância e tempo conhecidos", () => {
    // 1 minuto de latitude = 1 milha náutica. 40.0 → 40.1 = 6 NM.
    // Em 6 minutos → 60 nós.
    const speeds = deriveSpeeds([
      { lat: 40.0, lng: 0, timestamp: 0 },
      { lat: 40.1, lng: 0, timestamp: 6 * MIN },
    ]);
    expect(speeds).toHaveLength(1);
    expect(speeds[0]).toBeCloseTo(60, 0);
  });

  test("um troço por cada par de pontos consecutivos", () => {
    const speeds = deriveSpeeds([
      { lat: 40.0, lng: 0, timestamp: 0 },
      { lat: 40.1, lng: 0, timestamp: 6 * MIN },
      { lat: 40.2, lng: 0, timestamp: 12 * MIN },
    ]);
    expect(speeds).toHaveLength(2);
  });

  test("Δt = 0 não rebenta (velocidade 0, sem divisão por zero)", () => {
    const speeds = deriveSpeeds([
      { lat: 40.0, lng: 0, timestamp: 1000 },
      { lat: 40.1, lng: 0, timestamp: 1000 },
    ]);
    expect(speeds[0]).toBe(0);
  });

  test("menos de dois pontos → sem troços", () => {
    expect(deriveSpeeds([{ lat: 40, lng: 0, timestamp: 0 }])).toEqual([]);
    expect(deriveSpeeds([])).toEqual([]);
  });
});
