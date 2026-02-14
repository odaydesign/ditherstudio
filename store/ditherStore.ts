import { create } from 'zustand';

export interface DitherState {
  // File state
  currentFile: File | null;
  isVideo: boolean;
  isWebcam: boolean;
  videoDuration: number; // Duration of loaded video in seconds

  // Algorithm state
  currentAlgorithm: number;
  multiAlgoEnabled: boolean;
  secondAlgorithm: number;
  algoBlendMode: number;
  algoBlendAmount: number;

  // Algorithm parameters (dynamic based on selected algorithm)
  param1: number;
  param2: number;
  param3: number;
  param4: number;

  // Global settings
  threshold: number;
  contrast: number;
  brightness: number;
  colors: number;
  scale: number;
  midtones: number;
  highlights: number;
  lumThreshold: number;
  blur: number;
  pointSize: number;
  invert: boolean;
  grayscale: boolean;

  // Color mode
  colorMode: number; // 0: normal, 1: grayscale, 2: duotone, 3: tritone, 4: palette, 5: hue-palette
  duotoneDark: string;
  duotoneLight: string;
  tritoneShadow: string;
  tritoneMid: string;
  tritoneHighlight: string;
  selectedPalette: string;
  customPalette: string[];

  // Advanced dithering
  serpentine: boolean;
  gammaCorrect: boolean;
  ditherStrength: number;
  patternRandomization: number;
  temporalDither: boolean;
  temporalSpeed: number;
  colorSpace: number;
  adaptiveThreshold: boolean;
  adaptiveWindow: number;
  edgePreservation: number;
  bandingReduction: number;

  // Video/Animation settings
  frameBlending: boolean;
  frameBlendStrength: number;
  motionAdaptive: boolean;
  motionSensitivity: number;
  temporalStability: number;

  // Effects
  pixelation: number;
  crtEffect: number;
  pixelAspectRatio: number;
  vhsEffect: number;
  edgeGlow: number;
  emboss: number;

  // CRT Display Effects
  scanlines: number;
  phosphor: boolean;
  curvature: number;
  vignette: number;
  chromatic: number;
  bloom: number;

  // Palette mode
  paletteColors: string[];
  paletteSize: number;

  // Temporal coherence (video)
  temporalWeight: number;

  // Comparison mode
  comparisonMode: boolean;
  comparisonPosition: number;

  // Performance
  fps: number;

  //  // ASCII / Shape Effects
  asciiCellSize: number;
  asciiGap: number; // 0-1
  asciiBaseScale: number; // For scaling the texture/shape inside cell
  asciiIntensity: number; // 0-1
  asciiMode: number; // 0=Characters, 1=Shapes
  asciiShape: number; // 0=Circle, 1=Square, 2=X, 3=Cross, 4=Heart, etc.
  asciiBgColor: string;
  asciiFgColor: string;
  asciiUseColor: boolean; // true = use source color for FG
  asciiInvert: boolean;
  customShapeTexture: string | null; // Data URL for custom SVG/Image

  // Geometric Halftones (Efecto-style)
  halftoneShape: number; // 0=Circle, 1=Square, 2=Diamond, 3=Triangle, 4=Line
  halftoneRotation: number; // 0-360
  halftoneSpread: number; // 0-2 (Controls overlap)

  // Actions
  setFile: (file: File | null, isVideo: boolean) => void;
  setWebcam: (enabled: boolean) => void;
  setVideoDuration: (duration: number) => void;
  setAlgorithm: (algo: number) => void;
  setMultiAlgo: (enabled: boolean, algo2?: number, blendMode?: number, blendAmount?: number) => void;
  setParam: (paramNum: 1 | 2 | 3 | 4, value: number) => void;
  setGlobalSetting: (key: string, value: number | boolean | string) => void;
  setColorMode: (mode: number) => void;
  setAdvancedSetting: (key: string, value: number | boolean) => void;
  resetAll: () => void;
  setFps: (fps: number) => void;
  setCustomPaletteColor: (index: number, color: string) => void;
  setCustomPalette: (colors: string[]) => void;
  setComparisonMode: (enabled: boolean) => void;
  setComparisonPosition: (position: number) => void;

  setAsciiSetting: (key: string, value: number | string | boolean) => void;
  setHalftoneSetting: (key: string, value: number) => void;
  setCustomShape: (textureUrl: string | null) => void;
  surpriseMe: () => void;
}

