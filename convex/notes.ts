import { v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";

const noteDoc = v.object({
  _id: v.id("notes"),
  _creationTime: v.number(),
  userId: v.string(),
  mmsi: v.number(),
  text: v.string(),
});

async function requireUser(ctx: MutationCtx): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("É preciso iniciar sessão");
  return identity.subject;
}

// Notas do utilizador para um navio (privadas).
export const forVessel = query({
  args: { mmsi: v.number() },
  returns: v.array(noteDoc),
  handler: async (ctx, { mmsi }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.db
      .query("notes")
      .withIndex("by_user_mmsi", (q) =>
        q.eq("userId", identity.subject).eq("mmsi", mmsi),
      )
      .collect();
  },
});

export const add = mutation({
  args: { mmsi: v.number(), text: v.string() },
  returns: v.id("notes"),
  handler: async (ctx, { mmsi, text }) => {
    const uid = await requireUser(ctx);
    return await ctx.db.insert("notes", { userId: uid, mmsi, text });
  },
});

export const update = mutation({
  args: { noteId: v.id("notes"), text: v.string() },
  returns: v.null(),
  handler: async (ctx, { noteId, text }) => {
    const uid = await requireUser(ctx);
    const note = await ctx.db.get(noteId);
    if (!note || note.userId !== uid) {
      throw new Error("Nota não encontrada");
    }
    await ctx.db.patch(noteId, { text });
    return null;
  },
});

export const remove = mutation({
  args: { noteId: v.id("notes") },
  returns: v.null(),
  handler: async (ctx, { noteId }) => {
    const uid = await requireUser(ctx);
    const note = await ctx.db.get(noteId);
    if (!note || note.userId !== uid) {
      throw new Error("Nota não encontrada");
    }
    await ctx.db.delete(noteId);
    return null;
  },
});
