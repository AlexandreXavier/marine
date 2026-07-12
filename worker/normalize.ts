// Normalização de mensagens AISStream → atualização parcial de navio.
// Contrato das mensagens: https://aisstream.io/documentation

export type VesselUpdate = {
  mmsi: number;
  lat?: number;
  lng?: number;
  sog?: number;
  cog?: number;
  heading?: number;
  navStatus?: number;
  name?: string;
  callSign?: string;
  shipType?: string;
  destination?: string;
  flag?: string;
  length?: number;
  width?: number;
};

// Subconjunto da tabela ITU MID (3 primeiros dígitos do MMSI) → ISO 3166 alpha-2.
// O AIS não transmite bandeira; deriva-se daqui.
const MID_TO_FLAG: Record<number, string> = {
  201: "AL", 202: "AD", 203: "AT", 204: "PT", 205: "BE", 206: "BY", 207: "BG",
  208: "VA", 209: "CY", 210: "CY", 211: "DE", 212: "CY", 213: "GE", 214: "MD",
  215: "MT", 218: "DE", 219: "DK", 220: "DK", 224: "ES", 225: "ES", 226: "FR",
  227: "FR", 228: "FR", 229: "MT", 230: "FI", 231: "FO", 232: "GB", 233: "GB",
  234: "GB", 235: "GB", 236: "GI", 237: "GR", 238: "HR", 239: "GR", 240: "GR",
  241: "GR", 242: "MA", 243: "HU", 244: "NL", 245: "NL", 246: "NL", 247: "IT",
  248: "MT", 249: "MT", 250: "IE", 251: "IS", 252: "LI", 253: "LU", 254: "MC",
  255: "PT", 256: "MT", 257: "NO", 258: "NO", 259: "NO", 261: "PL", 262: "ME",
  263: "PT", 264: "RO", 265: "SE", 266: "SE", 267: "SK", 268: "SM", 269: "CH",
  270: "CZ", 271: "TR", 272: "UA", 273: "RU", 274: "MK", 275: "LV", 276: "EE",
  277: "LT", 278: "SI", 279: "RS",
  303: "US", 304: "AG", 305: "AG", 306: "CW", 307: "AW", 308: "BS", 309: "BS",
  310: "BM", 311: "BS", 316: "CA", 319: "KY", 338: "US", 339: "JM", 345: "MX",
  351: "PA", 352: "PA", 353: "PA", 354: "PA", 355: "PA", 356: "PA", 357: "PA",
  366: "US", 367: "US", 368: "US", 369: "US", 370: "PA", 371: "PA", 372: "PA",
  373: "PA", 374: "PA", 377: "VC", 378: "VG", 379: "VI",
  412: "CN", 413: "CN", 414: "CN", 416: "TW", 419: "IN", 431: "JP", 432: "JP",
  440: "KR", 441: "KR", 445: "KP", 457: "MN", 470: "AE", 471: "AE", 477: "HK",
  511: "PW", 512: "NZ", 525: "ID", 533: "MY", 548: "PH", 553: "PG", 563: "SG",
  564: "SG", 565: "SG", 566: "SG", 567: "TH", 572: "TV", 574: "VN", 577: "VU",
  601: "ZA", 603: "AO", 605: "DZ", 613: "CM", 620: "KM", 621: "DJ", 622: "EG",
  627: "GH", 636: "LR", 637: "LR", 642: "LY", 645: "MU", 650: "MZ", 654: "MR",
  655: "MG", 657: "NG", 659: "NA", 664: "TZ", 666: "SO", 667: "SL", 668: "ST",
  669: "SZ", 670: "TD", 671: "TG", 672: "TN", 674: "TZ", 675: "UG", 676: "CD",
  677: "TZ", 678: "ZM", 679: "ZW",
  701: "AR", 710: "BR", 720: "BO", 725: "CL", 730: "CO", 735: "EC", 740: "FK",
  745: "GF", 750: "GY", 755: "PY", 760: "PE", 765: "SR", 770: "UY", 775: "VE",
};

