import { describe, expect, test } from "vitest";
import { shouldSamplePosition, SAMPLE_INTERVAL_MS } from "./sampling";

describe("shouldSamplePosition", () => {
  const now = 1_000_000_000_000;

  test("grava o primeiro ponto quando ainda não há histórico", () => {
    expect(shouldSamplePosition(undefined, now)).toBe(true);
  });

  test("não grava se o último ponto é mais recente que o intervalo", () => {
    expect(shouldSamplePosition(now - 60_000, now)).toBe(false);
  });

  test("grava assim que passou o intervalo de amostragem", () => {
    expect(shouldSamplePosition(now - SAMPLE_INTERVAL_MS, now)).toBe(true);
    expect(shouldSamplePosition(now - SAMPLE_INTERVAL_MS - 1, now)).toBe(true);
  });

  test("o intervalo é de ~5 minutos", () => {
    expect(SAMPLE_INTERVAL_MS).toBe(5 * 60_000);
  });
});
