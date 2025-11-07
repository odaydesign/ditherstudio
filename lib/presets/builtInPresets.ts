/**
 * Built-in Presets for Dithering
 *
 * Comprehensive industry-standard and creative presets based on research
 */

export interface PresetParams {
  [key: string]: number;
}

export interface DuotoneColors {
  dark: string;
  light: string;
}

export interface TritoneColors {
  shadow: string;
  mid: string;
  highlight: string;
}

export interface MultiAlgoConfig {
  enabled: boolean;
  blendMode: number;
  blendAmount: number;
}

export interface DitherPreset {
  name?: string;
  description?: string;
  algorithm: string;
  algorithm2?: string;
  multiAlgo?: MultiAlgoConfig;
  colorMode?: string;
  palette?: string;
  duotone?: DuotoneColors;
  tritone?: TritoneColors;
  threshold?: number;
  contrast?: number;
  brightness?: number;
  colors?: number;
  scale?: number;
  pixelation?: number;
  blur?: number;
  params?: PresetParams;
}

export const builtInPresets: Record<string, DitherPreset> = {
  // ============================================================
  // PRINT INDUSTRY STANDARDS (based on LPI research)
  // ============================================================
  'newsprint-85lpi': {
    name: 'Newsprint 85 LPI',
    description: 'Standard newspaper halftone (85 LPI) - industry standard since 1970s',
    algorithm: 'halftone45',
    colorMode: 'grayscale',
    threshold: 0.45,
    contrast: 1.3,
    brightness: 0.0,
    colors: 2,
    params: { dotSize: 6.0, sharpness: 0.8 } // Coarser dots for newsprint
  },
  'magazine-133lpi': {
    name: 'Magazine Quality 133 LPI',
    description: 'SWOP standard for web offset magazines (133 LPI)',
    algorithm: 'halftone45',
    colorMode: 'normal',
    threshold: 0.5,
    contrast: 1.2,
    brightness: 0.0,
    colors: 8,
    params: { dotSize: 4.5, sharpness: 1.2 }
  },
  'book-150lpi': {
    name: 'Book Quality 150 LPI',
    description: 'High-quality book printing on maplitho paper (150 LPI)',
    algorithm: 'halftone',
    colorMode: 'normal',
    threshold: 0.5,
    contrast: 1.1,
    brightness: 0.0,
    colors: 16,
    params: { dotSize: 4.0, angle: 0.262, sharpness: 1.4 } // 15° for cyan
  },
  'fineart-175lpi': {
    name: 'Fine Art 175 LPI',
    description: 'Premium art paper printing (175 LPI)',
    algorithm: 'halftone',
    colorMode: 'normal',
    threshold: 0.5,
    contrast: 1.0,
    brightness: 0.05,
    colors: 32,
    params: { dotSize: 3.5, angle: 0.785, sharpness: 1.6 }
  },
  'premium-200lpi': {
    name: 'Museum Quality 200 LPI',
    description: 'Highest quality offset printing on coated paper (200 LPI)',
    algorithm: 'halftone45',
    colorMode: 'normal',
    threshold: 0.5,
    contrast: 1.0,
    brightness: 0.0,
    colors: 64,
    params: { dotSize: 3.0, sharpness: 1.8 }
  },
  'cmyk-cyan': {
    name: 'CMYK Cyan 15°',
    description: 'CMYK separation - Cyan at 15° (industry standard)',
    algorithm: 'halftone',
    colorMode: 'duotone',
    duotone: { dark: '#000000', light: '#00FFFF' },
    threshold: 0.5,
    contrast: 1.2,
    brightness: 0.0,
    params: { dotSize: 4.0, angle: 0.262, sharpness: 1.5 } // 15° in radians
  },
  'cmyk-magenta': {
    name: 'CMYK Magenta 75°',
    description: 'CMYK separation - Magenta at 75° (30° offset from black)',
    algorithm: 'halftone',
    colorMode: 'duotone',
    duotone: { dark: '#000000', light: '#FF00FF' },
    threshold: 0.5,
    contrast: 1.2,
    brightness: 0.0,
    params: { dotSize: 4.0, angle: 1.309, sharpness: 1.5 } // 75° in radians
  },
  'cmyk-black': {
    name: 'CMYK Black 45°',
    description: 'CMYK separation - Black at 45° (least visible angle, newspaper standard)',
    algorithm: 'halftone45',
    colorMode: 'grayscale',
    threshold: 0.5,
    contrast: 1.3,
    brightness: 0.0,
    params: { dotSize: 4.0, sharpness: 1.6 }
  },
  'screen-coarse': {
    name: 'Screen Print Coarse (55 LPI)',
    description: 'Screen printing on 200-305 mesh (55 LPI equivalent)',
    algorithm: 'halftone',
    colorMode: 'normal',
    threshold: 0.5,
    contrast: 1.4,
    brightness: 0.0,
    colors: 4,
    params: { dotSize: 8.0, angle: 0.785, sharpness: 0.8 }
  },
  'screen-medium': {
    name: 'Screen Print Medium (45 LPI)',
    description: 'Screen printing on 156 mesh (45 LPI equivalent)',
    algorithm: 'halftone',
    colorMode: 'normal',
    threshold: 0.5,
    contrast: 1.3,
    brightness: 0.0,
    colors: 6,
    params: { dotSize: 6.5, angle: 0.785, sharpness: 1.0 }
  },
  'screen-fine': {
    name: 'Screen Print Fine (35 LPI)',
    description: 'Screen printing on 110 mesh (35 LPI equivalent)',
    algorithm: 'halftone',
    colorMode: 'normal',
    threshold: 0.5,
    contrast: 1.2,
    brightness: 0.0,
    colors: 8,
    params: { dotSize: 5.5, angle: 0.785, sharpness: 1.2 }
  },
  'giclee-fineart': {
    name: 'Giclée Fine Art Print',
    description: 'Museum quality inkjet printing (300+ DPI, 12-color ink)',
    algorithm: 'dispersed',
    colorMode: 'normal',
    threshold: 0.5,
    contrast: 1.0,
    brightness: 0.05,
    colors: 256,
    params: { scale: 0.5, density: 0.9 }
  },

  // ============================================================
  // RETRO GAMING PLATFORMS (historical accuracy)
  // ============================================================
  'gameboy-original': {
    name: 'Game Boy Original (1989)',
    description: 'Nintendo Game Boy - 4 shades of green, Bayer dithering',
    algorithm: 'bayer4',
    colorMode: 'palette',
    palette: 'gameboy',
    threshold: 0.5,
    contrast: 1.2,
    brightness: 0.1,
    colors: 4,
    params: { scale: 1.0 }
  },
  'gameboy-pocket': {
    name: 'Game Boy Pocket (1996)',
    description: 'Game Boy Pocket - 4 shades of gray, improved LCD',
    algorithm: 'bayer4',
    colorMode: 'grayscale',
    threshold: 0.5,
    contrast: 1.3,
    brightness: 0.15,
    colors: 4,
    params: { scale: 1.0 }
  },
  'mac-classic': {
    name: 'Macintosh Classic (1984)',
    description: 'Bill Atkinson dithering - original Mac, discards 25% of error for "snap"',
    algorithm: 'atkinson',
    colorMode: 'grayscale',
    threshold: 0.5,
    contrast: 1.4,
    brightness: 0.0,
    colors: 2,
    params: { diffusion: 0.75 } // Atkinson uses 6/8 = 0.75
  },
  'commodore-64': {
    name: 'Commodore 64 (1982)',
    description: 'C64 - 16 color palette, 2x2 Bayer dithering',
    algorithm: 'bayer2',
    colorMode: 'palette',
    palette: 'c64',
    threshold: 0.5,
    contrast: 1.0,
    brightness: 0.0,
    colors: 16,
    params: { scale: 2.0 }
  },
  'cga-4color': {
    name: 'CGA 4-Color Mode',
    description: 'IBM CGA graphics - 4 color palettes, dithering for more colors',
    algorithm: 'pattern4x4',
    colorMode: 'palette',
    palette: 'cga',
    threshold: 0.5,
    contrast: 1.0,
    brightness: 0.0,
    colors: 4,
    params: { gridSize: 2, pixelRatio: 2 }
  },
  'amiga-ocs': {
    name: 'Amiga OCS (1985)',
    description: 'Commodore Amiga - Floyd-Steinberg for 32 color display',
    algorithm: 'floyd',
    colorMode: 'palette',
    palette: 'c64',
    threshold: 0.5,
    contrast: 1.1,
    brightness: 0.0,
    colors: 32,
    params: { diffusion: 1.0 }
  },
  'nes-graphics': {
    name: 'NES Graphics (1983)',
    description: 'Nintendo Entertainment System - limited palette, Bayer dithering',
    algorithm: 'bayer4',
    colorMode: 'palette',
    palette: 'nes',
    threshold: 0.5,
    contrast: 1.2,
    brightness: 0.0,
    colors: 16,
    params: { scale: 1.0 }
  },
  'pico8-style': {
    name: 'PICO-8 Fantasy Console',
    description: 'PICO-8 - 16 color palette, retro indie aesthetic',
    algorithm: 'pattern4x4',
    colorMode: 'palette',
    palette: 'pico8',
    threshold: 0.5,
    contrast: 1.0,
    brightness: 0.0,
    colors: 16,
    params: { gridSize: 4, pixelRatio: 1 }
  },
  'zx-spectrum': {
    name: 'ZX Spectrum (1982)',
    description: 'Sinclair ZX Spectrum - 8 colors, attribute clash simulation',
    algorithm: 'bayer2',
    colorMode: 'palette',
    palette: 'cga',
    threshold: 0.5,
    contrast: 1.3,
    brightness: 0.0,
    colors: 8,
    params: { scale: 3.0 }
  },
  'atari-2600': {
    name: 'Atari 2600 (1977)',
    description: 'Atari VCS - clustered dithering, vintage palette',
    algorithm: 'cluster',
    colorMode: 'palette',
    palette: 'c64',
    threshold: 0.5,
    contrast: 1.2,
    brightness: 0.0,
    colors: 16,
    params: { scale: 2.0, tightness: 0.7 }
  },

  // ============================================================
  // MODERN INDIE GAME AESTHETICS
  // ============================================================
  'obra-dinn': {
    name: 'Return of the Obra Dinn',
    description: 'Lucas Pope - Blue Noise + Bayer combo, 1-bit Mac-style, 800×450',
    algorithm: 'blue',
    algorithm2: 'bayer4',
    multiAlgo: { enabled: true, blendMode: 0, blendAmount: 0.3 }, // multiply
    colorMode: 'grayscale',
    threshold: 0.5,
    contrast: 1.5,
    brightness: 0.0,
    colors: 2,
    params: { frequency: 0.8, amplitude: 1.2 }
  },
  'obra-characters': {
    name: 'Obra Dinn - Characters',
    description: 'Bayer dithering for people/objects - helps them stand out',
    algorithm: 'bayer4',
    colorMode: 'grayscale',
    threshold: 0.5,
    contrast: 1.6,
    brightness: 0.05,
    colors: 2,
    params: { scale: 1.0, sharpness: 1.5 }
  },
  'obra-environment': {
    name: 'Obra Dinn - Environment',
    description: 'Blue noise for backgrounds - organic, less flickery',
    algorithm: 'blue',
    colorMode: 'grayscale',
    threshold: 0.5,
    contrast: 1.4,
    brightness: 0.0,
    colors: 2,
    params: { frequency: 1.0, amplitude: 1.0 }
  },
  'ditherpunk': {
    name: 'Ditherpunk 1-Bit',
    description: 'Modern 1-bit aesthetic - Floyd-Steinberg, high contrast',
    algorithm: 'floyd',
    colorMode: 'grayscale',
    threshold: 0.5,
    contrast: 1.7,
    brightness: 0.0,
    colors: 2,
    params: { diffusion: 1.2 }
  },
  'lofi-horror': {
    name: 'Lo-Fi Horror',
    description: 'Atkinson dithering, desaturated, film grain',
    algorithm: 'atkinson',
    colorMode: 'duotone',
    duotone: { dark: '#0a0a0a', light: '#d0d0d0' },
    threshold: 0.45,
    contrast: 1.6,
    brightness: -0.1,
    colors: 2,
    params: { diffusion: 0.8 }
  },
  'pixel-smooth': {
    name: 'Pixel Art Smooth Shading',
    description: 'Sierra dithering for anti-aliased retro look',
    algorithm: 'sierra',
    colorMode: 'palette',
    palette: 'pico8',
    threshold: 0.5,
    contrast: 1.0,
    brightness: 0.0,
    colors: 16,
    params: { diffusion: 0.9 }
  },
  'retro-fps': {
    name: 'Retro FPS (Doom-style)',
    description: 'Bayer 8×8, limited palette, pixelated',
    algorithm: 'bayer8',
    colorMode: 'palette',
    palette: 'pico8',
    threshold: 0.5,
    contrast: 1.3,
    brightness: -0.05,
    colors: 32,
    pixelation: 4,
    params: { scale: 1.0, sharpness: 1.2 }
  },
  'minimal-1bit': {
    name: 'Minimalist 1-Bit',
    description: 'Pure black & white, random dithering',
    algorithm: 'random',
    colorMode: 'grayscale',
    threshold: 0.5,
    contrast: 1.8,
    brightness: 0.0,
    colors: 2,
    params: { seed: 42 }
  },

  // ============================================================
  // ARTISTIC & CREATIVE
  // ============================================================
  'stipple-art': {
    name: 'Stipple Illustration',
    description: 'Traditional stippling technique - organic dot placement',
    algorithm: 'stipple',
    colorMode: 'grayscale',
    threshold: 0.5,
    contrast: 1.2,
    brightness: 0.0,
    colors: 8,
    params: { density: 0.6, size: 2.5 }
  },
  'pen-ink': {
    name: 'Pen & Ink Crosshatch',
    description: 'Traditional illustration technique - directional hatching',
    algorithm: 'crosshatch',
    colorMode: 'grayscale',
    threshold: 0.45,
    contrast: 1.5,
    brightness: 0.0,
    colors: 4,
    params: { spacing: 3.5, angle: 0.785 }
  },
  'linocut': {
    name: 'Linocut Print',
    description: 'Bold relief printing style - clustered dots, high contrast',
    algorithm: 'cluster',
    colorMode: 'grayscale',
    threshold: 0.5,
    contrast: 1.8,
    brightness: 0.0,
    colors: 2,
    params: { scale: 1.5, tightness: 0.9 }
  },
  'risograph': {
    name: 'Risograph Print',
    description: 'Japanese screen printing - vibrant halftones',
    algorithm: 'halftone',
    colorMode: 'duotone',
    duotone: { dark: '#FF0066', light: '#00FFFF' },
    threshold: 0.5,
    contrast: 1.3,
    brightness: 0.1,
    colors: 8,
    params: { dotSize: 5.0, angle: 0.524, sharpness: 1.0 } // 30°
  },
  'pencil-sketch': {
    name: 'Pencil Sketch',
    description: 'Soft graphite shading - Perlin noise texture',
    algorithm: 'perlin',
    colorMode: 'grayscale',
    threshold: 0.5,
    contrast: 0.9,
    brightness: 0.1,
    colors: 16,
    params: { frequency: 0.08, octaves: 4 }
  },
  'comic-dots': {
    name: 'Comic Book Halftone',
    description: 'Pop art style - bold color dots',
    algorithm: 'dots',
    colorMode: 'tritone',
    tritone: { shadow: '#000000', mid: '#FF0000', highlight: '#FFFF00' },
    threshold: 0.5,
    contrast: 1.4,
    brightness: 0.0,
    colors: 8,
    params: { spacing: 6.0, randomness: 0.2 }
  },
  'woodcut': {
    name: 'Woodcut Print',
    description: 'Traditional woodblock printing - directional lines',
    algorithm: 'lines',
    colorMode: 'grayscale',
    threshold: 0.5,
    contrast: 1.7,
    brightness: 0.0,
    colors: 2,
    params: { width: 1.5, angle: 0.0, spacing: 3.0 }
  },
  'abstract-voronoi': {
    name: 'Abstract Voronoi',
    description: 'Experimental cellular pattern - organic tessellation',
    algorithm: 'voronoi',
    colorMode: 'normal',
    threshold: 0.5,
    contrast: 1.2,
    brightness: 0.0,
    colors: 16,
    params: { cells: 16.0, randomness: 0.9 }
  },

  // ============================================================
  // PHOTOGRAPHY & FILM
  // ============================================================
  'ansel-adams': {
    name: 'Ansel Adams B&W',
    description: 'Zone System - full tonal range, Floyd-Steinberg',
    algorithm: 'floyd',
    colorMode: 'grayscale',
    threshold: 0.5,
    contrast: 1.3,
    brightness: 0.0,
    colors: 64,
    params: { diffusion: 1.0 }
  },
  'tritone-portrait': {
    name: 'Tri-Tone Portrait',
    description: 'Professional portrait tritone - shadow/mid/highlight',
    algorithm: 'stucki',
    colorMode: 'tritone',
    tritone: { shadow: '#1a1a1a', mid: '#8b6f47', highlight: '#f5e6d3' },
    threshold: 0.5,
    contrast: 1.2,
    brightness: 0.05,
    colors: 16,
    params: { diffusion: 1.0 }
  },
  'film-noir': {
    name: 'Film Noir',
    description: 'Classic high-contrast B&W - dramatic shadows',
    algorithm: 'bayer8',
    colorMode: 'grayscale',
    threshold: 0.45,
    contrast: 1.8,
    brightness: -0.1,
    colors: 4,
    params: { scale: 1.0, sharpness: 1.5 }
  },
  'vintage-photo': {
    name: 'Vintage Photograph',
    description: 'Atkinson dithering, sepia tone, aged look',
    algorithm: 'atkinson',
    colorMode: 'duotone',
    duotone: { dark: '#3b2814', light: '#f4e4c1' },
    threshold: 0.5,
    contrast: 1.1,
    brightness: 0.05,
    colors: 8,
    params: { diffusion: 0.75 }
  },
  'cyanotype': {
    name: 'Cyanotype Blueprint',
    description: 'Classic photographic printing process - Prussian blue',
    algorithm: 'floyd',
    colorMode: 'duotone',
    duotone: { dark: '#003153', light: '#c2dfe3' },
    threshold: 0.5,
    contrast: 1.3,
    brightness: 0.0,
    colors: 16,
    params: { diffusion: 1.0 }
  },
  'daguerreotype': {
    name: 'Daguerreotype',
    description: '1839 photographic process - antique silver tone',
    algorithm: 'cluster',
    colorMode: 'duotone',
    duotone: { dark: '#2a2118', light: '#d4c5b0' },
    threshold: 0.5,
    contrast: 1.4,
    brightness: 0.1,
    colors: 8,
    params: { scale: 1.5, tightness: 0.8 }
  },

  // ============================================================
  // ALGORITHM SHOWCASES (optimal settings for each)
  // ============================================================
  'floyd-demo': {
    name: 'Floyd-Steinberg Showcase',
    description: 'Optimal Floyd-Steinberg: 7/16, 3/16, 5/16, 1/16 distribution',
    algorithm: 'floyd',
    colorMode: 'normal',
    threshold: 0.5,
    contrast: 1.0,
    brightness: 0.0,
    colors: 16,
    params: { diffusion: 1.0 } // Standard divisor 16
  },
  'atkinson-demo': {
    name: 'Atkinson Showcase',
    description: 'Bill Atkinson: 6 pixels @ 1/8 each, discards 25% for snap',
    algorithm: 'atkinson',
    colorMode: 'normal',
    threshold: 0.5,
    contrast: 1.1,
    brightness: 0.0,
    colors: 16,
    params: { diffusion: 0.75 } // 6/8 = 0.75
  },
  'jarvis-demo': {
    name: 'Jarvis-Judice-Ninke Showcase',
    description: 'Bell Labs "minimized average error": 48 divisor, 12 pixels',
    algorithm: 'jarvis',
    colorMode: 'normal',
    threshold: 0.5,
    contrast: 1.0,
    brightness: 0.0,
    colors: 16,
    params: { diffusion: 1.0 }
  },
  'stucki-demo': {
    name: 'Stucki Showcase',
    description: 'Sharp dithering: 42 divisor, 12 pixels, fast & clean',
    algorithm: 'stucki',
    colorMode: 'normal',
    threshold: 0.5,
    contrast: 1.0,
    brightness: 0.0,
    colors: 16,
    params: { diffusion: 1.0 }
  },
  'bayer4-demo': {
    name: 'Bayer 4×4 Showcase',
    description: 'Recommended baseline: 16 threshold levels, 0-15 range',
    algorithm: 'bayer4',
    colorMode: 'normal',
    threshold: 0.5,
    contrast: 1.0,
    brightness: 0.0,
    colors: 16,
    params: { scale: 1.0 }
  },
  'bluenoise-demo': {
    name: 'Blue Noise Showcase',
    description: 'Modern quality: Poisson disk, organic pattern, 64×64 tile',
    algorithm: 'blue',
    colorMode: 'normal',
    threshold: 0.5,
    contrast: 1.0,
    brightness: 0.0,
    colors: 32,
    params: { frequency: 0.5, amplitude: 1.0 }
  },

  // ============================================================
  // VINTAGE COMPUTING PLATFORMS (Historical Accuracy)
  // ============================================================
  'teletext-mode7': {
    name: 'Teletext Mode 7 (BBC)',
    description: 'BBC Micro teletext - 40×25 chars, 2×3 sixel block graphics, Ceefax style',
    algorithm: 'pattern4x4',
    colorMode: 'palette',
    palette: 'cga',
    threshold: 0.5,
    contrast: 1.2,
    brightness: 0.0,
    colors: 8,
    params: { gridSize: 3, pixelRatio: 2 }
  },
  'zx-spectrum-enhanced': {
    name: 'ZX Spectrum Enhanced',
    description: 'Sinclair ZX Spectrum - 8×8 attribute blocks, color clash, CRT blur simulation',
    algorithm: 'bayer2',
    colorMode: 'palette',
    palette: 'cga',
    threshold: 0.5,
    contrast: 1.4,
    brightness: 0.0,
    colors: 8,
    blur: 1,
    params: { scale: 4.0 }
  },
  'amiga-ham6': {
    name: 'Amiga HAM6 Mode',
    description: 'Hold-And-Modify - 4096 colors, horizontal color fringing, oversaturated',
    algorithm: 'floyd',
    colorMode: 'normal',
    threshold: 0.45,
    contrast: 1.5,
    brightness: 0.1,
    colors: 64,
    params: { diffusion: 1.2 }
  },
  'apple-ii-hires': {
    name: 'Apple II Hi-Res',
    description: 'Apple II artifact colors - 6 colors from B&W pixels, horizontal fringing',
    algorithm: 'bayer2',
    colorMode: 'palette',
    palette: 'cga',
    threshold: 0.5,
    contrast: 1.1,
    brightness: 0.0,
    colors: 6,
    params: { scale: 2.0 }
  },
  'msx-computer': {
    name: 'MSX Computer (TMS9918)',
    description: 'MSX standard - TMS9918 VDP, 16 color palette, Bayer dithering',
    algorithm: 'bayer4',
    colorMode: 'palette',
    palette: 'nes',
    threshold: 0.5,
    contrast: 1.1,
    brightness: 0.0,
    colors: 16,
    params: { scale: 1.5 }
  },
  'bbc-micro-mode1': {
    name: 'BBC Micro Mode 1',
    description: 'BBC Micro - 320×256, 4 colors from 8, high detail graphics',
    algorithm: 'bayer4',
    colorMode: 'palette',
    palette: 'cga',
    threshold: 0.5,
    contrast: 1.2,
    brightness: 0.0,
    colors: 4,
    params: { scale: 1.0 }
  },
  'amstrad-cpc-mode1': {
    name: 'Amstrad CPC Mode 1',
    description: 'CPC Mode 1 - 320×200, 4 colors from 27, European home computer',
    algorithm: 'bayer2',
    colorMode: 'palette',
    palette: 'cga',
    threshold: 0.5,
    contrast: 1.1,
    brightness: 0.0,
    colors: 4,
    params: { scale: 2.0 }
  },
  'atari-st-med': {
    name: 'Atari ST Medium Res',
    description: 'Atari ST - 640×200, 4 colors from 512, 16-bit computing',
    algorithm: 'bayer4',
    colorMode: 'normal',
    threshold: 0.5,
    contrast: 1.1,
    brightness: 0.0,
    colors: 4,
    params: { scale: 1.0 }
  },

  // ============================================================
  // SCREEN DOOR & TEMPORAL EFFECTS (Modern 3D Games)
  // ============================================================
  'screen-door-transparency': {
    name: 'Screen Door Transparency',
    description: 'Stochastic transparency for 3D - alpha-tested dithering, TAA-friendly',
    algorithm: 'bayer8',
    colorMode: 'normal',
    threshold: 0.5,
    contrast: 1.0,
    brightness: 0.0,
    colors: 64,
    params: { scale: 1.0 }
  },
  'taa-optimized': {
    name: 'TAA-Optimized Dither',
    description: 'Temporal anti-aliasing friendly - noise smoothed over multiple frames',
    algorithm: 'blue',
    colorMode: 'normal',
    threshold: 0.5,
    contrast: 1.0,
    brightness: 0.0,
    colors: 32,
    params: { frequency: 0.6, amplitude: 0.8 }
  },
  'dissolve-fizzle': {
    name: 'Dissolve/Fizzle Effect',
    description: 'Classic fade-out dithering - ordered pattern for smooth transitions',
    algorithm: 'bayer16',
    colorMode: 'normal',
    threshold: 0.5,
    contrast: 1.0,
    brightness: 0.0,
    colors: 256,
    params: { scale: 0.5 }
  },
  'animated-dither': {
    name: 'Animated Noise Dither',
    description: 'Time-based noise for motion - add temporal variation manually',
    algorithm: 'perlin',
    colorMode: 'normal',
    threshold: 0.5,
    contrast: 1.0,
    brightness: 0.0,
    colors: 16,
    params: { frequency: 0.15, octaves: 3 }
  },

  // ============================================================
  // PRINT & ARCHIVAL STANDARDS (Professional Publishing)
  // ============================================================
  'microfilm-65lpi': {
    name: 'Microfilm Archival 65 LPI',
    description: 'Lithography archival standard - newspaper preservation, 65 LPI',
    algorithm: 'halftone',
    colorMode: 'grayscale',
    threshold: 0.5,
    contrast: 1.2,
    brightness: 0.0,
    colors: 2,
    params: { dotSize: 7.5, angle: 0.785, sharpness: 0.9 }
  },
  'newspaper-classified': {
    name: 'Newspaper Classified Ads',
    description: 'Coarse 55 LPI for small text - high readability, low detail',
    algorithm: 'halftone45',
    colorMode: 'grayscale',
    threshold: 0.48,
    contrast: 1.4,
    brightness: 0.0,
    colors: 2,
    params: { dotSize: 8.5, sharpness: 0.7 }
  },
  'magazine-swop-150': {
    name: 'Magazine SWOP 150 LPI',
    description: 'Web offset publication standard - coated paper, 150 LPI',
    algorithm: 'halftone',
    colorMode: 'normal',
    threshold: 0.5,
    contrast: 1.15,
    brightness: 0.0,
    colors: 32,
    params: { dotSize: 4.2, angle: 0.262, sharpness: 1.5 }
  },
  'artbook-175lpi': {
    name: 'Art Book 175 LPI',
    description: 'Maplitho coated paper - coffee table books, art catalogs',
    algorithm: 'halftone',
    colorMode: 'normal',
    threshold: 0.5,
    contrast: 1.08,
    brightness: 0.02,
    colors: 64,
    params: { dotSize: 3.7, angle: 0.785, sharpness: 1.65 }
  },
  'broadsheet-85lpi': {
    name: 'Newspaper Broadsheet 85 LPI',
    description: 'Full-page newspaper optimized - 85 LPI standard since 1970s',
    algorithm: 'halftone45',
    colorMode: 'grayscale',
    threshold: 0.46,
    contrast: 1.28,
    brightness: 0.0,
    colors: 4,
    params: { dotSize: 6.2, sharpness: 0.85 }
  },
  'photo-print-300dpi': {
    name: 'Photo Print 300 DPI',
    description: 'High-fidelity photographic halftone - inkjet/laser quality',
    algorithm: 'dispersed',
    colorMode: 'normal',
    threshold: 0.5,
    contrast: 1.0,
    brightness: 0.0,
    colors: 128,
    params: { scale: 0.4, density: 0.95 }
  },

  // ============================================================
  // MANGA & COMIC TECHNIQUES (Japanese & Western)
  // ============================================================
  'manga-screentone-60l': {
    name: 'Manga Screentone 60L',
    description: 'Professional manga gradients - 60 lines, linear gradient pattern',
    algorithm: 'lines',
    colorMode: 'grayscale',
    threshold: 0.5,
    contrast: 1.0,
    brightness: 0.0,
    colors: 16,
    params: { width: 1.0, angle: 0.0, spacing: 2.5 }
  },
  'manga-screentone-radial': {
    name: 'Manga Screentone Radial',
    description: 'Radial gradient screentone - emphasis and depth effects',
    algorithm: 'radialburst',
    colorMode: 'grayscale',
    threshold: 0.5,
    contrast: 1.1,
    brightness: 0.0,
    colors: 16,
    params: { scale: 1.5, density: 0.7 }
  },
  'manga-texture-pattern': {
    name: 'Manga Texture Pattern',
    description: 'Clothing and fabric patterns - avoid moiré with proper resolution',
    algorithm: 'dots',
    colorMode: 'grayscale',
    threshold: 0.5,
    contrast: 1.0,
    brightness: 0.0,
    colors: 8,
    params: { spacing: 4.5, randomness: 0.15 }
  },
  'comic-benday-dots': {
    name: 'Comic Benday Dots',
    description: 'Roy Lichtenstein pop art - large colored dots, 1960s comic style',
    algorithm: 'dots',
    colorMode: 'tritone',
    tritone: { shadow: '#000000', mid: '#FF0000', highlight: '#FFFF00' },
    threshold: 0.5,
    contrast: 1.5,
    brightness: 0.0,
    colors: 6,
    params: { spacing: 8.0, randomness: 0.0 }
  },
  'manga-speed-lines': {
    name: 'Manga Speed Lines',
    description: 'Motion blur with line dithering - action sequences',
    algorithm: 'lines',
    colorMode: 'grayscale',
    threshold: 0.4,
    contrast: 1.6,
    brightness: 0.0,
    colors: 4,
    params: { width: 2.0, angle: 0.785, spacing: 4.0 }
  },

  // ============================================================
  // ALTERNATIVE PHOTOGRAPHY (Analog Processes)
  // ============================================================
  'risograph-grain-touch': {
    name: 'Risograph Grain Touch',
    description: 'RISO diffusion dither - film grain aesthetic, 85% opacity recommended',
    algorithm: 'blue',
    colorMode: 'duotone',
    duotone: { dark: '#FF0066', light: '#00FFFF' },
    threshold: 0.5,
    contrast: 1.25,
    brightness: 0.08,
    colors: 12,
    params: { frequency: 0.7, amplitude: 1.1 }
  },
  'risograph-screen-covered': {
    name: 'Risograph Screen-Covered',
    description: 'RISO halftone pattern - classic dots, small scale, vibrant colors',
    algorithm: 'halftone',
    colorMode: 'duotone',
    duotone: { dark: '#0000FF', light: '#FFFF00' },
    threshold: 0.5,
    contrast: 1.3,
    brightness: 0.1,
    colors: 10,
    params: { dotSize: 4.5, angle: 0.524, sharpness: 1.1 }
  },
  'cyanotype-enhanced': {
    name: 'Cyanotype Blueprint Enhanced',
    description: 'UV photographic process - deep Prussian blue, soft gradients, 1842 technique',
    algorithm: 'stucki',
    colorMode: 'duotone',
    duotone: { dark: '#001a33', light: '#c8dfe5' },
    threshold: 0.5,
    contrast: 1.25,
    brightness: 0.05,
    colors: 24,
    params: { diffusion: 0.95 }
  },
  'vandyke-brown': {
    name: 'Van Dyke Brown Print',
    description: 'Alternative process - warm chocolate/sepia tones, silver-based',
    algorithm: 'jarvis',
    colorMode: 'duotone',
    duotone: { dark: '#3d2817', light: '#f0e0c8' },
    threshold: 0.5,
    contrast: 1.2,
    brightness: 0.03,
    colors: 20,
    params: { diffusion: 1.0 }
  },
  'platinum-palladium': {
    name: 'Platinum/Palladium Print',
    description: 'Ultra-fine grain archival quality - expensive metals, museum standard',
    algorithm: 'burkes',
    colorMode: 'grayscale',
    threshold: 0.5,
    contrast: 1.15,
    brightness: 0.0,
    colors: 128,
    params: { diffusion: 0.95 }
  },

  // ============================================================
  // ARTISTIC HATCHING TECHNIQUES (Traditional Media)
  // ============================================================
  'engraving-fine': {
    name: 'Engraving Style',
    description: 'Fine parallel lines and crosshatch - Renaissance printmaking',
    algorithm: 'crosshatch',
    colorMode: 'grayscale',
    threshold: 0.5,
    contrast: 1.4,
    brightness: 0.0,
    colors: 8,
    params: { spacing: 2.5, angle: 0.524 }
  },
  'woodcut-bold': {
    name: 'Woodcut Bold',
    description: 'Chunky directional marks - Japanese ukiyo-e style, hand-carved',
    algorithm: 'lines',
    colorMode: 'grayscale',
    threshold: 0.5,
    contrast: 1.7,
    brightness: 0.0,
    colors: 3,
    params: { width: 3.0, angle: 1.571, spacing: 5.0 }
  },
  'etching-aquatint': {
    name: 'Etching Aquatint',
    description: 'Rosin dust texture - acid-bitten tonal areas, Rembrandt technique',
    algorithm: 'stipple',
    colorMode: 'grayscale',
    threshold: 0.5,
    contrast: 1.3,
    brightness: 0.0,
    colors: 12,
    params: { density: 0.75, size: 1.5 }
  },
  'lithograph-crayon': {
    name: 'Lithograph Crayon',
    description: 'Soft textured marks - grease crayon on limestone, Toulouse-Lautrec',
    algorithm: 'perlin',
    colorMode: 'grayscale',
    threshold: 0.5,
    contrast: 1.1,
    brightness: 0.05,
    colors: 24,
    params: { frequency: 0.12, octaves: 3 }
  },
  'mezzotint-scraping': {
    name: 'Mezzotint Technique',
    description: 'Dark-to-light scraping - labor-intensive intaglio printmaking',
    algorithm: 'cluster',
    colorMode: 'grayscale',
    threshold: 0.5,
    contrast: 1.5,
    brightness: -0.05,
    colors: 16,
    params: { scale: 1.2, tightness: 0.85 }
  },

  // ============================================================
  // MODERN GAME STYLES (Indie & Retro-Inspired)
  // ============================================================
  'ditherpunk-extreme': {
    name: 'Ditherpunk Extreme Contrast',
    description: '1-bit indie aesthetic - ultra-high contrast, no midtones',
    algorithm: 'floyd',
    colorMode: 'grayscale',
    threshold: 0.5,
    contrast: 1.9,
    brightness: 0.0,
    colors: 2,
    params: { diffusion: 1.3 }
  },
  'obra-dinn-stable': {
    name: 'Obra Dinn Stable (Low Flicker)',
    description: 'Temporal coherence optimized - 15% frame blending, reduced video flicker',
    algorithm: 'blue',
    algorithm2: 'bayer4',
    multiAlgo: { enabled: true, blendMode: 0, blendAmount: 0.25 },
    colorMode: 'grayscale',
    threshold: 0.5,
    contrast: 1.45,
    brightness: 0.0,
    colors: 2,
    params: { frequency: 0.85, amplitude: 1.15 }
  },
  'papers-please': {
    name: 'Papers Please Style',
    description: 'Bureaucratic document aesthetic - stamp and paper texture',
    algorithm: 'atkinson',
    colorMode: 'duotone',
    duotone: { dark: '#2a1810', light: '#e8dcc0' },
    threshold: 0.5,
    contrast: 1.3,
    brightness: 0.0,
    colors: 4,
    params: { diffusion: 0.75 }
  },
  'downwell-vertical': {
    name: 'Downwell Vertical Action',
    description: 'High-contrast falling - 3-color palette, vertical gameplay optimized',
    algorithm: 'bayer4',
    colorMode: 'palette',
    palette: 'gameboy',
    threshold: 0.5,
    contrast: 1.5,
    brightness: 0.0,
    colors: 3,
    params: { scale: 1.0 }
  },
  'minit-60-second': {
    name: 'Minit 60-Second',
    description: 'Quick readable 1-bit - clear silhouettes, time pressure design',
    algorithm: 'bayer2',
    colorMode: 'grayscale',
    threshold: 0.5,
    contrast: 1.6,
    brightness: 0.0,
    colors: 2,
    params: { scale: 1.0 }
  },
  'world-of-horror': {
    name: 'World of Horror (Junji Ito)',
    description: 'Japanese horror manga aesthetic - Atkinson dithering, unsettling contrast',
    algorithm: 'atkinson',
    colorMode: 'grayscale',
    threshold: 0.48,
    contrast: 1.65,
    brightness: -0.08,
    colors: 2,
    params: { diffusion: 0.7 }
  },

  // ============================================================
  // EXPERIMENTAL & HYBRID (Advanced Techniques)
  // ============================================================
  'riemersma-hilbert': {
    name: 'Riemersma Space-Filling',
    description: 'Hilbert curve error diffusion - no directional bias, experimental',
    algorithm: 'sierra2',
    colorMode: 'normal',
    threshold: 0.5,
    contrast: 1.0,
    brightness: 0.0,
    colors: 16,
    params: { diffusion: 0.9 }
  },
  'ordered-error-hybrid': {
    name: 'Ordered-Error Hybrid',
    description: 'Bayer matrix + Floyd-Steinberg combo - structured yet smooth',
    algorithm: 'bayer4',
    algorithm2: 'floyd',
    multiAlgo: { enabled: true, blendMode: 4, blendAmount: 0.5 },
    colorMode: 'normal',
    threshold: 0.5,
    contrast: 1.0,
    brightness: 0.0,
    colors: 16,
    params: { scale: 1.0 }
  },
  'multi-scale-dither': {
    name: 'Multi-Scale Frequency',
    description: 'Multiple dithering frequencies combined - rich texture detail',
    algorithm: 'bayer8',
    algorithm2: 'bayer2',
    multiAlgo: { enabled: true, blendMode: 1, blendAmount: 0.35 },
    colorMode: 'normal',
    threshold: 0.5,
    contrast: 1.1,
    brightness: 0.0,
    colors: 32,
    params: { scale: 1.0 }
  },
  'anisotropic-dither': {
    name: 'Anisotropic Direction-Aware',
    description: 'Direction-aware pattern - elliptical halftones for motion',
    algorithm: 'ellipse',
    colorMode: 'normal',
    threshold: 0.5,
    contrast: 1.0,
    brightness: 0.0,
    colors: 16,
    params: { scale: 1.0, eccentricity: 0.7 }
  },
  'adaptive-edge-preserving': {
    name: 'Adaptive Edge-Preserving',
    description: 'Variable threshold based on local variance - experimental quality',
    algorithm: 'stucki',
    colorMode: 'normal',
    threshold: 0.5,
    contrast: 1.15,
    brightness: 0.0,
    colors: 24,
    params: { diffusion: 1.1 }
  },

  // ============================================================
  // LEGACY PRESETS (keeping for compatibility)
  // ============================================================
  'retro-gameboy': {
    algorithm: 'bayer4',
    colorMode: 'palette',
    palette: 'gameboy',
    scale: 1,
    threshold: 0.5,
    contrast: 1.2,
    brightness: 0.1
  },
  'newspaper': {
    algorithm: 'halftone45',
    colorMode: 'grayscale',
    threshold: 0.45,
    contrast: 1.3,
    brightness: 0.0,
    params: { dotSize: 6.0, sharpness: 1.2 }
  },
  'vaporwave': {
    algorithm: 'pattern4x4',
    colorMode: 'palette',
    palette: 'vaporwave',
    threshold: 0.5,
    contrast: 1.1,
    brightness: 0.05,
    params: { gridSize: 4, pixelRatio: 1 }
  },
  'cyberpunk': {
    algorithm: 'bayer8',
    colorMode: 'palette',
    palette: 'cyberpunk',
    threshold: 0.4,
    contrast: 1.4,
    brightness: -0.1
  },
  'retro-cga': {
    algorithm: 'bayer2',
    colorMode: 'palette',
    palette: 'cga',
    threshold: 0.5,
    contrast: 1.0,
    brightness: 0.0,
    scale: 2
  },
  'halftone-cmyk': {
    algorithm: 'halftone',
    colorMode: 'normal',
    threshold: 0.5,
    contrast: 1.2,
    brightness: 0.0,
    params: { dotSize: 4, angle: 0.785, sharpness: 1.5 }
  }
};

/**
 * Get preset by name
 */
export function getPreset(name: string): DitherPreset | undefined {
  return builtInPresets[name];
}

/**
 * Get all preset names
 */
export function getPresetNames(): string[] {
  return Object.keys(builtInPresets);
}

/**
 * Get presets by category
 */
export function getPresetsByCategory(): Record<string, string[]> {
  const categories: Record<string, string[]> = {};

  Object.entries(builtInPresets).forEach(([key, preset]) => {
    const category = preset.description?.split(' - ')[0] || 'Other';
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(key);
  });

  return categories;
}
