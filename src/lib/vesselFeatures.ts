// Transformação pura: navios → GeoJSON para a camada do mapa.
// Isolada aqui para ser testável sem MapLibre nem DOM.

export type MapVessel = {
  mmsi: number;
  lat: number;
  lng: number;
  name?: string;
  shipType?: string;
  cog?: number;
  sog?: number;
};

// Categorias de tipo de navio → cor do marcador.
// Aproxima a convenção do MarineTraffic (carga verde, tanque vermelho, etc.).
const SHIP_TYPE_COLORS: Record<string, string> = {
  cargo: "#4CAF50",
  tanker: "#F44336",
  passenger: "#2196F3",
  highspeed: "#FFC107",
  tug: "#00BCD4",
  fishing: "#FF9800",
  sailing: "#9C27B0",
  pleasure: "#9C27B0",
  other: "#9E9E9E",
};

export function shipTypeColor(shipType?: string): string {
  return SHIP_TYPE_COLORS[shipType ?? "other"] ?? SHIP_TYPE_COLORS.other;
}

export type VesselFeature = {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: {
    mmsi: number;
    name: string;
    shipType: string;
    color: string;
    rotation: number;
    sog: number | null;
    cog: number | null;
  };
};

export type VesselFeatureCollection = {
  type: "FeatureCollection";
  features: VesselFeature[];
};

export function toVesselFeatureCollection(
  vessels: MapVessel[],
): VesselFeatureCollection {
  return {
    type: "FeatureCollection",
    features: vessels.map((v) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [v.lng, v.lat] },
      properties: {
        mmsi: v.mmsi,
        name: v.name ?? "Sem nome",
        shipType: v.shipType ?? "other",
        color: shipTypeColor(v.shipType),
        rotation: v.cog ?? 0,
        sog: v.sog ?? null,
        cog: v.cog ?? null,
      },
    })),
  };
}