const defaultState = {
  // File state
  currentFile: null,
  isVideo: false,
  isWebcam: false,
  videoDuration: 0,

  // Algorithm state
  currentAlgorithm: 1, // Floyd-Steinberg default
  multiAlgoEnabled: false,
  secondAlgorithm: 0,
  algoBlendMode: 0,
  algoBlendAmount: 0.5,

  // Algorithm parameters (Floyd-Steinberg defaults)
  param1: 1.0,  // Diffusion Strength
  param2: 0.3,  // Feedback
  param3: 0.3,  // Error Clamping
  param4: 1.0,

  // Global settings
  threshold: 0.5,
  contrast: 1.0,
  brightness: 0.0,
  colors: 2,
  scale: 1.0,
  midtones: 0.0,
  highlights: 0.0,
  lumThreshold: 1.0,
  blur: 0.0,
  pointSize: 4.0,
  invert: false,
  grayscale: false,

  // Color mode
  colorMode: 0,
  duotoneDark: '#000000',
  duotoneLight: '#ffffff',
  tritoneShadow: '#000000',
  tritoneMid: '#808080',
  tritoneHighlight: '#ffffff',
  selectedPalette: 'none',
  customPalette: Array(16).fill('#000000'),

  // Advanced dithering
  serpentine: false,
  gammaCorrect: false,
  ditherStrength: 1.0,
  patternRandomization: 0.0,
  temporalDither: false,
  temporalSpeed: 1.0,
  colorSpace: 0,
  adaptiveThreshold: false,
  adaptiveWindow: 3,
  edgePreservation: 0.0,
  bandingReduction: 0.0,

  // Video/Animation settings
  frameBlending: false,
  frameBlendStrength: 0.5,
  motionAdaptive: false,
  motionSensitivity: 0.5,
  temporalStability: 0.3,

  // Effects
  pixelation: 1.0,
  crtEffect: 0.0,
  pixelAspectRatio: 1.0,
  vhsEffect: 0.0,
  edgeGlow: 0.0,
  emboss: 0.0,

  // CRT Display Effects
  scanlines: 0.0,
  phosphor: false,
  curvature: 0.0,
  vignette: 0.0,
  chromatic: 0.0,
  bloom: 0.0,

  // Palette mode
  paletteColors: Array(16).fill('#000000'),
  paletteSize: 0,

  // Temporal coherence
  temporalWeight: 0.15,

  // Comparison mode
  comparisonMode: false,
  comparisonPosition: 0.5,

  // Performance
  fps: 60,

  // ASCII Defaults
  asciiCellSize: 10,
  asciiGap: 1.0,
  asciiBaseScale: 0.9,
  asciiIntensity: 1.0,
  asciiMode: 1, // Halftone
  asciiShape: 0, // Circle
  asciiBgColor: '#111111',
  asciiFgColor: '#ffffff',
  asciiUseColor: true,
  asciiInvert: false,
  customShapeTexture: null,

  // Geometric Halftones
  halftoneShape: 0, // Circle
  halftoneRotation: 0,
  halftoneSpread: 0.1,
};

