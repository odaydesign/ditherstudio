// Authentic retro computer and gaming system color palettes

export interface RetroPalette {
  id: string;
  name: string;
  colors: string[];
  description: string;
  recommendedAlgorithm: number; // shader value
  recommendedColors: number;
}

export const retroPalettes: RetroPalette[] = [
  // === HANDHELD GAMING ===
  {
    id: 'gameboy',
    name: 'Game Boy',
    colors: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'],
    description: 'Classic DMG greenscale',
    recommendedAlgorithm: 22, // Bayer 4x4
    recommendedColors: 4
  },
  {
    id: 'gameboy-pocket',
    name: 'Game Boy Pocket',
    colors: ['#000000', '#545454', '#a9a9a9', '#ffffff'],
    description: 'Grayscale variant',
    recommendedAlgorithm: 22,
    recommendedColors: 4
  },
  {
    id: 'gameboy-light',
    name: 'Game Boy Light',
    colors: ['#00b581', '#00a578', '#009a64', '#008b4f'],
    description: 'Backlit green tint',
    recommendedAlgorithm: 22,
    recommendedColors: 4
  },
  {
    id: 'virtualboy',
    name: 'Virtual Boy',
    colors: ['#000000', '#550000', '#aa0000', '#ff0000'],
    description: 'Red monochrome 3D',
    recommendedAlgorithm: 22,
    recommendedColors: 4
  },

  // === CLASSIC COMPUTERS ===
  {
    id: 'cga-mode4-palette1',
    name: 'CGA Mode 4 (Cyan)',
    colors: ['#000000', '#00aaaa', '#aa00aa', '#ffffff'],
    description: 'Cyan/Magenta/White',
    recommendedAlgorithm: 22,
    recommendedColors: 4
  },
  {
    id: 'cga-mode4-palette2',
    name: 'CGA Mode 4 (Red)',
    colors: ['#000000', '#00aaaa', '#aa0000', '#ffffff'],
    description: 'Cyan/Red/White',
    recommendedAlgorithm: 22,
    recommendedColors: 4
  },
  {
    id: 'cga-mode5',
    name: 'CGA Mode 5',
    colors: ['#000000', '#00aaaa', '#aa0000', '#aaaaaa'],
    description: 'Cyan/Red/Gray',
    recommendedAlgorithm: 22,
    recommendedColors: 4
  },
  {
    id: 'ega',
    name: 'EGA 16-Color',
    colors: [
      '#000000', '#0000aa', '#00aa00', '#00aaaa',
      '#aa0000', '#aa00aa', '#aa5500', '#aaaaaa',
      '#555555', '#5555ff', '#55ff55', '#55ffff',
      '#ff5555', '#ff55ff', '#ffff55', '#ffffff'
    ],
    description: 'Standard 16-color',
    recommendedAlgorithm: 3, // Floyd-Steinberg
    recommendedColors: 16
  },
  {
    id: 'macintosh',
    name: 'Macintosh',
    colors: ['#000000', '#ffffff'],
    description: 'Original Mac B&W',
    recommendedAlgorithm: 3,
    recommendedColors: 2
  },
  {
    id: 'macintosh-system',
    name: 'Mac System 7',
    colors: [
      '#ffffff', '#ffff00', '#ff6600', '#dd0000',
      '#ff0099', '#330099', '#0000cc', '#0099ff',
      '#00aa00', '#006600', '#663300', '#996633',
      '#cccccc', '#888888', '#444444', '#000000'
    ],
    description: '16-color system palette',
    recommendedAlgorithm: 3,
    recommendedColors: 16
  },
  {
    id: 'commodore64',
    name: 'Commodore 64',
    colors: [
      '#000000', '#ffffff', '#880000', '#aaffee',
      '#cc44cc', '#00cc55', '#0000aa', '#eeee77',
      '#dd8855', '#664400', '#ff7777', '#333333',
      '#777777', '#aaff66', '#0088ff', '#bbbbbb'
    ],
    description: 'Classic C64 colors',
    recommendedAlgorithm: 3,
    recommendedColors: 16
  },
  {
    id: 'zxspectrum',
    name: 'ZX Spectrum',
    colors: [
      '#000000', '#0000d7', '#d70000', '#d700d7',
      '#00d700', '#00d7d7', '#d7d700', '#d7d7d7',
      '#000000', '#0000ff', '#ff0000', '#ff00ff',
      '#00ff00', '#00ffff', '#ffff00', '#ffffff'
    ],
    description: 'British micro colors',
    recommendedAlgorithm: 3,
    recommendedColors: 16
  },
  {
    id: 'amstrad-cpc',
    name: 'Amstrad CPC',
    colors: [
      '#000000', '#000080', '#0000ff', '#800000',
      '#800080', '#8000ff', '#ff0000', '#ff0080',
      '#ff00ff', '#008000', '#008080', '#0080ff',
      '#808000', '#808080', '#8080ff', '#ff8000',
      '#ff8080', '#ff80ff', '#00ff00', '#00ff80',
      '#00ffff', '#80ff00', '#80ff80', '#80ffff',
      '#ffff00', '#ffff80', '#ffffff'
    ],
    description: '27-color palette',
    recommendedAlgorithm: 3,
    recommendedColors: 27
  },

  // === CONSOLE GAMING ===
  {
    id: 'nes',
    name: 'NES',
    colors: [
      '#7c7c7c', '#0000fc', '#0000bc', '#4428bc',
      '#940084', '#a80020', '#a81000', '#881400',
      '#503000', '#007800', '#006800', '#005800',
      '#004058', '#000000', '#000000', '#000000',
      '#bcbcbc', '#0078f8', '#0058f8', '#6844fc',
      '#d800cc', '#e40058', '#f83800', '#e45c10',
      '#ac7c00', '#00b800', '#00a800', '#00a844',
      '#008888', '#000000', '#000000', '#000000',
      '#f8f8f8', '#3cbcfc', '#6888fc', '#9878f8',
      '#f878f8', '#f85898', '#f87858', '#fca044',
      '#f8b800', '#b8f818', '#58d854', '#58f898',
      '#00e8d8', '#787878', '#000000', '#000000',
      '#fcfcfc', '#a4e4fc', '#b8b8f8', '#d8b8f8',
      '#f8b8f8', '#f8a4c0', '#f0d0b0', '#fce0a8',
      '#f8d878', '#d8f878', '#b8f8b8', '#b8f8d8',
      '#00fcfc', '#d8d8d8', '#000000', '#000000'
    ],
    description: 'Full NES palette',
    recommendedAlgorithm: 3,
    recommendedColors: 54
  },
  {
    id: 'snes',
    name: 'SNES',
    colors: [
      '#000000', '#1d2b53', '#7e2553', '#008751',
      '#ab5236', '#5f574f', '#c2c3c7', '#fff1e8',
      '#ff004d', '#ffa300', '#ffec27', '#00e436',
      '#29adff', '#83769c', '#ff77a8', '#ffccaa'
    ],
    description: '16-color mode',
    recommendedAlgorithm: 3,
    recommendedColors: 16
  },
  {
    id: 'sega-master',
    name: 'Sega Master System',
    colors: [
      '#000000', '#550000', '#00aa00', '#55aa00',
      '#000055', '#550055', '#00aa55', '#55aa55',
      '#0000aa', '#5500aa', '#00aaaa', '#55aaaa',
      '#0055aa', '#5555aa', '#00ffaa', '#55ffaa',
      '#0000ff', '#5500ff', '#00aaff', '#55aaff',
      '#0055ff', '#5555ff', '#00ffff', '#55ffff',
      '#aa0000', '#ff0000', '#aaaa00', '#ffaa00',
      '#aa0055', '#ff0055', '#aaaa55', '#ffaa55',
      '#aa00aa', '#ff00aa', '#aaaaaa', '#ffaaaa',
      '#aa00ff', '#ff00ff', '#aaaaff', '#ffaaff',
      '#aa5500', '#ff5500', '#aaff00', '#ffff00',
      '#aa5555', '#ff5555', '#aaff55', '#ffff55',
      '#aa55aa', '#ff55aa', '#aaffaa', '#ffffaa',
      '#aa55ff', '#ff55ff', '#aaffff', '#ffffff'
    ],
    description: '64-color palette',
    recommendedAlgorithm: 3,
    recommendedColors: 64
  },
  {
    id: 'sega-genesis',
    name: 'Sega Genesis',
    colors: [
      '#000000', '#002200', '#004400', '#006600',
      '#008800', '#00aa00', '#00cc00', '#00ee00',
      '#220000', '#222200', '#224400', '#226600',
      '#440000', '#442200', '#444400', '#446600'
    ],
    description: '512-color capable (16 shown)',
    recommendedAlgorithm: 3,
    recommendedColors: 16
  },

  // === MODERN FANTASY CONSOLES ===
  {
    id: 'pico8',
    name: 'PICO-8',
    colors: [
      '#000000', '#1d2b53', '#7e2553', '#008751',
      '#ab5236', '#5f574f', '#c2c3c7', '#fff1e8',
      '#ff004d', '#ffa300', '#ffec27', '#00e436',
      '#29adff', '#83769c', '#ff77a8', '#ffccaa'
    ],
    description: 'Fantasy console',
    recommendedAlgorithm: 22,
    recommendedColors: 16
  },
  {
    id: 'tic80',
    name: 'TIC-80',
    colors: [
      '#140c1c', '#442434', '#30346d', '#4e4a4e',
      '#854c30', '#346524', '#d04648', '#757161',
      '#597dce', '#d27d2c', '#8595a1', '#6daa2c',
      '#d2aa99', '#6dc2ca', '#dad45e', '#deeed6'
    ],
    description: 'Fantasy computer',
    recommendedAlgorithm: 22,
    recommendedColors: 16
  },

  // === ARTISTIC PALETTES ===
  {
    id: 'dawnbringer16',
    name: 'DawnBringer 16',
    colors: [
      '#140c1c', '#442434', '#30346d', '#4e4a4e',
      '#854c30', '#346524', '#d04648', '#757161',
      '#597dce', '#d27d2c', '#8595a1', '#6daa2c',
      '#d2aa99', '#6dc2ca', '#dad45e', '#deeed6'
    ],
    description: 'Popular pixel art',
    recommendedAlgorithm: 3,
    recommendedColors: 16
  },
  {
    id: 'dawnbringer32',
    name: 'DawnBringer 32',
    colors: [
      '#000000', '#222034', '#45283c', '#663931',
      '#8f563b', '#df7126', '#d9a066', '#eec39a',
      '#fbf236', '#99e550', '#6abe30', '#37946e',
      '#4b692f', '#524b24', '#323c39', '#3f3f74',
      '#306082', '#5b6ee1', '#639bff', '#5fcde4',
      '#cbdbfc', '#ffffff', '#9badb7', '#847e87',
      '#696a6a', '#595652', '#76428a', '#ac3232',
      '#d95763', '#d77bba', '#8f974a', '#8a6f30'
    ],
    description: 'Extended pixel art',
    recommendedAlgorithm: 3,
    recommendedColors: 32
  },
  {
    id: 'resurrect64',
    name: 'Resurrect 64',
    colors: [
      '#2e222f', '#3e3546', '#625565', '#966c6c',
      '#ab947a', '#694f62', '#7f708a', '#9babb2',
      '#c7dcd0', '#ffffff', '#6e2727', '#b33831',
      '#ea4f36', '#f57d4a', '#ae2334', '#e83b3b',
      '#fb6b1d', '#f79617', '#f9c22b', '#7a3045',
      '#9e4539', '#cd683d', '#e6904e', '#fbb954',
      '#4c3e24', '#676633', '#a2a947', '#d5e04b',
      '#fbff86', '#165a4c', '#239063', '#1ebc73',
      '#91db69', '#cddf6c', '#313638', '#374e4a',
      '#547e64', '#92a984', '#b2ba90', '#0b5e65',
      '#0b8a8f', '#0eaf9b', '#30e1b9', '#8ff8e2',
      '#323353', '#484a77', '#4d65b4', '#4d9be6',
      '#8fd3ff', '#45293f', '#6b3e75', '#905ea9',
      '#a884f3', '#eaaded', '#753c54', '#a24b6f',
      '#cf657f', '#ed8099', '#831c5d', '#c32454',
      '#f04f78', '#f68181', '#fca790', '#fdcbb0'
    ],
    description: 'Modern 64-color',
    recommendedAlgorithm: 3,
    recommendedColors: 64
  },

  // === MONOCHROME & SPECIAL ===
  {
    id: 'amber-mono',
    name: 'Amber Monitor',
    colors: ['#000000', '#ff8800', '#ffaa00', '#ffcc00'],
    description: 'Vintage amber CRT',
    recommendedAlgorithm: 22,
    recommendedColors: 4
  },
  {
    id: 'green-mono',
    name: 'Green Monitor',
    colors: ['#000000', '#00aa00', '#00cc00', '#00ff00'],
    description: 'Vintage green CRT',
    recommendedAlgorithm: 22,
    recommendedColors: 4
  },
  {
    id: 'blue-mono',
    name: 'Blue Monitor',
    colors: ['#000000', '#0066aa', '#0088cc', '#00aaff'],
    description: 'Vintage blue CRT',
    recommendedAlgorithm: 22,
    recommendedColors: 4
  },
  {
    id: 'paperback',
    name: 'Paperback',
    colors: ['#382b26', '#b8a890'],
    description: 'Old book print',
    recommendedAlgorithm: 3,
    recommendedColors: 2
  },
  {
    id: 'newspaper',
    name: 'Newspaper',
    colors: ['#1a1a1a', '#f5f5dc'],
    description: 'Classic newsprint',
    recommendedAlgorithm: 28, // Halftone 45°
    recommendedColors: 2
  },
  {
    id: 'blueprint',
    name: 'Blueprint',
    colors: ['#ffffff', '#1e3a5f'],
    description: 'Technical drawing',
    recommendedAlgorithm: 32, // Crosshatch
    recommendedColors: 2
  },
  {
    id: 'sepia',
    name: 'Sepia',
    colors: ['#704214', '#c4a35a', '#f0e68c', '#fffef0'],
    description: 'Vintage photo',
    recommendedAlgorithm: 3,
    recommendedColors: 4
  }
];

// Get palette by ID
export function getPaletteById(id: string): RetroPalette | undefined {
  return retroPalettes.find(p => p.id === id);
}

// Group palettes by category
export const paletteCategories = {
  'Handheld Gaming': ['gameboy', 'gameboy-pocket', 'gameboy-light', 'virtualboy'],
  'Classic Computers': ['cga-mode4-palette1', 'cga-mode4-palette2', 'cga-mode5', 'ega', 'macintosh', 'macintosh-system', 'commodore64', 'zxspectrum', 'amstrad-cpc'],
  'Console Gaming': ['nes', 'snes', 'sega-master', 'sega-genesis'],
  'Fantasy Consoles': ['pico8', 'tic80'],
  'Artistic': ['dawnbringer16', 'dawnbringer32', 'resurrect64'],
  'Monochrome': ['amber-mono', 'green-mono', 'blue-mono', 'paperback', 'newspaper', 'blueprint', 'sepia']
};
