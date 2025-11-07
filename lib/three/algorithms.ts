/**
 * Dithering Algorithms Configuration
 *
 * Contains algorithms from ditherer (https://github.com/gyng/ditherer)
 * Copyright 2017 Ng Guoyou, contributors
 * Licensed under MIT License
 */

export interface AlgorithmParameter {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  label: string;
  type?: 'slider' | 'discrete' | 'discrete_labeled';
  options?: number[] | Array<{ value: number; label: string }>;
}

export interface AlgorithmParams {
  [key: string]: AlgorithmParameter;
}

export interface Algorithm {
  id: string;
  name: string;
  category: string;
  shaderValue: number;
  params?: AlgorithmParams;
}

/**
 * Map of algorithm IDs to their shader index values
 */
export const algoMap: Record<string, number> = {
  none: 0,
  bayer2: 1,
  random: 2,
  floyd: 3,
  ostromoukhov: 51,
  atkinson: 4,
  jarvis: 5,
  stucki: 6,
  burkes: 7,
  sierra: 8,
  sierralite: 9,
  sierra2: 10,
  bittone: 11,
  checkerssmall: 12,
  checkersmedium: 13,
  checkerslarge: 14,
  radialburst: 15,
  vortex: 16,
  diamond: 17,
  wave: 18,
  noise: 19,
  gridlock: 20,
  mosaic: 21,
  bayer4: 22,
  bayer8: 23,
  bayer16: 24,
  pattern4x4: 39,
  dispersed: 25,
  cluster: 26,
  halftone: 27,
  halftone45: 28,
  ellipse: 29,
  dots: 30,
  lines: 31,
  crosshatch: 32,
  spiral: 33,
  blue: 34,
  perlin: 35,
  voronoi: 36,
  stipple: 37,
  fan: 38,
  voidcluster: 50,
  // New algorithms from ditherer repository (MIT Licensed)
  falsefloyd: 40,
  horizontalstripe: 41,
  verticalstripe: 42,
  bayer3: 43,
  disperseddot: 44,
  square5x5: 45,
  corner4x4: 46,
  blockvertical: 47,
  blockhorizontal: 48,
  hatch2x2: 49,
  hatch3x3: 50,
  hatch4x4: 51,
  alternate3x3: 52,
  pattern5x5: 53
};

/**
 * Algorithm parameters (mathematically accurate per algorithm)
 */
