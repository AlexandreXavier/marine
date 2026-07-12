import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

export const RETENTION_MS = 48 * 3_600_000; // 48 horas
const MAX_TRAIL_POINTS = 2000; // 48h a ~5 min ≈ 576 pontos; folga larga
const DELETE_BATCH = 4000;

const trailPoint = v.object({
  lat: v.number(),
  lng: v.number(),
  timestamp: v.number(),
});

// Traçado das últimas 48h de um navio, por ordem cronológica (índice ascendente).
export const forVessel = query({
  args: { mmsi: v.number() },
  returns: v.array(trailPoint),
  handler: async (ctx, { mmsi }) => {
    const cutoff = Date.now() - RETENTION_MS;
    const points = await ctx.db
      .query("positions")
      .withIndex("by_mmsi_time", (q) =>
        q.eq("mmsi", mmsi).gt("timestamp", cutoff),
      )
      .take(MAX_TRAIL_POINTS);
    return points.map((p) => ({
      lat: p.lat,
      lng: p.lng,
      timestamp: p.timestamp,
    }));
  },
});

// Retenção: remove pontos com mais de 48h. Chamado pelo cron.
export const deleteOld = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const cutoff = Date.now() - RETENTION_MS;
    const stale = await ctx.db
      .query("positions")
      .withIndex("by_time", (q) => q.lt("timestamp", cutoff))
      .take(DELETE_BATCH);
    for (const p of stale) {
      await ctx.db.delete(p._id);
    }
    return stale.length;
  },
});
