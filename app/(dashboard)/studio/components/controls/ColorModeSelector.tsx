'use client';

import React from 'react';
import { useDitherStore } from '@/store/ditherStore';

const COLOR_MODES = [
    { id: 0, name: 'Normal' },
    { id: 1, name: 'Grayscale' },
    { id: 2, name: 'Duotone' },
    { id: 3, name: 'Tritone' },
    { id: 4, name: 'Palette' },
    { id: 5, name: 'Hue Palette' },
];

export default function ColorModeSelector() {
    const colorMode = useDitherStore((state) => state.colorMode);
    const setColorMode = useDitherStore((state) => state.setColorMode);

    return (
        <div className="mb-6">
            <div className="text-sm font-medium mb-2 text-[#2a2a2a]">COLOR MODE</div>
            <select
                value={colorMode}
                onChange={(e) => setColorMode(Number(e.target.value))}
                className="w-full bg-transparent border border-[#d0cdc4] p-2 text-[#2a2a2a] font-['JetBrains_Mono',monospace] text-sm outline-none cursor-pointer"
            >
                {COLOR_MODES.map((mode) => (
                    <option key={mode.id} value={mode.id}>
                        {mode.name}
                    </option>
                ))}
            </select>
        </div>
    );
}
