import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { shouldSamplePosition } from "./sampling";

const vesselUpdate = v.object({
  mmsi: v.number(),
  lat: v.optional(v.number()),
  lng: v.optional(v.number()),
  sog: v.optional(v.number()),
  cog: v.optional(v.number()),
  heading: v.optional(v.number()),
  navStatus: v.optional(v.number()),
  name: v.optional(v.string()),
  callSign: v.optional(v.string()),
  shipType: v.optional(v.string()),
  destination: v.optional(v.string()),
  flag: v.optional(v.string()),
  length: v.optional(v.number()),
  width: v.optional(v.number()),
});

export const batch = mutation({
  args: {
    key: v.string(),
    updates: v.array(vesselUpdate),
  },
  returns: v.null(),
  handler: async (ctx, { key, updates }) => {
    if (!process.env.INGEST_KEY || key !== process.env.INGEST_KEY) {
      throw new Error("Chave de ingestão inválida");
    }

    const now = Date.now();
    for (const update of updates) {
      const existing = await ctx.db
        .query("vessels")
        .withIndex("by_mmsi", (q) => q.eq("mmsi", update.mmsi))
        .unique();

      // Campos opcionais ausentes não devem apagar valores já conhecidos.
      const fields = Object.fromEntries(
        Object.entries(update).filter(([, value]) => value !== undefined),
      ) as typeof update;

      const hasPosition =
        update.lat !== undefined && update.lng !== undefined;
      const sample =
        hasPosition && shouldSamplePosition(existing?.lastPointAt, now);

      if (existing) {
        await ctx.db.patch(existing._id, {
          ...fields,
          lastSeen: now,
          ...(sample ? { lastPointAt: now } : {}),
        });
      } else if (hasPosition) {
        await ctx.db.insert("vessels", {
          ...fields,
          lat: update.lat!,
          lng: update.lng!,
          lastSeen: now,
          lastPointAt: now,
        });
      }
      // Sem posição e sem registo prévio: ignora — um navio nasce com posição.

      if (sample) {
        await ctx.db.insert("positions", {
          mmsi: update.mmsi,
          lat: update.lat!,
          lng: update.lng!,
          timestamp: now,
        });
      }
    }
    return null;
  },
});
