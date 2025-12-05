'use client';

import { useEffect, useState } from 'react';
import { useDitherStore } from '@/store/ditherStore';
import { paletteCategories, getPaletteById } from '@/lib/palettes/retroPalettes';
import { algorithms } from '@/lib/three/algorithms';

const PRESET_PALETTES = [
  { name: 'Black & White', dark: '#000000', light: '#FFFFFF' },
  { name: 'Red & Cream', dark: '#8B3A3A', light: '#F5E6D3' },
  { name: 'Purple & Pink', dark: '#6B4A8E', light: '#E8C4E8' },
  { name: 'Green & Mint', dark: '#2D5F4F', light: '#C4E8D4' },
  { name: 'Blue & Powder', dark: '#3A5A7C', light: '#D4E4F5' },
  { name: 'Brown & Tan', dark: '#8B6347', light: '#F5DEC4' },
];

// Group algorithms by category for dropdown
const algorithmCategories = {
  'Popular': ['floyd', 'bayer4', 'halftone45', 'atkinson', 'blue', 'stipple'],
  'Error Diffusion': ['floyd', 'ostromoukhov', 'atkinson', 'jarvis', 'stucki', 'burkes', 'sierra', 'sierra2', 'sierralite'],
  'Ordered/Bayer': ['bayer2', 'bayer3', 'bayer4', 'bayer8', 'bayer16'],
  'Halftone/Print': ['halftone', 'halftone45', 'ellipse', 'diamond', 'dispersed', 'cluster'],
  'Artistic': ['dots', 'lines', 'crosshatch', 'stipple', 'spiral', 'voronoi'],
  'Noise': ['random', 'blue', 'perlin', 'voidcluster'],
  'Geometric': ['checkerssmall', 'checkersmedium', 'checkerslarge', 'wave', 'radialburst', 'vortex', 'mosaic'],
};

