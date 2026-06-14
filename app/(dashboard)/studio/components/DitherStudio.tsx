'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { generateSVG } from '@/lib/utils/svgGenerator';
import WebGLCanvas from './canvas/WebGLCanvas';
import UploadZone from './controls/UploadZone';
import SimplifiedSettings from './controls/SimplifiedSettings';
import { useDitherStore } from '@/store/ditherStore';
import { generatorExport } from '@/lib/three/generatorController';
import GIF from 'gif.js';
import JSZip from 'jszip';

// Define Electron API interface
interface ElectronAPI {
  savePreset: (name: string, data: Record<string, unknown>) => Promise<{ success: boolean; preset?: DitherPreset; error?: string }>;
  loadPreset: (name: string) => Promise<any>;
  getPresets: () => Promise<DitherPreset[]>;
  deletePreset: (id: string) => Promise<{ success: boolean; error?: string }>;
}

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}

// Preset type for saving/loading settings
interface DitherPreset {
  id: string;
  name: string;
  settings: Record<string, unknown>;
  createdAt?: string;
}

// Built-in presets
const builtInPresets: DitherPreset[] = [
  {
    id: 'builtin-retro-mac',
    name: '🖥️ Retro Mac',
    settings: {
      currentAlgorithm: 4,
      param1: 0.75,
      threshold: 0.5,
      contrast: 1.1,
      brightness: 0,
      colors: 2,
      colorMode: 1,
      serpentine: true,
      gammaCorrect: false,
      ditherStrength: 1.0,
      scanlines: 0,
      phosphor: false,
      curvature: 0,
      vignette: 0,
      chromatic: 0,
      bloom: 0,
    }
  },
  {
    id: 'builtin-newspaper',
    name: '📰 Newspaper',
    settings: {
      currentAlgorithm: 28,
      param1: 6,
      threshold: 0.5,
      contrast: 1.2,
      brightness: 0.05,
      colors: 2,
      colorMode: 1,
      serpentine: false,
      gammaCorrect: true,
      ditherStrength: 1.0,
      scanlines: 0,
      phosphor: false,
      curvature: 0,
      vignette: 0.1,
      chromatic: 0,
      bloom: 0,
    }
  },
  {
    id: 'builtin-matrix',
    name: '💚 Matrix',
    settings: {
      currentAlgorithm: 2,
      param1: 0.6,
      threshold: 0.45,
      contrast: 1.3,
      brightness: -0.05,
      colors: 4,
      colorMode: 2,
      duotoneDark: '#000000',
      duotoneLight: '#00ff00',
      serpentine: false,
      gammaCorrect: false,
      ditherStrength: 1.0,
      scanlines: 0.2,
      phosphor: true,
      curvature: 0.05,
      vignette: 0.15,
      chromatic: 0.1,
      bloom: 0.2,
    }
  },
  {
    id: 'builtin-vaporwave',
    name: '🌴 Vaporwave',
    settings: {
      currentAlgorithm: 22,
      param1: 2.0,
      threshold: 0.5,
      contrast: 1.1,
      brightness: 0.05,
      colors: 8,
      colorMode: 2,
      duotoneDark: '#2d00f7',
      duotoneLight: '#f20089',
      serpentine: false,
      gammaCorrect: true,
      ditherStrength: 0.9,
      scanlines: 0.15,
      phosphor: false,
      curvature: 0.08,
      vignette: 0.2,
      chromatic: 0.25,
      bloom: 0.15,
    }
  },
  {
    id: 'builtin-gameboy',
    name: '🎮 Game Boy',
    settings: {
      currentAlgorithm: 22,
      param1: 1.0,
      threshold: 0.5,
      contrast: 1.0,
      brightness: 0,
      colors: 4,
      colorMode: 2,
      duotoneDark: '#0f380f',
      duotoneLight: '#9bbc0f',
      serpentine: false,
      gammaCorrect: false,
      ditherStrength: 1.0,
      scanlines: 0,
      phosphor: false,
      curvature: 0,
      vignette: 0,
      chromatic: 0,
      bloom: 0,
    }
  },
  {
    id: 'builtin-crt-tv',
    name: '📺 CRT TV',
    settings: {
      currentAlgorithm: 3,
      param1: 1.0,
      threshold: 0.5,
      contrast: 1.15,
      brightness: 0,
      colors: 16,
      colorMode: 0,
      serpentine: true,
      gammaCorrect: true,
      ditherStrength: 1.0,
      scanlines: 0.35,
      phosphor: true,
      curvature: 0.12,
      vignette: 0.2,
      chromatic: 0.15,
      bloom: 0.25,
    }
  },
  {
    id: 'builtin-comic',
    name: '💥 Comic Book',
    settings: {
      currentAlgorithm: 27,
      param1: 8,
      param2: 0.785,
      threshold: 0.45,
      contrast: 1.4,
      brightness: 0.05,
      colors: 4,
      colorMode: 0,
      serpentine: false,
      gammaCorrect: true,
      ditherStrength: 1.0,
      scanlines: 0,
      phosphor: false,
      curvature: 0,
      vignette: 0,
      chromatic: 0,
      bloom: 0,
    }
  },
  {
    id: 'builtin-blueprint',
    name: '📐 Blueprint',
    settings: {
      currentAlgorithm: 32,
      param1: 3.0,
      threshold: 0.5,
      contrast: 1.2,
      brightness: 0,
      colors: 2,
      colorMode: 2,
      duotoneDark: '#001f3f',
      duotoneLight: '#ffffff',
      serpentine: false,
      gammaCorrect: false,
      ditherStrength: 1.0,
      scanlines: 0,
      phosphor: false,
      curvature: 0,
      vignette: 0.1,
      chromatic: 0,
      bloom: 0,
    }
  },
];

