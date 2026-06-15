import { create } from 'zustand';
import { extractPalette } from '@/lib/utils/colorExtractor';
import { WAVE_TYPE_PRESETS } from '@/lib/three/waveField';

// Saved-colour swatches persist across sessions via localStorage.
const SAVED_COLORS_KEY = 'ditherSavedColors';
const loadSavedColors = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const v = JSON.parse(localStorage.getItem(SAVED_COLORS_KEY) || '[]');
    return Array.isArray(v) ? v.slice(0, 30) : [];
  } catch {
    return [];
  }
};
const persistSavedColors = (colors: string[]) => {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(SAVED_COLORS_KEY, JSON.stringify(colors)); } catch { /* ignore */ }
};

export interface DitherState {
  // File state
  currentFile: File | null;
  isVideo: boolean;
  isWebcam: boolean;
  videoDuration: number; // Duration of loaded video in seconds
  isGenerative: boolean; // Procedural generative-background source
  is3D: boolean; // Real 3D scene source (rendered then dithered)
  object3DShape: number; // 0 torusKnot,1 torus,2 sphere,3 box,4 ico,5 cone,6 cylinder,7 dodeca
  object3DMaterial: number; // 0 lit,1 toon,2 normal,3 matcap,4 depth,5 wireframe
  object3DColor: string; // base colour (lit/toon/wireframe)
  object3DBg: string; // scene background colour
  object3DAutoRotate: boolean;
  object3DAutoSpeed: number;
  object3DRotateX: number; // radians offset
  object3DRotateY: number; // radians offset
  object3DDistance: number; // camera distance
  object3DFov: number; // camera field of view
  object3DLowRes: number; // 1 = off, 2-6 = PS1 low-res divisor
  object3DVertexSnap: number; // 0 = off, >0 PS1 vertex-snap grid strength

  // Wave Field source — flowing displaced terrain (rendered then dithered)
  isWaveField: boolean;
  waveType: number; // 0 waves, 1 wind, 2 water, 3 sun
  waveGlow: number; // crest emission strength
  waveScale: number; // spatial frequency of the field
  waveAmp: number; // height amplitude
  waveLineCount: number; // contour lines per world unit
  waveLineStrength: number; // 0..1 grain contrast
  waveSpeed: number; // phase speed (loop period = 2π/speed seconds)
  waveGradient: number; // blue→red gradient slope across width
  waveColorLow: string; // deep colour (left)
  waveColorMid: string; // crest highlight
  waveColorHigh: string; // accent colour (right)
  waveColorFog: string; // distance-fog / horizon colour
  waveBg: string; // scene background
  waveCamHeight: number; // camera height (grazing angle)
  waveCamDistance: number; // camera distance
  waveFov: number; // camera field of view

  // Glass source — fluted/ribbed glass refraction (Three.js)
  isGlass: boolean;
  glassRibs: number;       // ribs across
  glassRefract: number;    // rib lens curvature (refraction magnification)
  glassIOR: number;        // index of refraction
  glassReflect: number;    // reflection strength (fresnel)
  glassFrost: number;      // blur / roughness
  glassSheen: number;      // specular highlight
  glassDispersion: number; // RGB chromatic split
  glassWavy: number;       // bow the ribs
  glassAngle: number;      // 0 vertical, 1 horizontal
  glassSpeed: number;      // drift speed (loop = 2π/speed)
  glassColorA: string;     // subject glow colours
  glassColorB: string;
  glassColorC: string;
  glassBg: string;         // backdrop behind the glass
  glassBgImage: string | null; // uploaded image refracted behind the glass (data URL)
  glassBgW: number;        // image natural width  (for cover-fit aspect)
  glassBgH: number;        // image natural height

  // Saved colour swatches (persisted, reusable across all colour pickers)
  savedColors: string[];

  // Output canvas size (used by generative mode for presentation export)
  outputWidth: number;
  outputHeight: number;
  outputAspect: string; // '16:9' | '1:1' | '9:16' | '4:3' | 'custom'

