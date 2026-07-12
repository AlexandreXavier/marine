import { v } from "convex/values";
import { query } from "./_generated/server";

const vesselDoc = v.object({
  _id: v.id("vessels"),
  _creationTime: v.number(),
  mmsi: v.number(),
  name: v.optional(v.string()),
  callSign: v.optional(v.string()),
  flag: v.optional(v.string()),
  shipType: v.optional(v.string()),
  lat: v.number(),
  lng: v.number(),
  sog: v.optional(v.number()),
  cog: v.optional(v.number()),
  heading: v.optional(v.number()),
  navStatus: v.optional(v.number()),
  destination: v.optional(v.string()),
  length: v.optional(v.number()),
  width: v.optional(v.number()),
  lastSeen: v.number(),
  lastPointAt: v.optional(v.number()),
});

const MAX_VESSELS = 2000;

export const list = query({
  args: {},
  returns: v.array(vesselDoc),
  handler: async (ctx) => {
    return await ctx.db.query("vessels").take(MAX_VESSELS);
  },
});

export const getByMmsi = query({
  args: { mmsi: v.number() },
  returns: v.union(vesselDoc, v.null()),
  handler: async (ctx, { mmsi }) => {
    return await ctx.db
      .query("vessels")
      .withIndex("by_mmsi", (q) => q.eq("mmsi", mmsi))
      .unique();
  },
});

const SEARCH_LIMIT = 100;

// Diretório: pesquisa por prefixo de nome (search index) com filtro opcional
// por tipo. Sem termo, devolve navios (opcionalmente filtrados por tipo).
export const search = query({
  args: { query: v.string(), shipType: v.optional(v.string()) },
  returns: v.array(vesselDoc),
  handler: async (ctx, { query, shipType }) => {
    const term = query.trim();
    if (term === "") {
      const all = await ctx.db.query("vessels").take(MAX_VESSELS);
      return shipType ? all.filter((doc) => doc.shipType === shipType) : all;
    }
    return await ctx.db
      .query("vessels")
      .withSearchIndex("search_name", (q) => {
        const s = q.search("name", term);
        return shipType ? s.eq("shipType", shipType) : s;
      })
      .take(SEARCH_LIMIT);
  },
});