export const algorithmParams: Record<string, AlgorithmParams> = {
  // === ERROR DIFFUSION ALGORITHMS ===
  // These approximate error by distributing it to neighboring pixels
  // Diffusion controls error distribution strength (0 = none, 1 = standard, >1 = exaggerated)
  floyd: {
    diffusion: { value: 1.0, min: 0.1, max: 1.5, step: 0.05, label: 'Error Diffusion' }
  },
  ostromoukhov: {
    diffusion: { value: 1.0, min: 0.1, max: 2.0, step: 0.05, label: 'Diffusion Strength', type: 'slider' }
  },
  atkinson: {
    diffusion: { value: 0.75, min: 0.1, max: 1.2, step: 0.05, label: 'Error Diffusion' }
  },
  jarvis: {
    diffusion: { value: 1.0, min: 0.1, max: 1.5, step: 0.05, label: 'Error Diffusion' }
  },
  stucki: {
    diffusion: { value: 1.0, min: 0.1, max: 1.5, step: 0.05, label: 'Error Diffusion' }
  },
  burkes: {
    diffusion: { value: 1.0, min: 0.1, max: 1.5, step: 0.05, label: 'Error Diffusion' }
  },
  sierra: {
    diffusion: { value: 1.0, min: 0.1, max: 1.5, step: 0.05, label: 'Error Diffusion' }
  },
  sierralite: {
    diffusion: { value: 1.0, min: 0.1, max: 1.5, step: 0.05, label: 'Error Diffusion' }
  },
  sierra2: {
    diffusion: { value: 1.0, min: 0.1, max: 1.5, step: 0.05, label: 'Error Diffusion' }
  },
  fan: {
    diffusion: { value: 1.0, min: 0.1, max: 1.5, step: 0.05, label: 'Error Diffusion' }
  },

  // === ORDERED DITHERING (BAYER MATRICES) ===
  // Use fixed threshold matrices, only scale affects pattern size
  bayer2: {
    scale: { value: 1.0, options: [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0, 4.0], label: 'Pattern Scale', type: 'discrete' }
  },
  bayer4: {
    scale: { value: 1.0, options: [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0, 4.0], label: 'Pattern Scale', type: 'discrete' }
  },
  bayer8: {
    scale: { value: 1.0, options: [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0, 4.0], label: 'Pattern Scale', type: 'discrete' },
    sharpness: { value: 1.0, min: 0.5, max: 2.0, step: 0.1, label: 'Sharpness' }
  },
  bayer16: {
    scale: { value: 1.0, options: [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0, 4.0], label: 'Pattern Scale', type: 'discrete' },
    sharpness: { value: 1.0, min: 0.5, max: 2.0, step: 0.1, label: 'Sharpness' }
  },

  // === 4x4 PATTERN DITHERING (Shader-based) ===
  // Grid size: 1-8 optimal (4x4 matrix tiles), higher values pixelate more
  // Pixel ratio: 1-5 for visible effect without over-pixelation
  pattern4x4: {
    gridSize: { value: 4.0, min: 1, max: 8, step: 0.5, label: 'Grid Size' },
    pixelRatio: { value: 1.0, min: 1, max: 5, step: 0.5, label: 'Pixel Size' }
  },

  // === HALFTONE PATTERNS ===
  // Screen printing technique - creates dot patterns
  // Angle in radians: 0°=0, 45°=0.785, 90°=1.57, 180°=3.14
  halftone: {
    dotSize: { value: 4.0, options: [2, 3, 4, 5, 6, 8, 10, 12, 16, 20], label: 'Dot Size', type: 'discrete' },
    angle: {
      value: 0.785,
      options: [
        { value: 0.0, label: '0° (Horizontal/Vertical)' },
        { value: 0.262, label: '15° (Cyan Separation)' },
        { value: 0.524, label: '30°' },
        { value: 0.785, label: '45° (Newspaper Black)' },
        { value: 1.047, label: '60°' },
        { value: 1.309, label: '75° (Magenta Separation)' },
        { value: 1.571, label: '90° (Vertical Lines)' },
        { value: 3.142, label: '180°' }
      ],
      label: 'Screen Angle',
      type: 'discrete_labeled'
    },
    sharpness: { value: 1.0, min: 0.3, max: 2.0, step: 0.1, label: 'Sharpness' }
  },
  halftone45: {
    dotSize: { value: 4.0, options: [2, 3, 4, 5, 6, 8, 10, 12, 16, 20], label: 'Dot Size', type: 'discrete' },
    sharpness: { value: 1.0, min: 0.3, max: 2.0, step: 0.1, label: 'Sharpness' }
  },
  ellipse: {
    dotSize: { value: 4.0, options: [2, 3, 4, 5, 6, 8, 10, 12, 16, 20], label: 'Dot Size', type: 'discrete' },
    aspect: { value: 1.5, min: 1.0, max: 4.0, step: 0.1, label: 'Aspect Ratio' },
    angle: {
      value: 0.785,
      options: [
        { value: 0.0, label: '0° (Horizontal/Vertical)' },
        { value: 0.262, label: '15° (Cyan Separation)' },
        { value: 0.524, label: '30°' },
        { value: 0.785, label: '45° (Newspaper Black)' },
        { value: 1.047, label: '60°' },
        { value: 1.309, label: '75° (Magenta Separation)' },
        { value: 1.571, label: '90° (Vertical Lines)' },
        { value: 3.142, label: '180°' }
      ],
      label: 'Screen Angle',
      type: 'discrete_labeled'
    }
  },
  diamond: {
    size: { value: 6.0, min: 2, max: 20, step: 0.5, label: 'Diamond Size' },
    sharpness: { value: 1.0, min: 0.3, max: 2.0, step: 0.1, label: 'Sharpness' }
  },
  dispersed: {
    scale: { value: 1.0, options: [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0, 4.0], label: 'Pattern Scale', type: 'discrete' },
    density: { value: 0.7, min: 0.2, max: 1.0, step: 0.05, label: 'Dot Density' }
  },
  cluster: {
    scale: { value: 1.0, options: [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0, 4.0], label: 'Pattern Scale', type: 'discrete' },
    tightness: { value: 0.8, min: 0.2, max: 1.0, step: 0.05, label: 'Cluster Tightness' }
  },

  // === GEOMETRIC PATTERNS ===
  dots: {
    spacing: { value: 6.0, min: 2, max: 24, step: 0.5, label: 'Dot Spacing' },
    randomness: { value: 0.5, min: 0, max: 1, step: 0.05, label: 'Randomness' }
  },
  lines: {
    width: { value: 2.0, min: 0.5, max: 10, step: 0.5, label: 'Line Width' },
    angle: {
      value: 0.0,
      options: [
        { value: 0.0, label: '0° (Horizontal/Vertical)' },
        { value: 0.262, label: '15° (Cyan Separation)' },
        { value: 0.524, label: '30°' },
        { value: 0.785, label: '45° (Newspaper Black)' },
        { value: 1.047, label: '60°' },
        { value: 1.309, label: '75° (Magenta Separation)' },
        { value: 1.571, label: '90° (Vertical Lines)' },
        { value: 3.142, label: '180°' }
      ],
      label: 'Screen Angle',
      type: 'discrete_labeled'
    },
    spacing: { value: 4.0, min: 2, max: 20, step: 0.5, label: 'Line Spacing' }
  },
  crosshatch: {
    spacing: { value: 4.0, min: 2, max: 20, step: 0.5, label: 'Line Spacing' },
    angle: {
      value: 0.785,
      options: [
        { value: 0.0, label: '0° (Horizontal/Vertical)' },
        { value: 0.262, label: '15° (Cyan Separation)' },
        { value: 0.524, label: '30°' },
        { value: 0.785, label: '45° (Newspaper Black)' },
        { value: 1.047, label: '60°' },
        { value: 1.309, label: '75° (Magenta Separation)' },
        { value: 1.571, label: '90° (Vertical Lines)' },
        { value: 3.142, label: '180°' }
      ],
      label: 'Screen Angle',
      type: 'discrete_labeled'
    }
  },
  checkerssmall: {
    size: { value: 2.0, min: 1, max: 8, step: 0.5, label: 'Cell Size' }
  },
  checkersmedium: {
    size: { value: 4.0, min: 2, max: 12, step: 0.5, label: 'Cell Size' }
  },
  checkerslarge: {
    size: { value: 8.0, min: 4, max: 20, step: 0.5, label: 'Cell Size' }
  },

  // === NOISE-BASED PATTERNS ===
  random: {
    grain: { value: 0.5, min: 0, max: 1, step: 0.05, label: 'Grain Amount' },
    seed: { value: 0.0, min: 0, max: 100, step: 1, label: 'Random Seed' }
  },
  blue: {
    frequency: { value: 0.5, min: 0.1, max: 3.0, step: 0.1, label: 'Frequency' },
    amplitude: { value: 1.0, min: 0.2, max: 2.0, step: 0.1, label: 'Amplitude' }
  },
  perlin: {
    frequency: { value: 0.05, options: [0.01, 0.02, 0.03, 0.05, 0.07, 0.1, 0.15, 0.2, 0.3], label: 'Frequency', type: 'discrete' },
    octaves: { value: 3, min: 1, max: 8, step: 1, label: 'Octaves', type: 'discrete' }
  },
  noise: {
    intensity: { value: 0.5, min: 0.1, max: 1.0, step: 0.05, label: 'Intensity' },
    scale: { value: 1.0, options: [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0, 4.0], label: 'Noise Scale', type: 'discrete' }
  },

  // === ORGANIC/PROCEDURAL PATTERNS ===
  voronoi: {
    cells: { value: 8.0, min: 4, max: 48, step: 2, label: 'Cell Count' },
    randomness: { value: 0.8, min: 0, max: 1, step: 0.05, label: 'Randomness' }
  },
  stipple: {
    density: { value: 0.5, min: 0.05, max: 1.0, step: 0.05, label: 'Dot Density' },
    size: { value: 2.0, min: 0.5, max: 8.0, step: 0.5, label: 'Dot Size' }
  },

  // === ANIMATED/DYNAMIC PATTERNS ===
  spiral: {
    frequency: { value: 0.1, min: 0.02, max: 0.5, step: 0.02, label: 'Spiral Frequency' },
    twist: { value: 2.0, min: 0.5, max: 10.0, step: 0.5, label: 'Twist Amount' }
  },
  wave: {
    frequency: { value: 0.1, min: 0.02, max: 0.5, step: 0.02, label: 'Wave Frequency' },
    amplitude: { value: 1.0, min: 0.2, max: 3.0, step: 0.1, label: 'Wave Amplitude' }
  },
  radialburst: {
    rays: { value: 16, min: 3, max: 64, step: 1, label: 'Ray Count' },
    rotation: { value: 0.0, min: 0, max: 6.28, step: 0.1, label: 'Rotation (rad)' }
  },
  vortex: {
    strength: { value: 2.0, min: 0.1, max: 10.0, step: 0.1, label: 'Vortex Strength' },
    rotation: { value: 3.0, min: 0.1, max: 10.0, step: 0.5, label: 'Rotation Speed' }
  },

  // === ARTISTIC PATTERNS ===
  bittone: {
    bitDepth: { value: 2, min: 1, max: 8, step: 1, label: 'Bit Depth' },
    pattern: { value: 0.5, min: 0, max: 1, step: 0.05, label: 'Pattern Mix' }
  },
  gridlock: {
    gridSize: { value: 8.0, min: 2, max: 32, step: 2, label: 'Grid Size' },
    density: { value: 0.5, min: 0.1, max: 1.0, step: 0.05, label: 'Fill Density' }
  },
  mosaic: {
    tileSize: { value: 8.0, min: 2, max: 32, step: 2, label: 'Tile Size' },
    variation: { value: 0.5, min: 0, max: 1, step: 0.05, label: 'Color Variation' }
  },

  // === NO PARAMETERS ===
  none: {}
};

