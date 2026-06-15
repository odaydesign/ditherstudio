'use client';

import { useEffect, useState } from 'react';
import { useDitherStore } from '@/store/ditherStore';
import { paletteCategories, getPaletteById } from '@/lib/palettes/retroPalettes';
import ColorPopover from './ColorPopover';
import { algorithms } from '@/lib/three/algorithms';
import { Collapsible } from './Collapsible';

const PRESET_PALETTES = [
  { name: 'Black & White', dark: '#000000', light: '#FFFFFF' },
  { name: 'Red & Cream', dark: '#8B3A3A', light: '#F5E6D3' },
  { name: 'Purple & Pink', dark: '#6B4A8E', light: '#E8C4E8' },
  { name: 'Green & Mint', dark: '#2D5F4F', light: '#C4E8D4' },
  { name: 'Blue & Powder', dark: '#3A5A7C', light: '#D4E4F5' },
  { name: 'Brown & Tan', dark: '#8B6347', light: '#F5DEC4' },
];

// Group algorithms by category for dropdown
// Define explicit order for categories
const CATEGORY_ORDER = ['Basic', 'Error Diffusion', 'Advanced Error Diffusion', 'Ordered', 'Artistic'];

// Group algorithms by category dynamically
const algorithmCategories = algorithms.reduce((acc, algo) => {
  if (!acc[algo.category]) {
    acc[algo.category] = [];
  }
  acc[algo.category].push(algo.id);
  return acc;
}, {} as Record<string, string[]>);

const sortedCategories = Object.entries(algorithmCategories).sort((a, b) => {
  const indexA = CATEGORY_ORDER.indexOf(a[0]);
  const indexB = CATEGORY_ORDER.indexOf(b[0]);
  if (indexA === -1) return 1;
  if (indexB === -1) return -1;
  return indexA - indexB;
});

const ASCII_MODES = [
  { value: 0, label: 'Static (Flat)' },
  { value: 1, label: 'Halftone' },
  { value: 2, label: 'Inv Halftone' },
  { value: 3, label: 'Rotation' },
  { value: 4, label: 'Stretch V' },
  { value: 5, label: 'Stretch H' },
  { value: 6, label: 'Checkerboard' },
  { value: 7, label: 'Wobble' },
  { value: 8, label: 'Glitch (Offset)' },
  { value: 9, label: 'Melt (Drip)' },
  { value: 10, label: 'Midtone Scale' },
  { value: 11, label: 'Ripple' },
  { value: 12, label: 'Quantize' },
  { value: 13, label: 'Noise' },
  { value: 14, label: 'Flow Field (Rot)' },
  { value: 15, label: 'Threshold' },
  { value: 16, label: 'Flow Field (Dir)' },
  { value: 17, label: 'Edge Detect' },
  { value: 18, label: 'Mosaic Jitter' },
  { value: 19, label: 'Posterize' },
  { value: 20, label: 'Interference' },
  { value: 21, label: 'CRT Scanline' },
  { value: 22, label: 'Bio / Cellular' },
  { value: 23, label: 'Eraser / Noise' },
];