export default function SimplifiedSettings() {
  const {
    currentAlgorithm: algorithm,
    setAlgorithm,
    param1,
    param2,
    setParam,
    duotoneDark,
    duotoneLight,
    setGlobalSetting,
    brightness,
    contrast,
    ditherStrength,
    colors,
    colorMode,
    setColorMode,
    serpentine,
    threshold,
    gammaCorrect,
    scale,
    patternRandomization,
    edgePreservation,
    bandingReduction,
    colorSpace,
    scanlines,
    phosphor,
    curvature,
    vignette,
    chromatic,
    bloom,
    // Video/Animation
    isVideo,
    temporalDither,
    temporalSpeed,
    temporalWeight,
    frameBlending,
    frameBlendStrength,
    motionAdaptive,
    motionSensitivity,
    temporalStability
  } = useDitherStore();

  const [selectedRetroPreset, setSelectedRetroPreset] = useState<string | null>(null);

  const handlePaletteSelect = (dark: string, light: string) => {
    setGlobalSetting('duotoneDark', dark);
    setGlobalSetting('duotoneLight', light);
    setColorMode(2);
    setSelectedRetroPreset(null);
  };

  const handleRetroPresetSelect = (presetId: string) => {
    const preset = getPaletteById(presetId);
    if (!preset) return;

    setSelectedRetroPreset(presetId);
    setAlgorithm(preset.recommendedAlgorithm);
    setGlobalSetting('colors', preset.recommendedColors);

    if (preset.colors.length === 2) {
      setColorMode(2);
      setGlobalSetting('duotoneDark', preset.colors[0]);
      setGlobalSetting('duotoneLight', preset.colors[1]);
    } else if (preset.colors.length <= 4) {
      setColorMode(2);
      setGlobalSetting('duotoneDark', preset.colors[0]);
      setGlobalSetting('duotoneLight', preset.colors[preset.colors.length - 1]);
    } else {
      setColorMode(4);
      preset.colors.slice(0, 16).forEach((color, index) => {
        setGlobalSetting(`paletteColors[${index}]` as any, color);
      });
      setGlobalSetting('paletteSize', Math.min(preset.colors.length, 16));
    }
  };

  const handleAlgorithmChange = (shaderValue: number) => {
    setAlgorithm(shaderValue);
    setSelectedRetroPreset(null);
  };

  const currentAlgorithm = algorithms.find(a => a.shaderValue === algorithm);

  useEffect(() => {
    setAlgorithm(3);
    setColorMode(2);
  }, [setAlgorithm, setColorMode]);

  const sliderClass = "w-full h-[2px] bg-[#d0cdc4] outline-none appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#2a2a2a] [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-[#2a2a2a] [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:cursor-pointer";

  const sectionClass = "pb-5 mb-5 border-b border-[#d0cdc4]";

  return (
    <div className="space-y-1">

      {/* ============================================ */}
      {/* SECTION 1: ALGORITHM & DITHER SETTINGS */}
      {/* ============================================ */}
      <div className={sectionClass}>
        <h2 className="text-sm font-medium mb-4 text-[#2a2a2a]">ALGORITHM</h2>

        {/* Algorithm Dropdown */}
        <select
          value={algorithm}
          onChange={(e) => handleAlgorithmChange(Number(e.target.value))}
          className="w-full p-2 bg-[#e8e5dd] border border-[#d0cdc4] text-xs text-[#2a2a2a] font-['JetBrains_Mono',monospace] cursor-pointer hover:border-[#2a2a2a] mb-2"
        >
          {Object.entries(algorithmCategories).map(([category, algoIds]) => (
            <optgroup key={category} label={category}>
              {algoIds.map(id => {
                const algo = algorithms.find(a => a.id === id);
                if (!algo) return null;
                return (
                  <option key={algo.id} value={algo.shaderValue}>
                    {algo.name.split('(')[0].trim()}
                  </option>
                );
              })}
            </optgroup>
          ))}
        </select>

        {currentAlgorithm && (
          <div className="text-[10px] text-[#999] mb-3">{currentAlgorithm.category}</div>
        )}

        {/* Algorithm-specific parameters */}
        {currentAlgorithm?.params && Object.keys(currentAlgorithm.params).length > 0 && (
          <div className="space-y-3 mb-4">
            {Object.entries(currentAlgorithm.params).map(([key, param]) => (
              <div key={key}>
                <div className="flex justify-between mb-2">
                  <label className="text-xs text-[#666]">{param.label}</label>
                  <span className="text-xs text-[#2a2a2a] font-mono">
                    {param.uniformIndex === 1 ? param1.toFixed(2) : param2.toFixed(2)}
                  </span>
                </div>
                {param.type === 'discrete' && param.options ? (
                  <select
                    value={param.uniformIndex === 1 ? param1 : param2}
                    onChange={(e) => setParam(param.uniformIndex || 1, Number(e.target.value))}
                    className="w-full p-2 bg-[#e8e5dd] border border-[#d0cdc4] text-xs text-[#2a2a2a] font-['JetBrains_Mono',monospace] cursor-pointer"
                  >
                    {(param.options as number[]).map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="range"
                    min={param.min || 0}
                    max={param.max || 1}
                    step={param.step || 0.01}
                    value={param.uniformIndex === 1 ? param1 : param2}
                    onChange={(e) => setParam(param.uniformIndex || 1, Number(e.target.value))}
                    className={sliderClass}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Dither Quality Settings - Related to Algorithm */}
        <div className="space-y-3 pt-3 border-t border-[#e0ddd5]">
          <div className="flex justify-between mb-2">
            <label className="text-xs text-[#666]">Threshold</label>
            <span className="text-xs text-[#2a2a2a] font-mono">{threshold.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={threshold}
            onChange={(e) => setGlobalSetting('threshold', Number(e.target.value))}
            className={sliderClass}
          />

          <div className="flex justify-between mb-2 mt-3">
            <label className="text-xs text-[#666]">Pattern Scale</label>
            <span className="text-xs text-[#2a2a2a] font-mono">{scale.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="4"
            step="0.1"
            value={scale}
            onChange={(e) => setGlobalSetting('scale', Number(e.target.value))}
            className={sliderClass}
          />

          <div className="flex justify-between mb-2 mt-3">
            <label className="text-xs text-[#666]">Randomization</label>
            <span className="text-xs text-[#2a2a2a] font-mono">{patternRandomization.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={patternRandomization}
            onChange={(e) => setGlobalSetting('patternRandomization', Number(e.target.value))}
            className={sliderClass}
          />

          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-[#666]">Serpentine Scan</span>
            <input
              type="checkbox"
              checked={serpentine}
              onChange={(e) => setGlobalSetting('serpentine', e.target.checked)}
              className="w-4 h-4 cursor-pointer accent-[#2a2a2a]"
            />
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* SECTION 2: COLORS & PALETTE */}
      {/* ============================================ */}
      <div className={sectionClass}>
        <h2 className="text-sm font-medium mb-4 text-[#2a2a2a]">COLORS</h2>

        {/* Color Count */}
        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <label className="text-xs text-[#666]">Color Levels</label>
            <span className="text-xs text-[#2a2a2a] font-mono">{colors}</span>
          </div>
          <input
            type="range"
            min="2"
            max="256"
            step="1"
            value={colors}
            onChange={(e) => setGlobalSetting('colors', Number(e.target.value))}
            className={sliderClass}
          />
        </div>

        {/* Preset Color Swatches */}
        <div className="grid grid-cols-6 gap-2 mb-4">
          {PRESET_PALETTES.map((palette, idx) => (
            <button
              key={idx}
              onClick={() => handlePaletteSelect(palette.dark, palette.light)}
              className="aspect-square border border-[#d0cdc4] overflow-hidden cursor-pointer hover:border-[#2a2a2a] transition-colors"
              title={palette.name}
            >
              <div
                className="w-full h-full"
                style={{
                  background: `linear-gradient(135deg, ${palette.dark} 50%, ${palette.light} 50%)`
                }}
              />
            </button>
          ))}
        </div>

        {/* Ink and BG Color Pickers */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs text-[#666] mb-2">Ink</label>
            <div className="relative">
              <input
                type="color"
                value={duotoneDark}
                onChange={(e) => setGlobalSetting('duotoneDark', e.target.value)}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
              />
              <div className="w-full h-10 border border-[#d0cdc4]" style={{ backgroundColor: duotoneDark }} />
            </div>
          </div>
          <div>
            <label className="block text-xs text-[#666] mb-2">Background</label>
            <div className="relative">
              <input
                type="color"
                value={duotoneLight}
                onChange={(e) => setGlobalSetting('duotoneLight', e.target.value)}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
              />
              <div className="w-full h-10 border border-[#d0cdc4]" style={{ backgroundColor: duotoneLight }} />
            </div>
          </div>
        </div>

        {/* Color Space */}
        <div>
          <label className="block text-xs text-[#666] mb-2">Color Space</label>
          <select
            value={colorSpace}
            onChange={(e) => setGlobalSetting('colorSpace', Number(e.target.value))}
            className="w-full p-2 bg-[#e8e5dd] border border-[#d0cdc4] text-xs text-[#2a2a2a] font-['JetBrains_Mono',monospace] cursor-pointer hover:border-[#2a2a2a]"
          >
            <option value={0}>RGB (Standard)</option>
            <option value={1}>LAB (Perceptual)</option>
            <option value={2}>Oklab (Modern)</option>
          </select>
        </div>
      </div>

      {/* ============================================ */}
      {/* SECTION 3: RETRO PRESETS */}
      {/* ============================================ */}
      <div className={sectionClass}>
        <h2 className="text-sm font-medium mb-4 text-[#2a2a2a]">RETRO PRESETS</h2>

        {/* Quick Preset Buttons */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {['gameboy', 'cga-mode4-palette1', 'nes', 'pico8', 'commodore64', 'macintosh', 'amber-mono', 'newspaper'].map(presetId => {
            const preset = getPaletteById(presetId);
            if (!preset) return null;
            const isSelected = selectedRetroPreset === presetId;
            return (
              <button
                key={presetId}
                onClick={() => handleRetroPresetSelect(presetId)}
                className={`p-2 border text-[9px] text-center leading-tight transition-colors ${
                  isSelected
                    ? 'border-[#2a2a2a] bg-[#2a2a2a] text-white'
                    : 'border-[#d0cdc4] hover:border-[#2a2a2a] text-[#666]'
                }`}
                title={preset.description}
              >
                {preset.name.split(' ')[0]}
              </button>
            );
          })}
        </div>

        {/* Full Preset Dropdown */}
        <select
          value={selectedRetroPreset || ''}
          onChange={(e) => e.target.value && handleRetroPresetSelect(e.target.value)}
          className="w-full p-2 bg-[#e8e5dd] border border-[#d0cdc4] text-xs text-[#2a2a2a] font-['JetBrains_Mono',monospace] cursor-pointer hover:border-[#2a2a2a]"
        >
          <option value="">More presets...</option>
          {Object.entries(paletteCategories).map(([category, presetIds]) => (
            <optgroup key={category} label={category}>
              {presetIds.map(id => {
                const preset = getPaletteById(id);
                if (!preset) return null;
                return (
                  <option key={id} value={id}>
                    {preset.name} ({preset.colors.length} colors)
                  </option>
                );
              })}
            </optgroup>
          ))}
        </select>
      </div>

      {/* ============================================ */}
      {/* SECTION 4: IMAGE ADJUSTMENTS */}
      {/* ============================================ */}
      <div className={sectionClass}>
        <h2 className="text-sm font-medium mb-4 text-[#2a2a2a]">IMAGE</h2>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs text-[#666]">Brightness</label>
              <span className="text-xs text-[#2a2a2a] font-mono">{brightness.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="-1"
              max="1"
              step="0.01"
              value={brightness}
              onChange={(e) => setGlobalSetting('brightness', Number(e.target.value))}
              className={sliderClass}
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs text-[#666]">Contrast</label>
              <span className="text-xs text-[#2a2a2a] font-mono">{contrast.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.01"
              value={contrast}
              onChange={(e) => setGlobalSetting('contrast', Number(e.target.value))}
              className={sliderClass}
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs text-[#666]">Detail</label>
              <span className="text-xs text-[#2a2a2a] font-mono">{ditherStrength.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={ditherStrength}
              onChange={(e) => setGlobalSetting('ditherStrength', Number(e.target.value))}
              className={sliderClass}
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs text-[#666]">Edge Preservation</label>
              <span className="text-xs text-[#2a2a2a] font-mono">{edgePreservation.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={edgePreservation}
              onChange={(e) => setGlobalSetting('edgePreservation', Number(e.target.value))}
              className={sliderClass}
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs text-[#666]">Banding Reduction</label>
              <span className="text-xs text-[#2a2a2a] font-mono">{bandingReduction.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={bandingReduction}
              onChange={(e) => setGlobalSetting('bandingReduction', Number(e.target.value))}
              className={sliderClass}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-[#666]">Gamma Correction</span>
            <input
              type="checkbox"
              checked={gammaCorrect}
              onChange={(e) => setGlobalSetting('gammaCorrect', e.target.checked)}
              className="w-4 h-4 cursor-pointer accent-[#2a2a2a]"
            />
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* SECTION 5: VIDEO / ANIMATION */}
      {/* ============================================ */}
      <div className={sectionClass}>
        <h2 className="text-sm font-medium mb-4 text-[#2a2a2a]">VIDEO / ANIMATION</h2>

        {!isVideo && (
          <p className="text-[10px] text-[#999] mb-3">Load a video or GIF to enable these controls</p>
        )}

        <div className={`space-y-4 ${!isVideo ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#666]">Temporal Dither</span>
            <input
              type="checkbox"
              checked={temporalDither}
              onChange={(e) => setGlobalSetting('temporalDither', e.target.checked)}
              className="w-4 h-4 cursor-pointer accent-[#2a2a2a]"
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs text-[#666]">Temporal Speed</label>
              <span className="text-xs text-[#2a2a2a] font-mono">{temporalSpeed.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={temporalSpeed}
              onChange={(e) => setGlobalSetting('temporalSpeed', Number(e.target.value))}
              className={sliderClass}
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs text-[#666]">Temporal Stability</label>
              <span className="text-xs text-[#2a2a2a] font-mono">{temporalStability.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={temporalStability}
              onChange={(e) => setGlobalSetting('temporalStability', Number(e.target.value))}
              className={sliderClass}
            />
            <p className="text-[9px] text-[#999] mt-1">Reduces flickering between frames</p>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-[#666]">Frame Blending</span>
            <input
              type="checkbox"
              checked={frameBlending}
              onChange={(e) => setGlobalSetting('frameBlending', e.target.checked)}
              className="w-4 h-4 cursor-pointer accent-[#2a2a2a]"
            />
          </div>

          {frameBlending && (
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs text-[#666]">Blend Strength</label>
                <span className="text-xs text-[#2a2a2a] font-mono">{frameBlendStrength.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={frameBlendStrength}
                onChange={(e) => setGlobalSetting('frameBlendStrength', Number(e.target.value))}
                className={sliderClass}
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-xs text-[#666]">Motion Adaptive</span>
            <input
              type="checkbox"
              checked={motionAdaptive}
              onChange={(e) => setGlobalSetting('motionAdaptive', e.target.checked)}
              className="w-4 h-4 cursor-pointer accent-[#2a2a2a]"
            />
          </div>

          {motionAdaptive && (
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs text-[#666]">Motion Sensitivity</label>
                <span className="text-xs text-[#2a2a2a] font-mono">{motionSensitivity.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={motionSensitivity}
                onChange={(e) => setGlobalSetting('motionSensitivity', Number(e.target.value))}
                className={sliderClass}
              />
              <p className="text-[9px] text-[#999] mt-1">Less dithering on moving areas</p>
            </div>
          )}

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs text-[#666]">Frame Weight</label>
              <span className="text-xs text-[#2a2a2a] font-mono">{temporalWeight.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.5"
              step="0.01"
              value={temporalWeight}
              onChange={(e) => setGlobalSetting('temporalWeight', Number(e.target.value))}
              className={sliderClass}
            />
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* SECTION 6: DISPLAY EFFECTS (CRT) */}
      {/* ============================================ */}
      <div>
        <h2 className="text-sm font-medium mb-4 text-[#2a2a2a]">DISPLAY EFFECTS</h2>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs text-[#666]">Scanlines</label>
              <span className="text-xs text-[#2a2a2a] font-mono">{scanlines.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={scanlines}
              onChange={(e) => setGlobalSetting('scanlines', Number(e.target.value))}
              className={sliderClass}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-[#666]">RGB Phosphor</span>
            <input
              type="checkbox"
              checked={phosphor}
              onChange={(e) => setGlobalSetting('phosphor', e.target.checked)}
              className="w-4 h-4 cursor-pointer accent-[#2a2a2a]"
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs text-[#666]">Screen Curvature</label>
              <span className="text-xs text-[#2a2a2a] font-mono">{curvature.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.5"
              step="0.01"
              value={curvature}
              onChange={(e) => setGlobalSetting('curvature', Number(e.target.value))}
              className={sliderClass}
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs text-[#666]">Vignette</label>
              <span className="text-xs text-[#2a2a2a] font-mono">{vignette.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={vignette}
              onChange={(e) => setGlobalSetting('vignette', Number(e.target.value))}
              className={sliderClass}
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs text-[#666]">Chromatic Aberration</label>
              <span className="text-xs text-[#2a2a2a] font-mono">{chromatic.toFixed(3)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.02"
              step="0.001"
              value={chromatic}
              onChange={(e) => setGlobalSetting('chromatic', Number(e.target.value))}
              className={sliderClass}
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs text-[#666]">Bloom / Glow</label>
              <span className="text-xs text-[#2a2a2a] font-mono">{bloom.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={bloom}
              onChange={(e) => setGlobalSetting('bloom', Number(e.target.value))}
              className={sliderClass}
            />
          </div>
        </div>
      </div>

    </div>
  );
}
