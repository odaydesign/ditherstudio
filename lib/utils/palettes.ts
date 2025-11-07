/**
 * Color Palettes for Dithering
 *
 * ANSI & Retro Color Palettes (RGB values 0-255)
 */

export type RGB = [number, number, number];

export interface ColorPalette {
  colors: RGB[];
  name: string;
  description?: string;
}

export const colorPalettes: Record<string, RGB[]> = {
  // Standard ANSI 16-color palette
  ansi16: [
    [0, 0, 0], [128, 0, 0], [0, 128, 0], [128, 128, 0],
    [0, 0, 128], [128, 0, 128], [0, 128, 128], [192, 192, 192],
    [128, 128, 128], [255, 0, 0], [0, 255, 0], [255, 255, 0],
    [0, 0, 255], [255, 0, 255], [0, 255, 255], [255, 255, 255]
  ],

  // CGA palette (1981) - 16 colors with brown quirk
  cga: [
    [0, 0, 0], [0, 0, 170], [0, 170, 0], [0, 170, 170],
    [170, 0, 0], [170, 0, 170], [170, 85, 0], [170, 170, 170],
    [85, 85, 85], [85, 85, 255], [85, 255, 85], [85, 255, 255],
    [255, 85, 85], [255, 85, 255], [255, 255, 85], [255, 255, 255]
  ],

  // EGA palette (1984) - 64 colors, showing 16 most common
  ega: [
    [0, 0, 0], [0, 0, 170], [0, 170, 0], [0, 170, 170],
    [170, 0, 0], [170, 0, 170], [170, 170, 0], [170, 170, 170],
    [85, 85, 85], [85, 85, 255], [85, 255, 85], [85, 255, 255],
    [255, 85, 85], [255, 85, 255], [255, 255, 85], [255, 255, 255]
  ],

  // VGA default palette (1987)
  vga: [
    [0, 0, 0], [0, 0, 168], [0, 168, 0], [0, 168, 168],
    [168, 0, 0], [168, 0, 168], [168, 84, 0], [168, 168, 168],
    [84, 84, 84], [84, 84, 252], [84, 252, 84], [84, 252, 252],
    [252, 84, 84], [252, 84, 252], [252, 252, 84], [252, 252, 252]
  ],

  // Commodore 64 palette
  c64: [
    [0, 0, 0], [255, 255, 255], [136, 0, 0], [170, 255, 238],
    [204, 68, 204], [0, 204, 85], [0, 0, 170], [238, 238, 119],
    [221, 136, 85], [102, 68, 0], [255, 119, 119], [51, 51, 51],
    [119, 119, 119], [170, 255, 102], [0, 136, 255], [187, 187, 187]
  ],

  // Amber monochrome (popular in 1980s terminals)
  amber: [
    [0, 0, 0], [255, 176, 0]
  ],

  // Green monochrome (classic terminal)
  green: [
    [0, 0, 0], [51, 255, 0]
  ],

  // Apple II Hi-Res 6-color palette
  apple2: [
    [0, 0, 0], [20, 245, 60], [255, 68, 253], [255, 255, 255],
    [20, 207, 253], [255, 106, 60]
  ],

  // Game Boy Original - 4 shades of green
  gameboy: [
    [15, 56, 15],    // Darkest green
    [48, 98, 48],    // Dark green
    [139, 172, 15],  // Light green
    [155, 188, 15]   // Lightest green
  ],

  // Nintendo Entertainment System
  nes: [
    [124, 124, 124], [0, 0, 252], [0, 0, 188], [68, 40, 188],
    [148, 0, 132], [168, 0, 32], [168, 16, 0], [136, 20, 0],
    [80, 48, 0], [0, 120, 0], [0, 104, 0], [0, 88, 0],
    [0, 64, 88], [0, 0, 0], [0, 0, 0], [0, 0, 0]
  ],

  // PICO-8 Fantasy Console
  pico8: [
    [0, 0, 0], [29, 43, 83], [126, 37, 83], [0, 135, 81],
    [171, 82, 54], [95, 87, 79], [194, 195, 199], [255, 241, 232],
    [255, 0, 77], [255, 163, 0], [255, 236, 39], [0, 228, 54],
    [41, 173, 255], [131, 118, 156], [255, 119, 168], [255, 204, 170]
  ],

  // Vaporwave aesthetic
  vaporwave: [
    [1, 34, 93], [48, 25, 52], [94, 53, 177], [138, 3, 143],
    [255, 0, 189], [255, 71, 255], [1, 205, 254], [148, 255, 181]
  ],

  // Twilight / Purple sunset
  twilight: [
    [17, 8, 32], [50, 16, 66], [85, 26, 98], [127, 32, 115],
    [171, 46, 114], [214, 73, 103], [255, 117, 95], [255, 173, 115]
  ],

  // Cyberpunk neon
  cyberpunk: [
    [8, 0, 24], [32, 0, 68], [76, 0, 106], [124, 0, 142],
    [176, 0, 172], [228, 0, 196], [0, 228, 255], [255, 0, 255]
  ],

  // Warm sunset
  sunset: [
    [25, 20, 35], [95, 35, 65], [165, 50, 85], [235, 75, 75],
    [255, 125, 75], [255, 180, 100], [255, 230, 140], [255, 255, 200]
  ],

  // Forest greens
  forest: [
    [10, 15, 10], [25, 45, 25], [50, 75, 50], [75, 115, 65],
    [100, 155, 80], [145, 195, 105], [190, 225, 140], [235, 255, 190]
  ]
};

/**
 * Get palette by name
 */
export function getPalette(name: string): RGB[] | undefined {
  return colorPalettes[name];
}

/**
 * Get all palette names
 */
export function getPaletteNames(): string[] {
  return Object.keys(colorPalettes);
}

/**
 * Convert RGB array to normalized values (0-1)
 */
export function normalizeRGB(rgb: RGB): [number, number, number] {
  return [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255];
}

/**
 * Convert entire palette to normalized values
 */
export function normalizePalette(palette: RGB[]): Array<[number, number, number]> {
  return palette.map(normalizeRGB);
}
