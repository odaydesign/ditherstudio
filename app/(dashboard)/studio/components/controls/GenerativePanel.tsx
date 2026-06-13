'use client';

import { useEffect, useRef, useState } from 'react';
import { useDitherStore } from '@/store/ditherStore';
import { extractPalette } from '@/lib/utils/colorExtractor';
import { Collapsible } from './Collapsible';

const PATTERNS = [
  { value: 0, label: 'Linear Gradient' },
  { value: 1, label: 'Radial Gradient' },
  { value: 2, label: 'Conic Gradient' },
  { value: 3, label: 'Mesh Gradient' },
  { value: 4, label: 'Flow Noise' },
  { value: 5, label: 'Waves / Bands' },
  { value: 6, label: 'Cellular' },
  { value: 7, label: 'Spectrum (2-axis)' },
  { value: 8, label: 'Tunnel (concentric)' },
  { value: 9, label: 'Plasma' },
  { value: 10, label: 'Contour Lines' },
  { value: 11, label: 'Moiré' },
  { value: 12, label: 'Truchet Tiles' },
  { value: 13, label: 'Voronoi Shards' },
  { value: 14, label: 'Spiral' },
  { value: 15, label: 'Grid / Graph Paper' },
  { value: 16, label: 'Isometric Grid' },
  { value: 17, label: 'Hex Grid' },
  { value: 18, label: 'Concentric Polygons' },
  { value: 19, label: 'Circuit Board' },
  { value: 20, label: 'Perspective Grid' },
  { value: 21, label: 'Crosshatch' },
  { value: 22, label: 'Quasicrystal' },
  { value: 23, label: 'Kaleidoscope IFS' },
  { value: 24, label: 'Julia Fractal' },
  { value: 25, label: 'Metaballs' },
  { value: 26, label: 'Marble / Veins' },
  { value: 27, label: 'Caustics' },
  { value: 28, label: 'Starfield' },
  { value: 29, label: 'Lissajous' },
  { value: 30, label: 'Op-Art Rings' },
  { value: 31, label: 'Gyroid (3D)' },
  { value: 32, label: 'Corridor (3D)' },
  { value: 33, label: 'Mandelbulb (3D)' },
  { value: 34, label: 'Triangle Grid' },
  { value: 35, label: 'Nested Squares' },
  { value: 36, label: 'Flower of Life' },
  { value: 37, label: 'Chevron' },
  { value: 38, label: 'Argyle' },
  { value: 39, label: 'Maze' },
];

const MOTIONS = [
  { value: 1, label: 'Drift' },
  { value: 2, label: 'Pulse' },
  { value: 3, label: 'Hue Cycle' },
  { value: 4, label: 'Swirl' },
  { value: 5, label: 'Zoom' },
  { value: 6, label: 'Strobe (BPM)' },
];

const MIRRORS = [
  { value: 0, label: 'None' },
  { value: 1, label: 'Mirror X' },
  { value: 2, label: 'Mirror Y' },
  { value: 3, label: 'Quad (X+Y)' },
  { value: 4, label: 'Kaleidoscope' },
];

const ASPECTS = [
  { id: '16:9', label: '16:9 · 1920×1080', w: 1920, h: 1080 },
  { id: '1:1', label: '1:1 · 1080×1080', w: 1080, h: 1080 },
  { id: '9:16', label: '9:16 · 1080×1920', w: 1080, h: 1920 },
  { id: '4:3', label: '4:3 · 1440×1080', w: 1440, h: 1080 },
  { id: '4k', label: '4K · 3840×2160', w: 3840, h: 2160 },
  { id: 'ultrawide', label: 'Ultrawide · 3440×1440', w: 3440, h: 1440 },
  { id: 'led', label: 'LED Wall · 3840×1080', w: 3840, h: 1080 },
  { id: 'stage', label: 'Stage · 5760×1080', w: 5760, h: 1080 },
  { id: 'custom', label: 'Custom', w: 0, h: 0 },
];

const BRAND_PALETTES: { name: string; colors: string[] }[] = [
  { name: 'Web3', colors: ['#241663', '#4a35a0', '#7b63cf', '#b3a1ea', '#e8defb'] },
  { name: 'Hotcoin', colors: ['#0a1f12', '#2f5d3a', '#8fae6b', '#d8c39a', '#f3e9da'] },
  { name: 'Neon', colors: ['#05010f', '#ff006e', '#fb5607', '#ffbe0b', '#8338ec'] },
  { name: 'Pastel', colors: ['#fbe7c6', '#b6e2d3', '#fad2e1', '#c5dedd', '#dbe7e4'] },
  { name: 'Mono', colors: ['#0a0a0a', '#3a3a3a', '#7a7a7a', '#bdbdbd', '#f2f2f2'] },
  { name: 'Earth', colors: ['#2d1b0e', '#6b4226', '#a9744f', '#cda983', '#ece0c8'] },
  { name: 'Ocean', colors: ['#03045e', '#0077b6', '#00b4d8', '#90e0ef', '#caf0f8'] },
  { name: 'Sunset', colors: ['#1a0a2e', '#7b2d6b', '#c84c5c', '#f08a4b', '#ffd9a0'] },
];

// Keys that make up a saved generator look (colours stored separately)
const GEN_PRESET_KEYS = [
  'generativePattern', 'generativeAngle', 'generativeScale', 'generativeWarp', 'generativeWarpFreq',
  'generativeGrain', 'generativeContrast', 'generativeBlend', 'generativeLineWeight',
  'generativeRenderStyle', 'generativeStyleDensity', 'generativeStyleAmount',
  'generativeStyleInvert', 'generativeStyleCenterX', 'generativeStyleCenterY', 'generativeAnimate', 'generativeMotion',
  'generativeSpeed', 'generativeSeed', 'generativeGridCols', 'generativeGridRows', 'generativeSteps',
  'generativeBPM', 'generativeMirror', 'generativeKaleido', 'generativePolar', 'generativeTileX', 'generativeTileY',
  'generativeVignette', 'generativeBorder', 'generativeBorderColor',
];
const USER_PRESET_STORAGE = 'dither.genPresets.v1';
type GenPreset = { name: string; colors: string[]; config: Record<string, number | boolean | string> };

