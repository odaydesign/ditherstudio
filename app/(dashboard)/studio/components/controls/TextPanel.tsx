'use client';

import { useDitherStore } from '@/store/ditherStore';
import { Collapsible } from './Collapsible';
import ColorPopover from './ColorPopover';

const sliderClass =
  "w-full h-[2px] bg-white/20 outline-none appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:cursor-pointer";
const selectClass =
  "w-full p-2 bg-white/[0.06] border border-white/10 rounded-xl text-xs text-white/90 font-sans cursor-pointer focus:outline-none focus:border-white/40";

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

const FONTS = ['Sans', 'Serif', 'Mono', 'Display'];
const WEIGHTS = [
  { v: 300, l: 'Light' }, { v: 400, l: 'Regular' }, { v: 500, l: 'Medium' },
  { v: 700, l: 'Bold' }, { v: 800, l: 'Extra' }, { v: 900, l: 'Black' },
];
const ALIGN = ['Left', 'Center', 'Right'];

export default function TextPanel() {
  const {
    textContent, textFont, textSize, textWeight, textAlign, textLineHeight,
    textTracking, textItalic, textUppercase, textColor, textBg, setGlobalSetting,
  } = useDitherStore();
  const set = setGlobalSetting;

  const toggleCls = (active: boolean, extra = '') =>
    `p-2 text-[11px] border rounded-xl transition-colors ${extra} ${active ? 'bg-white text-[#0b0b0d] border-white/30' : 'bg-white/[0.05] text-white/70 border-white/10 hover:border-white/40'}`;

  return (
    <div className="space-y-1">
      <Collapsible title="TEXT" defaultOpen={true}>
        <div className="space-y-4">
          <textarea
            value={textContent}
            onChange={(e) => set('textContent', e.target.value)}
            rows={2}
            spellCheck={false}
            placeholder="Type something…"
            className="w-full p-2 bg-white/[0.06] border border-white/10 rounded-xl text-xs text-white/90 font-sans resize-none focus:outline-none focus:border-white/40"
          />
          <div>
            <label className="text-xs text-white/55 block mb-2">Typeface</label>
            <select value={textFont} onChange={(e) => set('textFont', Number(e.target.value))} className={selectClass}>
              {FONTS.map((f, i) => <option key={f} value={i}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-white/55 block mb-2">Weight</label>
            <select value={textWeight} onChange={(e) => set('textWeight', Number(e.target.value))} className={selectClass}>
              {WEIGHTS.map((w) => <option key={w.v} value={w.v}>{w.l}</option>)}
            </select>
          </div>
          <Slider label="Size" value={textSize} min={0.05} max={0.9} step={0.01}
            onChange={(v) => set('textSize', v)} fmt={(v) => v.toFixed(2)} />
          <Slider label="Line height" value={textLineHeight} min={0.7} max={2} step={0.05}
            onChange={(v) => set('textLineHeight', v)} fmt={(v) => v.toFixed(2)} />
          <Slider label="Tracking" value={textTracking} min={-20} max={80} step={1}
            onChange={(v) => set('textTracking', v)} fmt={(v) => v.toFixed(0)} />
          <div>
            <label className="text-xs text-white/55 block mb-2">Align</label>
            <div className="grid grid-cols-3 gap-2">
              {ALIGN.map((a, i) => (
                <button key={a} onClick={() => set('textAlign', i)} className={toggleCls(textAlign === i)}>{a}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => set('textItalic', !textItalic)} className={toggleCls(textItalic, 'italic')}>Italic</button>
            <button onClick={() => set('textUppercase', !textUppercase)} className={toggleCls(textUppercase)}>UPPERCASE</button>
          </div>
        </div>
      </Collapsible>

      <Collapsible title="COLORS" defaultOpen={true}>
        <div className="space-y-4">
          <ColorPopover label="Text" value={textColor} onChange={(v) => set('textColor', v)} />
          <ColorPopover label="Background" value={textBg} onChange={(v) => set('textBg', v)} />
        </div>
      </Collapsible>
    </div>
  );
}
