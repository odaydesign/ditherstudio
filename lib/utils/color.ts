// Small colour helpers for the advanced colour picker: hex ↔ HSL, lighten/darken,
// and harmony suggestions (complementary / analogous / triadic / split).

export function clampHex(hex: string): string {
  let h = (hex || '').trim();
  if (!h.startsWith('#')) h = '#' + h;
  // expand #rgb → #rrggbb
  if (/^#[0-9a-fA-F]{3}$/.test(h)) {
    h = '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
  }
  return /^#[0-9a-fA-F]{6}$/.test(h) ? h.toLowerCase() : '';
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = clampHex(hex) || '#000000';
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

export interface HSL { h: number; s: number; l: number } // h 0..360, s/l 0..100

export function hexToHsl(hex: string): HSL {
  let [r, g, b] = hexToRgb(hex);
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0;
  const l = (max + min) / 2;
  const d = max - min;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r: h = ((g - b) / d) % 6; break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4; break;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: s * 100, l: l * 100 };
}

export function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

/** Shift lightness by delta (percentage points, can be negative). */
export function shiftLightness(hex: string, delta: number): string {
  const { h, s, l } = hexToHsl(hex);
  return hslToHex(h, s, l + delta);
}

/** Harmony suggestions derived from the hue of `hex` (keeps s/l). */
export function harmonies(hex: string): { label: string; hex: string }[] {
  const { h, s, l } = hexToHsl(hex);
  const at = (dh: number) => hslToHex(h + dh, s, l);
  return [
    { label: 'Complementary', hex: at(180) },
    { label: 'Analogous −30°', hex: at(-30) },
    { label: 'Analogous +30°', hex: at(30) },
    { label: 'Triadic +120°', hex: at(120) },
    { label: 'Triadic +240°', hex: at(240) },
    { label: 'Split +150°', hex: at(150) },
  ];
}

/** A light→dark ramp of the colour (for quick tint/shade picking). */
export function lightnessRamp(hex: string, steps = 5): string[] {
  const { h, s } = hexToHsl(hex);
  const out: string[] = [];
  for (let i = 0; i < steps; i++) {
    const l = 85 - (70 * i) / (steps - 1); // 85% → 15%
    out.push(hslToHex(h, s, l));
  }
  return out;
}
