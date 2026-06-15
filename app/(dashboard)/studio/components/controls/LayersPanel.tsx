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

const MOTIONS = ['Sway', 'Spin', 'Tumble', 'Float', 'Wave', 'Breathe', 'Orbit', 'Figure-8', 'Pendulum'];

export default function LayersPanel() {
  const {
    layersLayout, layersDensity, layersSpacing, layersThickness, layersRadius, layersTilt,
    layersLineWidth, layersGlow, layersReflect, layersOpacity, layersFov,
    layersMotion, layersMotionAmt, layersVariety, layersSeed, layersDir, layersSpeed,
    layersColorOuter, layersColorInner, layersEdge, layersBg,
    setGlobalSetting,
  } = useDitherStore();
  const set = setGlobalSetting;
  const loopSecs = (2 * Math.PI) / Math.max(layersSpeed, 0.05);
  const rotational = !layersVariety && (layersMotion === 1 || layersMotion === 2); // spin / tumble

  return (
    <div className="space-y-1">
      <Collapsible title="GLASS LAYERS" defaultOpen={true}>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-white/55 block mb-2">Arrangement</label>
            <select value={layersLayout} onChange={(e) => set('layersLayout', Number(e.target.value))}
              className="w-full p-2 bg-white/[0.06] border border-white/10 rounded-xl text-xs text-white/90 font-sans cursor-pointer focus:outline-none focus:border-white/40">
              <option value={0}>Stack</option>
              <option value={1}>Tunnel</option>
              <option value={2}>Wall</option>
            </select>
          </div>
          <Slider label="Cards" value={layersDensity} min={2} max={10} step={1}
            onChange={(v) => set('layersDensity', v)} fmt={(v) => v.toFixed(0)} />
          <Slider label="Spacing" value={layersSpacing} min={0.25} max={1.4} step={0.02}
            onChange={(v) => set('layersSpacing', v)} fmt={(v) => v.toFixed(2)} />
          <Slider label="Thickness" value={layersThickness} min={0.03} max={0.4} step={0.01}
            onChange={(v) => set('layersThickness', v)} fmt={(v) => v.toFixed(2)} />
          <Slider label="Corner Radius" value={layersRadius} min={0} max={0.18} step={0.005}
            onChange={(v) => set('layersRadius', v)} fmt={(v) => v.toFixed(3)} />
          <Slider label="Tilt" value={layersTilt} min={-0.7} max={0.7} step={0.01}
            onChange={(v) => set('layersTilt', v)} fmt={(v) => `${Math.round(v * 57.3)}°`} />
          <Slider label="Zoom (FOV)" value={layersFov} min={28} max={72} step={1}
            onChange={(v) => set('layersFov', v)} fmt={(v) => `${v.toFixed(0)}°`} />
        </div>
      </Collapsible>

      <Collapsible title="GLASS &amp; LIGHT" defaultOpen={true}>
        <div className="space-y-4">
          <Slider label="Opacity" value={layersOpacity} min={0.08} max={0.7} step={0.01}
            onChange={(v) => set('layersOpacity', v)} fmt={(v) => v.toFixed(2)} />
          <Slider label="Frost" value={layersLineWidth} min={0} max={1} step={0.02}
            onChange={(v) => set('layersLineWidth', v)} fmt={(v) => v.toFixed(2)} />
          <Slider label="Reflections" value={layersReflect} min={0} max={1} step={0.02}
            onChange={(v) => set('layersReflect', v)} fmt={(v) => v.toFixed(2)} />
          <Slider label="Glow" value={layersGlow} min={0} max={2} step={0.02}
            onChange={(v) => set('layersGlow', v)} fmt={(v) => v.toFixed(2)} />
        </div>
      </Collapsible>

      <Collapsible title="MOTION" defaultOpen={true}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs text-white/55">Per-object variety</label>
            <button onClick={() => set('layersVariety', !layersVariety)} role="switch" aria-checked={layersVariety}
              className={`relative w-9 h-5 rounded-full transition-colors ${layersVariety ? 'bg-white' : 'bg-white/15'}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full transition-transform ${layersVariety ? 'translate-x-4 bg-[#0b0b0d]' : 'translate-x-0.5 bg-white'}`} />
            </button>
          </div>
          {layersVariety ? (
            <div>
              <label className="text-xs text-white/55 block mb-2">Each object gets its own shape &amp; motion.</label>
              <button onClick={() => set('layersSeed', Math.floor(Math.random() * 9999) + 1)}
                className="w-full p-2 text-[11px] bg-white/[0.05] border border-white/10 rounded-xl text-white/80 hover:border-white/40 hover:text-white transition-colors">
                ⟳ Shuffle mix (seed {layersSeed})
              </button>
            </div>
          ) : (
            <div>
              <label className="text-xs text-white/55 block mb-2">Animation</label>
              <select value={layersMotion} onChange={(e) => set('layersMotion', Number(e.target.value))}
                className="w-full p-2 bg-white/[0.06] border border-white/10 rounded-xl text-xs text-white/90 font-sans cursor-pointer focus:outline-none focus:border-white/40">
                {MOTIONS.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
            </div>
          )}
          <Slider label={rotational ? 'Turns / Tilt' : 'Amount'} value={layersMotionAmt} min={0} max={1} step={0.02}
            onChange={(v) => set('layersMotionAmt', v)} fmt={(v) => v.toFixed(2)} />
          <Slider label="Speed" value={layersSpeed} min={0.05} max={1.5} step={0.05}
            onChange={(v) => set('layersSpeed', v)} fmt={(v) => v.toFixed(2)} />
          <div>
            <label className="text-xs text-white/55 block mb-2">Direction</label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => set('layersDir', 1)} className={`p-2 text-[11px] border rounded-xl transition-colors ${layersDir > 0 ? 'bg-white text-[#0b0b0d] border-white/30' : 'bg-white/[0.05] text-white/70 border-white/10 hover:border-white/40'}`}>{rotational ? 'CW' : 'Left'}</button>
              <button onClick={() => set('layersDir', -1)} className={`p-2 text-[11px] border rounded-xl transition-colors ${layersDir < 0 ? 'bg-white text-[#0b0b0d] border-white/30' : 'bg-white/[0.05] text-white/70 border-white/10 hover:border-white/40'}`}>{rotational ? 'CCW' : 'Right'}</button>
            </div>
          </div>
          <p className="text-[10px] text-white/40">Seamless loop ≈ {loopSecs.toFixed(1)}s.</p>
        </div>
      </Collapsible>

      <Collapsible title="COLORS" defaultOpen={true}>
        <div className="space-y-4">
          <ColorPopover label="Glass tint" value={layersColorOuter} onChange={(v) => set('layersColorOuter', v)} />
          <ColorPopover label="Neon core" value={layersColorInner} onChange={(v) => set('layersColorInner', v)} />
          <ColorPopover label="Neon outer" value={layersEdge} onChange={(v) => set('layersEdge', v)} />
          <ColorPopover label="Background" value={layersBg} onChange={(v) => set('layersBg', v)} />
        </div>
      </Collapsible>
    </div>
  );
}