  // Generative background config (independent of the dither palette)
  generativePattern: number; // 0 linear,1 radial,2 conic,3 mesh,4 flow,5 waves,6 cellular
  generativeColors: string[]; // 2..8 gradient stops (hex)
  generativeAngle: number; // degrees
  generativeScale: number;
  generativeWarp: number;
  generativeWarpFreq: number;
  generativeGrain: number;
  generativeContrast: number;
  generativeBlend: number; // 0 smooth .. 1 stepped
  generativeLineWeight: number; // geometric line thickness multiplier (default 1)
  generativeRenderStyle: number; // 0 fill,1 dots,2 flow lines,3 hatch,4 radial
  generativeStyleDensity: number; // dots/lines per unit
  generativeStyleAmount: number; // flow-line displacement
  generativeStyleInvert: boolean; // invert render-style ink
  generativeStyleCenterX: number; // radial centre x (uv)
  generativeStyleCenterY: number; // radial centre y (uv)
  generativeAnimate: boolean;
  generativeMotion: number; // 1 drift,2 pulse,3 hue-cycle,4 swirl
  generativeSpeed: number;
  generativeSeed: number;
  generativeGridCols: number; // grid quantization columns (0 = off)
  generativeGridRows: number; // grid quantization rows (0 = off)
  generativeSteps: number; // posterize the field into N bands (0 = off)
  generativeBPM: number; // strobe beats per minute
  // Symmetry & composition
  generativeMirror: number; // 0 none,1 X,2 Y,3 quad,4 kaleidoscope
  generativeKaleido: number; // kaleidoscope segments
  generativePolar: number; // coord warp: 0 none,1 polar,2 log-polar,3 twist
  generativeTileX: number; // repeat X (1 = off)
  generativeTileY: number; // repeat Y (1 = off)
  generativeVignette: number; // edge darkening 0..1
  generativeBorder: number; // inset frame width (0 = off)
  generativeBorderColor: string;
  // Text / logo overlay
  overlayEnabled: boolean;
  overlayText: string;
  overlayTextColor: string;
  overlaySize: number; // % of canvas height
  overlayX: number; // 0..1
  overlayY: number; // 0..1
  overlayLogo: string | null; // data URL
  overlayLogoScale: number; // fraction of canvas height

  // Image layer — composite an uploaded image WITH the generator pattern
  // (mask / blend) before the whole thing is dithered.
  generativeImageSrc: string | null; // data URL of the layer image
  generativeImageW: number;          // natural px width  (for cover/contain fit)
  generativeImageH: number;          // natural px height
  imageLayerMode: number;            // 0 off,1 alpha-over,2 luma-stencil,3 multiply,4 screen,5 overlay,6 add,7 crossfade
  imageLayerAmount: number;          // 0..1 strength / opacity
  imageLayerInvert: boolean;         // flip mask / alpha
  imageLayerFit: number;             // 0 cover, 1 contain, 2 stretch

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
  saturation: number;
  hueShift: number;
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
  sharpen: number;
  posterize: number;
  glitchIntensity: number;
  glitchSpeed: number;

  // Palette mode
  paletteColors: string[];
  paletteSize: number;

  // Temporal coherence (video)
  temporalWeight: number;

  // Comparison mode
  comparisonMode: boolean;
  comparisonPosition: number;
  gridMode: boolean; // NEW: 4-way comparison grid
  gridAlgorithms: number[]; // List of 4 algorithms for the grid

  // Performance
  fps: number;

  // ASCII / Shape Effects
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
  asciiCharacters: string; // glyph ramp for the Characters shape (first char = darkest)

  // Effect animation (animates the dither / ASCII on any source)
  fxAnimate: boolean;
  fxSpeed: number;
  fxMotion: number; // 1 drift, 2 zoom, 3 wobble, 4 shimmer

  // Analog signal effects (composite / VHS / CRT artifacts)
  analogWobble: number;
  analogBleed: number;
  analogStatic: number;
  analogHum: number;
  analogGhost: number;

