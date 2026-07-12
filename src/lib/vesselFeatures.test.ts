import { describe, expect, test } from "vitest";
import {
  shipTypeColor,
  toVesselFeatureCollection,
  type MapVessel,
} from "./vesselFeatures";

const madmax: MapVessel = {
  mmsi: 232028203,
  name: "MADMAX",
  shipType: "sailing",
  lat: 40.6405,
  lng: -8.7245,
  cog: 44,
  sog: 0,
};

describe("toVesselFeatureCollection", () => {
  test("coordenadas em ordem GeoJSON [lng, lat], não [lat, lng]", () => {
    const fc = toVesselFeatureCollection([madmax]);
    // O erro clássico é trocar a ordem; fixamos o contrato explicitamente.
    expect(fc.features[0].geometry.coordinates).toEqual([-8.7245, 40.6405]);
  });

  test("rotação do marcador vem do rumo (COG)", () => {
    const fc = toVesselFeatureCollection([madmax]);
    expect(fc.features[0].properties.rotation).toBe(44);
  });

  test("sem COG o marcador aponta a norte (rotação 0)", () => {
    const fc = toVesselFeatureCollection([{ ...madmax, cog: undefined }]);
    expect(fc.features[0].properties.rotation).toBe(0);
  });

  test("navio sem nome recebe rótulo de fallback", () => {
    const fc = toVesselFeatureCollection([{ ...madmax, name: undefined }]);
    expect(fc.features[0].properties.name).toBe("Sem nome");
  });

  test("preserva mmsi, sog e cog para o popup", () => {
    const fc = toVesselFeatureCollection([madmax]);
    expect(fc.features[0].properties).toMatchObject({
      mmsi: 232028203,
      sog: 0,
      cog: 44,
    });
  });

  test("transforma vários navios preservando a ordem", () => {
    const other: MapVessel = { mmsi: 111, lat: 41, lng: -8, cog: 90 };
    const fc = toVesselFeatureCollection([madmax, other]);
    expect(fc.features.map((f) => f.properties.mmsi)).toEqual([232028203, 111]);
  });
});

describe("shipTypeColor", () => {
  test("tipos diferentes têm cores diferentes (cargo ≠ tanker)", () => {
    expect(shipTypeColor("cargo")).not.toBe(shipTypeColor("tanker"));
  });

  test("tipo desconhecido ou ausente cai na cor 'other'", () => {
    const fallback = shipTypeColor("other");
    expect(shipTypeColor(undefined)).toBe(fallback);
    expect(shipTypeColor("inexistente")).toBe(fallback);
  });

  test("a cor de cada categoria é um hex válido", () => {
    for (const type of ["cargo", "tanker", "passenger", "sailing", "fishing"]) {
      expect(shipTypeColor(type)).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});
