'use client';

import { useRef } from 'react';
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
    glassRibs, glassRefract, glassIOR, glassReflect, glassFrost, glassSheen, glassDispersion,
    glassWavy, glassAngle, glassSpeed, glassColorA, glassColorB, glassColorC, glassBg, glassBgImage,
    setGlobalSetting,
  } = useDitherStore();
  const set = setGlobalSetting;
  const fileRef = useRef<HTMLInputElement>(null);
  const loopSecs = (2 * Math.PI) / Math.max(glassSpeed, 0.05);

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      const img = new window.Image();
      img.onload = () => {
        set('glassBgImage', url);
        set('glassBgW', img.naturalWidth);
        set('glassBgH', img.naturalHeight);
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-1">
      <Collapsible title="GLASS" defaultOpen={true}>
        <div className="space-y-4">
          <Slider label="Ribs" value={glassRibs} min={6} max={90} step={1}
            onChange={(v) => set('glassRibs', v)} fmt={(v) => `${Math.round(v)}`} />
          <Slider label="Curvature" value={glassRefract} min={0.1} max={2} step={0.05}
            onChange={(v) => set('glassRefract', v)} fmt={(v) => v.toFixed(2)} />
          <Slider label="Index of Refraction" value={glassIOR} min={1} max={2} step={0.01}
            onChange={(v) => set('glassIOR', v)} fmt={(v) => v.toFixed(2)} />
          <Slider label="Reflection" value={glassReflect} min={0} max={1} step={0.02}
            onChange={(v) => set('glassReflect', v)} fmt={(v) => v.toFixed(2)} />
          <Slider label="Frost (blur)" value={glassFrost} min={0} max={1} step={0.02}
            onChange={(v) => set('glassFrost', v)} fmt={(v) => v.toFixed(2)} />
          <Slider label="Dispersion" value={glassDispersion} min={0} max={1} step={0.02}
            onChange={(v) => set('glassDispersion', v)} fmt={(v) => v.toFixed(2)} />
          <Slider label="Sheen / Specular" value={glassSheen} min={0} max={1} step={0.02}
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

      <Collapsible title="BACKGROUND" defaultOpen={true}>
        <div className="space-y-4">
          <input ref={fileRef} type="file" accept="image/*" onChange={onUpload} className="hidden" />
          {glassBgImage ? (
            <div className="space-y-2">
              <div className="w-full h-20 rounded-xl border border-white/10 bg-cover bg-center" style={{ backgroundImage: `url(${glassBgImage})` }} />
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => fileRef.current?.click()} className="p-2 text-[11px] bg-white/[0.05] text-white/80 border border-white/10 rounded-xl hover:bg-white/10 hover:text-white transition-colors">Replace</button>
                <button onClick={() => { set('glassBgImage', null); set('glassBgW', 0); set('glassBgH', 0); }} className="p-2 text-[11px] bg-white/[0.05] text-white/70 border border-white/10 rounded-xl hover:text-[#e74c3c] hover:border-[#e74c3c] transition-colors">Remove</button>
              </div>
            </div>
          ) : (
            <button onClick={() => fileRef.current?.click()} className="w-full p-3 bg-white text-[#0b0b0d] text-xs rounded-xl hover:opacity-90 transition-opacity">Upload background image</button>
          )}
          <p className="text-[10px] text-white/40">Refract a photo through the glass — or leave empty for the animated glow below.</p>
        </div>
      </Collapsible>

      <Collapsible title="SUBJECT COLORS" defaultOpen={!glassBgImage}>
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
