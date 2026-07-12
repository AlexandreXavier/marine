import { describe, expect, test } from "vitest";
import { normalizeAisMessage } from "./normalize";

// Mensagens de exemplo da documentação oficial do AISStream
// (https://aisstream.io/documentation) — fonte de verdade independente.

const positionReport = {
  Message: {
    PositionReport: {
      Cog: 308,
      Latitude: 66.02695,
      Longitude: 12.253821666666665,
      MessageID: 1,
      NavigationalStatus: 15,
      Sog: 0,
      TrueHeading: 235,
      UserID: 259000420,
      Valid: true,
    },
  },
  MessageType: "PositionReport",
  MetaData: {
    MMSI: 259000420,
    ShipName: "AUGUSTSON",
    latitude: 66.02695,
    longitude: 12.253821666666665,
    time_utc: "2022-12-29 18:22:32.318353 +0000 UTC",
  },
};

const shipStaticData = {
  Message: {
    ShipStaticData: {
      CallSign: "LBHF",
      Destination: "COASTGUARD@@@@@@@@H",
      Dimension: { A: 20, B: 27, C: 7, D: 7 },
      ImoNumber: 9353333,
      MaximumStaticDraught: 4.5,
      MessageID: 5,
      Name: "KV FARM",
      Type: 55,
      UserID: 257069200,
      Valid: true,
    },
  },
  MessageType: "ShipStaticData",
  MetaData: { MMSI: 257069200, ShipName: "KV FARM" },
};

describe("PositionReport", () => {
  test("extrai posição, movimento e identidade", () => {
    const update = normalizeAisMessage(positionReport);
    expect(update).toMatchObject({
      mmsi: 259000420,
      lat: 66.02695,
      lng: 12.253821666666665,
      sog: 0,
      cog: 308,
      heading: 235,
      name: "AUGUSTSON",
      flag: "NO", // MID 259 = Noruega
    });
  });

  test("heading 511 (indisponível no AIS) é omitido", () => {
    const raw = structuredClone(positionReport);
    raw.Message.PositionReport.TrueHeading = 511;
    const update = normalizeAisMessage(raw);
    expect(update?.heading).toBeUndefined();
  });

  test("extrai o estado de navegação (código AIS)", () => {
    const raw = structuredClone(positionReport);
    raw.Message.PositionReport.NavigationalStatus = 8; // à vela
    expect(normalizeAisMessage(raw)?.navStatus).toBe(8);
  });

  test("estado 15 (não definido) é omitido, como o heading 511", () => {
    // A amostra oficial traz NavigationalStatus 15.
    expect(normalizeAisMessage(positionReport)?.navStatus).toBeUndefined();
  });
});

describe("ShipStaticData", () => {
  test("extrai dados estáticos e limpa padding @ do AIS", () => {
    const update = normalizeAisMessage(shipStaticData);
    expect(update).toMatchObject({
      mmsi: 257069200,
      name: "KV FARM",
      callSign: "LBHF",
      flag: "NO", // MID 257 = Noruega
    });
    // "COASTGUARD@@@@@@@@H": os @ são padding AIS, não fazem parte do texto
    expect(update?.destination).toBe("COASTGUARD H");
  });

  test("não inventa posição: mensagem estática não traz lat/lng", () => {
    const update = normalizeAisMessage(shipStaticData);
    expect(update?.lat).toBeUndefined();
    expect(update?.lng).toBeUndefined();
  });

  test("calcula comprimento (A+B) e boca (C+D) a partir da Dimension", () => {
    const update = normalizeAisMessage(shipStaticData);
    expect(update?.length).toBe(47); // 20 + 27
    expect(update?.width).toBe(14); // 7 + 7
  });

  test("Dimension a zero (desconhecida) não produz dimensões", () => {
    const raw = structuredClone(shipStaticData);
    raw.Message.ShipStaticData.Dimension = { A: 0, B: 0, C: 0, D: 0 };
    const update = normalizeAisMessage(raw);
    expect(update?.length).toBeUndefined();
    expect(update?.width).toBeUndefined();
  });
});

describe("StandardClassBPositionReport (classe B, ex.: veleiros como o MADMAX)", () => {
  test("extrai posição de um transponder classe B", () => {
    const update = normalizeAisMessage({
      Message: {
        StandardClassBPositionReport: {
          Cog: 44,
          Latitude: 40.6405,
          Longitude: -8.7245,
          Sog: 0,
          TrueHeading: 511,
          UserID: 232028203,
          Valid: true,
        },
      },
      MessageType: "StandardClassBPositionReport",
      MetaData: { MMSI: 232028203, ShipName: "MADMAX" },
    });
    expect(update).toMatchObject({
      mmsi: 232028203,
      lat: 40.6405,
      lng: -8.7245,
      cog: 44,
      name: "MADMAX",
      flag: "GB", // MID 232 = Reino Unido
    });
  });
});

describe("bandeira derivada do MID (3 primeiros dígitos do MMSI)", () => {
  test("263 → PT", () => {
    const raw = structuredClone(positionReport);
    raw.Message.PositionReport.UserID = 263123456;
    raw.MetaData.MMSI = 263123456;
    expect(normalizeAisMessage(raw)?.flag).toBe("PT");
  });

  test("MID desconhecido → sem bandeira", () => {
    const raw = structuredClone(positionReport);
    raw.Message.PositionReport.UserID = 999123456;
    raw.MetaData.MMSI = 999123456;
    expect(normalizeAisMessage(raw)?.flag).toBeUndefined();
  });
});

describe("mensagens irrelevantes ou malformadas são descartadas sem erro", () => {
  test.each([
    ["objeto vazio", {}],
    ["null", null],
    ["string", "lixo"],
    ["tipo não suportado", { MessageType: "BaseStationReport", Message: {}, MetaData: { MMSI: 1 } }],
    ["sem MMSI", { MessageType: "PositionReport", Message: { PositionReport: {} }, MetaData: {} }],
  ])("%s → null", (_label, raw) => {
    expect(normalizeAisMessage(raw)).toBeNull();
  });
});
