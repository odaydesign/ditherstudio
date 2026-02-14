'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { generateSVG } from '@/lib/utils/svgGenerator';
import WebGLCanvas from './canvas/WebGLCanvas';
import UploadZone from './controls/UploadZone';
import SimplifiedSettings from './controls/SimplifiedSettings';
import { useDitherStore } from '@/store/ditherStore';
import GIF from 'gif.js';

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

export default function DitherStudio() {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [jpegQuality, setJpegQuality] = useState(0.9);
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

  const exportImage = (format: 'png' | 'jpeg' | 'webp') => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    const mimeType = format === 'png' ? 'image/png' : format === 'jpeg' ? 'image/jpeg' : 'image/webp';
    const quality = format === 'jpeg' ? jpegQuality : undefined;

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dithered-image.${format}`;
        a.click();
        URL.revokeObjectURL(url);
      }
    }, mimeType, quality);

    setShowExportMenu(false);
  };

  const handleExportSVG = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const svgString = generateSVG(canvas, ditherState); // ditherState is accessible from component scope
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dither-geometric.svg';
      a.click();
      URL.revokeObjectURL(url);
      setShowExportMenu(false);
    }
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

  // Export GIF
  const exportGIF = useCallback(() => {
    const canvas = document.querySelector('canvas');
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

    const totalFrames = exportDuration * exportFps;
    const frameDelay = 1000 / exportFps;
    let frameCount = 0;

    const captureFrame = () => {
      if (frameCount >= totalFrames) {
        gif.render();
        return;
      }

      gif.addFrame(canvas, { copy: true, delay: frameDelay });
      frameCount++;
      setExportProgress(Math.round((frameCount / totalFrames) * 100));
      requestAnimationFrame(captureFrame);
    };

    gif.on('finished', (blob: Blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dithered-animation.gif`;
      a.click();
      URL.revokeObjectURL(url);
      setIsExporting(false);
      setExportProgress(0);
    });

    captureFrame();
  }, [exportDuration, exportFps]);

  // Export Video (WebM)
  const exportVideo = useCallback(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    setIsExporting(true);
    setExportProgress(0);
    recordedChunksRef.current = [];

    const stream = canvas.captureStream(exportFps);
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm; codecs=vp9',
    });

    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        recordedChunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dithered-video.webm`;
      a.click();
      URL.revokeObjectURL(url);
      setIsExporting(false);
      setExportProgress(0);
    };

    mediaRecorder.start();

    // Progress tracking
    let elapsed = 0;
    const progressInterval = setInterval(() => {
      elapsed += 100;
      setExportProgress(Math.round((elapsed / (exportDuration * 1000)) * 100));
    }, 100);

    // Stop after duration
    setTimeout(() => {
      clearInterval(progressInterval);
      mediaRecorder.stop();
    }, exportDuration * 1000);
  }, [exportDuration, exportFps]);

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
          <div className="text-sm text-[#666] mb-2">/UPLOAD</div>
          <UploadZone />
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
                  EXPORT JPEG
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
                    max="30"
                    value={exportFps}
                    onChange={(e) => setExportFps(Number(e.target.value))}
                    className="w-12 p-1 bg-white text-[#2a2a2a] border border-[#d0cdc4] font-['JetBrains_Mono',monospace] text-[10px] focus:outline-none"
                  />
                </div>

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
                  EXPORT VIDEO (WebM)
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
