/**
 * Color Extraction Utility
 * Extracts dominant colors from a canvas/image for palette generation.
 */

export const extractPalette = (
    canvas: HTMLCanvasElement,
    count: number = 8
): string[] => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];

    // 1. Downsample for performance
    const thumbSize = 64;
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = thumbSize;
    thumbCanvas.height = thumbSize;
    const thumbCtx = thumbCanvas.getContext('2d');
    if (!thumbCtx) return [];

    thumbCtx.drawImage(canvas, 0, 0, thumbSize, thumbSize);
    const imageData = thumbCtx.getImageData(0, 0, thumbSize, thumbSize);
    const data = imageData.data;

    // 2. Count color frequencies
    const colors: Record<string, number> = {};
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        if (a < 128) continue; // Skip transparent

        // Round colors to reduce detail and group similar colors
        const rd = Math.round(r / 16) * 16;
        const gd = Math.round(g / 16) * 16;
        const bd = Math.round(b / 16) * 16;
        
        const hex = rgbToHex(rd, gd, bd);
        colors[hex] = (colors[hex] || 0) + 1;
    }

    // 3. Sort by frequency
    const sortedColors = Object.entries(colors)
        .sort((a, b) => b[1] - a[1])
        .map(([hex]) => hex);

    // 4. Select top unique colors (ensure they aren't too similar)
    const palette: string[] = [];
    for (const color of sortedColors) {
        if (palette.length >= count) break;

        const isUnique = palette.every(p => colorDistance(color, p) > 40);
        if (isUnique) {
            palette.push(color);
        }
    }

    // Fill remaining with random variations of top if needed, or just return what we have
    return palette;
};

const rgbToHex = (r: number, g: number, b: number): string => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
};

const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
};

const colorDistance = (hex1: string, hex2: string): number => {
    const c1 = hexToRgb(hex1);
    const c2 = hexToRgb(hex2);
    // Simple Euclidean distance in RGB space
    return Math.sqrt(
        Math.pow(c1.r - c2.r, 2) +
        Math.pow(c1.g - c2.g, 2) +
        Math.pow(c1.b - c2.b, 2)
    );
};
