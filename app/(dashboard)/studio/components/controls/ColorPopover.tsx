'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDitherStore } from '@/store/ditherStore';
import { hexToHsl, hslToHex, clampHex, harmonies, lightnessRamp } from '@/lib/utils/color';

function SliderRow({ label, value, max = 100, onChange, grad }: {
  label: string; value: number; max?: number; onChange: (v: number) => void; grad: string;
}) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-[10px] text-white/55">{label}</span>
        <span className="text-[10px] font-mono text-white/90">{Math.round(value)}</span>
      </div>
      <input
        type="range" min={0} max={max} step={1} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2.5 appearance-none cursor-pointer rounded-full border border-white/10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-white/30 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-white/30 [&::-moz-range-thumb]:cursor-pointer"
        style={{ background: grad }}
      />
    </div>
  );
}

export default function ColorPopover({ label, value, onChange }: {
  label: string; value: string; onChange: (hex: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hsl, setHsl] = useState(() => hexToHsl(value));
  const [hexText, setHexText] = useState(value);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);

  const savedColors = useDitherStore((s) => s.savedColors);
  const addSavedColor = useDitherStore((s) => s.addSavedColor);
  const removeSavedColor = useDitherStore((s) => s.removeSavedColor);

  const hex = hslToHex(hsl.h, hsl.s, hsl.l);

  useEffect(() => setMounted(true), []);
  // Sync from the external value when it changes (e.g. theme preset applied).
  useEffect(() => { setHsl(hexToHsl(value)); setHexText(value); }, [value]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const emit = (next: { h: number; s: number; l: number }) => {
    setHsl(next);
    const hx = hslToHex(next.h, next.s, next.l);
    setHexText(hx);
    onChange(hx);
  };
  const apply = (raw: string) => {
    const c = clampHex(raw);
    if (!c) return;
    emit(hexToHsl(c));
  };

  const toggle = () => {
    if (!open && triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      const W = 256;
      const H = Math.min(452, window.innerHeight - 16);
      const left = Math.max(8, Math.min(r.right - W, window.innerWidth - W - 8));
      // Open below the swatch; if it would overflow the bottom, open above it.
      let top = r.bottom + 8;
      if (top + H > window.innerHeight - 8) top = r.top - 8 - H;
      if (top < 8) top = 8;
      setPos({ top, left });
    }
    setOpen((o) => !o);
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-white/55">{label}</span>
      <button
        ref={triggerRef}
        onClick={toggle}
        className="w-8 h-8 border border-white/10 rounded-xl hover:border-white/40"
        style={{ backgroundColor: hex }}
        aria-label={`${label} colour`}
      />
      {open && mounted && createPortal(
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} />
          <div
            className="fixed z-[61] w-[256px] p-3.5 rounded-2xl border border-white/12 bg-[#161619] shadow-[0_24px_70px_-15px_rgba(0,0,0,0.85)] space-y-3.5 animate-fade-up overflow-y-auto"
            style={{ top: pos.top, left: pos.left, maxHeight: 'min(452px, calc(100vh - 16px))' }}
          >
            <div className="text-[10px] text-white/40 uppercase tracking-wide">{label}</div>

            <div className="flex items-center gap-2">
              <div className="w-9 h-9 border border-white/10 rounded-xl shrink-0" style={{ backgroundColor: hex }} />
              <input
                value={hexText}
                onChange={(e) => setHexText(e.target.value)}
                onBlur={() => apply(hexText)}
                onKeyDown={(e) => { if (e.key === 'Enter') apply(hexText); }}
                spellCheck={false}
                className="flex-1 min-w-0 p-1.5 bg-white/[0.05] border border-white/10 rounded-xl text-xs font-mono text-white/90 uppercase focus:border-white/40 outline-none"
                maxLength={7}
              />
              <div className="relative w-9 h-9 shrink-0" title="System picker">
                <input type="color" value={hex} onChange={(e) => apply(e.target.value)}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                <div className="w-9 h-9 border border-white/10 rounded-xl flex items-center justify-center text-white/55 text-sm pointer-events-none">◐</div>
              </div>
            </div>

            <SliderRow label="Hue" value={hsl.h} max={360} onChange={(h) => emit({ ...hsl, h })}
              grad="linear-gradient(90deg,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)" />
            <SliderRow label="Saturation" value={hsl.s} onChange={(s) => emit({ ...hsl, s })}
              grad={`linear-gradient(90deg, ${hslToHex(hsl.h, 0, hsl.l)}, ${hslToHex(hsl.h, 100, hsl.l)})`} />
            <SliderRow label="Lightness" value={hsl.l} onChange={(l) => emit({ ...hsl, l })}
              grad={`linear-gradient(90deg, #000, ${hslToHex(hsl.h, hsl.s, 50)}, #fff)`} />

            <div>
              <div className="text-[10px] text-white/40 mb-1">Tint / shade</div>
              <div className="flex gap-1">
                {lightnessRamp(hex, 6).map((c, i) => (
                  <button key={i} onClick={() => apply(c)} title={c}
                    className="flex-1 h-6 border border-white/10 rounded-md hover:border-white/40 transition-colors" style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-white/40 mb-1">Harmony</div>
              <div className="flex gap-1">
                {harmonies(hex).map((h, i) => (
                  <button key={i} onClick={() => apply(h.hex)} title={`${h.label} · ${h.hex}`}
                    className="flex-1 h-6 border border-white/10 rounded-md hover:border-white/40 transition-colors" style={{ backgroundColor: h.hex }} />
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-white/40">Saved</span>
                <button onClick={() => addSavedColor(hex)} className="text-[10px] text-white/90 hover:underline">+ Save</button>
              </div>
              <div className="flex flex-wrap gap-1.5 min-h-[20px]">
                {savedColors.length === 0 && <span className="text-[10px] text-white/35">No saved colours yet</span>}
                {savedColors.map((c) => (
                  <div key={c} className="relative group">
                    <button onClick={() => apply(c)} title={c}
                      className="w-6 h-6 border border-white/10 rounded-md hover:border-white/40 transition-colors" style={{ backgroundColor: c }} />
                    <button onClick={() => removeSavedColor(c)} aria-label="Remove"
                      className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white text-[#0b0b0d] text-[9px] leading-none flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100">×</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>,
        document.body,
      )}
    </div>
  );
}