// Generator quick-presets (set generative config + matching dither settings)
const GEN_PRESETS: { name: string; apply: () => void }[] = [
  {
    name: 'Hotcoin',
    apply: () => {
      const s = useDitherStore.getState();
      s.setGenerativeColors(['#b9d49a', '#86ab63', '#a98f5a', '#cf8a6e', '#e7c3ab', '#f4ece1']);
      s.setGenerativeSetting('generativePattern', 7);
      s.setGenerativeSetting('generativeAngle', 0);
      s.setGenerativeSetting('generativeScale', 1.0);
      s.setGenerativeSetting('generativeWarp', 0);
      s.setGenerativeSetting('generativeContrast', 1.35);
      s.setGenerativeSetting('generativeGridCols', 8);
      s.setGenerativeSetting('generativeGridRows', 40);
      s.setGenerativeSetting('generativeSteps', 0);
      s.setGenerativeSetting('generativeMirror', 0);
      s.setGenerativeSetting('generativeAnimate', false);
      s.setColorMode(0);
      s.setGlobalSetting('colors', 16);
      s.setAlgorithm(1);
      s.setGlobalSetting('ditherStrength', 0.35);
      s.setGlobalSetting('scale', 1);
    },
  },
  {
    name: 'Aurora',
    apply: () => {
      const s = useDitherStore.getState();
      s.setGenerativeColors(['#04111a', '#0b3d4f', '#1f8a70', '#7fd1ae', '#e8f3c9']);
      s.setGenerativeSetting('generativeGridCols', 0);
      s.setGenerativeSetting('generativeGridRows', 0);
      s.setGenerativeSetting('generativeSteps', 0);
      s.setGenerativeSetting('generativeMirror', 0);
      s.setGenerativeSetting('generativePattern', 3);
      s.setGenerativeSetting('generativeScale', 1.4);
      s.setGenerativeSetting('generativeWarp', 0.35);
      s.setGenerativeSetting('generativeContrast', 1.1);
      s.setGenerativeSetting('generativeAnimate', true);
      s.setGenerativeSetting('generativeMotion', 1);
      s.setGenerativeSetting('generativeSpeed', 0.4);
      s.setAlgorithm(1);
      s.setGlobalSetting('scale', 3);
      s.setColorMode(0);
      s.setGlobalSetting('colors', 8);
    },
  },
  {
    name: 'Sunset',
    apply: () => {
      const s = useDitherStore.getState();
      s.setGenerativeColors(['#1a0a2e', '#7b2d6b', '#c84c5c', '#f08a4b', '#ffd9a0']);
      s.setGenerativeSetting('generativeGridCols', 0);
      s.setGenerativeSetting('generativeGridRows', 0);
      s.setGenerativeSetting('generativeSteps', 0);
      s.setGenerativeSetting('generativeMirror', 0);
      s.setGenerativeSetting('generativePattern', 0);
      s.setGenerativeSetting('generativeAngle', 90);
      s.setGenerativeSetting('generativeScale', 1.0);
      s.setGenerativeSetting('generativeWarp', 0.18);
      s.setGenerativeSetting('generativeContrast', 1.15);
      s.setGenerativeSetting('generativeAnimate', false);
      s.setAlgorithm(3);
      s.setGlobalSetting('scale', 5);
      s.setColorMode(0);
      s.setGlobalSetting('colors', 6);
    },
  },
  {
    name: 'Nebula',
    apply: () => {
      const s = useDitherStore.getState();
      s.setGenerativeColors(['#05010f', '#2a1a6e', '#6f3fd4', '#c86bd6', '#ffe1f2']);
      s.setGenerativeSetting('generativeGridCols', 0);
      s.setGenerativeSetting('generativeGridRows', 0);
      s.setGenerativeSetting('generativeSteps', 0);
      s.setGenerativeSetting('generativeMirror', 0);
      s.setGenerativeSetting('generativePattern', 4);
      s.setGenerativeSetting('generativeScale', 1.6);
      s.setGenerativeSetting('generativeWarp', 0.5);
      s.setGenerativeSetting('generativeWarpFreq', 1.4);
      s.setGenerativeSetting('generativeContrast', 1.2);
      s.setGenerativeSetting('generativeAnimate', true);
      s.setGenerativeSetting('generativeMotion', 1);
      s.setGenerativeSetting('generativeSpeed', 0.25);
      s.setAlgorithm(2);
      s.setGlobalSetting('scale', 2);
      s.setColorMode(0);
      s.setGlobalSetting('colors', 10);
    },
  },
  {
    name: 'Tunnel',
    apply: () => {
      const s = useDitherStore.getState();
      s.setGenerativeColors(['#241663', '#4a35a0', '#7b63cf', '#b3a1ea', '#d8cdf5']);
      s.setGenerativeSetting('generativePattern', 8);
      s.setGenerativeSetting('generativeScale', 1.0);
      s.setGenerativeSetting('generativeWarp', 0);
      s.setGenerativeSetting('generativeContrast', 1.0);
      s.setGenerativeSetting('generativeBlend', 0);
      s.setGenerativeSetting('generativeSteps', 11);
      s.setGenerativeSetting('generativeGridCols', 0);
      s.setGenerativeSetting('generativeGridRows', 0);
      s.setGenerativeSetting('generativeMirror', 0);
      s.setGenerativeSetting('generativeAnimate', false);
      s.setColorMode(0);
      s.setGlobalSetting('colors', 16);
      s.setAlgorithm(1);
      s.setGlobalSetting('ditherStrength', 0.15);
      s.setGlobalSetting('scale', 1);
    },
  },
  {
    name: 'Kaleido',
    apply: () => {
      const s = useDitherStore.getState();
      s.setGenerativeColors(['#05010f', '#3a0ca3', '#f72585', '#4cc9f0', '#ffe3a3']);
      s.setGenerativeSetting('generativePattern', 4);
      s.setGenerativeSetting('generativeScale', 1.2);
      s.setGenerativeSetting('generativeWarp', 0.3);
      s.setGenerativeSetting('generativeContrast', 1.2);
      s.setGenerativeSetting('generativeMirror', 4);
      s.setGenerativeSetting('generativeKaleido', 8);
      s.setGenerativeSetting('generativeGridCols', 0);
      s.setGenerativeSetting('generativeGridRows', 0);
      s.setGenerativeSetting('generativeSteps', 0);
      s.setGenerativeSetting('generativeAnimate', true);
      s.setGenerativeSetting('generativeMotion', 4);
      s.setGenerativeSetting('generativeSpeed', 0.3);
      s.setColorMode(0);
      s.setGlobalSetting('colors', 12);
      s.setAlgorithm(1);
      s.setGlobalSetting('scale', 2);
    },
  },
  {
    name: 'Blueprint',
    apply: () => {
      const s = useDitherStore.getState();
      s.setGenerativeColors(['#0b2a6b', '#bcd4ff']); // bg -> line
      s.setGenerativeSetting('generativePattern', 15); // grid
      s.setGenerativeSetting('generativeScale', 1.2);
      s.setGenerativeSetting('generativeWarp', 0);
      s.setGenerativeSetting('generativeContrast', 1.0);
      s.setGenerativeSetting('generativeMirror', 0);
      s.setGenerativeSetting('generativeGridCols', 0);
      s.setGenerativeSetting('generativeGridRows', 0);
      s.setGenerativeSetting('generativeSteps', 0);
      s.setGenerativeSetting('generativeAnimate', false);
      s.setColorMode(0);
      s.setGlobalSetting('colors', 16);
      s.setAlgorithm(1);
      s.setGlobalSetting('ditherStrength', 0.15);
      s.setGlobalSetting('scale', 1);
    },
  },
  {
    name: 'Wireframe',
    apply: () => {
      const s = useDitherStore.getState();
      s.setGenerativeColors(['#05060a', '#39ff9a']); // black -> neon green
      s.setGenerativeSetting('generativePattern', 20); // perspective grid
      s.setGenerativeSetting('generativeScale', 1.0);
      s.setGenerativeSetting('generativeWarp', 0);
      s.setGenerativeSetting('generativeContrast', 1.0);
      s.setGenerativeSetting('generativeMirror', 0);
      s.setGenerativeSetting('generativeGridCols', 0);
      s.setGenerativeSetting('generativeGridRows', 0);
      s.setGenerativeSetting('generativeSteps', 0);
      s.setGenerativeSetting('generativeAnimate', true);
      s.setGenerativeSetting('generativeMotion', 5); // zoom
      s.setGenerativeSetting('generativeSpeed', 0.4);
      s.setColorMode(0);
      s.setGlobalSetting('colors', 16);
      s.setAlgorithm(1);
      s.setGlobalSetting('ditherStrength', 0.1);
      s.setGlobalSetting('scale', 1);
    },
  },
  {
    name: 'Circuit',
    apply: () => {
      const s = useDitherStore.getState();
      s.setGenerativeColors(['#03130b', '#37e0a0']);
      s.setGenerativeSetting('generativePattern', 19); // circuit traces
      s.setGenerativeSetting('generativeScale', 1.3);
      s.setGenerativeSetting('generativeWarp', 0);
      s.setGenerativeSetting('generativeContrast', 1.0);
      s.setGenerativeSetting('generativeMirror', 0);
      s.setGenerativeSetting('generativeGridCols', 0);
      s.setGenerativeSetting('generativeGridRows', 0);
      s.setGenerativeSetting('generativeSteps', 0);
      s.setGenerativeSetting('generativeAnimate', false);
      s.setColorMode(0);
      s.setGlobalSetting('colors', 16);
      s.setAlgorithm(1);
      s.setGlobalSetting('ditherStrength', 0.12);
      s.setGlobalSetting('scale', 1);
    },
  },
  {
    name: 'Isometric',
    apply: () => {
      const s = useDitherStore.getState();
      s.setGenerativeColors(['#12101c', '#f5c451']);
      s.setGenerativeSetting('generativePattern', 16); // isometric grid
      s.setGenerativeSetting('generativeScale', 1.0);
      s.setGenerativeSetting('generativeWarp', 0);
      s.setGenerativeSetting('generativeContrast', 1.0);
      s.setGenerativeSetting('generativeMirror', 0);
      s.setGenerativeSetting('generativeGridCols', 0);
      s.setGenerativeSetting('generativeGridRows', 0);
      s.setGenerativeSetting('generativeSteps', 0);
      s.setGenerativeSetting('generativeAnimate', false);
      s.setColorMode(0);
      s.setGlobalSetting('colors', 16);
      s.setAlgorithm(1);
      s.setGlobalSetting('ditherStrength', 0.12);
      s.setGlobalSetting('scale', 1);
    },
  },
  {
    name: 'Quasicrystal',
    apply: () => {
      const s = useDitherStore.getState();
      s.setGenerativeColors(['#0c0a1f', '#3b2f8f', '#6f6bd1', '#b9c0f2', '#f2f4ff']);
      s.setGenerativeSetting('generativePattern', 22);
      s.setGenerativeSetting('generativeScale', 1.0);
      s.setGenerativeSetting('generativeWarp', 0);
      s.setGenerativeSetting('generativeContrast', 1.2);
      s.setGenerativeSetting('generativeGridCols', 0);
      s.setGenerativeSetting('generativeGridRows', 0);
      s.setGenerativeSetting('generativeSteps', 0);
      s.setGenerativeSetting('generativeMirror', 0);
      s.setGenerativeSetting('generativeAnimate', true);
      s.setGenerativeSetting('generativeMotion', 1);
      s.setGenerativeSetting('generativeSpeed', 0.4);
      s.setColorMode(0);
      s.setGlobalSetting('colors', 6);
      s.setAlgorithm(1);
      s.setGlobalSetting('scale', 2);
    },
  },
  {
    name: 'Fractal',
    apply: () => {
      const s = useDitherStore.getState();
      s.setGenerativeColors(['#01030a', '#0a2a5e', '#2f7fd1', '#9fd0f0', '#fef3c0', '#f0822f']);
      s.setGenerativeSetting('generativePattern', 24); // julia
      s.setGenerativeSetting('generativeScale', 1.0);
      s.setGenerativeSetting('generativeWarp', 0);
      s.setGenerativeSetting('generativeContrast', 1.15);
      s.setGenerativeSetting('generativeGridCols', 0);
      s.setGenerativeSetting('generativeGridRows', 0);
      s.setGenerativeSetting('generativeSteps', 0);
      s.setGenerativeSetting('generativeMirror', 0);
      s.setGenerativeSetting('generativeAnimate', true);
      s.setGenerativeSetting('generativeMotion', 1);
      s.setGenerativeSetting('generativeSpeed', 0.3);
      s.setColorMode(0);
      s.setGlobalSetting('colors', 8);
      s.setAlgorithm(1);
      s.setGlobalSetting('scale', 2);
    },
  },
  {
    name: 'Lava',
    apply: () => {
      const s = useDitherStore.getState();
      s.setGenerativeColors(['#1a0500', '#7a1500', '#e0490a', '#ffb020', '#fff1c0']);
      s.setGenerativeSetting('generativePattern', 25); // metaballs
      s.setGenerativeSetting('generativeScale', 1.0);
      s.setGenerativeSetting('generativeWarp', 0);
      s.setGenerativeSetting('generativeContrast', 1.3);
      s.setGenerativeSetting('generativeGridCols', 0);
      s.setGenerativeSetting('generativeGridRows', 0);
      s.setGenerativeSetting('generativeSteps', 0);
      s.setGenerativeSetting('generativeMirror', 0);
      s.setGenerativeSetting('generativeAnimate', true);
      s.setGenerativeSetting('generativeMotion', 1);
      s.setGenerativeSetting('generativeSpeed', 0.5);
      s.setColorMode(0);
      s.setGlobalSetting('colors', 8);
      s.setAlgorithm(1);
      s.setGlobalSetting('scale', 2);
    },
  },
  {
    name: 'Gyroid 3D',
    apply: () => {
      const s = useDitherStore.getState();
      s.setGenerativeColors(['#070a14', '#1e3a4f', '#3f8f8a', '#a7d49a', '#f3efd0']);
      s.setGenerativeSetting('generativePattern', 31); // gyroid
      s.setGenerativeSetting('generativeScale', 1.0);
      s.setGenerativeSetting('generativeWarp', 0);
      s.setGenerativeSetting('generativeContrast', 1.15);
      s.setGenerativeSetting('generativeGridCols', 0);
      s.setGenerativeSetting('generativeGridRows', 0);
      s.setGenerativeSetting('generativeSteps', 0);
      s.setGenerativeSetting('generativeMirror', 0);
      s.setGenerativeSetting('generativeAnimate', true);
      s.setGenerativeSetting('generativeMotion', 1);
      s.setGenerativeSetting('generativeSpeed', 0.35);
      s.setColorMode(0);
      s.setGlobalSetting('colors', 10);
      s.setAlgorithm(1);
      s.setGlobalSetting('scale', 1);
    },
  },
];

