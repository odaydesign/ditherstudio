'use client';

import WebGLCanvas from './canvas/WebGLCanvas';
import UploadZone from './controls/UploadZone';
import AlgorithmSelector from './controls/AlgorithmSelector';
import { useDitherStore } from '@/store/ditherStore';

export default function DitherStudio() {
  const { grayscale, setGlobalSetting, colors, contrast, brightness, ditherStrength } = useDitherStore();

  return (
    <div className="h-screen grid grid-cols-[300px_400px_1fr] gap-0 bg-[#e8e5dd] font-['JetBrains_Mono',monospace] text-[13px]">
      {/* Column 1: File Upload & Actions */}
      <div className="bg-[#e8e5dd] p-5 border-r border-[#d0cdc4] overflow-y-auto">
        <div className="text-sm font-medium mb-6 text-[#2a2a2a]">TODOGOOLS.APP</div>

        <div className="mb-8">
          <div className="text-sm text-[#666] mb-2">/UPLOAD</div>
          <UploadZone />
        </div>

        <div className="mb-8">
          <div className="text-sm text-[#666] mb-2">/ACTIONS</div>
          <button
            onClick={() => {
              // Export functionality
              const canvas = document.querySelector('canvas');
              if (canvas) {
                canvas.toBlob((blob) => {
                  if (blob) {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'dithered-image.png';
                    a.click();
                    URL.revokeObjectURL(url);
                  }
                });
              }
            }}
            className="w-full p-3 bg-[#2a2a2a] text-[#e8e5dd] border-none cursor-pointer font-['JetBrains_Mono',monospace] text-sm transition-opacity hover:opacity-80"
          >
            EXPORT PNG
          </button>

          <button
            onClick={() => useDitherStore.getState().resetAll()}
            className="w-full p-3 mt-2 bg-transparent text-[#2a2a2a] border border-[#d0cdc4] cursor-pointer font-['JetBrains_Mono',monospace] text-sm transition-opacity hover:opacity-80"
          >
            RESET ALL
          </button>
        </div>
      </div>

      {/* Column 2: Controls */}
      <div className="bg-[#e8e5dd] p-5 border-r border-[#d0cdc4] overflow-y-auto">
        <AlgorithmSelector />

        <div className="mb-8">
          <div className="text-sm font-medium mb-4 text-[#2a2a2a]">GLOBAL SETTINGS</div>

          <div className="mb-5">
            <div className="flex justify-between mb-2 text-sm">
              <span className="text-[#2a2a2a]">Contrast</span>
              <span className="text-[#666]">{contrast.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.01"
              value={contrast}
              onChange={(e) => setGlobalSetting('contrast', Number(e.target.value))}
              className="w-full h-[2px] bg-[#d0cdc4] outline-none appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#2a2a2a] [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-[#2a2a2a] [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:cursor-pointer"
            />
          </div>

          <div className="mb-5">
            <div className="flex justify-between mb-2 text-sm">
              <span className="text-[#2a2a2a]">Brightness</span>
              <span className="text-[#666]">{brightness.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="-1"
              max="1"
              step="0.01"
              value={brightness}
              onChange={(e) => setGlobalSetting('brightness', Number(e.target.value))}
              className="w-full h-[2px] bg-[#d0cdc4] outline-none appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#2a2a2a] [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-[#2a2a2a] [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:cursor-pointer"
            />
          </div>

          <div className="mb-5">
            <div className="flex justify-between mb-2 text-sm">
              <span className="text-[#2a2a2a]">Colors</span>
              <span className="text-[#666]">{colors}</span>
            </div>
            <input
              type="range"
              min="2"
              max="256"
              step="1"
              value={colors}
              onChange={(e) => setGlobalSetting('colors', Number(e.target.value))}
              className="w-full h-[2px] bg-[#d0cdc4] outline-none appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#2a2a2a] [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-[#2a2a2a] [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:cursor-pointer"
            />
          </div>

          <div className="mb-5">
            <div className="flex justify-between mb-2 text-sm">
              <span className="text-[#2a2a2a]">Dither Strength</span>
              <span className="text-[#666]">{ditherStrength.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={ditherStrength}
              onChange={(e) => setGlobalSetting('ditherStrength', Number(e.target.value))}
              className="w-full h-[2px] bg-[#d0cdc4] outline-none appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#2a2a2a] [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-[#2a2a2a] [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:cursor-pointer"
            />
          </div>

          <div className="flex items-center mb-3 cursor-pointer">
            <input
              type="checkbox"
              checked={grayscale}
              onChange={(e) => setGlobalSetting('grayscale', e.target.checked)}
              className="mr-2 w-[18px] h-[18px] cursor-pointer accent-[#2a2a2a]"
            />
            <label className="text-sm cursor-pointer">Grayscale</label>
          </div>
        </div>
      </div>

      {/* Column 3: Canvas */}
      <div className="relative bg-[#e8e5dd]">
        <WebGLCanvas />
      </div>
    </div>
  );
}
