'use client';

import { useRef, useState, useCallback } from 'react';
import { useDitherStore } from '@/store/ditherStore';

interface SplitViewComparisonProps {
    originalImageUrl: string;
}

export default function SplitViewComparison({ originalImageUrl }: SplitViewComparisonProps) {
    const { comparisonPosition, setComparisonPosition, setComparisonMode } = useDitherStore();
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        setIsDragging(true);
        updatePosition(e);
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging) return;
        updatePosition(e);
    }, [isDragging]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        setIsDragging(true);
        updateTouchPosition(e);
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isDragging) return;
        updateTouchPosition(e);
    }, [isDragging]);

    const updatePosition = useCallback((e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        setComparisonPosition(Math.max(0, Math.min(1, x)));
    }, [setComparisonPosition]);

    const updateTouchPosition = useCallback((e: React.TouchEvent) => {
        if (!containerRef.current || !e.touches[0]) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.touches[0].clientX - rect.left) / rect.width;
        setComparisonPosition(Math.max(0, Math.min(1, x)));
    }, [setComparisonPosition]);

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 z-20 cursor-ew-resize select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
        >
            {/* Original Image (left side, clipped) */}
            <div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{
                    clipPath: `inset(0 ${(1 - comparisonPosition) * 100}% 0 0)`,
                }}
            >
                <img
                    src={originalImageUrl}
                    alt="Original"
                    className="w-full h-full object-contain"
                    style={{ imageRendering: 'pixelated' }}
                />
            </div>

            {/* Labels */}
            <span
                className="absolute top-4 left-4 text-white text-xs font-medium bg-black/60 px-2 py-1 rounded pointer-events-none"
                style={{ opacity: comparisonPosition > 0.15 ? 1 : 0 }}
            >
                ORIGINAL
            </span>
            <span
                className="absolute top-4 right-4 text-white text-xs font-medium bg-black/60 px-2 py-1 rounded pointer-events-none"
                style={{ opacity: comparisonPosition < 0.85 ? 1 : 0 }}
            >
                DITHERED
            </span>

            {/* Slider line */}
            <div
                className="absolute inset-y-0 w-0.5 bg-white shadow-lg pointer-events-none"
                style={{ left: `calc(${comparisonPosition * 100}% - 1px)` }}
            >
                {/* Handle circle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center border-2 border-white/30">
                    <svg className="w-5 h-5 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    </svg>
                </div>
            </div>

            {/* Close button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setComparisonMode(false);
                }}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white text-[#0b0b0d] px-4 py-2 text-xs rounded hover:bg-white/15 transition-colors z-10"
            >
                EXIT COMPARISON
            </button>
        </div>
    );
}