const sliderClass =
  "w-full h-[2px] bg-[#d0cdc4] outline-none appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#2a2a2a] [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-[#2a2a2a] [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:cursor-pointer";
const selectClass =
  "w-full p-2 bg-[#e8e5dd] border border-[#d0cdc4] text-xs text-[#2a2a2a] font-['JetBrains_Mono',monospace] cursor-pointer hover:border-[#2a2a2a]";

function Slider({ label, value, min, max, step, onChange, fmt }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; fmt?: (v: number) => string;
}) {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <label className="text-xs text-[#666]">{label}</label>
        <span className="text-xs text-[#2a2a2a] font-mono">{fmt ? fmt(value) : value}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={sliderClass}
      />
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-[#666]">{label}</span>
      <div className="relative w-8 h-8">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10" />
        <div className="w-8 h-8 border border-[#d0cdc4]" style={{ backgroundColor: value }} />
      </div>
    </div>
  );
}

export default function GenerativePanel() {
  const {
    generativePattern, generativeColors, generativeAngle, generativeScale,
    generativeWarp, generativeWarpFreq, generativeGrain, generativeContrast,
    generativeBlend, generativeLineWeight, generativeRenderStyle, generativeStyleDensity, generativeStyleAmount,
    generativeStyleInvert, generativeStyleCenterX, generativeStyleCenterY,
    generativeAnimate, generativeMotion, generativeSpeed,
    generativeSeed, generativeGridCols, generativeGridRows, generativeSteps,
    generativeBPM, generativeMirror, generativeKaleido, generativePolar, generativeTileX,
    generativeTileY, generativeVignette, generativeBorder, generativeBorderColor,
    overlayEnabled, overlayText, overlayTextColor, overlaySize, overlayX, overlayY,
    overlayLogo, overlayLogoScale,
    generativeImageSrc, imageLayerMode, imageLayerAmount, imageLayerInvert, imageLayerFit,
    outputAspect, outputWidth, outputHeight,
    setGenerativeSetting, setGenerativeColors, setGenerativeColor, setGenerativeImage, setOutputSize, randomizeGenerative,
  } = useDitherStore();

  const [userPresets, setUserPresets] = useState<GenPreset[]>([]);
  const [presetName, setPresetName] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const extractInputRef = useRef<HTMLInputElement>(null);
  const imageLayerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(USER_PRESET_STORAGE);
      if (raw) setUserPresets(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const persistPresets = (list: GenPreset[]) => {
    setUserPresets(list);
    try { localStorage.setItem(USER_PRESET_STORAGE, JSON.stringify(list)); } catch { /* ignore */ }
  };

  const saveUserPreset = () => {
    const name = presetName.trim();
    if (!name) return;
    const s = useDitherStore.getState() as unknown as Record<string, number | boolean | string | string[]>;
    const config: Record<string, number | boolean | string> = {};
    GEN_PRESET_KEYS.forEach((k) => { config[k] = s[k] as number | boolean | string; });
    const preset: GenPreset = { name, colors: [...generativeColors], config };
    persistPresets([preset, ...userPresets.filter((p) => p.name !== name)]);
    setPresetName('');
  };

  const applyUserPreset = (p: GenPreset) => {
    setGenerativeColors([...p.colors]);
    Object.entries(p.config).forEach(([k, v]) => setGenerativeSetting(k, v));
  };

  const addStop = () => {
    if (generativeColors.length >= 8) return;
    setGenerativeColors([...generativeColors, generativeColors[generativeColors.length - 1] || '#ffffff']);
  };
  const removeStop = (index: number) => {
    if (generativeColors.length <= 2) return;
    setGenerativeColors(generativeColors.filter((_, i) => i !== index));
  };

  const handleAspect = (id: string) => {
    const a = ASPECTS.find((x) => x.id === id);
    if (!a) return;
    if (id === 'custom') setOutputSize(outputWidth, outputHeight, 'custom');
    else setOutputSize(a.w, a.h, id);
  };

  const handleExtractFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      const ctx = c.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const pal = extractPalette(c, 6);
      if (pal.length >= 2) setGenerativeColors(pal);
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  };

  const handleLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setGenerativeSetting('overlayLogo', reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleImageLayerFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => setGenerativeImage(dataUrl, img.naturalWidth, img.naturalHeight);
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-1">
      {/* GENERATOR PRESETS */}
      <Collapsible title="GENERATOR" defaultOpen={true}>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {GEN_PRESETS.map((p) => (
            <button key={p.name} onClick={p.apply}
              className="p-2 text-[11px] bg-white border border-[#d0cdc4] text-[#2a2a2a] hover:bg-[#2a2a2a] hover:text-[#e8e5dd] hover:border-[#2a2a2a] transition-colors">
              {p.name}
            </button>
          ))}
        </div>
        <button onClick={randomizeGenerative}
          className="w-full p-2 mb-3 bg-[#2a2a2a] text-[#e8e5dd] text-xs transition-opacity hover:opacity-80">
          ✦ RANDOMIZE BACKGROUND
        </button>

        {/* Save / load your own looks */}
        <div className="flex gap-2 mb-2">
          <input type="text" value={presetName} onChange={(e) => setPresetName(e.target.value)}
            placeholder="Save current look as…"
            onKeyDown={(e) => { if (e.key === 'Enter') saveUserPreset(); }}
            className="flex-1 p-2 bg-white text-[#2a2a2a] border border-[#d0cdc4] text-[10px] focus:outline-none focus:border-[#2a2a2a]" />
          <button onClick={saveUserPreset} disabled={!presetName.trim()}
            className="px-3 bg-[#2a2a2a] text-[#e8e5dd] text-[10px] disabled:opacity-40">SAVE</button>
        </div>
        {userPresets.length > 0 && (
          <div className="space-y-1">
            {userPresets.map((p) => (
              <div key={p.name} className="flex items-center gap-2">
                <button onClick={() => applyUserPreset(p)}
                  className="flex-1 text-left p-1.5 text-[10px] bg-[#f5f3ee] border border-[#d0cdc4] text-[#2a2a2a] hover:border-[#2a2a2a]">
                  {p.name}
                </button>
                <button onClick={() => persistPresets(userPresets.filter((x) => x.name !== p.name))}
                  className="text-[#999] hover:text-[#e74c3c] text-sm px-1" title="Delete">×</button>
              </div>
            ))}
          </div>
        )}
      </Collapsible>

      {/* PATTERN */}
      <Collapsible title="PATTERN" defaultOpen={true}>
        <select value={generativePattern}
          onChange={(e) => setGenerativeSetting('generativePattern', Number(e.target.value))}
          className={selectClass + ' mb-4'}>
          {PATTERNS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <div className="mb-4">
          <label className="text-xs text-[#666] block mb-2">Render Style</label>
          <select value={generativeRenderStyle}
            onChange={(e) => setGenerativeSetting('generativeRenderStyle', Number(e.target.value))}
            className={selectClass}>
            <option value={0}>Fill</option>
            <option value={1}>Dots (halftone)</option>
            <option value={2}>Flow Lines</option>
            <option value={3}>Hatch</option>
            <option value={4}>Radial Burst</option>
          </select>
        </div>
        {generativeRenderStyle > 0 && (
          <div className="space-y-4 mb-4">
            <Slider label="Style Density" value={generativeStyleDensity} min={5} max={220} step={1}
              onChange={(v) => setGenerativeSetting('generativeStyleDensity', v)} fmt={(v) => String(Math.round(v))} />
            {generativeRenderStyle === 2 && (
              <Slider label="Flow Displacement" value={generativeStyleAmount} min={0} max={3} step={0.05}
                onChange={(v) => setGenerativeSetting('generativeStyleAmount', v)} fmt={(v) => v.toFixed(2)} />
            )}
            {generativeRenderStyle === 4 && (
              <>
                <Slider label="Center X" value={generativeStyleCenterX} min={0} max={1} step={0.01}
                  onChange={(v) => setGenerativeSetting('generativeStyleCenterX', v)} fmt={(v) => v.toFixed(2)} />
                <Slider label="Center Y" value={generativeStyleCenterY} min={0} max={1} step={0.01}
                  onChange={(v) => setGenerativeSetting('generativeStyleCenterY', v)} fmt={(v) => v.toFixed(2)} />
              </>
            )}
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs text-[#666]">Invert (white on black)</span>
              <input type="checkbox" checked={generativeStyleInvert}
                onChange={(e) => setGenerativeSetting('generativeStyleInvert', e.target.checked)}
                className="w-4 h-4 cursor-pointer accent-[#2a2a2a]" />
            </label>
          </div>
        )}
        <div className="space-y-4">
          <Slider label="Angle" value={generativeAngle} min={0} max={360} step={1}
            onChange={(v) => setGenerativeSetting('generativeAngle', v)} fmt={(v) => `${Math.round(v)}°`} />
          <Slider label="Scale" value={generativeScale} min={0.1} max={4} step={0.05}
            onChange={(v) => setGenerativeSetting('generativeScale', v)} fmt={(v) => v.toFixed(2)} />
          <Slider label="Warp / Turbulence" value={generativeWarp} min={0} max={1} step={0.01}
            onChange={(v) => setGenerativeSetting('generativeWarp', v)} fmt={(v) => v.toFixed(2)} />
          <Slider label="Warp Frequency" value={generativeWarpFreq} min={0.2} max={3} step={0.05}
            onChange={(v) => setGenerativeSetting('generativeWarpFreq', v)} fmt={(v) => v.toFixed(2)} />
          <Slider label="Contrast" value={generativeContrast} min={0.5} max={2} step={0.05}
            onChange={(v) => setGenerativeSetting('generativeContrast', v)} fmt={(v) => v.toFixed(2)} />
          <Slider label="Stop Blend (smooth→steps)" value={generativeBlend} min={0} max={1} step={0.01}
            onChange={(v) => setGenerativeSetting('generativeBlend', v)} fmt={(v) => v.toFixed(2)} />
          <Slider label="Line Weight (geometric)" value={generativeLineWeight} min={0.25} max={5} step={0.05}
            onChange={(v) => setGenerativeSetting('generativeLineWeight', v)} fmt={(v) => `${v.toFixed(2)}×`} />
          <Slider label="Bands (posterize)" value={generativeSteps} min={0} max={32} step={1}
            onChange={(v) => setGenerativeSetting('generativeSteps', v)} fmt={(v) => v === 0 ? 'off' : String(Math.round(v))} />
          <Slider label="Grain" value={generativeGrain} min={0} max={0.5} step={0.01}
            onChange={(v) => setGenerativeSetting('generativeGrain', v)} fmt={(v) => v.toFixed(2)} />
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Slider label="Seed" value={generativeSeed} min={0} max={10} step={0.01}
                onChange={(v) => setGenerativeSetting('generativeSeed', v)} fmt={(v) => v.toFixed(2)} />
            </div>
            <button onClick={() => setGenerativeSetting('generativeSeed', Math.random() * 10)}
              className="px-2 py-1 text-sm border border-[#d0cdc4] hover:border-[#2a2a2a]" title="Random seed">🎲</button>
          </div>
        </div>
      </Collapsible>

      {/* GRID */}
      <Collapsible title="GRID" defaultOpen={false}>
        <div className="space-y-4">
          <Slider label="Columns" value={generativeGridCols} min={0} max={48} step={1}
            onChange={(v) => setGenerativeSetting('generativeGridCols', v)} fmt={(v) => v === 0 ? 'off' : String(Math.round(v))} />
          <Slider label="Rows" value={generativeGridRows} min={0} max={96} step={1}
            onChange={(v) => setGenerativeSetting('generativeGridRows', v)} fmt={(v) => v === 0 ? 'off' : String(Math.round(v))} />
        </div>
        <p className="text-[10px] text-[#999] mt-2">0 = off. Coarse columns + fine rows ≈ the grid look. Pairs well with Spectrum.</p>
      </Collapsible>

      {/* SYMMETRY & FRAME */}
      <Collapsible title="SYMMETRY & FRAME" defaultOpen={false}>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[#666] block mb-2">Mirror</label>
            <select value={generativeMirror}
              onChange={(e) => setGenerativeSetting('generativeMirror', Number(e.target.value))}
              className={selectClass}>
              {MIRRORS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          {generativeMirror === 4 && (
            <Slider label="Kaleidoscope Segments" value={generativeKaleido} min={2} max={16} step={1}
              onChange={(v) => setGenerativeSetting('generativeKaleido', v)} fmt={(v) => String(Math.round(v))} />
          )}
          <div>
            <label className="text-xs text-[#666] block mb-2">Polar Warp</label>
            <select value={generativePolar}
              onChange={(e) => setGenerativeSetting('generativePolar', Number(e.target.value))}
              className={selectClass}>
              <option value={0}>None</option>
              <option value={1}>Polar</option>
              <option value={2}>Log-polar (Droste)</option>
              <option value={3}>Twist / Spiral</option>
            </select>
          </div>
          <Slider label="Tile X" value={generativeTileX} min={1} max={12} step={1}
            onChange={(v) => setGenerativeSetting('generativeTileX', v)} fmt={(v) => v <= 1 ? 'off' : String(Math.round(v))} />
          <Slider label="Tile Y" value={generativeTileY} min={1} max={12} step={1}
            onChange={(v) => setGenerativeSetting('generativeTileY', v)} fmt={(v) => v <= 1 ? 'off' : String(Math.round(v))} />
          <Slider label="Vignette" value={generativeVignette} min={0} max={1} step={0.01}
            onChange={(v) => setGenerativeSetting('generativeVignette', v)} fmt={(v) => v.toFixed(2)} />
          <Slider label="Border / Frame" value={generativeBorder} min={0} max={0.2} step={0.005}
            onChange={(v) => setGenerativeSetting('generativeBorder', v)} fmt={(v) => v === 0 ? 'off' : v.toFixed(3)} />
          {generativeBorder > 0 && (
            <ColorField label="Border Color" value={generativeBorderColor}
              onChange={(v) => setGenerativeSetting('generativeBorderColor', v)} />
          )}
        </div>
      </Collapsible>

      {/* GRADIENT COLORS */}
      <Collapsible title="GRADIENT COLORS" defaultOpen={false}>

        {/* brand palette quick-swatches */}
        <div className="flex flex-wrap gap-1 mb-3">
          {BRAND_PALETTES.map((bp) => (
            <button key={bp.name} onClick={() => setGenerativeColors(bp.colors)} title={bp.name}
              className="flex h-6 w-9 overflow-hidden border border-[#d0cdc4] hover:border-[#2a2a2a]">
              {bp.colors.map((c, i) => <span key={i} style={{ backgroundColor: c }} className="flex-1" />)}
            </button>
          ))}
        </div>
        <button onClick={() => extractInputRef.current?.click()}
          className="w-full p-2 mb-3 text-[10px] bg-transparent border border-[#d0cdc4] text-[#666] hover:border-[#2a2a2a] hover:text-[#2a2a2a]">
          ⤓ EXTRACT PALETTE FROM IMAGE
        </button>
        <input ref={extractInputRef} type="file" accept="image/*" className="hidden" onChange={handleExtractFile} />

        <div className="space-y-2">
          {generativeColors.map((color, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="relative w-8 h-8 flex-shrink-0">
                <input type="color" value={color} onChange={(e) => setGenerativeColor(i, e.target.value)}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10" />
                <div className="w-8 h-8 border border-[#d0cdc4]" style={{ backgroundColor: color }} />
              </div>
              <span className="text-[10px] text-[#666] font-mono flex-1">{color.toUpperCase()}</span>
              {generativeColors.length > 2 && (
                <button onClick={() => removeStop(i)} className="text-[#999] hover:text-[#e74c3c] text-sm px-1" title="Remove stop">×</button>
              )}
            </div>
          ))}
        </div>
        {generativeColors.length < 8 && (
          <button onClick={addStop}
            className="w-full p-2 mt-2 text-[10px] bg-transparent border border-[#d0cdc4] text-[#666] hover:border-[#2a2a2a] hover:text-[#2a2a2a]">
            + ADD STOP
          </button>
        )}
      </Collapsible>

      {/* IMAGE LAYER */}
      <Collapsible title="IMAGE LAYER" defaultOpen={false}>
        <div className="flex gap-2 mb-3">
          <button onClick={() => imageLayerInputRef.current?.click()}
            className="flex-1 p-2 text-[10px] bg-transparent border border-[#d0cdc4] text-[#666] hover:border-[#2a2a2a] hover:text-[#2a2a2a]">
            {generativeImageSrc ? 'REPLACE IMAGE' : '⤓ ADD IMAGE'}
          </button>
          {generativeImageSrc && (
            <button onClick={() => setGenerativeImage(null)}
              className="px-3 text-[10px] bg-transparent border border-[#d0cdc4] text-[#999] hover:text-[#e74c3c] hover:border-[#e74c3c]">CLEAR</button>
          )}
        </div>
        <input ref={imageLayerInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageLayerFile} />
        {generativeImageSrc ? (
          <div className="space-y-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={generativeImageSrc} alt="layer preview"
              className="w-full max-h-28 object-contain bg-[#d8d4ca] border border-[#d0cdc4]" />
            <div>
              <label className="text-xs text-[#666] block mb-2">Blend mode</label>
              <select value={imageLayerMode}
                onChange={(e) => setGenerativeSetting('imageLayerMode', Number(e.target.value))}
                className={selectClass}>
                <option value={0}>Off</option>
                <option value={1}>Image over (alpha)</option>
                <option value={2}>Stencil — pattern fills image</option>
                <option value={3}>Multiply</option>
                <option value={4}>Screen</option>
                <option value={5}>Overlay</option>
                <option value={6}>Add</option>
                <option value={7}>Crossfade</option>
              </select>
            </div>
            <Slider label="Amount" value={imageLayerAmount} min={0} max={1} step={0.01}
              onChange={(v) => setGenerativeSetting('imageLayerAmount', v)} fmt={(v) => `${Math.round(v * 100)}%`} />
            <div>
              <label className="text-xs text-[#666] block mb-2">Fit</label>
              <select value={imageLayerFit}
                onChange={(e) => setGenerativeSetting('imageLayerFit', Number(e.target.value))}
                className={selectClass}>
                <option value={0}>Cover</option>
                <option value={1}>Contain</option>
                <option value={2}>Stretch</option>
              </select>
            </div>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs text-[#666]">Invert mask / alpha</span>
              <input type="checkbox" checked={imageLayerInvert}
                onChange={(e) => setGenerativeSetting('imageLayerInvert', e.target.checked)}
                className="w-4 h-4 cursor-pointer accent-[#2a2a2a]" />
            </label>
            <p className="text-[10px] text-[#999]">Composited into the pattern, then dithered together. <b>Alpha</b> = transparent-PNG logo over the pattern. <b>Stencil</b> = pattern shows through the image (use Invert to swap light/dark). Animate &amp; export work as usual.</p>
          </div>
        ) : (
          <p className="text-[10px] text-[#999]">Drop in a photo or transparent PNG to mask / blend it with the generator pattern — the whole composite then gets dithered.</p>
        )}
      </Collapsible>

      {/* MOTION */}
      <Collapsible title="MOTION" defaultOpen={false}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-[#666]">Animate</span>
          <input type="checkbox" checked={generativeAnimate}
            onChange={(e) => setGenerativeSetting('generativeAnimate', e.target.checked)}
            className="w-4 h-4 cursor-pointer accent-[#2a2a2a]" />
        </div>
        {generativeAnimate && (
          <div className="space-y-4">
            <select value={generativeMotion}
              onChange={(e) => setGenerativeSetting('generativeMotion', Number(e.target.value))}
              className={selectClass}>
              {MOTIONS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            {generativeMotion === 6 ? (
              <Slider label="BPM" value={generativeBPM} min={40} max={200} step={1}
                onChange={(v) => setGenerativeSetting('generativeBPM', v)} fmt={(v) => String(Math.round(v))} />
            ) : (
              <Slider label="Speed" value={generativeSpeed} min={0.05} max={3} step={0.05}
                onChange={(v) => setGenerativeSetting('generativeSpeed', v)} fmt={(v) => v.toFixed(2)} />
            )}
            {generativeMotion !== 6 && (
              <p className="text-[10px] text-[#999]">
                Seamless loop ≈ {(6.2831853 / Math.max(generativeSpeed, 0.05)).toFixed(1)}s — set export Duration to this for a perfect loop.
              </p>
            )}
          </div>
        )}
      </Collapsible>

      {/* TEXT / LOGO OVERLAY */}
      <Collapsible title="TEXT / LOGO" defaultOpen={false} accessory={
        <input type="checkbox" checked={overlayEnabled}
          onChange={(e) => setGenerativeSetting('overlayEnabled', e.target.checked)}
          className="w-4 h-4 cursor-pointer accent-[#2a2a2a]" />
      }>
        {overlayEnabled && (
          <div className="space-y-4">
            <textarea value={overlayText} rows={2}
              onChange={(e) => setGenerativeSetting('overlayText', e.target.value)}
              placeholder="Headline text (Enter for new line)"
              className="w-full p-2 bg-white text-[#2a2a2a] border border-[#d0cdc4] text-xs focus:outline-none focus:border-[#2a2a2a] resize-none" />
            <ColorField label="Text Color" value={overlayTextColor}
              onChange={(v) => setGenerativeSetting('overlayTextColor', v)} />
            <Slider label="Text Size" value={overlaySize} min={2} max={20} step={0.5}
              onChange={(v) => setGenerativeSetting('overlaySize', v)} fmt={(v) => `${v.toFixed(1)}%`} />
            <Slider label="Position X" value={overlayX} min={0} max={1} step={0.01}
              onChange={(v) => setGenerativeSetting('overlayX', v)} fmt={(v) => v.toFixed(2)} />
            <Slider label="Position Y" value={overlayY} min={0} max={1} step={0.01}
              onChange={(v) => setGenerativeSetting('overlayY', v)} fmt={(v) => v.toFixed(2)} />
            <div className="flex gap-2">
              <button onClick={() => logoInputRef.current?.click()}
                className="flex-1 p-2 text-[10px] bg-transparent border border-[#d0cdc4] text-[#666] hover:border-[#2a2a2a] hover:text-[#2a2a2a]">
                {overlayLogo ? 'REPLACE LOGO' : '⤓ ADD LOGO'}
              </button>
              {overlayLogo && (
                <button onClick={() => setGenerativeSetting('overlayLogo', '')}
                  className="px-3 text-[10px] bg-transparent border border-[#d0cdc4] text-[#999] hover:text-[#e74c3c] hover:border-[#e74c3c]">CLEAR</button>
              )}
            </div>
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoFile} />
            {overlayLogo && (
              <Slider label="Logo Size" value={overlayLogoScale} min={0.03} max={0.5} step={0.01}
                onChange={(v) => setGenerativeSetting('overlayLogoScale', v)} fmt={(v) => `${Math.round(v * 100)}%`} />
            )}
          </div>
        )}
      </Collapsible>

      {/* OUTPUT SIZE */}
      <Collapsible title="OUTPUT SIZE" defaultOpen={false}>
        <select value={outputAspect} onChange={(e) => handleAspect(e.target.value)} className={selectClass + ' mb-3'}>
          {ASPECTS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
        </select>
        {outputAspect === 'custom' && (
          <div className="flex items-center gap-2">
            <input type="number" min={16} max={7680} value={outputWidth}
              onChange={(e) => setOutputSize(Number(e.target.value), outputHeight, 'custom')}
              className="w-20 p-2 bg-white text-[#2a2a2a] border border-[#d0cdc4] text-xs focus:outline-none" />
            <span className="text-xs text-[#666]">×</span>
            <input type="number" min={16} max={7680} value={outputHeight}
              onChange={(e) => setOutputSize(outputWidth, Number(e.target.value), 'custom')}
              className="w-20 p-2 bg-white text-[#2a2a2a] border border-[#d0cdc4] text-xs focus:outline-none" />
            <span className="text-[10px] text-[#999]">px</span>
          </div>
        )}
        <p className="text-[10px] text-[#999] mt-2">Sets preview size &amp; aspect. Stills &amp; MP4 export at ≥4K of this aspect; GIF exports at this size.</p>
      </Collapsible>
    </div>
  );
}
