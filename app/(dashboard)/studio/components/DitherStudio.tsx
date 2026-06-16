'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { generateSVG } from '@/lib/utils/svgGenerator';
import WebGLCanvas from './canvas/WebGLCanvas';
import UploadZone from './controls/UploadZone';
import SimplifiedSettings from './controls/SimplifiedSettings';
import GenerativePanel from './controls/GenerativePanel';
import Object3DPanel from './controls/Object3DPanel';
import WaveFieldPanel from './controls/WaveFieldPanel';
import GlassPanel from './controls/GlassPanel';
import LayersPanel from './controls/LayersPanel';
import TextPanel from './controls/TextPanel';
import { useDitherStore } from '@/store/ditherStore';
import { initHistory, undo, redo, useHistoryMeta } from '@/lib/history';
import { generatorExport } from '@/lib/three/generatorController';
import GIF from 'gif.js';
import JSZip from 'jszip';

// ---- Inline icon set (no dependency) — 16px stroke icons for the command bar ----
const ic = 'w-[15px] h-[15px]';
const IconUpload = () => (<svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4M7 9l5-5 5 5M5 20h14" /></svg>);
const IconGenerate = () => (<svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.8 4.6L18 9l-4.2 1.4L12 15l-1.8-4.6L6 9l4.2-1.4L12 3zM19 14l.9 2.3L22 17l-2.1.7L19 20l-.9-2.3L16 17l2.1-.7L19 14z" /></svg>);
const IconCube = () => (<svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l9 5v10l-9 5-9-5V7l9-5zM3 7l9 5 9-5M12 12v10" /></svg>);
const IconWave = () => (<svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12c2.5-4 5-4 7.5 0s5 4 7.5 0 5-4 5 0" /></svg>);
const IconGlass = () => (<svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M8 3.5v17M12.5 3.5v17M16.5 3.5v17" /></svg>);
const IconLayers = () => (<svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="3" /><rect x="7.5" y="7.5" width="9" height="9" rx="2" /></svg>);
const IconText = () => (<svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16M4 5v2m16-2v2M12 5v14m-3 0h6" /></svg>);
const IconShuffle = () => (<svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" /></svg>);
const IconReset = () => (<svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5" /></svg>);
const IconUndo = () => (<svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14L4 9l5-5M4 9h11a5 5 0 0 1 0 10h-4" /></svg>);
const IconRedo = () => (<svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14l5-5-5-5M20 9H9a5 5 0 0 0 0 10h4" /></svg>);
const IconCopy = () => (<svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>);
const IconCheck = () => (<svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>);
const IconHelp = () => (<svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 0 1 4.5 1.5c0 1.5-2 2-2 3.5" /><path d="M12 17.5h.01" /></svg>);
const IconExpand = () => (<svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3m13-5v3a2 2 0 0 1-2 2h-3" /></svg>);
const IconShrink = () => (<svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3m13-5h-3a2 2 0 0 0-2 2v3" /></svg>);
const IconCompare = () => (<svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 3v18" /><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none" /></svg>);
const IconExport = () => (<svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" /></svg>);

function PanelHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="h-11 shrink-0 flex items-center justify-between px-4 border-b border-white/10">
      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">{title}</span>
      {subtitle && <span className="text-[10px] text-white/35 lowercase tracking-normal">{subtitle}</span>}
    </div>
  );
}


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
  const projectInputRef = useRef<HTMLInputElement>(null);

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
  const canUndo = useHistoryMeta((s) => s.canUndo);
  const canRedo = useHistoryMeta((s) => s.canRedo);
  const [justCopied, setJustCopied] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

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

  // Portable project file: serialise the whole store (minus file/transient fields)
  // to JSON so the full studio state can be saved and reloaded anywhere (web too).
  const saveProject = () => {
    const s = useDitherStore.getState() as unknown as Record<string, unknown>;
    const SKIP = new Set(['currentFile', 'isWebcam', 'isVideo', 'fps', 'compareOriginal', 'savedColors']);
    const data: Record<string, unknown> = {};
    for (const k in s) {
      if (typeof s[k] === 'function' || SKIP.has(k)) continue;
      data[k] = s[k];
    }
    const blob = new Blob([JSON.stringify({ app: 'ditherstudio', version: 1, settings: data }, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `dither-project-${Date.now()}.json`);
  };

  const loadProjectFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const settings = (parsed && parsed.settings) || parsed;
        if (!settings || typeof settings !== 'object') return;
        const cur = useDitherStore.getState() as unknown as Record<string, unknown>;
        const next: Record<string, unknown> = {};
        for (const k in settings) {
          if (k in cur && typeof cur[k] !== 'function' && k !== 'currentFile') next[k] = settings[k];
        }
        useDitherStore.setState(next);
        setSelectedPresetId('');
      } catch (err) {
        console.error('Invalid project file', err);
      }
    };
    reader.readAsText(file);
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
    if (!s.isGenerative && !s.is3D && !s.isWaveField && !s.isGlass && !s.isLayers) return { w: c?.width || s.outputWidth, h: c?.height || s.outputHeight };
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
    if ((s.isGenerative || s.is3D || s.isWaveField || s.isGlass || s.isLayers || s.isText) && generatorExport.beginExport && generatorExport.renderStillFrame) {
      const { w, h } = exportDims();
      generatorExport.beginExport(w, h);
      generatorExport.renderStillFrame();
      grab(() => generatorExport.endExport?.());
    } else {
      grab();
    }
    setShowExportMenu(false);
  };

  const copyToClipboard = async () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas || typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) return;
    try {
      const blob: Blob | null = await new Promise((res) => canvas.toBlob((b) => res(b), 'image/png'));
      if (!blob) return;
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 1200);
    } catch (err) {
      console.error('Copy to clipboard failed', err);
    }
  };

  // Undo/redo history + global keyboard shortcuts.
  useEffect(() => {
    initHistory();
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      const meta = e.metaKey || e.ctrlKey;
      if (meta && (e.key === 'z' || e.key === 'Z')) { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
      if (meta && (e.key === 'y' || e.key === 'Y')) { e.preventDefault(); redo(); return; }
      if (meta) return;
      const st = useDitherStore.getState();
      switch (e.key) {
        case 'r': case 'R': st.resetAll(); setSelectedPresetId(''); break;
        case 'e': case 'E': exportImage('png'); break;
        case 'c': case 'C': copyToClipboard(); break;
        case 'b': case 'B': st.setGlobalSetting('compareOriginal', true); break;
        case 'f': case 'F': setFocusMode((v) => !v); break;
        case '?': setShowShortcuts((v) => !v); break;
        case 'Escape': setShowShortcuts(false); setFocusMode(false); break;
        case '1': st.setGenerativeEnabled(false); st.setThreeDEnabled(false); st.setWaveFieldEnabled(false); st.setGlassEnabled(false); st.setLayersEnabled(false); st.setTextEnabled(false); break;
        case '2': st.setGenerativeEnabled(true); break;
        case '3': st.setThreeDEnabled(true); break;
        case '4': st.setWaveFieldEnabled(true); break;
        case '5': st.setGlassEnabled(true); break;
        case '6': st.setLayersEnabled(true); break;
        case '7': st.setTextEnabled(true); break;
        default: return;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'b' || e.key === 'B') useDitherStore.getState().setGlobalSetting('compareOriginal', false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKeyUp); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    // Glass source loops the same way: uPhase = t * glassSpeed.
    const glassAnim = s.isGlass;
    const layersAnim = s.isLayers;
    // Smooth analog motion (wobble / hum bar) also benefits from a seamless loop;
    // it's phase-locked to this same speed via uAnalogRate (fallback 0.5).
    const analogAnim = s.analogWobble > 0 || s.analogHum > 0;
    const speed = genAnim ? s.generativeSpeed
      : threeDAnim ? s.object3DAutoSpeed
      : waveAnim ? s.waveSpeed
      : glassAnim ? s.glassSpeed
      : layersAnim ? s.layersSpeed
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
    if ((gs.isGenerative && gs.generativeAnimate) || (gs.is3D && gs.object3DAutoRotate) || gs.isWaveField || gs.isGlass || gs.isLayers || gs.fxAnimate || analogAnim) {
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
    <div className="h-screen flex flex-col bg-transparent font-sans text-[13px] text-white/90 overflow-hidden">
      {/* ===== Command bar ===== */}
      <header className="h-12 shrink-0 flex items-center gap-2 px-3 border-b border-white/10 bg-white/[0.04] backdrop-blur-2xl relative z-30" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
        <div className="flex items-center pl-[68px] pr-1 select-none">
          <span className="text-[12px] font-semibold tracking-[0.24em] text-white/95">DITHER<span className="text-white/35">.</span>STUDIO</span>
        </div>
        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* Source segmented control */}
        <div className="flex items-center gap-0.5 p-1 rounded-xl bg-white/[0.05] border border-white/10" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <button onClick={() => { const st = useDitherStore.getState(); st.setThreeDEnabled(false); st.setGenerativeEnabled(false); st.setWaveFieldEnabled(false); }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-colors ${!ditherState.isGenerative && !ditherState.is3D && !ditherState.isWaveField ? 'bg-white text-[#0b0b0d]' : 'text-white/60 hover:text-white hover:bg-white/10'}`}><IconUpload />Upload</button>
          <button onClick={() => useDitherStore.getState().setGenerativeEnabled(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-colors ${ditherState.isGenerative ? 'bg-white text-[#0b0b0d]' : 'text-white/60 hover:text-white hover:bg-white/10'}`}><IconGenerate />Generate</button>
          <button onClick={() => useDitherStore.getState().setThreeDEnabled(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-colors ${ditherState.is3D ? 'bg-white text-[#0b0b0d]' : 'text-white/60 hover:text-white hover:bg-white/10'}`}><IconCube />3D</button>
          <button onClick={() => useDitherStore.getState().setWaveFieldEnabled(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-colors ${ditherState.isWaveField ? 'bg-white text-[#0b0b0d]' : 'text-white/60 hover:text-white hover:bg-white/10'}`}><IconWave />Waves</button>
          <button onClick={() => useDitherStore.getState().setGlassEnabled(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-colors ${ditherState.isGlass ? 'bg-white text-[#0b0b0d]' : 'text-white/60 hover:text-white hover:bg-white/10'}`}><IconGlass />Glass</button>
          <button onClick={() => useDitherStore.getState().setLayersEnabled(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-colors ${ditherState.isLayers ? 'bg-white text-[#0b0b0d]' : 'text-white/60 hover:text-white hover:bg-white/10'}`}><IconLayers />Layers</button>
          <button onClick={() => useDitherStore.getState().setTextEnabled(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-colors ${ditherState.isText ? 'bg-white text-[#0b0b0d]' : 'text-white/60 hover:text-white hover:bg-white/10'}`}><IconText />Text</button>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-1.5" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <button onClick={() => setShowShortcuts(true)} title="Keyboard shortcuts (?)" className="w-8 h-8 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10">
            <IconHelp />
          </button>
          <button onClick={() => setFocusMode((v) => !v)} title="Focus mode (F)" className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors ${focusMode ? 'text-white bg-white/10 border-white/20' : 'text-white/70 hover:text-white hover:bg-white/10 border-transparent hover:border-white/10'}`}>
            {focusMode ? <IconShrink /> : <IconExpand />}
          </button>
          <div className="w-px h-5 bg-white/10 mx-0.5" />
          <button onClick={() => undo()} disabled={!canUndo} title="Undo (⌘Z)" className="w-8 h-8 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-default">
            <IconUndo />
          </button>
          <button onClick={() => redo()} disabled={!canRedo} title="Redo (⌘⇧Z)" className="w-8 h-8 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-default">
            <IconRedo />
          </button>
          <div className="w-px h-5 bg-white/10 mx-0.5" />
          <button
            onPointerDown={() => useDitherStore.getState().setGlobalSetting('compareOriginal', true)}
            onPointerUp={() => useDitherStore.getState().setGlobalSetting('compareOriginal', false)}
            onPointerLeave={() => useDitherStore.getState().setGlobalSetting('compareOriginal', false)}
            title="Hold to compare original (B)"
            className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors ${ditherState.compareOriginal ? 'text-white bg-white/10 border-white/20' : 'text-white/70 hover:text-white hover:bg-white/10 border-transparent hover:border-white/10'}`}>
            <IconCompare />
          </button>
          <button onClick={copyToClipboard} title="Copy to clipboard (C)" className={`w-8 h-8 flex items-center justify-center rounded-lg border border-transparent transition-colors ${justCopied ? 'text-emerald-400' : 'text-white/70 hover:text-white hover:bg-white/10 hover:border-white/10'}`}>
            {justCopied ? <IconCheck /> : <IconCopy />}
          </button>
          <button onClick={() => useDitherStore.getState().surpriseMe()} title="Surprise me" className="w-8 h-8 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10">
            <IconShuffle />
          </button>
          <button onClick={() => { useDitherStore.getState().resetAll(); setSelectedPresetId(''); }} title="Reset all settings" className="flex items-center gap-1.5 pl-2.5 pr-3 h-8 rounded-lg text-white/80 text-xs font-medium border border-white/15 hover:bg-white/10 hover:text-white transition-colors">
            <IconReset />Reset
          </button>
          <button onClick={() => exportImage('png')} title="Quick export PNG" className="flex items-center gap-1.5 pl-2.5 pr-3 h-8 rounded-lg bg-white text-[#0b0b0d] text-xs font-medium hover:opacity-90 active:scale-[0.98] transition-all">
            <IconExport />Export
          </button>
        </div>
      </header>

      {focusMode && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[70] px-3 py-1.5 rounded-full bg-black/70 border border-white/10 text-[11px] text-white/70 backdrop-blur-md pointer-events-none">
          Focus mode — press <span className="text-white/95 font-medium">F</span> or <span className="text-white/95 font-medium">Esc</span> to exit
        </div>
      )}

      {showShortcuts && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowShortcuts(false)}>
          <div className="w-[320px] rounded-2xl border border-white/12 bg-[#161619] p-5 shadow-[0_24px_70px_-15px_rgba(0,0,0,0.85)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-sm font-medium text-white">Keyboard shortcuts</h3>
              <button onClick={() => setShowShortcuts(false)} className="text-white/50 hover:text-white text-lg leading-none">×</button>
            </div>
            <div className="space-y-2 text-xs">
              {([
                ['Undo / Redo', '⌘Z / ⌘⇧Z'],
                ['Reset all', 'R'],
                ['Export PNG', 'E'],
                ['Copy to clipboard', 'C'],
                ['Compare original (hold)', 'B'],
                ['Focus mode', 'F'],
                ['Switch source', '1 – 7'],
                ['This help', '?'],
              ] as [string, string][]).map(([label, key]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-white/65">{label}</span>
                  <kbd className="px-1.5 py-0.5 rounded-md bg-white/[0.08] border border-white/10 text-white/90 font-mono text-[11px]">{key}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== Body ===== */}
      <div className="flex-1 flex min-h-0">
        {/* LEFT — Source */}
        <aside className={`w-[300px] shrink-0 flex-col border-r border-white/10 bg-white/[0.025] backdrop-blur-2xl ${focusMode ? 'hidden' : 'flex'}`}>
          <PanelHeader title="Source" subtitle={ditherState.isText ? 'text' : ditherState.isLayers ? 'layers' : ditherState.isGlass ? 'glass' : ditherState.isWaveField ? 'wave field' : ditherState.is3D ? '3d object' : ditherState.isGenerative ? 'generative' : 'upload'} />
          <div className="flex-1 overflow-y-auto p-4">
            {/* Source creative controls */}
            <div className="mb-8">
              {ditherState.isText ? <TextPanel /> : ditherState.isLayers ? <LayersPanel /> : ditherState.isGlass ? <GlassPanel /> : ditherState.isWaveField ? <WaveFieldPanel /> : ditherState.is3D ? <Object3DPanel /> : ditherState.isGenerative ? <GenerativePanel /> : (
                <>
                  <UploadZone onBatchSelect={(files) => setBatchFiles(files)} />
                  {batchFiles.length > 0 && (
                    <div className="mt-2 p-2 bg-white/[0.045] border border-white/10 rounded-xl text-[10px]">
                      <div className="flex justify-between items-center mb-2">
                        <span>{batchFiles.length} FILES SELECTED</span>
                        <button onClick={() => setBatchFiles([])} className="text-[#e74c3c]">CLEAR</button>
                      </div>
                      <button
                        onClick={exportBatch}
                        disabled={isBatchProcessing}
                        className="w-full p-2 rounded-lg bg-white text-[#0b0b0d] transition-opacity hover:opacity-80 disabled:opacity-40"
                      >
                        {isBatchProcessing ? `PROCESSING ${exportProgress}%` : 'GENERATE BATCH ZIP'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

        {/* Presets Section */}
        <div className="mb-8">
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/40 mb-3">/PRESETS</div>

          {/* Preset Dropdown */}
          <select
            value={selectedPresetId}
            onChange={(e) => handlePresetSelect(e.target.value)}
            disabled={isLoading}
            className="w-full p-3 mb-2 bg-white/[0.045] text-white/90 border border-white/10 rounded-xl cursor-pointer font-sans text-xs focus:outline-none focus:border-white/40 disabled:opacity-50"
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
              className="w-full p-2 bg-white text-[#0b0b0d] border-none cursor-pointer font-sans text-xs transition-opacity hover:opacity-80"
            >
              + SAVE CURRENT SETTINGS
            </button>
          ) : (
            <div className="p-3 border border-white/10 rounded-xl bg-white/[0.045]">
              <input
                type="text"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder="Enter preset name..."
                className="w-full p-2 mb-2 bg-white/[0.06] text-white/90 border border-white/10 rounded-xl font-sans text-xs focus:outline-none focus:border-white/40"
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
                  className="flex-1 p-2 bg-white text-[#0b0b0d] border-none cursor-pointer font-sans text-xs transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'SAVING...' : 'SAVE'}
                </button>
                <button
                  onClick={() => {
                    setShowSaveDialog(false);
                    setNewPresetName('');
                  }}
                  className="flex-1 p-2 bg-transparent text-white/90 border border-white/10 rounded-xl cursor-pointer font-sans text-xs transition-opacity hover:opacity-80"
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
              className="w-full p-2 mt-2 bg-transparent text-white/40 border border-white/10 rounded-xl cursor-pointer font-sans text-xs transition-opacity hover:opacity-80 hover:text-[#e74c3c] hover:border-[#e74c3c]"
            >
              DELETE PRESET
            </button>
          )}
        </div>

        <div className="mb-8">
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/40 mb-3">/PROJECT</div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={saveProject}
              className="p-2 bg-white/[0.045] text-white/90 border border-white/10 rounded-xl cursor-pointer font-sans text-xs transition-colors hover:border-white/40 hover:bg-white/[0.08]">
              Save Project
            </button>
            <button onClick={() => projectInputRef.current?.click()}
              className="p-2 bg-white/[0.045] text-white/90 border border-white/10 rounded-xl cursor-pointer font-sans text-xs transition-colors hover:border-white/40 hover:bg-white/[0.08]">
              Open Project
            </button>
          </div>
          <input ref={projectInputRef} type="file" accept=".json,application/json" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) loadProjectFile(f); e.currentTarget.value = ''; }} />
          <p className="text-[10px] text-white/40 mt-2">Saves all settings to a portable .json file.</p>
        </div>

        <div className="mb-8">
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/40 mb-3">/EXPORT</div>

          <button
            onClick={() => exportImage('png')}
            className="w-full p-3 bg-white text-[#0b0b0d] border-none cursor-pointer font-sans text-sm transition-opacity hover:opacity-80"
          >
            EXPORT PNG
          </button>

          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="w-full p-2 mt-2 bg-transparent text-white/55 border border-white/10 rounded-xl cursor-pointer font-sans text-xs transition-opacity hover:opacity-80"
          >
            {showExportMenu ? '▲ LESS OPTIONS' : '▼ MORE OPTIONS'}
          </button>

          {showExportMenu && (
            <div className="mt-2 p-3 border border-white/10 rounded-xl bg-white/[0.045]">
              <div className="mb-3">
                <button
                  onClick={() => exportImage('jpeg')}
                  className="w-full p-2 bg-transparent text-white/90 border border-white/10 rounded-xl cursor-pointer font-sans text-xs transition-opacity hover:opacity-80 hover:bg-white/[0.05]"
                >
                  EXPORT JPG
                </button>
                <div className="flex items-center mt-2 gap-2">
                  <span className="text-[10px] text-white/55">Quality:</span>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={jpegQuality}
                    onChange={(e) => setJpegQuality(Number(e.target.value))}
                    className="flex-1 h-[2px] bg-white/20 outline-none appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:cursor-pointer"
                  />
                  <span className="text-[10px] text-white/90 w-8">{Math.round(jpegQuality * 100)}%</span>
                </div>
              </div>

              <button
                onClick={() => exportImage('webp')}
                className="w-full p-2 mb-2 bg-transparent text-white/90 border border-white/10 rounded-xl cursor-pointer font-sans text-xs transition-opacity hover:opacity-80 hover:bg-white/[0.05]"
              >
                EXPORT WEBP
              </button>

              {/* SVG Export Option (New) */}
              {ditherState.asciiMode === 0 && (
                <button
                  onClick={handleExportSVG}
                  className="w-full text-left p-2 mb-2 bg-transparent text-white/90 border border-white/10 rounded-xl cursor-pointer font-sans text-xs transition-opacity hover:opacity-80 hover:bg-white/[0.05]"
                >
                  EXPORT SVG (VECTOR)
                </button>
              )}

              <div className="border-t border-white/10 pt-2 mt-2">
                <div className="text-[10px] text-white/55 mb-2">PRESET FILE</div>
                <button
                  onClick={exportPresetFile}
                  className="w-full p-2 mb-1 bg-transparent text-white/90 border border-white/10 rounded-xl cursor-pointer font-sans text-xs transition-opacity hover:opacity-80 hover:bg-white/[0.05]"
                >
                  EXPORT PRESET (.json)
                </button>
                <button
                  onClick={() => presetInputRef.current?.click()}
                  className="w-full p-2 bg-transparent text-white/90 border border-white/10 rounded-xl cursor-pointer font-sans text-xs transition-opacity hover:opacity-80 hover:bg-white/[0.05]"
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

              <div className="border-t border-white/10 pt-2 mt-2">
                <div className="text-[10px] text-white/55 mb-2">PALETTE</div>
                <button
                  onClick={exportPalette}
                  className="w-full p-2 bg-transparent text-white/90 border border-white/10 rounded-xl cursor-pointer font-sans text-xs transition-opacity hover:opacity-80 hover:bg-white/[0.05]"
                >
                  EXPORT PALETTE (.hex)
                </button>
              </div>

              {/* Video/GIF Export */}
              <div className="border-t border-white/10 pt-2 mt-2">
                <div className="text-[10px] text-white/55 mb-2">VIDEO / GIF</div>

                {/* Duration & FPS Controls */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] text-white/55">Duration:</span>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={exportDuration}
                    onChange={(e) => setExportDuration(Number(e.target.value))}
                    className="w-12 p-1 bg-white/[0.06] text-white/90 border border-white/10 rounded-xl font-sans text-[10px] focus:outline-none"
                  />
                  <span className="text-[10px] text-white/55">sec</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] text-white/55">FPS:</span>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={exportFps}
                    onChange={(e) => setExportFps(Number(e.target.value))}
                    className="w-12 p-1 bg-white/[0.06] text-white/90 border border-white/10 rounded-xl font-sans text-[10px] focus:outline-none"
                  />
                </div>

                {(((ditherState.isGenerative && ditherState.generativeAnimate) || (ditherState.is3D && ditherState.object3DAutoRotate) || ditherState.isWaveField || ditherState.isGlass || ditherState.isLayers || ditherState.fxAnimate || ditherState.analogWobble > 0 || ditherState.analogHum > 0)) && (
                  <label className="flex items-center gap-2 mb-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={loopExport}
                      onChange={(e) => setLoopExport(e.target.checked)}
                      className="w-3.5 h-3.5 accent-white"
                    />
                    <span className="text-[10px] text-white/55">
                      🔁 Seamless loop
                      {(() => {
                        const genAnim = ditherState.isGenerative && ditherState.generativeAnimate && ditherState.generativeMotion !== 6;
                        const threeDAnim = ditherState.is3D && ditherState.object3DAutoRotate;
                        const waveAnim = ditherState.isWaveField;
                        const glassAnim = ditherState.isGlass;
                        const layersAnim = ditherState.isLayers;
                        const analogAnim = ditherState.analogWobble > 0 || ditherState.analogHum > 0;
                        const speed = genAnim ? ditherState.generativeSpeed : threeDAnim ? ditherState.object3DAutoSpeed : waveAnim ? ditherState.waveSpeed : glassAnim ? ditherState.glassSpeed : layersAnim ? ditherState.layersSpeed : (ditherState.fxAnimate ? ditherState.fxSpeed : (analogAnim ? 0.5 : 0));
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
                    className="w-3.5 h-3.5 mt-0.5 accent-white"
                  />
                  <span className="text-[10px] text-white/55 leading-snug">
                    Max-detail video (VP9 · up to 8K)
                    <br />
                    <span className="text-white/40">
                      {ditherState.videoMaxDetail
                        ? '⚠ exact colors at full detail, but the .mp4 plays only in VLC / Chrome'
                        : 'off = H.264/4K, plays everywhere (dither rendered a touch coarser to keep colors exact)'}
                    </span>
                  </span>
                </label>

                {isExporting && (
                  <div className="mb-2">
                    <div className="text-[10px] text-white/55 mb-1">Exporting... {exportProgress}%</div>
                    <div className="w-full h-1 bg-white/20 rounded">
                      <div
                        className="h-1 bg-white rounded transition-all"
                        style={{ width: `${exportProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={exportGIF}
                  disabled={isExporting}
                  className="w-full p-2 mb-1 bg-transparent text-white/90 border border-white/10 rounded-xl cursor-pointer font-sans text-xs transition-opacity hover:opacity-80 hover:bg-white/[0.05] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  EXPORT GIF
                </button>
                <button
                  onClick={exportVideo}
                  disabled={isExporting}
                  className="w-full p-2 bg-transparent text-white/90 border border-white/10 rounded-xl cursor-pointer font-sans text-xs transition-opacity hover:opacity-80 hover:bg-white/[0.05] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  EXPORT VIDEO (MP4 / WebM)
                </button>
              </div>
            </div>
          )}
        </div>

          </div>
        </aside>

        {/* CENTER — Canvas stage */}
        <main className="flex-1 min-w-0 relative bg-black/40">
          <WebGLCanvas />
        </main>

        {/* RIGHT — Adjust */}
        <aside className={`w-[340px] shrink-0 flex-col border-l border-white/10 bg-white/[0.025] backdrop-blur-2xl ${focusMode ? 'hidden' : 'flex'}`}>
          <PanelHeader title="Adjust" />
          <div className="flex-1 overflow-y-auto p-4">
            <SimplifiedSettings />
          </div>
        </aside>
      </div>
    </div>
  );
}