const ASCII_SHAPES = [
  { value: 0, label: 'Circle' },
  { value: 1, label: 'Square' },
  { value: 2, label: 'Triangle' },
  { value: 3, label: 'Diamond' },
  { value: 4, label: 'Hexagon' },
  { value: 5, label: 'Rect Vertical' },
  { value: 6, label: 'Rect Horizontal' },
  { value: 7, label: 'Diagonal R' },
  { value: 8, label: 'Diagonal L' },
  { value: 9, label: 'Octagon' },
  { value: 10, label: 'Star' },
  { value: 11, label: 'Heart' },
  { value: 12, label: 'Flower' },
  { value: 13, label: 'Gear' },
  { value: 14, label: 'Ring' },
  { value: 15, label: 'Hollow Rect' },
  { value: 16, label: 'Trapezoid' },
  { value: 17, label: 'Romb' },
  { value: 18, label: 'Plus' },
  { value: 19, label: 'Chevron' },
  { value: 20, label: 'Pacman' },
  { value: 21, label: 'Cross' },
  { value: 22, label: 'Semi-Circle Top' },
  { value: 23, label: 'Semi-Circle Bottom' },
  { value: 24, label: 'Shuriken' },
  { value: 25, label: 'Lightning' },
  { value: 26, label: 'Ghost' },
  { value: 27, label: 'Leaf' },
  { value: 28, label: 'Cloud' },
  { value: 29, label: 'Concentric' },
  { value: 30, label: 'Custom SVG / Image' },
  { value: 31, label: 'Characters (Text)' },
];

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
    saturation,
    hueShift,
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
    isWebcam,
    setWebcam,
    temporalDither,
    temporalSpeed,
    temporalWeight,
    frameBlending,
    frameBlendStrength,
    motionAdaptive,
    motionSensitivity,
    temporalStability,
    pointSize,
    // Effects
    vhsEffect,
    edgeGlow,
    emboss,
    // ASCII Params
    asciiCellSize,
    asciiGap,
    asciiBaseScale,
    asciiIntensity,
    asciiMode,
    asciiShape,
    asciiBgColor,
    asciiFgColor,
    asciiUseColor,
    asciiInvert,
    asciiCharacters,
    setAsciiSetting,
    fxAnimate,
    fxSpeed,
    fxMotion,
    analogWobble,
    analogBleed,
    analogStatic,
    analogHum,
    analogGhost,
    comparisonMode,
    setCustomShape,
    customShapeTexture,
    gridMode,
    gridAlgorithms,
    autoTheme,
    // New effects
    sharpen,
    posterize,
    glitchIntensity,
    glitchSpeed,
    adaptiveThreshold,
    adaptiveWindow,
    // Geometric Halftone
    halftoneShape,
    halftoneRotation,
    halftoneSpread,
    setHalftoneSetting,
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

  // No forced defaults — the source loads undithered (algorithm "None"); the user
  // opts into an algorithm/colour mode. Reset all restores this clean baseline.

  const sliderClass = "w-full h-[2px] bg-white/20 outline-none appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:cursor-pointer";

  return (
    <div className="space-y-1">
      {/* Source-specific creative panels now live in the left "Source" panel. */}

      {/* ============================================ */}
      {/* SECTION 1: SOURCE IMAGE */}
      {/* ============================================ */}
      <Collapsible title="SOURCE IMAGE" defaultOpen={false}>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs text-white/55">Brightness</label>
              <span className="text-xs text-white/90 font-mono">{brightness.toFixed(2)}</span>
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
              <label className="text-xs text-white/55">Contrast</label>
              <span className="text-xs text-white/90 font-mono">{contrast.toFixed(2)}</span>
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
              <label className="text-xs text-white/55">Saturation</label>
              <span className="text-xs text-white/90 font-mono">{saturation.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.01"
              value={saturation}
              onChange={(e) => setGlobalSetting('saturation', Number(e.target.value))}
              className={sliderClass}
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs text-white/55">Hue Shift</label>
              <span className="text-xs text-white/90 font-mono">{hueShift.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={hueShift}
              onChange={(e) => setGlobalSetting('hueShift', Number(e.target.value))}
              className={sliderClass}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-white/55">Gamma Correction</span>
            <input
              type="checkbox"
              checked={gammaCorrect}
              onChange={(e) => setGlobalSetting('gammaCorrect', e.target.checked)}
              className="w-4 h-4 cursor-pointer accent-white"
            />
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-2 mt-2">
            <span className="text-xs text-white/55 font-medium">Split-View Comparison</span>
            <input
              type="checkbox"
              checked={comparisonMode}
              onChange={(e) => setGlobalSetting('comparisonMode', e.target.checked)}
              className="w-4 h-4 cursor-pointer accent-white"
            />
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-2">
            <span className="text-xs text-white/55 font-medium">Grid Comparison (4-way)</span>
            <input
              type="checkbox"
              checked={gridMode}
              onChange={(e) => setGlobalSetting('gridMode', e.target.checked)}
              className="w-4 h-4 cursor-pointer accent-white"
            />
          </div>
          
          {gridMode && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              {[0, 1, 2, 3].map(i => (
                <select
                  key={i}
                  value={gridAlgorithms[i]}
                  onChange={(e) => {
                    const newAlgos = [...gridAlgorithms];
                    newAlgos[i] = Number(e.target.value);
                    setGlobalSetting('gridAlgorithms', newAlgos);
                  }}
                  className="w-full p-1 bg-white/[0.045] border border-white/10 rounded-xl text-[9px] font-mono"
                >
                  {algorithms.map(a => <option key={a.id} value={a.shaderValue}>{a.name.split('(')[0]}</option>)}
                </select>
              ))}
            </div>
          )}
        </div>
      </Collapsible>

      {/* ============================================ */}
      {/* SECTION 1.5: ANIMATE EFFECTS (dither / ASCII) */}
      <Collapsible title="ANIMATE" defaultOpen={false} accessory={
        <input
          type="checkbox"
          checked={fxAnimate}
          onChange={(e) => setGlobalSetting('fxAnimate', e.target.checked)}
          className="w-4 h-4 cursor-pointer accent-white"
        />
      }>
        {fxAnimate && (
          <div className="space-y-4">
            <select
              value={fxMotion}
              onChange={(e) => setGlobalSetting('fxMotion', Number(e.target.value))}
              className="w-full p-2 bg-white/[0.05] border border-white/10 rounded-xl text-xs text-white/90 font-sans cursor-pointer"
            >
              <option value={1}>Drift</option>
              <option value={2}>Zoom</option>
              <option value={3}>Wobble</option>
              <option value={4}>Shimmer (dither)</option>
            </select>
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs text-white/55">Speed</label>
                <span className="text-xs text-white/90 font-mono">{fxSpeed.toFixed(2)}</span>
              </div>
              <input
                type="range" min="0.05" max="3" step="0.05" value={fxSpeed}
                onChange={(e) => setGlobalSetting('fxSpeed', Number(e.target.value))}
                className={sliderClass}
              />
            </div>
            <p className="text-[10px] text-white/40">Animates the dither &amp; ASCII on any source (incl. uploads). Export a seamless loop via /EXPORT → More options → 🔁.</p>
          </div>
        )}
      </Collapsible>

      {/* SECTION 1.6: ANALOG SIGNAL FX (composite / VHS / CRT artifacts) */}
      <Collapsible title="ANALOG" defaultOpen={false} accessory={
        (analogWobble || analogBleed || analogStatic || analogHum || analogGhost) > 0 ? (
          <button
            onClick={() => {
              setGlobalSetting('analogWobble', 0);
              setGlobalSetting('analogBleed', 0);
              setGlobalSetting('analogStatic', 0);
              setGlobalSetting('analogHum', 0);
              setGlobalSetting('analogGhost', 0);
            }}
            className="text-[10px] text-white/40 underline hover:text-white/90"
          >
            reset
          </button>
        ) : null
      }>
        <div className="space-y-4">
          {([
            ['analogWobble', 'Tracking wobble', analogWobble],
            ['analogBleed', 'Chroma bleed', analogBleed],
            ['analogGhost', 'Signal ghost', analogGhost],
            ['analogHum', 'AC hum bar', analogHum],
            ['analogStatic', 'TV static', analogStatic],
          ] as [string, string, number][]).map(([key, label, val]) => (
            <div key={key}>
              <div className="flex justify-between mb-2">
                <label className="text-xs text-white/55">{label}</label>
                <span className="text-xs text-white/90 font-mono">{val.toFixed(2)}</span>
              </div>
              <input
                type="range" min="0" max="1" step="0.01" value={val}
                onChange={(e) => setGlobalSetting(key, Number(e.target.value))}
                className={sliderClass}
              />
            </div>
          ))}
          <p className="text-[10px] text-white/40">Composite/VHS artifacts applied before &amp; after the dither. Wobble, hum, ghost &amp; static animate over time &mdash; enable ANIMATE (or a generative motion) and export as a loop to capture the movement.</p>
        </div>
      </Collapsible>

      {/* SECTION 2: ALGORITHM & DITHERING */}
      {/* ============================================ */}
      <Collapsible title="ALGORITHM & DITHERING" defaultOpen={true}>

        {/* Algorithm Dropdown */}
        <select
          value={algorithm}
          onChange={(e) => handleAlgorithmChange(Number(e.target.value))}
          className="w-full p-2 bg-white/[0.05] border border-white/10 rounded-xl text-xs text-white/90 font-sans cursor-pointer hover:border-white/40 mb-2"
        >
          {sortedCategories.map(([category, algoIds]) => (
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
          <div className="text-[10px] text-white/40 mb-3">{currentAlgorithm.category}</div>
        )}

        {/* Algorithm-specific parameters */}
        {currentAlgorithm?.params && Object.keys(currentAlgorithm.params).length > 0 && (
          <div className="space-y-3 mb-4">
            {Object.entries(currentAlgorithm.params).map(([key, param]) => (
              <div key={key}>
                <div className="flex justify-between mb-2">
                  <label className="text-xs text-white/55">{param.label}</label>
                  <span className="text-xs text-white/90 font-mono">
                    {param.uniformIndex === 1 ? param1.toFixed(2) : param2.toFixed(2)}
                  </span>
                </div>
                {param.type === 'discrete' && param.options ? (
                  <select
                    value={param.uniformIndex === 1 ? param1 : param2}
                    onChange={(e) => setParam(param.uniformIndex || 1, Number(e.target.value))}
                    className="w-full p-2 bg-white/[0.05] border border-white/10 rounded-xl text-xs text-white/90 font-sans cursor-pointer"
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

        {/* ASCII / SHAPE SPECIFIC CONTROLS */}
        {algorithm === 2 && (
          <div className="space-y-4 mb-4 border-t border-white/10 pt-4">

            {/* Mode Selection */}
            <div>
              <label className="block text-xs text-white/55 mb-2">Effect Mode</label>
              <select
                value={asciiMode}
                onChange={(e) => setAsciiSetting('asciiMode', Number(e.target.value))}
                className="w-full p-2 bg-white/[0.05] border border-white/10 rounded-xl text-xs text-white/90 font-sans cursor-pointer"
              >
                {ASCII_MODES.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* Shape Selection */}
            <div>
              <label className="block text-xs text-white/55 mb-2">Shape</label>
              <select
                value={asciiShape}
                onChange={(e) => setAsciiSetting('asciiShape', Number(e.target.value))}
                className="w-full p-2 bg-white/[0.05] border border-white/10 rounded-xl text-xs text-white/90 font-sans cursor-pointer"
              >
                {ASCII_SHAPES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>

              {asciiShape === 30 && (
                <div className="mt-2">
                  <label className="block text-xs text-white/55 mb-1">Upload Shape (SVG/PNG)</label>
                  <input
                    type="file"
                    accept="image/*,.svg"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          if (event.target?.result) {
                            setCustomShape(event.target.result as string);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full text-[10px] text-white/55 file:mr-2 file:py-1 file:px-2 file:border-0 file:text-xs file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer"
                  />
                  {customShapeTexture && (
                    <div className="mt-1 text-[9px] text-green-600 flex items-center">
                      <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                      Custom shape loaded
                    </div>
                  )}
                </div>
              )}

              {asciiShape === 31 && (
                <div className="mt-2">
                  <label className="block text-xs text-white/55 mb-1">Characters (first = darkest)</label>
                  <input
                    type="text"
                    value={asciiCharacters}
                    onChange={(e) => setAsciiSetting('asciiCharacters', e.target.value)}
                    placeholder="@%#*+=-:. "
                    spellCheck={false}
                    className="w-full p-2 bg-white/[0.06] border border-white/10 rounded-xl text-xs text-white/90 font-sans focus:outline-none focus:border-white/40"
                  />
                  <p className="text-[9px] text-white/40 mt-1">Ordered dark → light. Trailing space keeps highlights blank. Try &quot;01&quot; or &quot;DITHER&quot;.</p>
                </div>
              )}
            </div>

            {/* Cell Size */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs text-white/55">Cell Size</label>
                <span className="text-xs text-white/90 font-mono">{asciiCellSize}px</span>
              </div>
              <input
                type="range"
                min="4"
                max="60"
                step="1"
                value={asciiCellSize}
                onChange={(e) => setAsciiSetting('asciiCellSize', Number(e.target.value))}
                className={sliderClass}
              />
            </div>

            {/* Base Scale */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs text-white/55">Shape Scale</label>
                <span className="text-xs text-white/90 font-mono">{asciiBaseScale.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="3.0"
                step="0.1"
                value={asciiBaseScale}
                onChange={(e) => setAsciiSetting('asciiBaseScale', Number(e.target.value))}
                className={sliderClass}
              />
            </div>

            {/* Gap */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs text-white/55">Gap</label>
                <span className="text-xs text-white/90 font-mono">{asciiGap.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="10.0"
                step="0.25"
                value={asciiGap}
                onChange={(e) => setAsciiSetting('asciiGap', Number(e.target.value))}
                className={sliderClass}
              />
            </div>

            {/* Intensity */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs text-white/55">Intensity</label>
                <span className="text-xs text-white/90 font-mono">{asciiIntensity.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="5.0"
                step="0.1"
                value={asciiIntensity}
                onChange={(e) => setAsciiSetting('asciiIntensity', Number(e.target.value))}
                className={sliderClass}
              />
            </div>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-3">
              <ColorPopover label="Shape Color" value={asciiFgColor} onChange={(v) => setAsciiSetting('asciiFgColor', v)} variant="block" />
              <ColorPopover label="Background" value={asciiBgColor} onChange={(v) => setAsciiSetting('asciiBgColor', v)} variant="block" />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-xs text-white/55">Use Image Colors</label>
              <input
                type="checkbox"
                checked={asciiUseColor}
                onChange={(e) => setAsciiSetting('asciiUseColor', e.target.checked)}
                className="w-4 h-4 cursor-pointer accent-white"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-xs text-white/55">Invert Luma</label>
              <input
                type="checkbox"
                checked={asciiInvert}
                onChange={(e) => setAsciiSetting('asciiInvert', e.target.checked)}
                className="w-4 h-4 cursor-pointer accent-white"
              />
            </div>

          </div>
        )}

        {/* Global Dither Params */}
        <div className="space-y-4 pt-2">
          {/* Dot Size (Scale) */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs text-white/55">Dot Size</label>
              <span className="text-xs text-white/90 font-mono">{scale.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="1"
              max="8"
              step="0.5"
              value={scale}
              onChange={(e) => setGlobalSetting('scale', Number(e.target.value))}
              className={sliderClass}
            />
          </div>

          {/* Dither Strength (Detail) */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs text-white/55">Dither Strength</label>
              <span className="text-xs text-white/90 font-mono">{ditherStrength.toFixed(2)}</span>
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

          <div className="pt-2 mt-2 border-t border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-white/55 font-bold uppercase tracking-wider">Adaptive Threshold</span>
              <input
                type="checkbox"
                checked={adaptiveThreshold}
                onChange={(e) => setGlobalSetting('adaptiveThreshold', e.target.checked)}
                className="w-4 h-4 cursor-pointer accent-white"
              />
            </div>
            {adaptiveThreshold && (
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <label className="text-xs text-white/55">Window Size</label>
                  <span className="text-xs text-white/90 font-mono">{adaptiveWindow}px</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="32"
                  step="1"
                  value={adaptiveWindow}
                  onChange={(e) => setGlobalSetting('adaptiveWindow', Number(e.target.value))}
                  className={sliderClass}
                />
              </div>
            )}
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs text-white/55">Pattern Jitter</label>
              <span className="text-xs text-white/90 font-mono">{patternRandomization.toFixed(2)}</span>
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
          </div>

          {/* New Additions to Algorithm Section: Edge & Banding */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs text-white/55">Edge Preservation</label>
              <span className="text-xs text-white/90 font-mono">{edgePreservation.toFixed(2)}</span>
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
              <label className="text-xs text-white/55">Banding Reduction</label>
              <span className="text-xs text-white/90 font-mono">{bandingReduction.toFixed(2)}</span>
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
        </div>
      </Collapsible>
      {/* ============================================ */}
      {/* SECTION 3: COLOR PALETTE */}
      {/* ============================================ */}
      <Collapsible title="COLOR PALETTE" defaultOpen={true}>

        {/* Retro Presets (Moved here) */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs text-white/55">Quick Presets</label>
            <button 
              onClick={() => {
                 const canvas = document.querySelector('canvas');
                 if (canvas) autoTheme(canvas);
              }}
              className="text-[10px] font-bold text-white/90 underline decoration-dotted"
            >
              AUTO-EXTRACT THEME
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {['gameboy', 'cga-mode4-palette1', 'nes', 'pico8', 'commodore64', 'macintosh', 'amber-mono', 'newspaper'].map(presetId => {
              const preset = getPaletteById(presetId);
              if (!preset) return null;
              const isSelected = selectedRetroPreset === presetId;
              return (
                <button
                  key={presetId}
                  onClick={() => handleRetroPresetSelect(presetId)}
                  className={`p-2 border text-[9px] text-center leading-tight transition-colors ${isSelected
                    ? 'border-white/30 bg-white text-[#0b0b0d]'
                    : 'border-white/10 hover:border-white/40 text-white/55'
                    }`}
                  title={preset.description}
                >
                  {preset.name.split(' ')[0]}
                </button>
              );
            })}
          </div>

          <select
            value={selectedRetroPreset || ''}
            onChange={(e) => e.target.value && handleRetroPresetSelect(e.target.value)}
            className="w-full p-2 bg-white/[0.05] border border-white/10 rounded-xl text-xs text-white/90 font-sans cursor-pointer hover:border-white/40 mb-4"
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


        {/* Color Count */}
        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <label className="text-xs text-white/55">Color Levels</label>
            <span className="text-xs text-white/90 font-mono">{colors}</span>
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
              className="aspect-square border border-white/10 rounded-xl overflow-hidden cursor-pointer hover:border-white/40 transition-colors"
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
          <ColorPopover label="Ink" value={duotoneDark} onChange={(v) => setGlobalSetting('duotoneDark', v)} variant="block" />
          <ColorPopover label="Background" value={duotoneLight} onChange={(v) => setGlobalSetting('duotoneLight', v)} variant="block" />
        </div>

        {/* Color Space */}
        <div>
          <label className="block text-xs text-white/55 mb-2">Color Space</label>
          <select
            value={colorSpace}
            onChange={(e) => setGlobalSetting('colorSpace', Number(e.target.value))}
            className="w-full p-2 bg-white/[0.05] border border-white/10 rounded-xl text-xs text-white/90 font-sans cursor-pointer hover:border-white/40"
          >
            <option value={0}>RGB (Standard)</option>
            <option value={1}>LAB (Perceptual)</option>
            <option value={2}>Oklab (Modern)</option>
            <option value={29}>Concentric</option>
            <option value={30}>Custom SVG / Image</option>
          </select>
        </div>

        {/* Geometric Halftone Settings */}
        {asciiMode === 0 && (
          <>
            {/* Halftone Shape Selector */}
            <div className="mb-4">
              <div className="flex justify-between mb-1">
                <label className="text-[10px] font-bold tracking-wider text-white/55 uppercase">Geometric Shape</label>
              </div>
              <select
                value={halftoneShape}
                onChange={(e) => setHalftoneSetting('halftoneShape', Number(e.target.value))}
                className="w-full p-2 bg-white/[0.045] text-white/90 border border-white/10 rounded-xl font-sans text-xs focus:outline-none focus:border-white/40 appearance-none cursor-pointer"
              >
                <option value={0}>Circle</option>
                <option value={1}>Square</option>
                <option value={2}>Diamond</option>
                <option value={3}>Triangle</option>
                <option value={4}>Line</option>
              </select>
            </div>

            {/* Rotation */}
            <div className="mb-4">
              <div className="flex justify-between mb-1">
                <label className="text-[10px] font-bold tracking-wider text-white/55 uppercase">Rotation</label>
                <span className="text-[10px] text-white/90">{halftoneRotation}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="180"
                step="1"
                value={halftoneRotation}
                onChange={(e) => setHalftoneSetting('halftoneRotation', Number(e.target.value))}
                className={sliderClass}
              />
            </div>

            {/* Spread (Overlap) */}
            <div className="mb-4">
              <div className="flex justify-between mb-1">
                <label className="text-[10px] font-bold tracking-wider text-white/55 uppercase">Spread</label>
                <span className="text-[10px] text-white/90">{halftoneSpread.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.05"
                value={halftoneSpread}
                onChange={(e) => setHalftoneSetting('halftoneSpread', Number(e.target.value))}
                className={sliderClass}
              />
            </div>
          </>
        )}

        {/* Character Scaling */}
        {/* Character Scaling */}
      </Collapsible>

      {/* ============================================ */}
      {/* SECTION 4: POST-PROCESSING */}
      {/* ============================================ */}
      <Collapsible title="POST-PROCESSING" defaultOpen={false}>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs text-white/55">VHS Effect</label>
              <span className="text-xs text-white/90 font-mono">{Math.round(vhsEffect * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={vhsEffect}
              onChange={(e) => setGlobalSetting('vhsEffect', Number(e.target.value))}
              className={sliderClass}
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs text-white/55">Edge Glow</label>
              <span className="text-xs text-white/90 font-mono">{Math.round(edgeGlow * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={edgeGlow}
              onChange={(e) => setGlobalSetting('edgeGlow', Number(e.target.value))}
              className={sliderClass}
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs text-white/55">Emboss</label>
              <span className="text-xs text-white/90 font-mono">{Math.round(emboss * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={emboss}
              onChange={(e) => setGlobalSetting('emboss', Number(e.target.value))}
              className={sliderClass}
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs text-white/55">Sharpen</label>
              <span className="text-xs text-white/90 font-mono">{sharpen.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1.0"
              step="0.01"
              value={sharpen}
              onChange={(e) => setGlobalSetting('sharpen', Number(e.target.value))}
              className={sliderClass}
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs text-white/55">Posterize</label>
              <span className="text-xs text-white/90 font-mono">{posterize.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1.0"
              step="0.01"
              value={posterize}
              onChange={(e) => setGlobalSetting('posterize', Number(e.target.value))}
              className={sliderClass}
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs text-white/55">Glitch Intensity</label>
              <span className="text-xs text-white/90 font-mono">{glitchIntensity.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1.0"
              step="0.01"
              value={glitchIntensity}
              onChange={(e) => setGlobalSetting('glitchIntensity', Number(e.target.value))}
              className={sliderClass}
            />
          </div>
        </div>
      </Collapsible>
      {/* ============================================ */}
      {/* SECTION 5: DISPLAY EFFECTS */}
      {/* ============================================ */}
      <Collapsible title="DISPLAY EFFECTS" defaultOpen={false}>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs text-white/55">Scanlines</label>
              <span className="text-xs text-white/90 font-mono">{scanlines.toFixed(2)}</span>
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
            <span className="text-xs text-white/55">RGB Phosphor</span>
            <input
              type="checkbox"
              checked={phosphor}
              onChange={(e) => setGlobalSetting('phosphor', e.target.checked)}
              className="w-4 h-4 cursor-pointer accent-white"
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs text-white/55">Screen Curvature</label>
              <span className="text-xs text-white/90 font-mono">{curvature.toFixed(2)}</span>
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
              <label className="text-xs text-white/55">Vignette</label>
              <span className="text-xs text-white/90 font-mono">{vignette.toFixed(2)}</span>
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
              <label className="text-xs text-white/55">Chromatic Aberration</label>
              <span className="text-xs text-white/90 font-mono">{chromatic.toFixed(3)}</span>
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
              <label className="text-xs text-white/55">Bloom / Glow</label>
              <span className="text-xs text-white/90 font-mono">{bloom.toFixed(2)}</span>
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
      </Collapsible>

      {/* ============================================ */}
      {/* SECTION 6: VIDEO / WEBCAM */}
      {/* ============================================ */}
      <Collapsible title="VIDEO / WEBCAM" defaultOpen={false} accessory={
        <button
          onClick={() => setWebcam(!isWebcam)}
          className={`text-[10px] px-2 py-1 border ${isWebcam ? 'bg-white text-[#0b0b0d] border-white/30' : 'bg-white/[0.06] text-white/90 border-white/10'}`}
        >
          {isWebcam ? 'STOP WEBCAM' : 'USE WEBCAM'}
        </button>
      }>

        {(!isVideo && !isWebcam) && (
          <p className="text-[10px] text-white/40 mb-3">Load a video or start webcam to enable these controls</p>
        )}

        <div className={`space-y-4 ${(!isVideo && !isWebcam) ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/55">Temporal Dither</span>
            <input
              type="checkbox"
              checked={temporalDither}
              onChange={(e) => setGlobalSetting('temporalDither', e.target.checked)}
              className="w-4 h-4 cursor-pointer accent-white"
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs text-white/55">Temporal Speed</label>
              <span className="text-xs text-white/90 font-mono">{temporalSpeed.toFixed(2)}</span>
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
              <label className="text-xs text-white/55">Temporal Stability</label>
              <span className="text-xs text-white/90 font-mono">{temporalStability.toFixed(2)}</span>
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
            <p className="text-[9px] text-white/40 mt-1">Reduces flickering between frames</p>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-white/55">Frame Blending</span>
            <input
              type="checkbox"
              checked={frameBlending}
              onChange={(e) => setGlobalSetting('frameBlending', e.target.checked)}
              className="w-4 h-4 cursor-pointer accent-white"
            />
          </div>

          {frameBlending && (
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs text-white/55">Blend Strength</label>
                <span className="text-xs text-white/90 font-mono">{frameBlendStrength.toFixed(2)}</span>
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
            <span className="text-xs text-white/55">Motion Adaptive</span>
            <input
              type="checkbox"
              checked={motionAdaptive}
              onChange={(e) => setGlobalSetting('motionAdaptive', e.target.checked)}
              className="w-4 h-4 cursor-pointer accent-white"
            />
          </div>

          {motionAdaptive && (
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs text-white/55">Motion Sensitivity</label>
                <span className="text-xs text-white/90 font-mono">{motionSensitivity.toFixed(2)}</span>
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
              <p className="text-[9px] text-white/40 mt-1">Less dithering on moving areas</p>
            </div>
          )}

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs text-white/55">Frame Weight</label>
              <span className="text-xs text-white/90 font-mono">{temporalWeight.toFixed(2)}</span>
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
      </Collapsible>
    </div >
  );
}
