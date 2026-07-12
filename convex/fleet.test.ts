import { convexTest } from "convex-test";
import { beforeEach, expect, test } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";

const KEY = "chave-de-teste";

beforeEach(() => {
  process.env.INGEST_KEY = KEY;
});

async function seedVessels(t: ReturnType<typeof convexTest>) {
  await t.mutation(api.ingest.batch, {
    key: KEY,
    updates: [
      { mmsi: 111, name: "ALFA", lat: 40, lng: -8 },
      { mmsi: 222, name: "BETA", lat: 41, lng: -8 },
    ],
  });
}

test("toggle adiciona e depois remove um navio da frota", async () => {
  const t = convexTest(schema);
  await seedVessels(t);
  const asUser = t.withIdentity({ subject: "user_a" });

  expect(await asUser.mutation(api.fleet.toggle, { mmsi: 111 })).toBe(true);
  expect(await asUser.query(api.fleet.isInFleet, { mmsi: 111 })).toBe(true);

  expect(await asUser.mutation(api.fleet.toggle, { mmsi: 111 })).toBe(false);
  expect(await asUser.query(api.fleet.isInFleet, { mmsi: 111 })).toBe(false);
});

test("fleet.list devolve os navios da frota com o estado atual", async () => {
  const t = convexTest(schema);
  await seedVessels(t);
  const asUser = t.withIdentity({ subject: "user_a" });

  await asUser.mutation(api.fleet.toggle, { mmsi: 222 });

  const fleet = await asUser.query(api.fleet.list, {});
  expect(fleet).toHaveLength(1);
  expect(fleet[0]).toMatchObject({ mmsi: 222, name: "BETA" });
});

test("a frota é privada: um utilizador nunca vê a de outro", async () => {
  const t = convexTest(schema);
  await seedVessels(t);
  await t.withIdentity({ subject: "user_a" }).mutation(api.fleet.toggle, {
    mmsi: 111,
  });

  const otherFleet = await t
    .withIdentity({ subject: "user_b" })
    .query(api.fleet.list, {});
  expect(otherFleet).toHaveLength(0);
  expect(
    await t
      .withIdentity({ subject: "user_b" })
      .query(api.fleet.isInFleet, { mmsi: 111 }),
  ).toBe(false);
});

test("sem sessão, toggle falha e a lista vem vazia", async () => {
  const t = convexTest(schema);
  await seedVessels(t);

  await expect(t.mutation(api.fleet.toggle, { mmsi: 111 })).rejects.toThrow();
  expect(await t.query(api.fleet.list, {})).toHaveLength(0);
  expect(await t.query(api.fleet.isInFleet, { mmsi: 111 })).toBe(false);
});
