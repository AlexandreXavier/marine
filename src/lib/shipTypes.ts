// Rótulos PT-PT das categorias de tipo de navio, partilhados pelo mapa,
// popup e página de detalhe.

const SHIP_TYPE_LABELS: Record<string, string> = {
  cargo: "Carga",
  tanker: "Tanque",
  passenger: "Passageiros",
  highspeed: "Alta velocidade",
  tug: "Reboque",
  fishing: "Pesca",
  sailing: "Veleiro",
  pleasure: "Recreio",
  other: "Outro",
};

export function shipTypeLabel(shipType?: string): string {
  return SHIP_TYPE_LABELS[shipType ?? "other"] ?? SHIP_TYPE_LABELS.other;
}
