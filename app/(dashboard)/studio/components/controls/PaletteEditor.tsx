'use client';

import React from 'react';
import { useDitherStore } from '@/store/ditherStore';

export default function PaletteEditor() {
    const customPalette = useDitherStore((state) => state.customPalette);
    const setCustomPaletteColor = useDitherStore((state) => state.setCustomPaletteColor);
    const colorMode = useDitherStore((state) => state.colorMode);

    // Only show if color mode is Palette (4) or Hue Palette (5)
    // Logic handled by ColorSettings parent component now
    // if (colorMode !== 4 && colorMode !== 5) {
    //   return null;
    // }

    return (
        <div className="mt-4 border-t border-[#d0cdc4] pt-4">
            <div className="text-xs font-bold text-[#666] mb-2 uppercase tracking-wider">
                Custom Palette (16 Colors)
            </div>
            <div className="grid grid-cols-8 gap-2">
                {customPalette.map((color, index) => (
                    <div key={index} className="relative group">
                        <input
                            type="color"
                            value={color}
                            onChange={(e) => setCustomPaletteColor(index, e.target.value)}
                            className="w-8 h-8 p-0 border-0 rounded cursor-pointer opacity-0 absolute inset-0 z-10"
                        />
                        <div
                            className="w-8 h-8 rounded border border-[#d0cdc4] shadow-sm"
                            style={{ backgroundColor: color }}
                        />
                    </div>
                ))}
            </div>
            <div className="text-[10px] text-[#999] mt-2">
                Click a swatch to change color. Used when "Palette" or "Hue Palette" mode is selected.
            </div>
        </div>
    );
}
