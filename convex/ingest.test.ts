import { convexTest } from "convex-test";
import { beforeEach, expect, test } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";

const KEY = "chave-de-teste";

beforeEach(() => {
  process.env.INGEST_KEY = KEY;
});

const madmaxPosition = {
  mmsi: 232028203,
  lat: 40.6405,
  lng: -8.7245,
  sog: 0,
  cog: 44,
  name: "MADMAX",
  flag: "GB",
};

test("um lote de posições cria navios novos", async () => {
  const t = convexTest(schema);

  await t.mutation(api.ingest.batch, { key: KEY, updates: [madmaxPosition] });

  const vessels = await t.query(api.vessels.list, {});
  expect(vessels).toHaveLength(1);
  expect(vessels[0]).toMatchObject({
    mmsi: 232028203,
    lat: 40.6405,
    lng: -8.7245,
    name: "MADMAX",
    flag: "GB",
  });
  expect(vessels[0].lastSeen).toBeGreaterThan(0);
});

test("posições repetidas do mesmo MMSI atualizam in-place, sem duplicar", async () => {
  const t = convexTest(schema);

  await t.mutation(api.ingest.batch, { key: KEY, updates: [madmaxPosition] });
  await t.mutation(api.ingest.batch, {
    key: KEY,
    updates: [{ ...madmaxPosition, lat: 40.65, lng: -8.72, sog: 4.2 }],
  });

  const vessels = await t.query(api.vessels.list, {});
  expect(vessels).toHaveLength(1);
  expect(vessels[0]).toMatchObject({ lat: 40.65, lng: -8.72, sog: 4.2 });
});

test("dados estáticos enriquecem o navio sem apagar a posição", async () => {
  const t = convexTest(schema);

  await t.mutation(api.ingest.batch, { key: KEY, updates: [madmaxPosition] });
  await t.mutation(api.ingest.batch, {
    key: KEY,
    updates: [
      // ShipStaticData normalizado: sem lat/lng
      {
        mmsi: 232028203,
        callSign: "MHNU5",
        shipType: "sailing",
        destination: "Aveiro",
        flag: "GB",
      },
    ],
  });

  const vessels = await t.query(api.vessels.list, {});
  expect(vessels).toHaveLength(1);
  expect(vessels[0]).toMatchObject({
    lat: 40.6405,
    lng: -8.7245,
    callSign: "MHNU5",
    shipType: "sailing",
    destination: "Aveiro",
  });
});

test("posição sem coordenadas não cria navio (navio nasce com posição)", async () => {
  const t = convexTest(schema);

  await t.mutation(api.ingest.batch, {
    key: KEY,
    updates: [{ mmsi: 999000111, callSign: "XXXX" }],
  });

  const vessels = await t.query(api.vessels.list, {});
  expect(vessels).toHaveLength(0);
});

test("um lote misto processa vários navios de uma vez", async () => {
  const t = convexTest(schema);

  await t.mutation(api.ingest.batch, {
    key: KEY,
    updates: [
      madmaxPosition,
      { mmsi: 263000001, lat: 41.15, lng: -8.68, sog: 12, flag: "PT" },
    ],
  });

  const vessels = await t.query(api.vessels.list, {});
  expect(vessels).toHaveLength(2);
});

test("chave errada é rejeitada e não escreve nada", async () => {
  const t = convexTest(schema);

  await expect(
    t.mutation(api.ingest.batch, {
      key: "chave-errada",
      updates: [madmaxPosition],
    }),
  ).rejects.toThrow();

  const vessels = await t.query(api.vessels.list, {});
  expect(vessels).toHaveLength(0);
});
