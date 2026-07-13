// Cor de um troço em função da velocidade (nós), gradiente amarelo→laranja→
// vermelho como na referência. Isolada para ser testável.

export function speedColor(knots: number): string {
  // Âncoras: 0 nós = amarelo claro, ~15+ nós = vermelho.
  const stops: [number, [number, number, number]][] = [
    [0, [255, 236, 130]], // amarelo claro
    [6, [255, 193, 59]], // amarelo-torrado
    [12, [245, 130, 32]], // laranja
    [18, [214, 40, 40]], // vermelho
  ];
  const v = Math.max(0, knots);
  for (let i = 1; i < stops.length; i++) {
    const [hi, hiColor] = stops[i];
    const [lo, loColor] = stops[i - 1];
    if (v <= hi) {
      const t = (v - lo) / (hi - lo);
      return rgb(mix(loColor, hiColor, t));
    }
  }
  return rgb(stops[stops.length - 1][1]);
}

function mix(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function rgb([r, g, b]: [number, number, number]): string {
  const hex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}
