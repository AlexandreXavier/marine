import { describe, expect, test } from "vitest";
import { speedColor } from "./speedColor";

describe("speedColor", () => {
  test("devolve sempre um hex válido", () => {
    for (const v of [0, 3, 6, 12, 18, 30, -5]) {
      expect(speedColor(v)).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  test("velocidades diferentes dão cores diferentes", () => {
    expect(speedColor(0)).not.toBe(speedColor(18));
  });

  test("velocidade negativa é tratada como 0 (sem rebentar)", () => {
    expect(speedColor(-10)).toBe(speedColor(0));
  });

  test("acima do topo satura na cor mais rápida", () => {
    expect(speedColor(50)).toBe(speedColor(18));
  });
});
