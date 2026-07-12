import { describe, expect, test } from "vitest";
import { formatRelativeTime } from "./format";

describe("formatRelativeTime", () => {
  const now = 1_000_000_000_000;

  test("segundos para diferenças com menos de um minuto", () => {
    expect(formatRelativeTime(now - 5_000, now)).toBe("há 5 s");
  });

  test("minutos até uma hora", () => {
    expect(formatRelativeTime(now - 3 * 60_000, now)).toBe("há 3 min");
  });

  test("horas até um dia", () => {
    expect(formatRelativeTime(now - 5 * 3_600_000, now)).toBe("há 5 h");
  });

  test("dias para diferenças maiores", () => {
    expect(formatRelativeTime(now - 2 * 86_400_000, now)).toBe("há 2 d");
  });

  test("nunca produz durações negativas (relógios dessincronizados)", () => {
    expect(formatRelativeTime(now + 10_000, now)).toBe("há 0 s");
  });
});