// Pick the best-supported MediaRecorder container/codec. Prefer MP4/H.264 for
// portability (plays in QuickTime/Safari/most editors); fall back to WebM.
const pickVideoMimeType = (): string => {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return '';
  const candidates = [
    'video/mp4;codecs=avc1.42E01E',
    'video/mp4',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];
  for (const c of candidates) {
    try { if (MediaRecorder.isTypeSupported(c)) return c; } catch { /* ignore */ }
  }
  return '';
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// High bitrate scaled by pixels×fps for crisp 4K output (clamped 12–120 Mbps).
const videoBitrate = (w: number, h: number, fps: number) =>
  Math.min(120_000_000, Math.max(12_000_000, Math.round(w * h * fps * 0.15)));

// Pick an H.264 codec string the browser can encode at this size/fps (4K needs a
// high level). Returns '' when WebCodecs/H.264 isn't available.
const pickAvcCodec = async (w: number, h: number, fps: number, bitrate: number): Promise<string> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const VE: any = (typeof window !== 'undefined') ? (window as any).VideoEncoder : undefined;
  if (!VE?.isConfigSupported) return '';
  for (const codec of ['avc1.640034', 'avc1.640033', 'avc1.4D4034', 'avc1.640028']) {
    try {
      const r = await VE.isConfigSupported({ codec, width: w, height: h, bitrate, framerate: fps });
      if (r?.supported) return codec;
    } catch { /* try next */ }
  }
  return '';
};

// Pick a VP9 codec string for the given size (VP9 reaches 8K). Used by the
// "max detail" path, which encodes at 2x so a fine dither survives 4:2:0.
const pickVp9Codec = async (w: number, h: number, fps: number, bitrate: number): Promise<string> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const VE: any = (typeof window !== 'undefined') ? (window as any).VideoEncoder : undefined;
  if (!VE?.isConfigSupported) return '';
  for (const codec of ['vp09.00.62.08', 'vp09.00.61.08', 'vp09.00.60.08', 'vp09.00.51.08', 'vp09.00.50.08', 'vp09.00.41.08']) {
    try {
      const r = await VE.isConfigSupported({ codec, width: w, height: h, bitrate, framerate: fps });
      if (r?.supported) return codec;
    } catch { /* try next */ }
  }
  return '';
};

