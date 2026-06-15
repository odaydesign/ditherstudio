'use client';

import { useDitherStore } from '@/store/ditherStore';
import { Collapsible } from './Collapsible';
import ColorPopover from './ColorPopover';

const sliderClass =
  "w-full h-[2px] bg-white/20 outline-none appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:cursor-pointer";

function Slider({ label, value, min, max, step, onChange, fmt }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; fmt?: (v: number) => string;
}) {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <label className="text-xs text-white/55">{label}</label>
        <span className="text-xs text-white/90 font-mono">{fmt ? fmt(value) : value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))} className={sliderClass} />
    </div>
  );
}

export default function GlassPanel() {
  const {
    glassRibs, glassRefract, glassFrost, glassSheen, glassDispersion, glassWavy, glassAngle, glassSpeed,
    glassColorA, glassColorB, glassColorC, glassBg,
    setGlobalSetting,
  } = useDitherStore();
  const set = setGlobalSetting;
  const loopSecs = (2 * Math.PI) / Math.max(glassSpeed, 0.05);

  return (
    <div className="space-y-1">
      <Collapsible title="GLASS" defaultOpen={true}>
        <div className="space-y-4">
          <Slider label="Ribs" value={glassRibs} min={6} max={90} step={1}
            onChange={(v) => set('glassRibs', v)} fmt={(v) => `${Math.round(v)}`} />
          <Slider label="Refraction" value={glassRefract} min={0} max={3} step={0.05}
            onChange={(v) => set('glassRefract', v)} fmt={(v) => v.toFixed(2)} />
          <Slider label="Frost (blur)" value={glassFrost} min={0} max={1} step={0.02}
            onChange={(v) => set('glassFrost', v)} fmt={(v) => v.toFixed(2)} />
          <Slider label="Dispersion" value={glassDispersion} min={0} max={1} step={0.02}
            onChange={(v) => set('glassDispersion', v)} fmt={(v) => v.toFixed(2)} />
          <Slider label="Sheen" value={glassSheen} min={0} max={1} step={0.02}
            onChange={(v) => set('glassSheen', v)} fmt={(v) => v.toFixed(2)} />
          <Slider label="Waviness" value={glassWavy} min={0} max={1} step={0.02}
            onChange={(v) => set('glassWavy', v)} fmt={(v) => v.toFixed(2)} />
          <div>
            <label className="text-xs text-white/55 block mb-2">Direction</label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => set('glassAngle', 0)} className={`p-2 text-[11px] border rounded-xl transition-colors ${glassAngle < 0.5 ? 'bg-white text-[#0b0b0d] border-white/30' : 'bg-white/[0.05] text-white/70 border-white/10 hover:border-white/40'}`}>Vertical</button>
              <button onClick={() => set('glassAngle', 1)} className={`p-2 text-[11px] border rounded-xl transition-colors ${glassAngle >= 0.5 ? 'bg-white text-[#0b0b0d] border-white/30' : 'bg-white/[0.05] text-white/70 border-white/10 hover:border-white/40'}`}>Horizontal</button>
            </div>
          </div>
          <Slider label="Drift Speed" value={glassSpeed} min={0.05} max={1.5} step={0.05}
            onChange={(v) => set('glassSpeed', v)} fmt={(v) => v.toFixed(2)} />
          <p className="text-[10px] text-white/40">Seamless loop ≈ {loopSecs.toFixed(1)}s.</p>
        </div>
      </Collapsible>

      <Collapsible title="SUBJECT COLORS" defaultOpen={true}>
        <div className="space-y-4">
          <ColorPopover label="Glow A" value={glassColorA} onChange={(v) => set('glassColorA', v)} />
          <ColorPopover label="Glow B" value={glassColorB} onChange={(v) => set('glassColorB', v)} />
          <ColorPopover label="Glow C" value={glassColorC} onChange={(v) => set('glassColorC', v)} />
          <ColorPopover label="Backdrop" value={glassBg} onChange={(v) => set('glassBg', v)} />
        </div>
      </Collapsible>
    </div>
  );
}