  // Video export quality: false = H.264/4K (plays everywhere, colors chroma-aligned);
  // true = VP9/8K full-detail (exact colors at full res, but .mp4 only plays in VLC/Chrome).
  videoMaxDetail: boolean;
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
  setGlobalSetting: (key: string, value: number | boolean | string | any) => void;
  setColorMode: (mode: number) => void;
  setAdvancedSetting: (key: string, value: number | boolean) => void;
  resetAll: () => void;
  setFps: (fps: number) => void;
  setCustomPaletteColor: (index: number, color: string) => void;
  setCustomPalette: (colors: string[]) => void;
  setComparisonMode: (enabled: boolean) => void;
  setComparisonPosition: (position: number) => void;
  setGridMode: (enabled: boolean) => void;
  setGridAlgorithms: (algos: number[]) => void;

  setAsciiSetting: (key: string, value: number | string | boolean) => void;
  setHalftoneSetting: (key: string, value: number) => void;
  setCustomShape: (textureUrl: string | null) => void;
  surpriseMe: () => void;
  autoTheme: (canvas: HTMLCanvasElement) => void; // NEW: Intelligent palette extraction

  // Generative background actions
  setGenerativeEnabled: (enabled: boolean) => void;
  setThreeDEnabled: (enabled: boolean) => void;
  setWaveFieldEnabled: (enabled: boolean) => void;
  setWaveType: (type: number) => void;
  setGlassEnabled: (enabled: boolean) => void;
  addSavedColor: (hex: string) => void;
  removeSavedColor: (hex: string) => void;
  setGenerativeSetting: (key: string, value: number | boolean | string) => void;
  setGenerativeColors: (colors: string[]) => void;
  setGenerativeColor: (index: number, color: string) => void;
  setGenerativeImage: (src: string | null, width?: number, height?: number) => void;
  setOutputSize: (width: number, height: number, aspect?: string) => void;
  randomizeGenerative: () => void;
}

const defaultState = {
  // File state
  currentFile: null,
  isVideo: false,
  isWebcam: false,
  videoDuration: 0,
  isGenerative: false,
  is3D: false,
  object3DShape: 0,
  object3DMaterial: 0,
  object3DColor: '#e8e2d0',
  object3DBg: '#0a0a0a',
  object3DAutoRotate: true,
  object3DAutoSpeed: 1.0,
  object3DRotateX: 0.5,
  object3DRotateY: 0.0,
  object3DDistance: 3.4,
  object3DFov: 45,
  object3DLowRes: 1,
  object3DVertexSnap: 0,

  // Wave Field source
  isWaveField: false,
  waveType: 0,
  waveGlow: 0.18,
  waveScale: 0.15,
  waveAmp: 2.3,
  waveLineCount: 1.3,
  waveLineStrength: 0.42,
  waveSpeed: 0.45,
  waveGradient: 0.011,
  waveColorLow: '#1b46e0',
  waveColorMid: '#cfeeff',
  waveColorHigh: '#ff3b6b',
  waveColorFog: '#03141a',
  waveBg: '#04080c',
  waveCamHeight: 8,
  waveCamDistance: 36,
  waveFov: 42,

  isGlass: false,
  glassRibs: 22,
  glassRefract: 0.7,
  glassIOR: 1.45,
  glassReflect: 0.5,
  glassFrost: 0.45,
  glassSheen: 0.6,
  glassDispersion: 0.5,
  glassWavy: 0.0,
  glassAngle: 0,
  glassSpeed: 0.4,
  glassColorA: '#2f6bff',
  glassColorB: '#7a45ff',
  glassColorC: '#16348f',
  glassBg: '#05060c',
  glassBgImage: null,
  glassBgW: 0,
  glassBgH: 0,

  savedColors: loadSavedColors(),

  // Output canvas size
  outputWidth: 1920,
  outputHeight: 1080,
  outputAspect: '16:9',

  // Generative background config (defaults echo the green->cream reference)
  generativePattern: 3, // Mesh gradient
  generativeColors: ['#0a1f12', '#2f5d3a', '#8fae6b', '#d8c39a', '#f3e9da'],
  generativeAngle: 45,
  generativeScale: 1.0,
  generativeWarp: 0.25,
  generativeWarpFreq: 1.0,
  generativeGrain: 0.0,
  generativeContrast: 1.0,
  generativeBlend: 0.0,
  generativeLineWeight: 1.0,
  generativeRenderStyle: 0,
  generativeStyleDensity: 50,
  generativeStyleAmount: 1.0,
  generativeStyleInvert: false,
  generativeStyleCenterX: 0.5,
  generativeStyleCenterY: 0.5,
  generativeAnimate: false,
  generativeMotion: 1, // Drift
  generativeSpeed: 0.5,
  generativeSeed: 2.0,
  generativeGridCols: 0,
  generativeGridRows: 0,
  generativeSteps: 0,
  generativeBPM: 120,
  generativeMirror: 0,
  generativeKaleido: 6,
  generativePolar: 0,
  generativeTileX: 1,
  generativeTileY: 1,
  generativeVignette: 0,
  generativeBorder: 0,
  generativeBorderColor: '#000000',
  overlayEnabled: false,
  overlayText: '',
  overlayTextColor: '#ffffff',
  overlaySize: 8,
  overlayX: 0.5,
  overlayY: 0.5,
  overlayLogo: null,
  overlayLogoScale: 0.16,

  // Image layer
  generativeImageSrc: null,
  generativeImageW: 0,
  generativeImageH: 0,
  imageLayerMode: 1, // alpha-over (best for transparent logos; falls back to crossfade for JPGs)
  imageLayerAmount: 1,
  imageLayerInvert: false,
  imageLayerFit: 0, // cover

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
  saturation: 1.0,
  hueShift: 0.0,
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
  sharpen: 0.0,
  posterize: 0.0,
  glitchIntensity: 0.0,
  glitchSpeed: 1.0,

  // Palette mode
  paletteColors: Array(16).fill('#000000'),
  paletteSize: 0,

  // Temporal coherence
  temporalWeight: 0.15,

  // Comparison mode
  comparisonMode: false,
  comparisonPosition: 0.5,
  gridMode: false,
  gridAlgorithms: [1, 2, 3, 22], // Default grid: Floyd, Bayer, Atkinson, Blue Noise

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
  asciiCharacters: '@%#*+=-:. ',
  fxAnimate: false,
  fxSpeed: 0.5,
  fxMotion: 1,
  analogWobble: 0,
  analogBleed: 0,
  analogStatic: 0,
  analogHum: 0,
  analogGhost: 0,
  videoMaxDetail: false,
  customShapeTexture: null,

  // Geometric Halftones
  halftoneShape: 0, // Circle
  halftoneRotation: 0,
  halftoneSpread: 0.1,
};

