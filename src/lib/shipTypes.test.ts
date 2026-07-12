import { describe, expect, test } from "vitest";
import { navStatusLabel, shipTypeLabel } from "./shipTypes";

describe("shipTypeLabel", () => {
  test("traduz categorias conhecidas", () => {
    expect(shipTypeLabel("sailing")).toBe("Veleiro");
    expect(shipTypeLabel("cargo")).toBe("Carga");
  });

  test("categoria desconhecida ou ausente → Outro", () => {
    expect(shipTypeLabel(undefined)).toBe("Outro");
    expect(shipTypeLabel("inexistente")).toBe("Outro");
  });
});

describe("navStatusLabel", () => {
  test("traduz códigos AIS conhecidos", () => {
    // Códigos da norma ITU-R M.1371 (fonte independente do código).
    expect(navStatusLabel(1)).toBe("Fundeado");
    expect(navStatusLabel(7)).toBe("A pescar");
    expect(navStatusLabel(8)).toBe("A navegar à vela");
  });

  test("ausente ou código não mapeado → Desconhecido", () => {
    expect(navStatusLabel(undefined)).toBe("Desconhecido");
    expect(navStatusLabel(15)).toBe("Desconhecido");
  });
});
