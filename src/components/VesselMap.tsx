"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  toVesselFeatureCollection,
  type MapVessel,
} from "@/lib/vesselFeatures";
import { shipTypeLabel } from "@/lib/shipTypes";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const IBERIA_CENTER: [number, number] = [-8.5, 40.2];
const SOURCE_ID = "vessels";
const LAYER_ID = "vessel-arrows";

// Desenha um triângulo apontado a norte na cor pedida — serve de imagem
// do marcador. O id da imagem é a própria cor, para reutilização.
function arrowImage(color: string): ImageData {
  const size = 28;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.beginPath();
  ctx.moveTo(size / 2, 3);
  ctx.lineTo(size - 6, size - 5);
  ctx.lineTo(size / 2, size - 10);
  ctx.lineTo(6, size - 5);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "rgba(27, 37, 46, 0.85)";
  ctx.stroke();
  return ctx.getImageData(0, 0, size, size);
}

function popupHtml(p: {
  mmsi: number;
  name: string;
  shipType: string;
  sog: number | null;
  cog: number | null;
}): string {
  const rows = [
    `MMSI: ${p.mmsi}`,
    `Velocidade: ${p.sog != null ? `${p.sog} nós` : "—"}`,
    `Rumo: ${p.cog != null ? `${p.cog}°` : "—"}`,
  ]
    .map((r) => `<div style="color:#4b5563">${r}</div>`)
    .join("");
  return `
    <div style="font-family:Roboto,sans-serif;font-size:13px;min-width:150px">
      <div style="font-weight:700;font-size:14px">${p.name}</div>
      <div style="color:#6b7280;margin-bottom:6px">${shipTypeLabel(p.shipType)}</div>
      ${rows}
      <a href="/vessel/${p.mmsi}" style="display:inline-block;margin-top:8px;color:#136FD5;font-weight:500;text-decoration:none">Ver detalhe →</a>
    </div>`;
}

export function VesselMap() {
  const vessels = useQuery(api.vessels.list);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const loadedRef = useRef(false);
  const addedColors = useRef<Set<string>>(new Set());

  // Inicializa o mapa uma vez.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: IBERIA_CENTER,
      zoom: 6,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl(), "bottom-right");
    mapRef.current = map;

    // Se o contentor só ganhar altura depois da inicialização (layout tardio),
    // o canvas WebGL fica com 0px — o ResizeObserver mantém-no sincronizado.
    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(containerRef.current);

    map.on("load", () => {
      map.addSource(SOURCE_ID, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: LAYER_ID,
        type: "symbol",
        source: SOURCE_ID,
        layout: {
          "icon-image": ["get", "color"],
          "icon-rotate": ["get", "rotation"],
          "icon-rotation-alignment": "map",
          "icon-allow-overlap": true,
          "icon-size": 0.8,
        },
      });
      loadedRef.current = true;

      const popup = new maplibregl.Popup({ closeButton: true, offset: 12 });
      map.on("click", LAYER_ID, (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const p = f.properties as ReturnType<
          typeof toVesselFeatureCollection
        >["features"][number]["properties"];
        const coords = (f.geometry as GeoJSON.Point).coordinates as [
          number,
          number,
        ];
        popup.setLngLat(coords).setHTML(popupHtml(p)).addTo(map);
      });
      map.on("mouseenter", LAYER_ID, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", LAYER_ID, () => {
        map.getCanvas().style.cursor = "";
      });
    });

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      loadedRef.current = false;
      addedColors.current.clear();
    };
  }, []);

  // Alimenta a camada sempre que a query reativa muda.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current || !vessels) return;

    const fc = toVesselFeatureCollection(vessels as MapVessel[]);
    for (const feature of fc.features) {
      const color = feature.properties.color;
      if (!addedColors.current.has(color)) {
        map.addImage(color, arrowImage(color));
        addedColors.current.add(color);
      }
    }
    const source = map.getSource(SOURCE_ID) as
      | maplibregl.GeoJSONSource
      | undefined;
    source?.setData(fc);
  }, [vessels]);

  // Nota: o container é dimensionado com h-full/w-full (não `absolute inset-0`)
  // porque o CSS do MapLibre força `.maplibregl-map { position: relative }`,
  // o que anula o posicionamento absoluto e colapsa a altura para 0.
  return <div ref={containerRef} className="h-full w-full" />;
}