export const useDitherStore = create<DitherState>((set) => ({
  ...defaultState,

  setFile: (file, isVideo) => set({ ...defaultState, currentFile: file, isVideo }),

  setWebcam: (enabled) => set(enabled ? { isWebcam: true, isGenerative: false, is3D: false, isWaveField: false, isGlass: false } : { isWebcam: false }),

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
    // Preserve the active source + generative config so RESET ALL only
    // resets dither/colour/fx params, not your generated background.
    isGenerative: state.isGenerative,
    is3D: state.is3D,
    object3DShape: state.object3DShape,
    object3DMaterial: state.object3DMaterial,
    object3DColor: state.object3DColor,
    object3DBg: state.object3DBg,
    object3DAutoRotate: state.object3DAutoRotate,
    object3DAutoSpeed: state.object3DAutoSpeed,
    object3DRotateX: state.object3DRotateX,
    object3DRotateY: state.object3DRotateY,
    object3DDistance: state.object3DDistance,
    object3DFov: state.object3DFov,
    object3DLowRes: state.object3DLowRes,
    object3DVertexSnap: state.object3DVertexSnap,
    isWaveField: state.isWaveField,
    waveType: state.waveType,
    waveGlow: state.waveGlow,
    waveScale: state.waveScale,
    waveAmp: state.waveAmp,
    waveLineCount: state.waveLineCount,
    waveLineStrength: state.waveLineStrength,
    waveSpeed: state.waveSpeed,
    waveGradient: state.waveGradient,
    waveColorLow: state.waveColorLow,
    waveColorMid: state.waveColorMid,
    waveColorHigh: state.waveColorHigh,
    waveColorFog: state.waveColorFog,
    waveBg: state.waveBg,
    waveCamHeight: state.waveCamHeight,
    waveCamDistance: state.waveCamDistance,
    waveFov: state.waveFov,
    isGlass: state.isGlass,
    glassRibs: state.glassRibs,
    glassRefract: state.glassRefract,
    glassIOR: state.glassIOR,
    glassReflect: state.glassReflect,
    glassFrost: state.glassFrost,
    glassSheen: state.glassSheen,
    glassDispersion: state.glassDispersion,
    glassWavy: state.glassWavy,
    glassAngle: state.glassAngle,
    glassSpeed: state.glassSpeed,
    glassColorA: state.glassColorA,
    glassColorB: state.glassColorB,
    glassColorC: state.glassColorC,
    glassBg: state.glassBg,
    glassBgImage: state.glassBgImage,
    glassBgW: state.glassBgW,
    glassBgH: state.glassBgH,
    savedColors: state.savedColors,
    outputWidth: state.outputWidth,
    outputHeight: state.outputHeight,
    outputAspect: state.outputAspect,
    generativePattern: state.generativePattern,
    generativeColors: state.generativeColors,
    generativeAngle: state.generativeAngle,
    generativeScale: state.generativeScale,
    generativeWarp: state.generativeWarp,
    generativeWarpFreq: state.generativeWarpFreq,
    generativeGrain: state.generativeGrain,
    generativeContrast: state.generativeContrast,
    generativeBlend: state.generativeBlend,
    generativeLineWeight: state.generativeLineWeight,
    generativeRenderStyle: state.generativeRenderStyle,
    generativeStyleDensity: state.generativeStyleDensity,
    generativeStyleAmount: state.generativeStyleAmount,
    generativeStyleInvert: state.generativeStyleInvert,
    generativeStyleCenterX: state.generativeStyleCenterX,
    generativeStyleCenterY: state.generativeStyleCenterY,
    generativeAnimate: state.generativeAnimate,
    generativeMotion: state.generativeMotion,
    generativeSpeed: state.generativeSpeed,
    generativeSeed: state.generativeSeed,
    generativeGridCols: state.generativeGridCols,
    generativeGridRows: state.generativeGridRows,
    generativeSteps: state.generativeSteps,
    generativeBPM: state.generativeBPM,
    generativeMirror: state.generativeMirror,
    generativeKaleido: state.generativeKaleido,
    generativePolar: state.generativePolar,
    generativeTileX: state.generativeTileX,
    generativeTileY: state.generativeTileY,
    generativeVignette: state.generativeVignette,
    generativeBorder: state.generativeBorder,
    generativeBorderColor: state.generativeBorderColor,
    overlayEnabled: state.overlayEnabled,
    overlayText: state.overlayText,
    overlayTextColor: state.overlayTextColor,
    overlaySize: state.overlaySize,
    overlayX: state.overlayX,
    overlayY: state.overlayY,
    overlayLogo: state.overlayLogo,
    overlayLogoScale: state.overlayLogoScale,
    // Image layer is part of the generated composition — keep it through RESET ALL.
    generativeImageSrc: state.generativeImageSrc,
    generativeImageW: state.generativeImageW,
    generativeImageH: state.generativeImageH,
    imageLayerMode: state.imageLayerMode,
    imageLayerAmount: state.imageLayerAmount,
    imageLayerInvert: state.imageLayerInvert,
    imageLayerFit: state.imageLayerFit,
  })),

  setFps: (fps) => set({ fps }),

  setCustomPaletteColor: (index, color) =>
    set((state) => {
      const newPalette = [...state.customPalette];
      newPalette[index] = color;
      return { customPalette: newPalette };
    }),
  setCustomPalette: (colors) => set({ customPalette: colors }),

  // ---- Generative background ----
  setGenerativeEnabled: (enabled) =>
    set(enabled
      // Tasteful baseline so a bare GENERATE looks good: full colour (not the
      // app's B&W duotone) with enough levels to keep the gradient smooth.
      // Presets can still override colour mode / levels.
      ? { isGenerative: true, is3D: false, isWaveField: false, isGlass: false, currentFile: null, isVideo: false, isWebcam: false, colorMode: 0, colors: 6 }
      : { isGenerative: false }),

  setThreeDEnabled: (enabled) =>
    set(enabled
      ? { is3D: true, isGenerative: false, isWaveField: false, isGlass: false, currentFile: null, isVideo: false, isWebcam: false, colorMode: 0, colors: 6 }
      : { is3D: false }),

  setWaveFieldEnabled: (enabled) =>
    set(enabled
      ? { isWaveField: true, is3D: false, isGenerative: false, isGlass: false, currentFile: null, isVideo: false, isWebcam: false, colorMode: 0, colors: 6 }
      : { isWaveField: false }),

  setGlassEnabled: (enabled) =>
    set(enabled
      ? { isGlass: true, isWaveField: false, is3D: false, isGenerative: false, currentFile: null, isVideo: false, isWebcam: false, colorMode: 0, colors: 6 }
      : { isGlass: false }),

  addSavedColor: (hex) => set((state) => {
    const c = hex.toLowerCase();
    if (state.savedColors.includes(c)) return {};
    const next = [c, ...state.savedColors].slice(0, 30);
    persistSavedColors(next);
    return { savedColors: next };
  }),
  removeSavedColor: (hex) => set((state) => {
    const next = state.savedColors.filter((c) => c !== hex.toLowerCase());
    persistSavedColors(next);
    return { savedColors: next };
  }),

  // Apply a flow-field theme preset (waves / wind / water / sun)
  setWaveType: (type) => set(() => {
    const preset = WAVE_TYPE_PRESETS[type] ?? WAVE_TYPE_PRESETS[0];
    const { label: _label, ...fields } = preset;
    void _label;
    return fields;
  }),

  setGenerativeSetting: (key, value) => set({ [key]: value } as any),

  setGenerativeColors: (colors) => set({ generativeColors: colors }),

  setGenerativeColor: (index, color) =>
    set((state) => {
      const next = [...state.generativeColors];
      next[index] = color;
      return { generativeColors: next };
    }),

  setGenerativeImage: (src, width = 0, height = 0) =>
    set({ generativeImageSrc: src, generativeImageW: width, generativeImageH: height }),

  setOutputSize: (width, height, aspect) =>
    set({
      outputWidth: Math.max(16, Math.round(width)),
      outputHeight: Math.max(16, Math.round(height)),
      ...(aspect ? { outputAspect: aspect } : {}),
    }),

  randomizeGenerative: () => {
    const rf = (min: number, max: number) => Math.random() * (max - min) + min;
    const ri = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
    const rhex = () => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    const count = ri(3, 6);
    const colors = Array.from({ length: count }, () => rhex());
    set({
      generativePattern: ri(0, 39),
      generativeColors: colors,
      generativeAngle: rf(0, 360),
      generativeScale: rf(0.5, 2.5),
      generativeWarp: rf(0, 0.6),
      generativeWarpFreq: rf(0.5, 2.0),
      generativeContrast: rf(0.85, 1.6),
      generativeBlend: Math.random() > 0.7 ? rf(0.3, 1.0) : 0,
      generativeMotion: ri(1, 4),
      generativeSeed: rf(0, 10),
    });
  },

  setComparisonMode: (enabled) => set({ comparisonMode: enabled }),
  setComparisonPosition: (position) => set({ comparisonPosition: position }),
  setGridMode: (enabled) => set({ gridMode: enabled }),
  setGridAlgorithms: (algos) => set({ gridAlgorithms: algos }),

  setAsciiSetting: (key, value) => {
    set((state: any) => ({ ...state, [key]: value }));
  },

  setHalftoneSetting: (key, value) => {
    set((state: any) => ({ ...state, [key]: value }));
  },

  setCustomShape: (textureUrl) => {
    set((state) => ({ ...state, customShapeTexture: textureUrl }));
  },

  autoTheme: (canvas) => {
    const palette = extractPalette(canvas, 8);
    if (palette.length > 0) {
      set({ 
        customPalette: palette,
        colorMode: 4, // Palette mode
        paletteSize: palette.length,
        duotoneDark: palette[0],
        duotoneLight: palette[palette.length - 1]
      });
    }
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
