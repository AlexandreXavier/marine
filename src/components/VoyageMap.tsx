"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { deriveSpeeds, type Voyage } from "@/lib/voyages";
import { speedColor } from "@/lib/speedColor";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/positron";

// Constrói uma FeatureCollection de segmentos, cada um com a cor da sua
// velocidade — MapLibre desenha a linha "colorida por velocidade".
function coloredSegments(voyage: Voyage, showSpeed: boolean) {
  const speeds = deriveSpeeds(voyage.points);
  const features = [];
  for (let i = 0; i < speeds.length; i++) {
    const a = voyage.points[i];
    const b = voyage.points[i + 1];
    features.push({
      type: "Feature" as const,
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [a.lng, a.lat],
          [b.lng, b.lat],
        ],
      },
      properties: {
        color: showSpeed ? speedColor(speeds[i]) : "#136FD5",
      },
    });
  }
  return { type: "FeatureCollection" as const, features };
}

// Posição interpolada no instante t (ms) ao longo da viagem.
function positionAt(voyage: Voyage, t: number): [number, number] {
  const pts = voyage.points;
  if (t <= pts[0].timestamp) return [pts[0].lng, pts[0].lat];
  const last = pts[pts.length - 1];
  if (t >= last.timestamp) return [last.lng, last.lat];
  for (let i = 1; i < pts.length; i++) {
    if (t <= pts[i].timestamp) {
      const a = pts[i - 1];
      const b = pts[i];
      const span = b.timestamp - a.timestamp || 1;
      const f = (t - a.timestamp) / span;
      return [a.lng + (b.lng - a.lng) * f, a.lat + (b.lat - a.lat) * f];
    }
  }
  return [last.lng, last.lat];
}

export function VoyageMap({
  voyage,
  currentTime,
  showSpeed,
  showName,
  vesselName,
  fitKey,
}: {
  voyage: Voyage;
  currentTime: number;
  showSpeed: boolean;
  showName: boolean;
  vesselName: string;
  fitKey: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const labelElRef = useRef<HTMLDivElement | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [voyage.points[0].lng, voyage.points[0].lat],
      zoom: 9,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(containerRef.current);

    map.on("load", () => {
      map.addSource("voyage", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "voyage-line",
        type: "line",
        source: "voyage",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": ["get", "color"], "line-width": 3 },
      });

      const el = document.createElement("div");
      el.style.cssText =
        "display:flex;flex-direction:column;align-items:center;font-family:Roboto,sans-serif";
      const dot = document.createElement("div");
      dot.style.cssText =
        "width:14px;height:14px;border-radius:50%;background:#136FD5;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)";
      const label = document.createElement("div");
      label.style.cssText =
        "margin-top:2px;font-size:11px;font-weight:700;color:#1B252E;background:rgba(255,255,255,.85);padding:0 4px;border-radius:3px;white-space:nowrap";
      labelElRef.current = label;
      el.appendChild(dot);
      el.appendChild(label);
      markerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([voyage.points[0].lng, voyage.points[0].lat])
        .addTo(map);

      setMapLoaded(true);
    });

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redesenha a linha quando muda a viagem ou o toggle de velocidade.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    (map.getSource("voyage") as maplibregl.GeoJSONSource | undefined)?.setData(
      coloredSegments(voyage, showSpeed),
    );
  }, [voyage, showSpeed, mapLoaded]);

  // Enquadra a viagem inteira quando muda de viagem (fitKey).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    const coords = voyage.points.map(
      (p) => [p.lng, p.lat] as [number, number],
    );
    if (coords.length > 1) {
      const bounds = coords.reduce(
        (b, c) => b.extend(c),
        new maplibregl.LngLatBounds(coords[0], coords[0]),
      );
      map.fitBounds(bounds, { padding: 80, maxZoom: 13, duration: 400 });
    } else {
      map.setCenter(coords[0]);
    }
  }, [fitKey, mapLoaded]);

  // Move o marcador conforme o tempo de reprodução.
  useEffect(() => {
    if (!mapLoaded || !markerRef.current) return;
    markerRef.current.setLngLat(positionAt(voyage, currentTime));
    if (labelElRef.current) {
      labelElRef.current.textContent = showName ? vesselName : "";
    }
  }, [currentTime, voyage, showName, vesselName, mapLoaded]);

  return <div ref={containerRef} className="h-full w-full" />;
}
