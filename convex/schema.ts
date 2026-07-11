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
    destination: v.optional(v.string()),
    lastSeen: v.number(),
  }).index("by_mmsi", ["mmsi"]),
});