/**
 * Array of all algorithms with metadata
 */
export const algorithms: Algorithm[] = [
  { id: 'none', name: 'None', category: 'None', shaderValue: 0 },

  // ERROR DIFFUSION (Classic)
  { id: 'floyd', name: 'Floyd-Steinberg (7/16, 3/16, 5/16, 1/16)', category: 'Error Diffusion (Classic)', shaderValue: 3, params: algorithmParams.floyd },
  { id: 'ostromoukhov', name: 'Ostromoukhov (variable, blue-noise, SIGGRAPH 2001)', category: 'Error Diffusion (Classic)', shaderValue: 51, params: algorithmParams.ostromoukhov },
  { id: 'atkinson', name: 'Atkinson (1/8 × 6, Mac Classic)', category: 'Error Diffusion (Classic)', shaderValue: 4, params: algorithmParams.atkinson },
  { id: 'jarvis', name: 'Jarvis-Judice-Ninke (Bell Labs, 48 divisor)', category: 'Error Diffusion (Classic)', shaderValue: 5, params: algorithmParams.jarvis },
  { id: 'stucki', name: 'Stucki (42 divisor, sharp)', category: 'Error Diffusion (Classic)', shaderValue: 6, params: algorithmParams.stucki },
  { id: 'burkes', name: 'Burkes (32 divisor, fast)', category: 'Error Diffusion (Classic)', shaderValue: 7, params: algorithmParams.burkes },

  // ERROR DIFFUSION (Sierra Family)
  { id: 'sierra', name: 'Sierra (Full, 32 divisor)', category: 'Error Diffusion (Sierra Family)', shaderValue: 8, params: algorithmParams.sierra },
  { id: 'sierra2', name: 'Two-Row Sierra (16 divisor)', category: 'Error Diffusion (Sierra Family)', shaderValue: 10, params: algorithmParams.sierra2 },
  { id: 'sierralite', name: 'Sierra Lite (4 divisor, fastest)', category: 'Error Diffusion (Sierra Family)', shaderValue: 9, params: algorithmParams.sierralite },

  // ERROR DIFFUSION (Variants)
  { id: 'falsefloyd', name: 'False Floyd-Steinberg (3/8, 3/8, 2/8)', category: 'Error Diffusion (Variants)', shaderValue: 40 },
  { id: 'horizontalstripe', name: 'Horizontal Stripe (vertical diffusion)', category: 'Error Diffusion (Variants)', shaderValue: 41 },
  { id: 'verticalstripe', name: 'Vertical Stripe (horizontal diffusion)', category: 'Error Diffusion (Variants)', shaderValue: 42 },

  // ORDERED DITHERING (Bayer Matrix)
  { id: 'bayer2', name: 'Bayer 2×2 (4 levels)', category: 'Ordered Dithering (Bayer Matrix)', shaderValue: 1, params: algorithmParams.bayer2 },
  { id: 'bayer3', name: 'Bayer 3×3 (9 levels)', category: 'Ordered Dithering (Bayer Matrix)', shaderValue: 43 },
  { id: 'bayer4', name: 'Bayer 4×4 (16 levels, recommended)', category: 'Ordered Dithering (Bayer Matrix)', shaderValue: 22, params: algorithmParams.bayer4 },
  { id: 'bayer8', name: 'Bayer 8×8 (64 levels)', category: 'Ordered Dithering (Bayer Matrix)', shaderValue: 23, params: algorithmParams.bayer8 },
  { id: 'bayer16', name: 'Bayer 16×16 (256 levels)', category: 'Ordered Dithering (Bayer Matrix)', shaderValue: 24, params: algorithmParams.bayer16 },
  { id: 'pattern4x4', name: 'Pattern 4×4 (Shader-based)', category: 'Ordered Dithering (Bayer Matrix)', shaderValue: 39, params: algorithmParams.pattern4x4 },

  // ORDERED DITHERING (Special Patterns)
  { id: 'disperseddot', name: 'Dispersed Dot 3×3 (blue noise)', category: 'Ordered Dithering (Special Patterns)', shaderValue: 44 },
  { id: 'square5x5', name: 'Square 5×5 (digital halftone)', category: 'Ordered Dithering (Special Patterns)', shaderValue: 45 },
  { id: 'corner4x4', name: 'Corner 4×4 (diagonal)', category: 'Ordered Dithering (Special Patterns)', shaderValue: 46 },
  { id: 'blockvertical', name: 'Block Vertical 4×4', category: 'Ordered Dithering (Special Patterns)', shaderValue: 47 },
  { id: 'blockhorizontal', name: 'Block Horizontal 4×4', category: 'Ordered Dithering (Special Patterns)', shaderValue: 48 },
  { id: 'hatch2x2', name: 'Hatch 2×2 (line art)', category: 'Ordered Dithering (Special Patterns)', shaderValue: 49 },
  { id: 'hatch3x3', name: 'Hatch 3×3 (line art)', category: 'Ordered Dithering (Special Patterns)', shaderValue: 50 },
  { id: 'hatch4x4', name: 'Hatch 4×4 (line art)', category: 'Ordered Dithering (Special Patterns)', shaderValue: 51 },
  { id: 'alternate3x3', name: 'Alternate 3×3 (checkerboard)', category: 'Ordered Dithering (Special Patterns)', shaderValue: 52 },
  { id: 'pattern5x5', name: 'Pattern 5×5 (concentric)', category: 'Ordered Dithering (Special Patterns)', shaderValue: 53 },

  // HALFTONE SCREENING (Print)
  { id: 'halftone', name: 'Classic Halftone (0° angle)', category: 'Halftone Screening (Print)', shaderValue: 27, params: algorithmParams.halftone },
  { id: 'halftone45', name: 'Halftone 45° (newspaper black)', category: 'Halftone Screening (Print)', shaderValue: 28, params: algorithmParams.halftone45 },
  { id: 'ellipse', name: 'Ellipse Halftone (anisotropic)', category: 'Halftone Screening (Print)', shaderValue: 29, params: algorithmParams.ellipse },
  { id: 'diamond', name: 'Diamond Halftone', category: 'Halftone Screening (Print)', shaderValue: 17, params: algorithmParams.diamond },
  { id: 'dispersed', name: 'Dispersed Dots', category: 'Halftone Screening (Print)', shaderValue: 25, params: algorithmParams.dispersed },
  { id: 'cluster', name: 'Clustered Dots', category: 'Halftone Screening (Print)', shaderValue: 26, params: algorithmParams.cluster },

  // ARTISTIC PATTERNS
  { id: 'dots', name: 'Dot Pattern', category: 'Artistic Patterns', shaderValue: 30, params: algorithmParams.dots },
  { id: 'lines', name: 'Line Pattern', category: 'Artistic Patterns', shaderValue: 31, params: algorithmParams.lines },
  { id: 'crosshatch', name: 'Crosshatch', category: 'Artistic Patterns', shaderValue: 32, params: algorithmParams.crosshatch },
  { id: 'stipple', name: 'Stippling (random dots)', category: 'Artistic Patterns', shaderValue: 37, params: algorithmParams.stipple },
  { id: 'spiral', name: 'Spiral', category: 'Artistic Patterns', shaderValue: 33, params: algorithmParams.spiral },
  { id: 'voronoi', name: 'Voronoi (cellular)', category: 'Artistic Patterns', shaderValue: 36, params: algorithmParams.voronoi },

  // NOISE-BASED
  { id: 'random', name: 'Random Noise (white)', category: 'Noise-Based', shaderValue: 2, params: algorithmParams.random },
  { id: 'blue', name: 'Blue Noise (poisson disk)', category: 'Noise-Based', shaderValue: 34, params: algorithmParams.blue },
  { id: 'voidcluster', name: 'Void-and-Cluster (hybrid)', category: 'Noise-Based', shaderValue: 50 },
  { id: 'perlin', name: 'Perlin Noise (coherent)', category: 'Noise-Based', shaderValue: 35, params: algorithmParams.perlin },

  // GEOMETRIC EFFECTS
  { id: 'checkerssmall', name: 'Checkers Small (2px)', category: 'Geometric Effects', shaderValue: 12, params: algorithmParams.checkerssmall },
  { id: 'checkersmedium', name: 'Checkers Medium (4px)', category: 'Geometric Effects', shaderValue: 13, params: algorithmParams.checkersmedium },
  { id: 'checkerslarge', name: 'Checkers Large (8px)', category: 'Geometric Effects', shaderValue: 14, params: algorithmParams.checkerslarge },
  { id: 'wave', name: 'Wave Pattern (sine)', category: 'Geometric Effects', shaderValue: 18, params: algorithmParams.wave },
  { id: 'radialburst', name: 'Radial Burst', category: 'Geometric Effects', shaderValue: 15, params: algorithmParams.radialburst },
  { id: 'vortex', name: 'Vortex (twisted)', category: 'Geometric Effects', shaderValue: 16, params: algorithmParams.vortex },
  { id: 'mosaic', name: 'Mosaic (tiles)', category: 'Geometric Effects', shaderValue: 21, params: algorithmParams.mosaic },
  { id: 'gridlock', name: 'Gridlock Pattern', category: 'Geometric Effects', shaderValue: 20, params: algorithmParams.gridlock },

  // SPECIAL
  { id: 'bittone', name: 'Bit Tone (quantized)', category: 'Special', shaderValue: 11, params: algorithmParams.bittone },
  { id: 'fan', name: 'Fan Pattern', category: 'Special', shaderValue: 38, params: algorithmParams.fan }
];
