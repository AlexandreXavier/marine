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

// Categorias para o filtro do diretório (chave + rótulo).
export const SHIP_TYPE_CATEGORIES = Object.entries(SHIP_TYPE_LABELS).map(
  ([value, label]) => ({ value, label }),
);

// Estado de navegação AIS (ITU-R M.1371). 15 e outros códigos não mapeados
// aparecem como "Desconhecido".
const NAV_STATUS_LABELS: Record<number, string> = {
  0: "A navegar a motor",
  1: "Fundeado",
  2: "Sem governo",
  3: "Manobra restrita",
  4: "Limitado pelo calado",
  5: "Amarrado",
  6: "Encalhado",
  7: "A pescar",
  8: "A navegar à vela",
  11: "A rebocar (atrás)",
  12: "A rebocar (à frente)",
};

export function navStatusLabel(code?: number): string {
  if (code == null) return "Desconhecido";
  return NAV_STATUS_LABELS[code] ?? "Desconhecido";
}
