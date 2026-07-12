import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  vessels: defineTable({
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
    // Instante do último ponto gravado em `positions` (para amostrar ~5 min).
    lastPointAt: v.optional(v.number()),
  })
    .index("by_mmsi", ["mmsi"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["shipType"],
    }),

  // Histórico amostrado de posições (traçado de viagem, retido ~48h).
  positions: defineTable({
    mmsi: v.number(),
    lat: v.number(),
    lng: v.number(),
    timestamp: v.number(),
  })
    .index("by_mmsi_time", ["mmsi", "timestamp"])
    .index("by_time", ["timestamp"]),
});
