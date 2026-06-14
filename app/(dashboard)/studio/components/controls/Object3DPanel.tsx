'use client';

import { useDitherStore } from '@/store/ditherStore';
import { Collapsible } from './Collapsible';

const sliderClass =
  "w-full h-[2px] bg-white/20 outline-none appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:cursor-pointer";
const selectClass =
  "w-full p-2 bg-white/[0.05] border border-white/10 rounded-xl text-xs text-white/90 font-sans cursor-pointer hover:border-white/40";

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

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-white/55">{label}</span>
      <div className="relative w-8 h-8">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10" />
        <div className="w-8 h-8 border border-white/10 rounded-xl" style={{ backgroundColor: value }} />
      </div>
    </div>
  );
}

const SHAPES = [
  { v: 0, l: 'Torus Knot' }, { v: 1, l: 'Torus' }, { v: 2, l: 'Sphere' }, { v: 3, l: 'Cube' },
  { v: 4, l: 'Icosahedron' }, { v: 5, l: 'Cone' }, { v: 6, l: 'Cylinder' }, { v: 7, l: 'Dodecahedron' },
];
const MATERIALS = [
  { v: 0, l: 'Lit (shaded)' }, { v: 1, l: 'Toon' }, { v: 2, l: 'Normals' },
  { v: 3, l: 'Matcap' }, { v: 4, l: 'Depth' }, { v: 5, l: 'Wireframe' },
];

export default function Object3DPanel() {
  const {
    object3DShape, object3DMaterial, object3DColor, object3DBg,
    object3DAutoRotate, object3DAutoSpeed, object3DRotateX, object3DRotateY,
    object3DDistance, object3DFov, object3DLowRes, object3DVertexSnap,
    setGlobalSetting,
  } = useDitherStore();
  const set = setGlobalSetting;
  const needsColor = object3DMaterial === 0 || object3DMaterial === 1 || object3DMaterial === 5;

  return (
    <div className="space-y-1">
      <Collapsible title="OBJECT" defaultOpen={true}>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-white/55 block mb-2">Shape</label>
            <select value={object3DShape} onChange={(e) => set('object3DShape', Number(e.target.value))} className={selectClass}>
              {SHAPES.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-white/55 block mb-2">Material</label>
            <select value={object3DMaterial} onChange={(e) => set('object3DMaterial', Number(e.target.value))} className={selectClass}>
              {MATERIALS.map((m) => <option key={m.v} value={m.v}>{m.l}</option>)}
            </select>
          </div>
          {needsColor && <ColorField label="Object Color" value={object3DColor} onChange={(v) => set('object3DColor', v)} />}
          <ColorField label="Background" value={object3DBg} onChange={(v) => set('object3DBg', v)} />
        </div>
      </Collapsible>

      <Collapsible title="CAMERA & MOTION" defaultOpen={true}>
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs text-white/55">Auto-rotate</span>
            <input type="checkbox" checked={object3DAutoRotate}
              onChange={(e) => set('object3DAutoRotate', e.target.checked)}
              className="w-4 h-4 cursor-pointer accent-white" />
          </label>
          {object3DAutoRotate && (
            <Slider label="Rotate Speed" value={object3DAutoSpeed} min={0.1} max={4} step={0.05}
              onChange={(v) => set('object3DAutoSpeed', v)} fmt={(v) => v.toFixed(2)} />
          )}
          <Slider label="Rotate X" value={object3DRotateX} min={-3.14} max={3.14} step={0.01}
            onChange={(v) => set('object3DRotateX', v)} fmt={(v) => v.toFixed(2)} />
          <Slider label="Rotate Y" value={object3DRotateY} min={-3.14} max={3.14} step={0.01}
            onChange={(v) => set('object3DRotateY', v)} fmt={(v) => v.toFixed(2)} />
          <Slider label="Distance" value={object3DDistance} min={1.5} max={8} step={0.1}
            onChange={(v) => set('object3DDistance', v)} fmt={(v) => v.toFixed(1)} />
          <Slider label="Field of View" value={object3DFov} min={15} max={90} step={1}
            onChange={(v) => set('object3DFov', v)} fmt={(v) => `${Math.round(v)}°`} />
        </div>
      </Collapsible>

      <Collapsible title="RETRO (PS1)" defaultOpen={false}>
        <div className="space-y-4">
          <Slider label="Low-res pixels" value={object3DLowRes} min={1} max={6} step={1}
            onChange={(v) => set('object3DLowRes', v)} fmt={(v) => v <= 1 ? 'off' : `1/${Math.round(v)}`} />
          <Slider label="Vertex Snap" value={object3DVertexSnap} min={0} max={1} step={0.01}
            onChange={(v) => set('object3DVertexSnap', v)} fmt={(v) => v === 0 ? 'off' : v.toFixed(2)} />
          <p className="text-[10px] text-white/40">Low-res + vertex snap give the wobbly PlayStation-1 look — then the dither lands on top.</p>
        </div>
      </Collapsible>
    </div>
  );
}
