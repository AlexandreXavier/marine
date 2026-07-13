import { v } from "convex/values";
import { query } from "./_generated/server";

const PREVIEW_WINDOW_MS = 48 * 3_600_000; // 48h para o preview do card
const MAX_PREVIEW_POINTS = 2000; // 48h a ~5 min ≈ 576 pontos; folga larga
// Histórico completo é retido para sempre (ver ticket 8); a query devolve
// no máximo este número de pontos (~5 min → ~5.7 meses) por Navio.
const MAX_TRACK_POINTS = 50_000;

const trailPoint = v.object({
  lat: v.number(),
  lng: v.number(),
  timestamp: v.number(),
});

// Traçado recente (últimas 48h) — usado no preview do card do detalhe.
export const forVessel = query({
  args: { mmsi: v.number() },
  returns: v.array(trailPoint),
  handler: async (ctx, { mmsi }) => {
    const cutoff = Date.now() - PREVIEW_WINDOW_MS;
    const points = await ctx.db
      .query("positions")
      .withIndex("by_mmsi_time", (q) =>
        q.eq("mmsi", mmsi).gt("timestamp", cutoff),
      )
      .take(MAX_PREVIEW_POINTS);
    return points.map((p) => ({
      lat: p.lat,
      lng: p.lng,
      timestamp: p.timestamp,
    }));
  },
});

// Histórico completo de um Navio, por ordem cronológica — alimenta a vista de
// percurso, que o segmenta em Viagens no cliente (ver src/lib/voyages.ts).
export const fullTrack = query({
  args: { mmsi: v.number() },
  returns: v.array(trailPoint),
  handler: async (ctx, { mmsi }) => {
    const points = await ctx.db
      .query("positions")
      .withIndex("by_mmsi_time", (q) => q.eq("mmsi", mmsi))
      .take(MAX_TRACK_POINTS);
    return points.map((p) => ({
      lat: p.lat,
      lng: p.lng,
      timestamp: p.timestamp,
    }));
  },
});