// Tipo de navio AIS (numérico) → categoria usada na UI.
function shipTypeCategory(type: number): string {
  if (type === 30) return "fishing";
  if (type === 36) return "sailing";
  if (type === 37) return "pleasure";
  if (type >= 40 && type <= 49) return "highspeed";
  if (type === 50 || type === 52) return "tug";
  if (type >= 60 && type <= 69) return "passenger";
  if (type >= 70 && type <= 79) return "cargo";
  if (type >= 80 && type <= 89) return "tanker";
  return "other";
}

// O AIS transmite texto em campos fixos preenchidos com '@' e espaços.
function cleanAisText(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const cleaned = raw.replace(/@/g, " ").replace(/\s+/g, " ").trim();
  return cleaned.length > 0 ? cleaned : undefined;
}

const HEADING_UNAVAILABLE = 511;
const NAV_STATUS_UNDEFINED = 15;

type PositionFields = {
  Latitude?: number;
  Longitude?: number;
  Sog?: number;
  Cog?: number;
  TrueHeading?: number;
  NavigationalStatus?: number;
};

function positionFields(msg: PositionFields): Partial<VesselUpdate> {
  const update: Partial<VesselUpdate> = {};
  if (typeof msg.Latitude === "number") update.lat = msg.Latitude;
  if (typeof msg.Longitude === "number") update.lng = msg.Longitude;
  if (typeof msg.Sog === "number") update.sog = msg.Sog;
  if (typeof msg.Cog === "number") update.cog = msg.Cog;
  if (
    typeof msg.TrueHeading === "number" &&
    msg.TrueHeading !== HEADING_UNAVAILABLE
  ) {
    update.heading = msg.TrueHeading;
  }
  // Só relatórios de classe A trazem estado de navegação; 15 = não definido.
  if (
    typeof msg.NavigationalStatus === "number" &&
    msg.NavigationalStatus !== NAV_STATUS_UNDEFINED
  ) {
    update.navStatus = msg.NavigationalStatus;
  }
  return update;
}

export function normalizeAisMessage(raw: unknown): VesselUpdate | null {
  if (typeof raw !== "object" || raw === null) return null;
  const envelope = raw as {
    MessageType?: string;
    Message?: Record<string, Record<string, unknown>>;
    MetaData?: { MMSI?: number; ShipName?: string };
  };

  const mmsi = envelope.MetaData?.MMSI;
  if (typeof mmsi !== "number" || mmsi <= 0) return null;

  const type = envelope.MessageType;
  const body = type ? envelope.Message?.[type] : undefined;
  if (!body) return null;

  const update: VesselUpdate = { mmsi };
  update.flag = MID_TO_FLAG[Math.floor(mmsi / 1_000_000)];
  const metaName = cleanAisText(envelope.MetaData?.ShipName);
  if (metaName) update.name = metaName;

  switch (type) {
    case "PositionReport":
    case "StandardClassBPositionReport":
    case "ExtendedClassBPositionReport":
      Object.assign(update, positionFields(body as PositionFields));
      break;
    case "ShipStaticData": {
      const name = cleanAisText(body.Name);
      if (name) update.name = name;
      const callSign = cleanAisText(body.CallSign);
      if (callSign) update.callSign = callSign;
      const destination = cleanAisText(body.Destination);
      if (destination) update.destination = destination;
      if (typeof body.Type === "number") {
        update.shipType = shipTypeCategory(body.Type);
      }
      // Dimensão do casco: A+B = comprimento, C+D = boca (metros).
      const dim = body.Dimension as
        | { A?: number; B?: number; C?: number; D?: number }
        | undefined;
      if (dim) {
        const length = (dim.A ?? 0) + (dim.B ?? 0);
        const width = (dim.C ?? 0) + (dim.D ?? 0);
        if (length > 0) update.length = length;
        if (width > 0) update.width = width;
      }
      break;
    }
    default:
      return null;
  }

  return update;
}
