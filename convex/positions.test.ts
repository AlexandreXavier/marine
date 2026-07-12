import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import schema from "./schema";
import { api, internal } from "./_generated/api";

const HOUR = 3_600_000;

async function seedPoints(
  t: ReturnType<typeof convexTest>,
  points: { mmsi: number; lat: number; lng: number; ageHours: number }[],
) {
  const now = Date.now();
  await t.run(async (ctx) => {
    for (const p of points) {
      await ctx.db.insert("positions", {
        mmsi: p.mmsi,
        lat: p.lat,
        lng: p.lng,
        timestamp: now - p.ageHours * HOUR,
      });
    }
  });
}

test("positions.forVessel devolve o traçado do navio por ordem cronológica", async () => {
  const t = convexTest(schema);
  await seedPoints(t, [
    { mmsi: 1, lat: 40, lng: -8, ageHours: 2 },
    { mmsi: 1, lat: 41, lng: -8, ageHours: 1 },
    { mmsi: 2, lat: 50, lng: 0, ageHours: 1 },
  ]);

  const trail = await t.query(api.positions.forVessel, { mmsi: 1 });
  expect(trail).toHaveLength(2);
  expect(trail.map((p) => p.lat)).toEqual([40, 41]); // mais antigo primeiro
});

test("positions.forVessel exclui pontos com mais de 48h", async () => {
  const t = convexTest(schema);
  await seedPoints(t, [
    { mmsi: 1, lat: 40, lng: -8, ageHours: 49 },
    { mmsi: 1, lat: 41, lng: -8, ageHours: 1 },
  ]);

  const trail = await t.query(api.positions.forVessel, { mmsi: 1 });
  expect(trail).toHaveLength(1);
  expect(trail[0].lat).toBe(41);
});

test("deleteOld apaga posições com mais de 48h e preserva as recentes", async () => {
  const t = convexTest(schema);
  await seedPoints(t, [
    { mmsi: 1, lat: 40, lng: -8, ageHours: 49 },
    { mmsi: 1, lat: 41, lng: -8, ageHours: 50 },
    { mmsi: 1, lat: 42, lng: -8, ageHours: 1 },
  ]);

  const deleted = await t.mutation(internal.positions.deleteOld, {});
  expect(deleted).toBe(2);

  const remaining = await t.run((ctx) => ctx.db.query("positions").collect());
  expect(remaining).toHaveLength(1);
  expect(remaining[0].lat).toBe(42);
});
