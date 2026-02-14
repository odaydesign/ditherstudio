'use client';

import React, { useState, useEffect } from 'react';
import { useDitherStore } from '@/store/ditherStore';
import { extractPaletteFromImage } from '@/lib/utils/color-extraction';

export default function PaletteEditor() {
    const customPalette = useDitherStore((state) => state.customPalette);
    const setCustomPaletteColor = useDitherStore((state) => state.setCustomPaletteColor);
    const setCustomPalette = useDitherStore((state) => state.setCustomPalette);
    const colors = useDitherStore((state) => state.colors); // Active palette size
    const setGlobalSetting = useDitherStore((state) => state.setGlobalSetting);
    const currentFile = useDitherStore((state) => state.currentFile);

    const [imageSrc, setImageSrc] = useState<string | null>(null);

    useEffect(() => {
        if (currentFile && !currentFile.type.startsWith('video/')) {
            const url = URL.createObjectURL(currentFile);
            setImageSrc(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setImageSrc(null);
        }
    }, [currentFile]);

    const [isExtracting, setIsExtracting] = useState(false);

    const handleExtract = async () => {
        if (!imageSrc) return;
        setIsExtracting(true);
        try {
            // Extract colors based on current count
            const extracted = await extractPaletteFromImage(imageSrc, colors);
            // Fill the rest with black if less than 16 (max palette size)
            while (extracted.length < 16) {
                extracted.push('#000000');
            }
            setCustomPalette(extracted);
        } catch (error) {
            console.error('Failed to extract palette:', error);
            alert('Could not extract palette from image.');
        } finally {
            setIsExtracting(false);
        }
    };

    const updateColorCount = (count: number) => {
        // Clamp to 2-16
        const newCount = Math.max(2, Math.min(16, count));
        setGlobalSetting('colors', newCount);
    };

    return (
        <div className="mt-4 border-t border-[#d0cdc4] pt-4">
            <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-bold text-[#666] uppercase tracking-wider">
                    Custom Palette
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#666]">COLORS:</span>
                    <input
                        type="number"
                        min="2"
                        max="16"
                        value={colors}
                        onChange={(e) => updateColorCount(parseInt(e.target.value) || 2)}
                        className="w-10 p-1 text-xs border border-[#d0cdc4] text-center"
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mb-3">
                <button
                    onClick={handleExtract}
                    disabled={!imageSrc || isExtracting}
                    className="flex-1 py-1 px-2 bg-white border border-[#d0cdc4] text-[10px] uppercase font-medium hover:bg-[#f5f3ee] disabled:opacity-50 transition-colors"
                >
                    {isExtracting ? 'Extracting...' : 'Extract From Image'}
                </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-8 gap-2">
                {customPalette.map((color, index) => {
                    const isActive = index < colors;
                    return (
                        <div key={index} className={`relative group ${!isActive ? 'opacity-30 grayscale' : ''}`}>
                            <input
                                type="color"
                                value={color}
                                onChange={(e) => setCustomPaletteColor(index, e.target.value)}
                                className="w-full aspect-square p-0 border-0 rounded cursor-pointer opacity-0 absolute inset-0 z-10"
                                disabled={!isActive}
                            />
                            <div
                                className={`w-full aspect-square rounded border ${isActive ? 'border-[#d0cdc4] shadow-sm' : 'border-dashed border-[#ccc]'} transition-all`}
                                style={{ backgroundColor: color }}
                            />
                            {isActive && (
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black text-white text-[9px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-20">
                                    {color}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="text-[10px] text-[#999] mt-2">
                Palette size: {colors}. Inactive colors are ignored.
            </div>
        </div>
    );
}