export const useDitherStore = create<DitherState>((set) => ({
  ...defaultState,

  setFile: (file, isVideo) => set({ ...defaultState, currentFile: file, isVideo }),

  setWebcam: (enabled) => set({ isWebcam: enabled }),

  setVideoDuration: (duration) => set({ videoDuration: duration }),

  setAlgorithm: (algo) => set({ currentAlgorithm: algo }),

  setMultiAlgo: (enabled, algo2, blendMode, blendAmount) =>
    set((state) => ({
      multiAlgoEnabled: enabled,
      ...(algo2 !== undefined && { secondAlgorithm: algo2 }),
      ...(blendMode !== undefined && { algoBlendMode: blendMode }),
      ...(blendAmount !== undefined && { algoBlendAmount: blendAmount }),
    })),

  setParam: (paramNum, value) =>
    set({ [`param${paramNum}`]: value } as any),

  setGlobalSetting: (key, value) =>
    set({ [key]: value } as any),

  setColorMode: (mode) => set({ colorMode: mode }),

  setAdvancedSetting: (key, value) =>
    set({ [key]: value } as any),

  resetAll: () => set((state) => ({
    ...defaultState,
    currentFile: state.currentFile,
    isVideo: state.isVideo,
    videoDuration: state.videoDuration,
  })),

  setFps: (fps) => set({ fps }),

  setCustomPaletteColor: (index, color) =>
    set((state) => {
      const newPalette = [...state.customPalette];
      newPalette[index] = color;
      return { customPalette: newPalette };
    }),
  setCustomPalette: (colors) => set({ customPalette: colors }),

  setComparisonMode: (enabled) => set({ comparisonMode: enabled }),
  setComparisonPosition: (position) => set({ comparisonPosition: position }),

  setAsciiSetting: (key, value) => {
    set((state) => ({ ...state, [key]: value }));
  },

  setHalftoneSetting: (key, value) => {
    set((state) => ({ ...state, [key]: value }));
  },

  setCustomShape: (textureUrl) => {
    set((state) => ({ ...state, customShapeTexture: textureUrl }));
  },

  surpriseMe: () => {
    // Random helper functions
    const randomFloat = (min: number, max: number) => Math.random() * (max - min) + min;
    const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
    const randomBool = () => Math.random() > 0.5;
    const randomChoice = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
    const randomHexColor = () => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');

    // Algorithm shader values (excluding 'none' which is 0)
    const algorithmValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53];

    // Fun color palettes for duotone
    const funPalettes = [
      { dark: '#000000', light: '#00ff00' }, // Matrix green
      { dark: '#1a1a2e', light: '#edf2f4' }, // Dark blue/white
      { dark: '#2d00f7', light: '#f20089' }, // Cyberpunk
      { dark: '#ff006e', light: '#ffbe0b' }, // Hot pink/yellow
      { dark: '#3a0ca3', light: '#4cc9f0' }, // Purple/cyan
      { dark: '#000000', light: '#ff4500' }, // Black/orange
      { dark: '#1b4332', light: '#d8f3dc' }, // Forest green
      { dark: '#03071e', light: '#ffba08' }, // Dark/gold
      { dark: '#240046', light: '#e0aaff' }, // Deep purple/lavender
      { dark: '#10002b', light: '#c77dff' }, // Violet dreams
      { dark: '#582f0e', light: '#ede0d4' }, // Coffee
      { dark: '#003049', light: '#fcbf49' }, // Navy/mustard
      { dark: '#000000', light: '#ffffff' }, // Classic B&W
      { dark: '#2b2d42', light: '#ef233c' }, // Dark/red
      { dark: '#001219', light: '#94d2bd' }, // Teal vibes
    ];

    // Color modes: 0 = normal, 1 = grayscale, 2 = duotone
    const colorModes = [0, 1, 2];
    const selectedColorMode = randomChoice(colorModes);
    const selectedPalette = randomChoice(funPalettes);

    // Random CRT effects (occasionally apply for retro feel)
    const applyCRT = Math.random() > 0.7;

    set({
      // Random algorithm
      currentAlgorithm: randomChoice(algorithmValues),

      // Random params
      param1: randomFloat(0.5, 4.0),
      param2: randomFloat(0.5, 2.0),
      param3: randomFloat(0.5, 2.0),
      param4: randomFloat(0.5, 2.0),

      // Random global settings
      threshold: randomFloat(0.3, 0.7),
      contrast: randomFloat(0.8, 1.4),
      brightness: randomFloat(-0.15, 0.15),
      colors: randomChoice([2, 3, 4, 6, 8, 12, 16]),

      // Color mode
      colorMode: selectedColorMode,
      duotoneDark: selectedPalette.dark,
      duotoneLight: selectedPalette.light,

      // Random advanced settings
      serpentine: randomBool(),
      gammaCorrect: randomBool(),
      ditherStrength: randomFloat(0.6, 1.2),
      patternRandomization: randomFloat(0, 0.3),

      // Occasional CRT effects
      scanlines: applyCRT ? randomFloat(0.1, 0.4) : 0,
      phosphor: applyCRT && randomBool(),
      curvature: applyCRT ? randomFloat(0, 0.15) : 0,
      vignette: applyCRT ? randomFloat(0, 0.25) : 0,
      chromatic: applyCRT ? randomFloat(0, 0.3) : 0,
      bloom: applyCRT ? randomFloat(0, 0.3) : 0,

      // New Effects
      vhsEffect: applyCRT ? randomFloat(0, 0.2) : 0,
      edgeGlow: 0,
      emboss: 0,
    });
  },
}));
