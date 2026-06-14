'use client';

import { useDitherStore } from '@/store/ditherStore';
import { Collapsible } from './Collapsible';
import ColorPopover from './ColorPopover';

const sliderClass =
  "w-full h-[2px] bg-[#d0cdc4] outline-none appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#2a2a2a] [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-[#2a2a2a] [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:cursor-pointer";

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
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))} className={sliderClass} />
    </div>
  );
}

const TYPES = ['Waves', 'Wind', 'Water', 'Sun'];

export default function WaveFieldPanel() {
  const {
    waveType, waveGlow, waveScale, waveAmp, waveLineCount, waveLineStrength, waveGradient,
    waveColorLow, waveColorMid, waveColorHigh, waveColorFog, waveBg,
    waveCamHeight, waveCamDistance, waveFov, waveSpeed,
    setGlobalSetting, setWaveType,
  } = useDitherStore();
  const set = setGlobalSetting;
  const loopSecs = (2 * Math.PI) / Math.max(waveSpeed, 0.05);

  return (
    <div className="space-y-1">
      <div className="pb-5 mb-5 border-b border-[#d0cdc4]">
        <label className="text-xs text-[#666] block mb-2">Type</label>
        <div className="grid grid-cols-4 gap-2">
          {TYPES.map((label, i) => (
            <button
              key={label}
              onClick={() => setWaveType(i)}
              className={`p-2 text-[11px] border transition-colors ${waveType === i ? 'bg-[#2a2a2a] text-[#e8e5dd] border-[#2a2a2a]' : 'bg-transparent text-[#666] border-[#d0cdc4] hover:border-[#2a2a2a]'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-[#999] mt-2">Each theme is a starting point — tweak anything below.</p>
      </div>

      <Collapsible title="WAVE LOOK" defaultOpen={true}>
        <div className="space-y-4">
          <Slider label="Scale" value={waveScale} min={0.05} max={0.4} step={0.005}
            onChange={(v) => set('waveScale', v)} fmt={(v) => v.toFixed(3)} />
          <Slider label="Amplitude" value={waveAmp} min={0.5} max={5} step={0.1}
            onChange={(v) => set('waveAmp', v)} fmt={(v) => v.toFixed(1)} />
          <Slider label="Line Density" value={waveLineCount} min={0.3} max={4} step={0.05}
            onChange={(v) => set('waveLineCount', v)} fmt={(v) => v.toFixed(2)} />
          <Slider label="Line Contrast" value={waveLineStrength} min={0} max={1} step={0.02}
            onChange={(v) => set('waveLineStrength', v)} fmt={(v) => v.toFixed(2)} />
          <Slider label="Glow" value={waveGlow} min={0} max={1.5} step={0.02}
            onChange={(v) => set('waveGlow', v)} fmt={(v) => v.toFixed(2)} />
          <Slider label="Color Spread" value={waveGradient} min={0.004} max={0.03} step={0.001}
            onChange={(v) => set('waveGradient', v)} fmt={(v) => v.toFixed(3)} />
        </div>
      </Collapsible>

      <Collapsible title="WAVE COLORS" defaultOpen={true}>
        <div className="space-y-4">
          <ColorPopover label="Low (left)" value={waveColorLow} onChange={(v) => set('waveColorLow', v)} />
          <ColorPopover label="Crest highlight" value={waveColorMid} onChange={(v) => set('waveColorMid', v)} />
          <ColorPopover label="Accent (right)" value={waveColorHigh} onChange={(v) => set('waveColorHigh', v)} />
          <ColorPopover label="Horizon / fog" value={waveColorFog} onChange={(v) => set('waveColorFog', v)} />
          <ColorPopover label="Background" value={waveBg} onChange={(v) => set('waveBg', v)} />
        </div>
      </Collapsible>

      <Collapsible title="CAMERA & MOTION" defaultOpen={false}>
        <div className="space-y-4">
          <Slider label="Camera Height" value={waveCamHeight} min={2} max={20} step={0.5}
            onChange={(v) => set('waveCamHeight', v)} fmt={(v) => v.toFixed(1)} />
          <Slider label="Camera Distance" value={waveCamDistance} min={15} max={70} step={1}
            onChange={(v) => set('waveCamDistance', v)} fmt={(v) => `${Math.round(v)}`} />
          <Slider label="Field of View" value={waveFov} min={20} max={80} step={1}
            onChange={(v) => set('waveFov', v)} fmt={(v) => `${Math.round(v)}°`} />
          <Slider label="Loop Speed" value={waveSpeed} min={0.1} max={1.5} step={0.05}
            onChange={(v) => set('waveSpeed', v)} fmt={(v) => v.toFixed(2)} />
          <p className="text-[10px] text-[#999]">Seamless loop ≈ {loopSecs.toFixed(1)}s. Exports loop exactly — one full cycle, no seam.</p>
        </div>
      </Collapsible>
    </div>
  );
}
