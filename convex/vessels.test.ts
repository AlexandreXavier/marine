import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import schema from "./schema";
import { api, internal } from "./_generated/api";

// Valores esperados retirados da captura do MarineTraffic
// (marinetraffic-capture/vessel-madmax/page.md), não do código.
test("vessels.list devolve o navio seed MADMAX com os dados da captura", async () => {
  const t = convexTest(schema);

  await t.mutation(internal.seed.run, {});

  const vessels = await t.query(api.vessels.list, {});
  expect(vessels).toHaveLength(1);
  expect(vessels[0]).toMatchObject({
    mmsi: 232028203,
    name: "MADMAX",
    callSign: "MHNU5",
    flag: "GB",
    shipType: "sailing",
    destination: "Aveiro",
  });
});

test("o seed é idempotente: correr duas vezes não duplica o navio", async () => {
  const t = convexTest(schema);

  await t.mutation(internal.seed.run, {});
  await t.mutation(internal.seed.run, {});

  const vessels = await t.query(api.vessels.list, {});
  expect(vessels).toHaveLength(1);
});

test("vessels.getByMmsi devolve o navio correspondente", async () => {
  const t = convexTest(schema);

  await t.mutation(internal.seed.run, {});

  const vessel = await t.query(api.vessels.getByMmsi, { mmsi: 232028203 });
  expect(vessel).toMatchObject({ mmsi: 232028203, name: "MADMAX" });
});

test("vessels.getByMmsi devolve null para um MMSI desconhecido", async () => {
  const t = convexTest(schema);

  await t.mutation(internal.seed.run, {});

  const vessel = await t.query(api.vessels.getByMmsi, { mmsi: 111000111 });
  expect(vessel).toBeNull();
});

const KEY = "chave-de-teste";

async function seedFleet(t: ReturnType<typeof convexTest>) {
  process.env.INGEST_KEY = KEY;
  await t.mutation(api.ingest.batch, {
    key: KEY,
    updates: [
      { mmsi: 1, name: "MADMAX", shipType: "sailing", lat: 40, lng: -8 },
      { mmsi: 2, name: "SANTA MARIA", shipType: "cargo", lat: 41, lng: -8 },
      { mmsi: 3, name: "MADEIRA STAR", shipType: "cargo", lat: 42, lng: -8 },
    ],
  });
}

test("vessels.search encontra por prefixo de nome", async () => {
  const t = convexTest(schema);
  await seedFleet(t);

  const results = await t.query(api.vessels.search, { query: "MAD" });
  const names = results.map((v) => v.name).sort();
  expect(names).toEqual(["MADEIRA STAR", "MADMAX"]);
});

test("vessels.search filtra por tipo de navio", async () => {
  const t = convexTest(schema);
  await seedFleet(t);

  const results = await t.query(api.vessels.search, {
    query: "MAD",
    shipType: "cargo",
  });
  expect(results.map((v) => v.name)).toEqual(["MADEIRA STAR"]);
});

test("vessels.search sem termo devolve o diretório, filtrável por tipo", async () => {
  const t = convexTest(schema);
  await seedFleet(t);

  const all = await t.query(api.vessels.search, { query: "" });
  expect(all).toHaveLength(3);

  const cargo = await t.query(api.vessels.search, {
    query: "",
    shipType: "cargo",
  });
  expect(cargo.map((v) => v.name).sort()).toEqual([
    "MADEIRA STAR",
    "SANTA MARIA",
  ]);
});
