import { v } from "convex/values";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { vesselDoc } from "./vessels";

// Clerk identity → userId, ou null se não autenticado.
async function userId(ctx: QueryCtx): Promise<string | null> {
  const identity = await ctx.auth.getUserIdentity();
  return identity?.subject ?? null;
}

// Adiciona/remove o navio da frota do utilizador. Devolve o estado final
// (true = agora na frota). Requer sessão.
export const toggle = mutation({
  args: { mmsi: v.number() },
  returns: v.boolean(),
  handler: async (ctx, { mmsi }) => {
    const uid = await userId(ctx);
    if (!uid) throw new Error("É preciso iniciar sessão");

    const existing = await ctx.db
      .query("fleets")
      .withIndex("by_user_mmsi", (q) => q.eq("userId", uid).eq("mmsi", mmsi))
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    }
    await ctx.db.insert("fleets", { userId: uid, mmsi });
    return true;
  },
});

export const isInFleet = query({
  args: { mmsi: v.number() },
  returns: v.boolean(),
  handler: async (ctx, { mmsi }) => {
    const uid = await userId(ctx);
    if (!uid) return false;
    const entry = await ctx.db
      .query("fleets")
      .withIndex("by_user_mmsi", (q) => q.eq("userId", uid).eq("mmsi", mmsi))
      .unique();
    return entry !== null;
  },
});

// Navios da frota do utilizador, com o estado atual de cada um.
export const list = query({
  args: {},
  returns: v.array(vesselDoc),
  handler: async (ctx) => {
    const uid = await userId(ctx);
    if (!uid) return [];

    const entries = await ctx.db
      .query("fleets")
      .withIndex("by_user_mmsi", (q) => q.eq("userId", uid))
      .collect();

    const vessels = await Promise.all(
      entries.map((entry) =>
        ctx.db
          .query("vessels")
          .withIndex("by_mmsi", (q) => q.eq("mmsi", entry.mmsi))
          .unique(),
      ),
    );
    return vessels.filter((vessel) => vessel !== null);
  },
});