export default function DitherStudio() {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [jpegQuality, setJpegQuality] = useState(0.95);
  const [savedPresets, setSavedPresets] = useState<DitherPreset[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const presetInputRef = useRef<HTMLInputElement>(null);

  // Video/GIF Export State
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportDuration, setExportDuration] = useState(3); // seconds
  const [exportFps, setExportFps] = useState(15);
  const [loopExport, setLoopExport] = useState(false);
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Get video duration from store and auto-update export duration
  const { isVideo, videoDuration } = useDitherStore();
  const ditherState = useDitherStore();

  // Sync export duration with video duration
  useEffect(() => {
    if (isVideo && videoDuration > 0) {
      setExportDuration(Math.round(videoDuration));
      // Estimate FPS from video (default to 30 for most videos)
      setExportFps(30);
    }
  }, [isVideo, videoDuration]);

  // Load presets via Electron IPC
  const loadPresets = useCallback(async () => {
    if (!window.electron) return;

    setIsLoading(true);
    try {
      const presets = await window.electron.getPresets();
      setSavedPresets(presets || []);
    } catch (error) {
      console.error('Failed to load presets:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPresets();
  }, [loadPresets]);

  const getCurrentSettings = (): Record<string, unknown> => {
    const state = useDitherStore.getState();
    return {
      currentAlgorithm: state.currentAlgorithm,
      param1: state.param1,
      param2: state.param2,
      param3: state.param3,
      param4: state.param4,
      threshold: state.threshold,
      contrast: state.contrast,
      brightness: state.brightness,
      colors: state.colors,
      scale: state.scale,
      colorMode: state.colorMode,
      duotoneDark: state.duotoneDark,
      duotoneLight: state.duotoneLight,
      serpentine: state.serpentine,
      gammaCorrect: state.gammaCorrect,
      ditherStrength: state.ditherStrength,
      patternRandomization: state.patternRandomization,
      colorSpace: state.colorSpace,
      edgePreservation: state.edgePreservation,
      bandingReduction: state.bandingReduction,
      scanlines: state.scanlines,
      phosphor: state.phosphor,
      curvature: state.curvature,
      vignette: state.vignette,
      chromatic: state.chromatic,
      bloom: state.bloom,
      customPalette: state.customPalette,
    };
  };

  const applyPreset = (preset: DitherPreset) => {
    const { setGlobalSetting, setAlgorithm, setParam, setColorMode } = useDitherStore.getState();

    if (preset.settings.currentAlgorithm !== undefined) {
      setAlgorithm(preset.settings.currentAlgorithm as number);
    }
    if (preset.settings.colorMode !== undefined) {
      setColorMode(preset.settings.colorMode as number);
    }
    if (preset.settings.param1 !== undefined) setParam(1, preset.settings.param1 as number);
    if (preset.settings.param2 !== undefined) setParam(2, preset.settings.param2 as number);
    if (preset.settings.param3 !== undefined) setParam(3, preset.settings.param3 as number);
    if (preset.settings.param4 !== undefined) setParam(4, preset.settings.param4 as number);

    Object.entries(preset.settings).forEach(([key, value]) => {
      if (!['currentAlgorithm', 'colorMode', 'param1', 'param2', 'param3', 'param4'].includes(key)) {
        setGlobalSetting(key, value as number | boolean | string);
      }
    });

    setSelectedPresetId(preset.id);
  };

  const handlePresetSelect = (presetId: string) => {
    if (!presetId) {
      setSelectedPresetId('');
      return;
    }

    const builtIn = builtInPresets.find(p => p.id === presetId);
    if (builtIn) {
      applyPreset(builtIn);
      return;
    }

    const saved = savedPresets.find(p => p.id === presetId);
    if (saved) {
      applyPreset(saved);
    }
  };

  const saveNewPreset = async () => {
    if (!newPresetName.trim()) return;

    if (!window.electron) {
      alert('Not in Electron environment');
      return;
    }

    setIsSaving(true);
    try {
      const result = await window.electron.savePreset(newPresetName.trim(), getCurrentSettings());
      if (result.success && result.preset) {
        setSavedPresets(prev => [result.preset!, ...prev]); // ! to assert existence
        setSelectedPresetId(result.preset.id);
      } else {
        alert('Failed to save preset: ' + result.error);
      }
    } catch (error: any) {
      console.error('Error saving preset:', error);
      alert('Failed to save preset');
    }

    setIsSaving(false);
    setShowSaveDialog(false);
    setNewPresetName('');
  };

  const deletePreset = async (presetId: string) => {
    // Only delete native file presets
    if (!presetId.startsWith('file-')) {
      return;
    }

    if (!window.electron) return;

    try {
      const result = await window.electron.deletePreset(presetId);
      if (result.success) {
        setSavedPresets(prev => prev.filter(p => p.id !== presetId));
      } else {
        alert('Failed to delete preset: ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting preset:', error);
      alert('Failed to delete preset');
    }

    if (selectedPresetId === presetId) {
      setSelectedPresetId('');
    }
  };

  // Export resolution: >= 4K long edge (preserving the output aspect) for generative
  // backgrounds; the canvas's native size for uploaded media.
  const exportDims = useCallback((): { w: number; h: number } => {
    const s = useDitherStore.getState();
    const c = document.querySelector('canvas');
    if (!s.isGenerative && !s.is3D && !s.isWaveField) return { w: c?.width || s.outputWidth, h: c?.height || s.outputHeight };
    let w = s.outputWidth, h = s.outputHeight;
    const MIN_LONG = 3840; // 4K long edge
    const long = Math.max(w, h);
    if (long < MIN_LONG) { const k = MIN_LONG / long; w = Math.round(w * k); h = Math.round(h * k); }
    return { w: w - (w % 2), h: h - (h % 2) };
  }, []);

  const exportImage = (format: 'png' | 'jpeg' | 'webp') => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    const mimeType = format === 'png' ? 'image/png' : format === 'jpeg' ? 'image/jpeg' : 'image/webp';
    const quality = format === 'jpeg' ? jpegQuality : format === 'webp' ? 0.95 : undefined;
    const ext = format === 'jpeg' ? 'jpg' : format;
    const s = useDitherStore.getState();

    const grab = (after?: () => void) => canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, `dither-${Date.now()}.${ext}`);
      after?.();
    }, mimeType, quality);

    // Generative / 3D / wave stills render at >= 4K via a temporary hi-res pass.
    if ((s.isGenerative || s.is3D || s.isWaveField) && generatorExport.beginExport && generatorExport.renderStillFrame) {
      const { w, h } = exportDims();
      generatorExport.beginExport(w, h);
      generatorExport.renderStillFrame();
      grab(() => generatorExport.endExport?.());
    } else {
      grab();
    }
    setShowExportMenu(false);
  };

  const handleExportSVG = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const svgString = generateSVG(canvas, ditherState); 
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dither-${Date.now()}.svg`;
      a.click();
      URL.revokeObjectURL(url);
      setShowExportMenu(false);
    }
  };

  const exportBatch = async () => {
    if (batchFiles.length === 0) return;
    
    setIsBatchProcessing(true);
    setExportProgress(0);
    
    const zip = new JSZip();
    const { setFile } = useDitherStore.getState();
    
    for (let i = 0; i < batchFiles.length; i++) {
      const file = batchFiles[i];
      setFile(file, file.type.startsWith('video/'));
      
      // Wait for render (roughly)
      await new Promise(r => setTimeout(r, 1000));
      
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
        if (blob) {
          zip.file(`dithered-${file.name}.png`, blob);
        }
      }
      
      setExportProgress(Math.round(((i + 1) / batchFiles.length) * 100));
    }
    
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dither-batch-${Date.now()}.zip`;
    a.click();
    
    setIsBatchProcessing(false);
    setBatchFiles([]);
    setExportProgress(0);
  };

  const exportPresetFile = () => {
    const preset = {
      name: 'Exported Preset',
      settings: getCurrentSettings(),
    };

    const blob = new Blob([JSON.stringify(preset, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dither-preset-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadPresetFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const preset = JSON.parse(event.target?.result as string);
        const name = preset.name || 'Imported Preset';
        const settings = preset.settings;

        if (window.electron) {
          const result = await window.electron.savePreset(name, settings);
          if (result.success && result.preset) {
            setSavedPresets(prev => [result.preset!, ...prev]);
            applyPreset(result.preset);
          }
        }
      } catch {
        alert('Invalid preset file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const exportPalette = () => {
    const state = useDitherStore.getState();
    const palette = {
      name: 'Dither Palette',
      colors: state.colorMode === 2
        ? [state.duotoneDark, state.duotoneLight]
        : state.customPalette.filter(c => c !== '#000000'),
      colorCount: state.colors,
    };

    const hexContent = palette.colors.join('\n');
    const blob = new Blob([hexContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dither-palette.hex`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Plan a seamless loop: an integer number of motion cycles closest to the requested
  // Duration, rendered as N deterministic frames (frame i at phase 2π·i/N). Because the
  // frames tile whole cycles, frame N ≡ frame 0 — seamless at ANY fps/duration.
  // Returns null when loop export isn't applicable (then we live-record instead).
  const getLoopPlan = useCallback(() => {
    const s = useDitherStore.getState();
    if (!loopExport || !generatorExport.renderExportFrame) return null;
    // Loop length comes from whichever animation is active: the generator motion,
    // or the effect (dither/ASCII) animation. Strobe (gen motion 6) doesn't loop.
    const genAnim = s.isGenerative && s.generativeAnimate && s.generativeMotion !== 6;
    // 3D auto-rotate loops seamlessly: rotation.y = t * speed, so over one period
    // (2π/speed) it completes a full turn.
    const threeDAnim = s.is3D && s.object3DAutoRotate;
    // Wave field always loops: uPhase = t * waveSpeed (radians), period 2π/speed.
    const waveAnim = s.isWaveField;
    // Smooth analog motion (wobble / hum bar) also benefits from a seamless loop;
    // it's phase-locked to this same speed via uAnalogRate (fallback 0.5).
    const analogAnim = s.analogWobble > 0 || s.analogHum > 0;
    const speed = genAnim ? s.generativeSpeed
      : threeDAnim ? s.object3DAutoSpeed
      : waveAnim ? s.waveSpeed
      : (s.fxAnimate ? s.fxSpeed : (analogAnim ? 0.5 : 0));
    if (speed <= 0) return null;
    const period = (2 * Math.PI) / Math.max(speed, 0.05); // seconds per cycle
    const cycles = Math.max(1, Math.round(exportDuration / period));
    const loopDuration = cycles * period;
    const frames = Math.max(2, Math.round(loopDuration * exportFps));
    return { loopDuration, frames };
  }, [loopExport, exportDuration, exportFps]);

  // Export GIF (loops by default in gif.js)
  const exportGIF = useCallback(async () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) return;

    setIsExporting(true);
    setExportProgress(0);

    const gif = new GIF({
      workers: 2,
      quality: 10,
      width: canvas.width,
      height: canvas.height,
      workerScript: '/gif.worker.js',
    });
    const frameDelay = 1000 / exportFps;

    gif.on('finished', (blob: Blob) => {
      downloadBlob(blob, `dither-${Date.now()}.gif`);
      setIsExporting(false);
      setExportProgress(0);
    });

    const plan = getLoopPlan();
    if (plan) {
      // Deterministic seamless loop — render exactly N frames spanning whole cycles.
      const { loopDuration, frames } = plan;
      generatorExport.capturing = true;
      try {
        for (let i = 0; i < frames; i++) {
          generatorExport.renderExportFrame?.((i / frames) * loopDuration);
          gif.addFrame(canvas, { copy: true, delay: frameDelay });
          setExportProgress(Math.round(((i + 1) / frames) * 100));
          if (i % 4 === 0) await new Promise((r) => setTimeout(r, 0)); // keep UI responsive
        }
      } finally {
        generatorExport.capturing = false;
      }
      gif.render();
      return;
    }

    // Live capture (non-loop)
    const totalFrames = Math.max(1, Math.round(exportDuration * exportFps));
    let frameCount = 0;
    const captureFrame = () => {
      if (frameCount >= totalFrames) { gif.render(); return; }
      gif.addFrame(canvas, { copy: true, delay: frameDelay });
      frameCount++;
      setExportProgress(Math.round((frameCount / totalFrames) * 100));
      requestAnimationFrame(captureFrame);
    };
    captureFrame();
  }, [exportFps, exportDuration, getLoopPlan]);

  // Frame-accurate MP4 via WebCodecs: each frame gets an explicit timestamp AND
  // duration, so there is no end-frame freeze (the MediaRecorder bug) and the loop
  // is perfect. Renders at >= 4K. Returns false if WebCodecs/H.264 is unavailable.
  const exportVideoWebCodecs = useCallback(async (
    frames: number, fps: number, timeFn: (i: number) => number,
  ): Promise<boolean> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w0 = (typeof window !== 'undefined' ? (window as any) : undefined);
    if (!w0?.VideoEncoder || !w0?.VideoFrame) return false;
    if (!generatorExport.beginExport || !generatorExport.renderExportFrame || !generatorExport.endExport) return false;

    // Video codecs only encode 4:2:0 (one chroma sample per 2x2 block), which
    // averages neighbouring colours and destroys a fine dither's exact palette.
    // Fix: render each dithered pixel as a 2x2 block (render at half the encode
    // size, then nearest-neighbour upscale 2x) so the chroma grid aligns to it.
    //   - Default (H.264): encode <=4K -> render <=2K. Plays everywhere.
    //   - Max detail (VP9): render full 4K, encode 2x up to 8K. Exact colours at
    //     full detail, but the .mp4 only plays in VLC/Chrome.
    const even = (n: number) => Math.max(2, Math.floor(n / 2) * 2);
    const fitInto = (bw: number, bh: number, maxW: number, maxH: number): [number, number] => {
      const k = Math.min(1, maxW / bw, maxH / bh);
      return [even(bw * k), even(bh * k)];
    };
    const base = exportDims();
    const maxDetail = useDitherStore.getState().videoMaxDetail;
    let encodeW: number, encodeH: number, muxCodec: 'avc' | 'vp9', codec: string;
    const bitrate0 = videoBitrate(base.w * (maxDetail ? 2 : 1), base.h * (maxDetail ? 2 : 1), fps);
    if (maxDetail) {
      [encodeW, encodeH] = fitInto(base.w * 2, base.h * 2, 8192, 4320);
      muxCodec = 'vp9';
      codec = await pickVp9Codec(encodeW, encodeH, fps, bitrate0);
    } else {
      [encodeW, encodeH] = fitInto(base.w, base.h, 4096, 4096);
      muxCodec = 'avc';
      codec = await pickAvcCodec(encodeW, encodeH, fps, bitrate0);
    }
    if (!codec) return false;
    const renderW = even(encodeW / 2), renderH = even(encodeH / 2);
    const bitrate = videoBitrate(encodeW, encodeH, fps);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let Muxer: any, ArrayBufferTarget: any;
    try { ({ Muxer, ArrayBufferTarget } = await import('mp4-muxer')); } catch { return false; }

    setIsExporting(true);
    setExportProgress(0);
    const srcCanvas = document.querySelector('canvas') as HTMLCanvasElement;
    // Offscreen target the renderer canvas is nearest-upscaled into (2x).
    const up = document.createElement('canvas');
    up.width = encodeW; up.height = encodeH;
    const upCtx = up.getContext('2d')!;
    upCtx.imageSmoothingEnabled = false;

    const muxer = new Muxer({
      target: new ArrayBufferTarget(),
      video: { codec: muxCodec, width: encodeW, height: encodeH, frameRate: fps },
      fastStart: 'in-memory',
    });
    let encError: unknown = null;
    const encoder = new w0.VideoEncoder({
      output: (chunk: unknown, meta: unknown) => muxer.addVideoChunk(chunk, meta),
      error: (e: unknown) => { encError = e; },
    });
    encoder.configure({ codec, width: encodeW, height: encodeH, bitrate, framerate: fps });

    generatorExport.beginExport(renderW, renderH);
    try {
      const usPerFrame = 1_000_000 / fps;
      const keyEvery = Math.max(1, Math.round(fps)); // ~1 keyframe / second
      for (let i = 0; i < frames; i++) {
        if (encError) throw encError;
        generatorExport.renderExportFrame!(timeFn(i));
        upCtx.drawImage(srcCanvas, 0, 0, encodeW, encodeH); // nearest 2x -> chroma-aligned
        const frame = new w0.VideoFrame(up, { timestamp: Math.round(i * usPerFrame), duration: Math.round(usPerFrame) });
        encoder.encode(frame, { keyFrame: i % keyEvery === 0 });
        frame.close();
        setExportProgress(Math.round(((i + 1) / frames) * 92));
        while (encoder.encodeQueueSize > 8) await new Promise((r) => setTimeout(r, 4)); // backpressure at 4K
      }
      await encoder.flush();
      muxer.finalize();
      downloadBlob(new Blob([muxer.target.buffer], { type: 'video/mp4' }), `dither-${Date.now()}.mp4`);
    } catch (e) {
      console.error('WebCodecs export failed, falling back:', e);
      try { encoder.close(); } catch { /* */ }
      generatorExport.endExport();
      setIsExporting(false);
      setExportProgress(0);
      return false;
    }
    try { encoder.close(); } catch { /* */ }
    generatorExport.endExport();
    setIsExporting(false);
    setExportProgress(0);
    return true;
  }, [exportDims]);

  // Export Video — WebCodecs MP4 (>=4K, seamless) with a MediaRecorder fallback
  const exportVideo = useCallback(async () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) return;

    // Preferred path for any animation (generator OR dither/ASCII effect):
    // deterministic frames -> 4K MP4 (no end-freeze).
    const gs = useDitherStore.getState();
    const analogAnim = gs.analogWobble > 0 || gs.analogHum > 0 || gs.analogStatic > 0 || gs.analogGhost > 0;
    if ((gs.isGenerative && gs.generativeAnimate) || (gs.is3D && gs.object3DAutoRotate) || gs.isWaveField || gs.fxAnimate || analogAnim) {
      const loop = getLoopPlan();
      const fps = exportFps;
      const frames = loop ? loop.frames : Math.max(1, Math.round(exportDuration * fps));
      const timeFn = loop ? (i: number) => (i / frames) * loop.loopDuration : (i: number) => i / fps;
      const ok = await exportVideoWebCodecs(frames, fps, timeFn);
      if (ok) return; // otherwise fall through to MediaRecorder
    }

    const mimeType = pickVideoMimeType();
    if (!mimeType) {
      alert('Video recording is not supported in this browser. Try GIF export, or use Chrome/Edge.');
      return;
    }

    setIsExporting(true);
    setExportProgress(0);
    recordedChunksRef.current = [];

    const makeRecorder = (stream: MediaStream): MediaRecorder | null => {
      try { return new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 16_000_000 }); }
      catch { try { return new MediaRecorder(stream); } catch { return null; } }
    };
    const finish = (recorder: MediaRecorder) => {
      const type = recorder.mimeType || mimeType;
      const blob = new Blob(recordedChunksRef.current, { type });
      setIsExporting(false);
      setExportProgress(0);
      if (blob.size === 0) { alert('No video frames were captured — make sure something is visible on the canvas.'); return; }
      downloadBlob(blob, `dither-${Date.now()}.${type.includes('mp4') ? 'mp4' : 'webm'}`);
    };

    const plan = getLoopPlan();
    if (plan) {
      // Deterministic seamless loop: drive frames manually into the capture stream.
      const { loopDuration, frames } = plan;
      let stream: MediaStream;
      let manual = true;
      try { stream = canvas.captureStream(0); }
      catch {
        manual = false;
        try { stream = canvas.captureStream(exportFps); }
        catch { setIsExporting(false); alert('Could not capture the canvas for video export.'); return; }
      }
      const track = stream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack;
      const recorder = makeRecorder(stream);
      if (!recorder) { setIsExporting(false); alert('Video recording failed to start in this browser.'); return; }
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data); };
      recorder.onstop = () => finish(recorder);
      recorder.onerror = () => { setIsExporting(false); setExportProgress(0); alert('Video recording error.'); };
      recorder.start();

      const frameMs = (loopDuration * 1000) / frames;
      generatorExport.capturing = true;
      try {
        for (let i = 0; i < frames; i++) {
          generatorExport.renderExportFrame?.((i / frames) * loopDuration);
          if (manual && typeof track?.requestFrame === 'function') track.requestFrame();
          setExportProgress(Math.round(((i + 1) / frames) * 100));
          await new Promise((r) => setTimeout(r, frameMs));
        }
      } finally {
        generatorExport.capturing = false;
      }
      if (recorder.state !== 'inactive') recorder.stop();
      return;
    }

    // Live capture (non-loop)
    let stream: MediaStream;
    try { stream = canvas.captureStream(exportFps); }
    catch { setIsExporting(false); alert('Could not capture the canvas for video export.'); return; }
    const recorder = makeRecorder(stream);
    if (!recorder) { setIsExporting(false); alert('Video recording failed to start in this browser.'); return; }
    mediaRecorderRef.current = recorder;
    recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data); };
    recorder.onstop = () => finish(recorder);
    recorder.onerror = () => { setIsExporting(false); setExportProgress(0); alert('Video recording error.'); };
    recorder.start(100);

    const duration = exportDuration;
    let elapsed = 0;
    const progressInterval = setInterval(() => {
      elapsed += 100;
      setExportProgress(Math.min(99, Math.round((elapsed / (duration * 1000)) * 100)));
    }, 100);
    setTimeout(() => {
      clearInterval(progressInterval);
      if (recorder.state !== 'inactive') recorder.stop();
    }, duration * 1000);
  }, [exportFps, exportDuration, getLoopPlan, exportVideoWebCodecs]);

  const isUserPreset = (presetId: string) => {
    return !presetId.startsWith('builtin-');
  };

  return (
    <div className="h-screen grid grid-cols-[300px_400px_1fr] gap-0 bg-[#e8e5dd] font-['JetBrains_Mono',monospace] text-[13px] overflow-hidden">
      {/* Column 1: File Upload & Actions */}
      <div className="bg-[#e8e5dd] p-5 border-r border-[#d0cdc4] overflow-y-auto">
        <div
          className="text-sm font-medium mb-6 mt-8 text-[#2a2a2a] select-none"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
          DITHER.STUDIO
        </div>

        <div className="mb-8" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <div className="text-sm text-[#666] mb-2">/SOURCE</div>

          {/* Upload / Generate / 3D / Waves source toggle (single source of truth) */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            <button
              onClick={() => { const st = useDitherStore.getState(); st.setThreeDEnabled(false); st.setGenerativeEnabled(false); st.setWaveFieldEnabled(false); }}
              className={`p-2 text-xs border transition-colors ${!ditherState.isGenerative && !ditherState.is3D && !ditherState.isWaveField ? 'bg-[#2a2a2a] text-[#e8e5dd] border-[#2a2a2a]' : 'bg-transparent text-[#666] border-[#d0cdc4] hover:border-[#2a2a2a]'}`}
            >
              UPLOAD
            </button>
            <button
              onClick={() => useDitherStore.getState().setGenerativeEnabled(true)}
              className={`p-2 text-xs border transition-colors ${ditherState.isGenerative ? 'bg-[#2a2a2a] text-[#e8e5dd] border-[#2a2a2a]' : 'bg-transparent text-[#666] border-[#d0cdc4] hover:border-[#2a2a2a]'}`}
            >
              GENERATE
            </button>
            <button
              onClick={() => useDitherStore.getState().setThreeDEnabled(true)}
              className={`p-2 text-xs border transition-colors ${ditherState.is3D ? 'bg-[#2a2a2a] text-[#e8e5dd] border-[#2a2a2a]' : 'bg-transparent text-[#666] border-[#d0cdc4] hover:border-[#2a2a2a]'}`}
            >
              3D
            </button>
            <button
              onClick={() => useDitherStore.getState().setWaveFieldEnabled(true)}
              className={`p-2 text-xs border transition-colors ${ditherState.isWaveField ? 'bg-[#2a2a2a] text-[#e8e5dd] border-[#2a2a2a]' : 'bg-transparent text-[#666] border-[#d0cdc4] hover:border-[#2a2a2a]'}`}
            >
              WAVES
            </button>
          </div>

          {ditherState.isWaveField ? (
            <div className="p-3 bg-[#f5f3ee] border border-[#d0cdc4] text-[10px] text-[#666] leading-relaxed">
              ∿ Flowing wave field — tune the look, colours, camera &amp; loop speed in the controls panel, then dither it. Animates + exports as a seamless loop.
            </div>
          ) : ditherState.is3D ? (
            <div className="p-3 bg-[#f5f3ee] border border-[#d0cdc4] text-[10px] text-[#666] leading-relaxed">
              ▣ Rendering a 3D object — pick the shape, material, camera &amp; PS1 look in the controls panel, then dither it.
            </div>
          ) : !ditherState.isGenerative ? (
            <>
              <UploadZone onBatchSelect={(files) => setBatchFiles(files)} />
              {batchFiles.length > 0 && (
                <div className="mt-2 p-2 bg-[#f5f3ee] border border-[#d0cdc4] text-[10px]">
                  <div className="flex justify-between items-center mb-2">
                    <span>{batchFiles.length} FILES SELECTED</span>
                    <button onClick={() => setBatchFiles([])} className="text-[#e74c3c]">CLEAR</button>
                  </div>
                  <button
                    onClick={exportBatch}
                    disabled={isBatchProcessing}
                    className="w-full p-2 bg-[#2a2a2a] text-[#e8e5dd] transition-opacity hover:opacity-80 disabled:opacity-40"
                  >
                    {isBatchProcessing ? `PROCESSING ${exportProgress}%` : 'GENERATE BATCH ZIP'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="p-3 bg-[#f5f3ee] border border-[#d0cdc4] text-[10px] text-[#666] leading-relaxed">
              ✦ Generating a background — tune the pattern, colours, grid, bands &amp; motion in the controls panel. Presets: Hotcoin, Tunnel, Aurora…
            </div>
          )}
        </div>

        {/* Presets Section */}
        <div className="mb-8">
          <div className="text-sm text-[#666] mb-2">/PRESETS</div>

          {/* Preset Dropdown */}
          <select
            value={selectedPresetId}
            onChange={(e) => handlePresetSelect(e.target.value)}
            disabled={isLoading}
            className="w-full p-3 mb-2 bg-[#f5f3ee] text-[#2a2a2a] border border-[#d0cdc4] cursor-pointer font-['JetBrains_Mono',monospace] text-xs focus:outline-none focus:border-[#2a2a2a] disabled:opacity-50"
          >
            <option value="">{isLoading ? 'Loading...' : '-- Select a preset --'}</option>
            <optgroup label="Built-in Presets">
              {builtInPresets.map(preset => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </optgroup>
            {savedPresets.length > 0 && (
              <optgroup label="My Presets">
                {savedPresets.map(preset => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>

          {/* Save Current Settings Button */}
          {!showSaveDialog ? (
            <button
              onClick={() => setShowSaveDialog(true)}
              className="w-full p-2 bg-[#2a2a2a] text-[#e8e5dd] border-none cursor-pointer font-['JetBrains_Mono',monospace] text-xs transition-opacity hover:opacity-80"
            >
              + SAVE CURRENT SETTINGS
            </button>
          ) : (
            <div className="p-3 border border-[#d0cdc4] bg-[#f5f3ee]">
              <input
                type="text"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder="Enter preset name..."
                className="w-full p-2 mb-2 bg-white text-[#2a2a2a] border border-[#d0cdc4] font-['JetBrains_Mono',monospace] text-xs focus:outline-none focus:border-[#2a2a2a]"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isSaving) saveNewPreset();
                  if (e.key === 'Escape') {
                    setShowSaveDialog(false);
                    setNewPresetName('');
                  }
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={saveNewPreset}
                  disabled={!newPresetName.trim() || isSaving}
                  className="flex-1 p-2 bg-[#2a2a2a] text-[#e8e5dd] border-none cursor-pointer font-['JetBrains_Mono',monospace] text-xs transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'SAVING...' : 'SAVE'}
                </button>
                <button
                  onClick={() => {
                    setShowSaveDialog(false);
                    setNewPresetName('');
                  }}
                  className="flex-1 p-2 bg-transparent text-[#2a2a2a] border border-[#d0cdc4] cursor-pointer font-['JetBrains_Mono',monospace] text-xs transition-opacity hover:opacity-80"
                >
                  CANCEL
                </button>
              </div>
            </div>
          )}

          {/* Delete selected user preset */}
          {selectedPresetId && selectedPresetId.startsWith('file-') && (
            <button
              onClick={() => {
                if (confirm('Delete this preset?')) {
                  deletePreset(selectedPresetId);
                }
              }}
              className="w-full p-2 mt-2 bg-transparent text-[#999] border border-[#d0cdc4] cursor-pointer font-['JetBrains_Mono',monospace] text-xs transition-opacity hover:opacity-80 hover:text-[#e74c3c] hover:border-[#e74c3c]"
            >
              DELETE PRESET
            </button>
          )}
        </div>

        <div className="mb-8">
          <div className="text-sm text-[#666] mb-2">/EXPORT</div>

          <button
            onClick={() => exportImage('png')}
            className="w-full p-3 bg-[#2a2a2a] text-[#e8e5dd] border-none cursor-pointer font-['JetBrains_Mono',monospace] text-sm transition-opacity hover:opacity-80"
          >
            EXPORT PNG
          </button>

          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="w-full p-2 mt-2 bg-transparent text-[#666] border border-[#d0cdc4] cursor-pointer font-['JetBrains_Mono',monospace] text-xs transition-opacity hover:opacity-80"
          >
            {showExportMenu ? '▲ LESS OPTIONS' : '▼ MORE OPTIONS'}
          </button>

          {showExportMenu && (
            <div className="mt-2 p-3 border border-[#d0cdc4] bg-[#f5f3ee]">
              <div className="mb-3">
                <button
                  onClick={() => exportImage('jpeg')}
                  className="w-full p-2 bg-transparent text-[#2a2a2a] border border-[#d0cdc4] cursor-pointer font-['JetBrains_Mono',monospace] text-xs transition-opacity hover:opacity-80 hover:bg-[#e8e5dd]"
                >
                  EXPORT JPG
                </button>
                <div className="flex items-center mt-2 gap-2">
                  <span className="text-[10px] text-[#666]">Quality:</span>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={jpegQuality}
                    onChange={(e) => setJpegQuality(Number(e.target.value))}
                    className="flex-1 h-[2px] bg-[#d0cdc4] outline-none appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#2a2a2a] [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-[#2a2a2a] [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:cursor-pointer"
                  />
                  <span className="text-[10px] text-[#2a2a2a] w-8">{Math.round(jpegQuality * 100)}%</span>
                </div>
              </div>

              <button
                onClick={() => exportImage('webp')}
                className="w-full p-2 mb-2 bg-transparent text-[#2a2a2a] border border-[#d0cdc4] cursor-pointer font-['JetBrains_Mono',monospace] text-xs transition-opacity hover:opacity-80 hover:bg-[#e8e5dd]"
              >
                EXPORT WEBP
              </button>

              {/* SVG Export Option (New) */}
              {ditherState.asciiMode === 0 && (
                <button
                  onClick={handleExportSVG}
                  className="w-full text-left p-2 mb-2 bg-transparent text-[#2a2a2a] border border-[#d0cdc4] cursor-pointer font-['JetBrains_Mono',monospace] text-xs transition-opacity hover:opacity-80 hover:bg-[#e8e5dd]"
                >
                  EXPORT SVG (VECTOR)
                </button>
              )}

              <div className="border-t border-[#d0cdc4] pt-2 mt-2">
                <div className="text-[10px] text-[#666] mb-2">PRESET FILE</div>
                <button
                  onClick={exportPresetFile}
                  className="w-full p-2 mb-1 bg-transparent text-[#2a2a2a] border border-[#d0cdc4] cursor-pointer font-['JetBrains_Mono',monospace] text-xs transition-opacity hover:opacity-80 hover:bg-[#e8e5dd]"
                >
                  EXPORT PRESET (.json)
                </button>
                <button
                  onClick={() => presetInputRef.current?.click()}
                  className="w-full p-2 bg-transparent text-[#2a2a2a] border border-[#d0cdc4] cursor-pointer font-['JetBrains_Mono',monospace] text-xs transition-opacity hover:opacity-80 hover:bg-[#e8e5dd]"
                >
                  IMPORT PRESET (.json)
                </button>
                <input
                  ref={presetInputRef}
                  type="file"
                  accept=".json"
                  onChange={loadPresetFile}
                  className="hidden"
                />
              </div>

              <div className="border-t border-[#d0cdc4] pt-2 mt-2">
                <div className="text-[10px] text-[#666] mb-2">PALETTE</div>
                <button
                  onClick={exportPalette}
                  className="w-full p-2 bg-transparent text-[#2a2a2a] border border-[#d0cdc4] cursor-pointer font-['JetBrains_Mono',monospace] text-xs transition-opacity hover:opacity-80 hover:bg-[#e8e5dd]"
                >
                  EXPORT PALETTE (.hex)
                </button>
              </div>

              {/* Video/GIF Export */}
              <div className="border-t border-[#d0cdc4] pt-2 mt-2">
                <div className="text-[10px] text-[#666] mb-2">VIDEO / GIF</div>

                {/* Duration & FPS Controls */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] text-[#666]">Duration:</span>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={exportDuration}
                    onChange={(e) => setExportDuration(Number(e.target.value))}
                    className="w-12 p-1 bg-white text-[#2a2a2a] border border-[#d0cdc4] font-['JetBrains_Mono',monospace] text-[10px] focus:outline-none"
                  />
                  <span className="text-[10px] text-[#666]">sec</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] text-[#666]">FPS:</span>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={exportFps}
                    onChange={(e) => setExportFps(Number(e.target.value))}
                    className="w-12 p-1 bg-white text-[#2a2a2a] border border-[#d0cdc4] font-['JetBrains_Mono',monospace] text-[10px] focus:outline-none"
                  />
                </div>

                {(((ditherState.isGenerative && ditherState.generativeAnimate) || (ditherState.is3D && ditherState.object3DAutoRotate) || ditherState.isWaveField || ditherState.fxAnimate || ditherState.analogWobble > 0 || ditherState.analogHum > 0)) && (
                  <label className="flex items-center gap-2 mb-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={loopExport}
                      onChange={(e) => setLoopExport(e.target.checked)}
                      className="w-3.5 h-3.5 accent-[#2a2a2a]"
                    />
                    <span className="text-[10px] text-[#666]">
                      🔁 Seamless loop
                      {(() => {
                        const genAnim = ditherState.isGenerative && ditherState.generativeAnimate && ditherState.generativeMotion !== 6;
                        const threeDAnim = ditherState.is3D && ditherState.object3DAutoRotate;
                        const waveAnim = ditherState.isWaveField;
                        const analogAnim = ditherState.analogWobble > 0 || ditherState.analogHum > 0;
                        const speed = genAnim ? ditherState.generativeSpeed : threeDAnim ? ditherState.object3DAutoSpeed : waveAnim ? ditherState.waveSpeed : (ditherState.fxAnimate ? ditherState.fxSpeed : (analogAnim ? 0.5 : 0));
                        if (!loopExport || speed <= 0) return '';
                        const period = (2 * Math.PI) / Math.max(speed, 0.05);
                        const cycles = Math.max(1, Math.round(exportDuration / period));
                        return ` · ${(cycles * period).toFixed(1)}s`;
                      })()}
                    </span>
                  </label>
                )}

                <label className="flex items-start gap-2 mb-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={ditherState.videoMaxDetail}
                    onChange={(e) => ditherState.setGlobalSetting('videoMaxDetail', e.target.checked)}
                    className="w-3.5 h-3.5 mt-0.5 accent-[#2a2a2a]"
                  />
                  <span className="text-[10px] text-[#666] leading-snug">
                    Max-detail video (VP9 · up to 8K)
                    <br />
                    <span className="text-[#999]">
                      {ditherState.videoMaxDetail
                        ? '⚠ exact colors at full detail, but the .mp4 plays only in VLC / Chrome'
                        : 'off = H.264/4K, plays everywhere (dither rendered a touch coarser to keep colors exact)'}
                    </span>
                  </span>
                </label>

                {isExporting && (
                  <div className="mb-2">
                    <div className="text-[10px] text-[#666] mb-1">Exporting... {exportProgress}%</div>
                    <div className="w-full h-1 bg-[#d0cdc4] rounded">
                      <div
                        className="h-1 bg-[#2a2a2a] rounded transition-all"
                        style={{ width: `${exportProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={exportGIF}
                  disabled={isExporting}
                  className="w-full p-2 mb-1 bg-transparent text-[#2a2a2a] border border-[#d0cdc4] cursor-pointer font-['JetBrains_Mono',monospace] text-xs transition-opacity hover:opacity-80 hover:bg-[#e8e5dd] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  EXPORT GIF
                </button>
                <button
                  onClick={exportVideo}
                  disabled={isExporting}
                  className="w-full p-2 bg-transparent text-[#2a2a2a] border border-[#d0cdc4] cursor-pointer font-['JetBrains_Mono',monospace] text-xs transition-opacity hover:opacity-80 hover:bg-[#e8e5dd] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  EXPORT VIDEO (MP4 / WebM)
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mb-8">
          <div className="text-sm text-[#666] mb-2">/ACTIONS</div>
          <button
            onClick={() => useDitherStore.getState().surpriseMe()}
            className="w-full p-3 mb-2 bg-[#2a2a2a] text-[#e8e5dd] border-none cursor-pointer font-['JetBrains_Mono',monospace] text-sm transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
          >
            ✦ SURPRISE ME
          </button>
          <button
            onClick={() => {
              useDitherStore.getState().resetAll();
              setSelectedPresetId('');
            }}
            className="w-full p-3 bg-transparent text-[#2a2a2a] border border-[#d0cdc4] cursor-pointer font-['JetBrains_Mono',monospace] text-sm transition-opacity hover:opacity-80"
          >
            RESET ALL
          </button>
        </div>
      </div>

      {/* Column 2: Controls */}
      <div className="bg-[#e8e5dd] p-5 border-r border-[#d0cdc4] overflow-y-auto relative">
        <div className="absolute top-0 left-0 right-0 h-6" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties} />
        <div className="mt-8">
          <SimplifiedSettings />
        </div>
      </div>

      {/* Column 3: Canvas */}
      <div className="relative bg-[#e8e5dd]">
        <div className="absolute top-0 left-0 right-0 h-6 z-10" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties} />
        <WebGLCanvas />
      </div>
    </div>
  );
}
