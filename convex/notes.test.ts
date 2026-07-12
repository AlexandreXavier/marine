import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";

const MMSI = 232028203;

test("add cria uma nota que forVessel devolve", async () => {
  const t = convexTest(schema);
  const asUser = t.withIdentity({ subject: "user_a" });

  await asUser.mutation(api.notes.add, { mmsi: MMSI, text: "Bom veleiro" });

  const notes = await asUser.query(api.notes.forVessel, { mmsi: MMSI });
  expect(notes).toHaveLength(1);
  expect(notes[0].text).toBe("Bom veleiro");
});

test("update altera o texto da nota", async () => {
  const t = convexTest(schema);
  const asUser = t.withIdentity({ subject: "user_a" });

  const id = await asUser.mutation(api.notes.add, {
    mmsi: MMSI,
    text: "rascunho",
  });
  await asUser.mutation(api.notes.update, { noteId: id, text: "final" });

  const notes = await asUser.query(api.notes.forVessel, { mmsi: MMSI });
  expect(notes[0].text).toBe("final");
});

test("remove apaga a nota", async () => {
  const t = convexTest(schema);
  const asUser = t.withIdentity({ subject: "user_a" });

  const id = await asUser.mutation(api.notes.add, { mmsi: MMSI, text: "x" });
  await asUser.mutation(api.notes.remove, { noteId: id });

  expect(await asUser.query(api.notes.forVessel, { mmsi: MMSI })).toHaveLength(
    0,
  );
});

test("as notas são privadas: um utilizador não vê as de outro", async () => {
  const t = convexTest(schema);
  await t
    .withIdentity({ subject: "user_a" })
    .mutation(api.notes.add, { mmsi: MMSI, text: "secreta" });

  const otherNotes = await t
    .withIdentity({ subject: "user_b" })
    .query(api.notes.forVessel, { mmsi: MMSI });
  expect(otherNotes).toHaveLength(0);
});

test("um utilizador não pode editar nem apagar a nota de outro", async () => {
  const t = convexTest(schema);
  const id = await t
    .withIdentity({ subject: "user_a" })
    .mutation(api.notes.add, { mmsi: MMSI, text: "do A" });

  const asB = t.withIdentity({ subject: "user_b" });
  await expect(
    asB.mutation(api.notes.update, { noteId: id, text: "hackeada" }),
  ).rejects.toThrow();
  await expect(
    asB.mutation(api.notes.remove, { noteId: id }),
  ).rejects.toThrow();

  // A nota do A permanece intacta.
  const notes = await t
    .withIdentity({ subject: "user_a" })
    .query(api.notes.forVessel, { mmsi: MMSI });
  expect(notes[0].text).toBe("do A");
});

test("sem sessão, add falha", async () => {
  const t = convexTest(schema);
  await expect(
    t.mutation(api.notes.add, { mmsi: MMSI, text: "x" }),
  ).rejects.toThrow();
});
