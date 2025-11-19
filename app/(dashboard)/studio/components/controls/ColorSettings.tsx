'use client';

import React from 'react';
import { useDitherStore } from '@/store/ditherStore';
import PaletteEditor from './PaletteEditor';
import { getPalette, getPaletteNames } from '@/lib/utils/palettes';

export default function ColorSettings() {
    const colorMode = useDitherStore((state) => state.colorMode);
    const { duotoneDark, duotoneLight, tritoneShadow, tritoneMid, tritoneHighlight } = useDitherStore();
    const setGlobalSetting = useDitherStore((state) => state.setGlobalSetting);

    // Grayscale Mode (1)
    if (colorMode === 1) {
        return (
            <div className="mt-4 border-t border-[#d0cdc4] pt-4">
                <div className="text-xs font-bold text-[#666] mb-2 uppercase tracking-wider">
                    Grayscale Settings
                </div>
                <div>
                    <label className="text-[10px] text-[#999] block mb-1">Tint Color</label>
                    <div className="flex items-center">
                        <div className="relative w-8 h-8 mr-2">
                            <input
                                type="color"
                                value={duotoneLight}
                                onChange={(e) => setGlobalSetting('duotoneLight', e.target.value)}
                                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                            />
                            <div
                                className="w-full h-full rounded border border-[#d0cdc4] shadow-sm"
                                style={{ backgroundColor: duotoneLight }}
                            />
                        </div>
                        <span className="text-xs text-[#2a2a2a] font-mono">{duotoneLight}</span>
                    </div>
                </div>
            </div>
        );
    }

    // Duotone Mode (2)
    if (colorMode === 2) {
        return (
            <div className="mt-4 border-t border-[#d0cdc4] pt-4">
                <div className="text-xs font-bold text-[#666] mb-2 uppercase tracking-wider">
                    Duotone Colors
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] text-[#999] block mb-1">Dark</label>
                        <div className="flex items-center">
                            <div className="relative w-8 h-8 mr-2">
                                <input
                                    type="color"
                                    value={duotoneDark}
                                    onChange={(e) => setGlobalSetting('duotoneDark', e.target.value)}
                                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                                />
                                <div
                                    className="w-full h-full rounded border border-[#d0cdc4] shadow-sm"
                                    style={{ backgroundColor: duotoneDark }}
                                />
                            </div>
                            <span className="text-xs text-[#2a2a2a] font-mono">{duotoneDark}</span>
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] text-[#999] block mb-1">Light</label>
                        <div className="flex items-center">
                            <div className="relative w-8 h-8 mr-2">
                                <input
                                    type="color"
                                    value={duotoneLight}
                                    onChange={(e) => setGlobalSetting('duotoneLight', e.target.value)}
                                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                                />
                                <div
                                    className="w-full h-full rounded border border-[#d0cdc4] shadow-sm"
                                    style={{ backgroundColor: duotoneLight }}
                                />
                            </div>
                            <span className="text-xs text-[#2a2a2a] font-mono">{duotoneLight}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Tritone Mode (3)
    if (colorMode === 3) {
        return (
            <div className="mt-4 border-t border-[#d0cdc4] pt-4">
                <div className="text-xs font-bold text-[#666] mb-2 uppercase tracking-wider">
                    Tritone Colors
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <div>
                        <label className="text-[10px] text-[#999] block mb-1">Shadow</label>
                        <div className="relative w-full h-8">
                            <input
                                type="color"
                                value={tritoneShadow}
                                onChange={(e) => setGlobalSetting('tritoneShadow', e.target.value)}
                                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                            />
                            <div
                                className="w-full h-full rounded border border-[#d0cdc4] shadow-sm"
                                style={{ backgroundColor: tritoneShadow }}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] text-[#999] block mb-1">Mid</label>
                        <div className="relative w-full h-8">
                            <input
                                type="color"
                                value={tritoneMid}
                                onChange={(e) => setGlobalSetting('tritoneMid', e.target.value)}
                                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                            />
                            <div
                                className="w-full h-full rounded border border-[#d0cdc4] shadow-sm"
                                style={{ backgroundColor: tritoneMid }}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] text-[#999] block mb-1">Highlight</label>
                        <div className="relative w-full h-8">
                            <input
                                type="color"
                                value={tritoneHighlight}
                                onChange={(e) => setGlobalSetting('tritoneHighlight', e.target.value)}
                                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                            />
                            <div
                                className="w-full h-full rounded border border-[#d0cdc4] shadow-sm"
                                style={{ backgroundColor: tritoneHighlight }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Palette Modes (4 & 5)
    if (colorMode === 4 || colorMode === 5) {
        return (
            <>
                <div className="mt-4 border-t border-[#d0cdc4] pt-4 mb-4">
                    <div className="text-xs font-bold text-[#666] mb-2 uppercase tracking-wider">
                        Palette Presets
                    </div>
                    <select
                        onChange={(e) => {
                            const palette = getPalette(e.target.value);
                            if (palette) {
                                // Convert RGB array to hex strings
                                const hexColors = palette.map(rgb =>
                                    `#${rgb[0].toString(16).padStart(2, '0')}${rgb[1].toString(16).padStart(2, '0')}${rgb[2].toString(16).padStart(2, '0')}`
                                );
                                // Pad with black if less than 16 colors
                                while (hexColors.length < 16) {
                                    hexColors.push('#000000');
                                }
                                useDitherStore.getState().setCustomPalette(hexColors);
                            }
                        }}
                        className="w-full bg-transparent border border-[#d0cdc4] p-2 text-[#2a2a2a] font-['JetBrains_Mono',monospace] text-sm outline-none cursor-pointer"
                    >
                        <option value="">Select a preset...</option>
                        {getPaletteNames().map((name) => (
                            <option key={name} value={name}>
                                {name.charAt(0).toUpperCase() + name.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>
                <PaletteEditor />
            </>
        );
    }

    return null;
}
