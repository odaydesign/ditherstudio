import { DitherState } from '@/store/ditherStore';

/**
 * Optimized SVG Generator
 * Strategy:
 * 1. For Geometric/Halftone modes: Generate perfect circles/shapes based on brightness.
 * 2. For standard Dithering: Sample the rendered pixels and merge contiguous horizontal 
 *    pixels of the same color into single <rect> elements to optimize file size.
 */
export const generateSVG = (
    canvas: HTMLCanvasElement,
    state: DitherState
): string => {
    const { width, height } = canvas;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return '';

    // If we are in "Geometric" or "ASCII" mode, use the shape-based vector logic
    // (This matches the current implementation for specific "geometric halftones")
    if (state.asciiMode === 0) {
        return generateGeometricSVG(ctx, width, height, state);
    }

    // Otherwise, we "Trace" the dithered pixels (all other algorithms)
    return traceDitherSVG(ctx, width, height, state);
};

/**
 * Traces dithered pixels from the canvas and converts them to optimized SVG rectangles.
 * Merges adjacent horizontal pixels of the same color into single rectangles.
 */
const traceDitherSVG = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    state: DitherState
): string => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    const bgColor = (state.colorMode === 2 || state.colorMode === 1) ? state.duotoneLight : state.asciiBgColor;
    let svgContent = `<rect x="0" y="0" width="${width}" height="${height}" fill="${bgColor}" />`;
    
    // We'll iterate row by row and merge horizontal spans of the same color
    for (let y = 0; y < height; y++) {
        let x = 0;
        while (x < width) {
            const idx = (y * width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const a = data[idx + 3];

            if (a < 128) {
                x++;
                continue;
            }

            const hex = rgbToHex(r, g, b);
            
            // Skip the background color to save on many rectangles
            if (hex.toLowerCase() === bgColor.toLowerCase()) {
                x++;
                continue;
            }

            // Find how many pixels to the right share the same color
            let length = 1;
            while (x + length < width) {
                const nextIdx = (y * width + (x + length)) * 4;
                if (data[nextIdx] === r && data[nextIdx + 1] === g && data[nextIdx + 2] === b && data[nextIdx + 3] === a) {
                    length++;
                } else {
                    break;
                }
            }

            // Create optimized rectangle for this span
            svgContent += `<rect x="${x}" y="${y}" width="${length}" height="1" fill="${hex}" />`;
            x += length;
        }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" shape-rendering="crispEdges">${svgContent}</svg>`;
};

const generateGeometricSVG = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    state: DitherState
): string => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const cellSize = Math.max(4, state.asciiCellSize);
    const cols = Math.ceil(width / cellSize);
    const rows = Math.ceil(height / cellSize);

    const bgColor = (state.colorMode === 2 || state.colorMode === 1) ? state.duotoneLight : state.asciiBgColor;
    const fgColor = (state.colorMode === 2 || state.colorMode === 1) ? state.duotoneDark : state.asciiFgColor;

    let svgContent = `<rect x="0" y="0" width="${width}" height="${height}" fill="${bgColor}" />`;

    const getBrightness = (c: number, r: number) => {
        const x = Math.min(width - 1, Math.floor(c * cellSize + cellSize / 2));
        const y = Math.min(height - 1, Math.floor(r * cellSize + cellSize / 2));
        const idx = (y * width + x) * 4;
        const lum = (data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114) / 255;
        return state.asciiInvert ? 1.0 - lum : lum;
    };

    const getPixelColor = (c: number, r: number) => {
        if (!state.asciiUseColor) return fgColor;
        const x = Math.min(width - 1, Math.floor(c * cellSize + cellSize / 2));
        const y = Math.min(height - 1, Math.floor(r * cellSize + cellSize / 2));
        const idx = (y * width + x) * 4;
        return rgbToHex(data[idx], data[idx + 1], data[idx + 2]);
    };

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const lum = getBrightness(c, r);
            let sizeNorm = 1.0 - lum;
            sizeNorm = Math.min(Math.max(sizeNorm * state.asciiIntensity * 1.5, 0), 1.0 + state.halftoneSpread);

            if (sizeNorm <= 0.01) continue;

            const cx = c * cellSize + cellSize / 2;
            const cy = r * cellSize + cellSize / 2;
            const size = (cellSize * 0.5) * sizeNorm;
            let transform = state.halftoneRotation !== 0 ? ` transform="rotate(${state.halftoneRotation}, ${cx}, ${cy})"` : '';
            const currentFg = getPixelColor(c, r);

            if (state.halftoneShape === 0) { // Circle
                svgContent += `<circle cx="${cx}" cy="${cy}" r="${size}" fill="${currentFg}"${transform} />`;
            } else if (state.halftoneShape === 1) { // Square
                svgContent += `<rect x="${cx - size}" y="${cy - size}" width="${size * 2}" height="${size * 2}" fill="${currentFg}"${transform} />`;
            } else if (state.halftoneShape === 2) { // Diamond
                svgContent += `<rect x="${cx - size * 1.2}" y="${cy - size * 1.2}" width="${size * 2.4}" height="${size * 2.4}" fill="${currentFg}" transform="rotate(${state.halftoneRotation + 45}, ${cx}, ${cy})" />`;
            } else if (state.halftoneShape === 3) { // Triangle
                const rd = size * 1.3;
                const p1 = `${cx},${cy - rd}`;
                const p2 = `${cx - rd * 0.866},${cy + rd * 0.5}`;
                const p3 = `${cx + rd * 0.866},${cy + rd * 0.5}`;
                svgContent += `<polygon points="${p1} ${p2} ${p3}" fill="${currentFg}"${transform} />`;
            } else if (state.halftoneShape === 4) { // Line
                const h = cellSize * sizeNorm * 0.5;
                const w = cellSize * 3;
                svgContent += `<rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" fill="${currentFg}"${transform} />`;
            }
        }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${svgContent}</svg>`;
};

const rgbToHex = (r: number, g: number, b: number): string => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
};
