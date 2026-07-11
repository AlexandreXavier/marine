import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

// Navio de arranque: dados reais do MADMAX capturados do MarineTraffic
// (posição aproximada da chegada a Aveiro, 2026-07-11).
const MADMAX = {
  mmsi: 232028203,
  name: "MADMAX",
  callSign: "MHNU5",
  flag: "GB",
  shipType: "sailing",
  lat: 40.6405,
  lng: -8.7245,
  sog: 0,
  cog: 44,
  destination: "Aveiro",
};

export const run = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("vessels")
      .withIndex("by_mmsi", (q) => q.eq("mmsi", MADMAX.mmsi))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { ...MADMAX, lastSeen: Date.now() });
    } else {
      await ctx.db.insert("vessels", { ...MADMAX, lastSeen: Date.now() });
    }
  },
});
