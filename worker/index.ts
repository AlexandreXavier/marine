// Worker de ingestão AIS: WebSocket AISStream → lotes → mutation Convex.
// Correr com: npm run worker (precisa de AISSTREAM_API_KEY, INGEST_KEY,
// NEXT_PUBLIC_CONVEX_URL no ambiente / .env.local).

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { normalizeAisMessage, type VesselUpdate } from "./normalize";

// Atlântico ibérico: Galiza → Gibraltar. [[latSW, lonSW], [latNE, lonNE]]
const IBERIA_BBOX = [
  [
    [35.7, -10.5],
    [44.0, -5.5],
  ],
];

const BATCH_INTERVAL_MS = 3000;
const MAX_BACKOFF_MS = 60_000;

const AISSTREAM_API_KEY = process.env.AISSTREAM_API_KEY;
const INGEST_KEY = process.env.INGEST_KEY;
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!AISSTREAM_API_KEY || !INGEST_KEY || !CONVEX_URL) {
  console.error(
    "Faltam env vars: AISSTREAM_API_KEY, INGEST_KEY e/ou NEXT_PUBLIC_CONVEX_URL",
  );
  process.exit(1);
}

const convex = new ConvexHttpClient(CONVEX_URL);

// Um update por MMSI por lote — o mais recente ganha, campos fundem-se.
const pending = new Map<number, VesselUpdate>();
let received = 0;
let flushed = 0;

function enqueue(update: VesselUpdate) {
  const existing = pending.get(update.mmsi);
  pending.set(update.mmsi, existing ? { ...existing, ...update } : update);
}

async function flush() {
  if (pending.size === 0) return;
  const updates = [...pending.values()];
  pending.clear();
  try {
    await convex.mutation(api.ingest.batch, { key: INGEST_KEY!, updates });
    flushed += updates.length;
    console.log(
      `[flush] ${updates.length} navios (total: ${flushed} enviados / ${received} msgs recebidas)`,
    );
  } catch (error) {
    console.error("[flush] falhou, updates perdidos neste ciclo:", error);
  }
}

setInterval(flush, BATCH_INTERVAL_MS);

let backoffMs = 1000;

function connect() {
  console.log("[ws] a ligar ao AISStream…");
  const ws = new WebSocket("wss://stream.aisstream.io/v0/stream");

  ws.addEventListener("open", () => {
    backoffMs = 1000;
    ws.send(
      JSON.stringify({
        APIKey: AISSTREAM_API_KEY,
        BoundingBoxes: IBERIA_BBOX,
        FilterMessageTypes: [
          "PositionReport",
          "StandardClassBPositionReport",
          "ExtendedClassBPositionReport",
          "ShipStaticData",
        ],
      }),
    );
    console.log("[ws] ligado — bbox Ibéria, à escuta");
  });

  ws.addEventListener("message", async (event) => {
    try {
      const data =
        event.data instanceof Blob
          ? await event.data.text()
          : event.data instanceof ArrayBuffer
            ? new TextDecoder().decode(event.data)
            : String(event.data);
      const raw = JSON.parse(data);
      if (raw.error) {
        console.error("[ws] erro do AISStream:", raw.error);
        return;
      }
      received++;
      const update = normalizeAisMessage(raw);
      if (update) enqueue(update);
    } catch {
      // mensagem ilegível — ignorar
    }
  });

  ws.addEventListener("close", () => {
    console.warn(`[ws] ligação caiu; reconecto em ${backoffMs / 1000}s`);
    setTimeout(connect, backoffMs);
    backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF_MS);
  });

  ws.addEventListener("error", () => {
    ws.close();
  });
}

connect();
