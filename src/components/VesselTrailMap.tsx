"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toTrailFeature } from "@/lib/trail";
import { shipTypeColor } from "@/lib/vesselFeatures";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

export function VesselTrailMap({
  mmsi,
  lat,
  lng,
  shipType,
}: {
  mmsi: number;
  lat: number;
  lng: number;
  shipType?: string;
}) {
  const trail = useQuery(api.positions.forVessel, { mmsi });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [lng, lat],
      zoom: 10,
      attributionControl: { compact: true },
    });
    mapRef.current = map;

    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(containerRef.current);

    map.on("load", () => {
      map.addSource("trail", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "trail-line",
        type: "line",
        source: "trail",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#136FD5", "line-width": 2.5 },
      });
      map.addSource("current", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "current-point",
        type: "circle",
        source: "current",
        paint: {
          "circle-radius": 6,
          "circle-color": shipTypeColor(shipType),
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });
      setMapLoaded(true);
    });

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const points = trail ?? [];
    (map.getSource("trail") as maplibregl.GeoJSONSource | undefined)?.setData(
      toTrailFeature(points),
    );
    (map.getSource("current") as maplibregl.GeoJSONSource | undefined)?.setData({
      type: "Feature",
      geometry: { type: "Point", coordinates: [lng, lat] },
      properties: {},
    });

    const coords: [number, number][] = [
      ...points.map((p) => [p.lng, p.lat] as [number, number]),
      [lng, lat],
    ];
    if (coords.length > 1) {
      const bounds = coords.reduce(
        (b, c) => b.extend(c),
        new maplibregl.LngLatBounds(coords[0], coords[0]),
      );
      map.fitBounds(bounds, { padding: 40, maxZoom: 12, duration: 0 });
    } else {
      map.setCenter([lng, lat]);
    }
  }, [trail, mapLoaded, lat, lng]);

  return <div ref={containerRef} className="h-full w-full" />;
}
