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
