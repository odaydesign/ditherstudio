import { create } from 'zustand';

export interface DitherState {
  // File state
  currentFile: File | null;
  isVideo: boolean;

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

  // Effects
  pixelation: number;
  crtEffect: number;
  pixelAspectRatio: number;

  // Temporal coherence (video)
  temporalWeight: number;

  // Performance
  fps: number;

  // Actions
  setFile: (file: File | null, isVideo: boolean) => void;
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
}

const defaultState = {
  // File state
  currentFile: null,
  isVideo: false,

  // Algorithm state
  currentAlgorithm: 22, // bayer4 default
  multiAlgoEnabled: false,
  secondAlgorithm: 0,
  algoBlendMode: 0,
  algoBlendAmount: 0.5,

  // Algorithm parameters
  param1: 4.0,
  param2: 1.0,
  param3: 1.0,
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

  // Effects
  pixelation: 1.0,
  crtEffect: 0.0,
  pixelAspectRatio: 1.0,

  // Temporal coherence
  temporalWeight: 0.15,

  // Performance
  fps: 60,
};

export const useDitherStore = create<DitherState>((set) => ({
  ...defaultState,

  setFile: (file, isVideo) => set({ currentFile: file, isVideo }),

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

  resetAll: () => set(defaultState),

  setFps: (fps) => set({ fps }),

  setCustomPaletteColor: (index, color) =>
    set((state) => {
      const newPalette = [...state.customPalette];
      newPalette[index] = color;
      return { customPalette: newPalette };
    }),
  setCustomPalette: (colors) => set({ customPalette: colors }),
}));
